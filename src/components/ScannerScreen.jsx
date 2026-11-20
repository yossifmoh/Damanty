import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Plus,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  FileUp,
  SwitchCamera,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { OCR_SAMPLE_PRESETS } from '../data/mockData';
import {
  extractFromFile,
  extractFromImageSource,
  parseEgyptianReceipt,
  detectQrFromCanvas,
  detectQrFromDataUrl,
} from '../utils/receiptScanner';
import { reportFraudOnCloud } from '../utils/cloudSync';

function computeExpiryAndDays(purchaseDate, years) {
  const base = new Date(`${purchaseDate}T00:00:00`);
  const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
  const exp = new Date(safeBase);
  exp.setFullYear(exp.getFullYear() + Number(years || 3));
  const diffDays = Math.max(
    1,
    Math.round((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  return {
    expiryDate: exp.toISOString().slice(0, 10),
    daysLeft: diffDays,
  };
}

export default function ScannerScreen({
  devices = [],
  lang,
  t,
  onAddDevice,
  onAddMaintenanceRecord,
}) {
  const isAr = lang === 'ar';
  const [mode, setMode] = useState('ocr'); // 'ocr' | 'antifake'
  const [selectedPresetId, setSelectedPresetId] = useState(OCR_SAMPLE_PRESETS[0].id);
  const [saveTarget, setSaveTarget] = useState('new'); // 'new' | 'maintenance'
  const [targetDeviceId, setTargetDeviceId] = useState(devices[0]?.id || '');
  const [maintCovered, setMaintCovered] = useState(false);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // File input refs
  const galleryInputRef = useRef(null);
  const docInputRef = useRef(null);
  const qrGalleryInputRef = useRef(null);

  // Processing & result state
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // Anti-fake QR state
  const [antiFakeResult, setAntiFakeResult] = useState(null); // { status: 'genuine' | 'counterfeit' | 'not_found', payload?: string }
  const [reported, setReported] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const selectedPreset =
    OCR_SAMPLE_PRESETS.find((p) => p.id === selectedPresetId) || OCR_SAMPLE_PRESETS[0];

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async (targetFacing = facingMode) => {
    setCameraError('');
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t.scanner.cameraError);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setPreviewUrl(null);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setCameraError(t.scanner.cameraError);
      setCameraActive(false);
    }
  };

  const evaluateQrPayload = useCallback((payload) => {
    if (!payload) {
      setAntiFakeResult({ status: 'not_found' });
      return;
    }
    const upper = payload.toUpperCase();
    const isGenuine =
      upper.startsWith('DAMANTY:') ||
      upper.includes('ELARABY') ||
      upper.includes('LG-EG') ||
      upper.includes('GENUINE') ||
      upper.includes('SAMSUNG');
    setAntiFakeResult({
      status: isGenuine ? 'genuine' : 'counterfeit',
      payload,
    });
  }, []);

  // Auto-scan QR codes in live camera when in Anti-Counterfeit mode
  useEffect(() => {
    if (!cameraActive || mode !== 'antifake') return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth) return;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const qr = detectQrFromCanvas(canvas);
      if (qr) {
        stopCamera();
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.9));
        evaluateQrPayload(qr);
      }
    }, 350);
    return () => clearInterval(interval);
  }, [cameraActive, mode, stopCamera, evaluateQrPayload]);

  const captureFromCamera = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    setPreviewUrl(dataUrl);

    if (mode === 'antifake') {
      const qr = detectQrFromCanvas(canvas);
      evaluateQrPayload(qr);
      return;
    }

    setOcrResult(null);
    setRawText('');
    setScanning(true);
    setProgress(10);
    try {
      const extracted = await extractFromImageSource(dataUrl, setProgress);
      setRawText(extracted.rawText || '');
      const parsed = parseEgyptianReceipt(extracted.rawText, extracted.qrText, 'camera-capture.jpg');
      setOcrResult(parsed);
      setSaveTarget(parsed.suggestedDocKind === 'maintenance' && devices.length ? 'maintenance' : 'new');
      setMaintCovered(parsed.detectedCostEgp === 0);
    } catch {
      setOcrResult(parseEgyptianReceipt('', '', 'camera-capture.jpg'));
      setSaveTarget('new');
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    stopCamera();
    setCameraError('');

    if (mode === 'antifake') {
      setScanning(true);
      setProgress(40);
      setAntiFakeResult(null);
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        setPreviewUrl(dataUrl);
        const qr = await detectQrFromDataUrl(dataUrl);
        setScanning(false);
        setProgress(100);
        evaluateQrPayload(qr);
      };
      reader.readAsDataURL(file);
      return;
    }

    setOcrResult(null);
    setRawText('');
    setPreviewUrl(null);
    setScanning(true);
    setProgress(5);

    try {
      const extracted = await extractFromFile(file, setProgress);
      if (extracted.previewUrl) setPreviewUrl(extracted.previewUrl);
      setRawText(extracted.rawText || '');
      const parsed = parseEgyptianReceipt(
        extracted.rawText,
        extracted.qrText,
        file.name
      );
      setOcrResult(parsed);
      setSaveTarget(parsed.suggestedDocKind === 'maintenance' && devices.length ? 'maintenance' : 'new');
      setMaintCovered(parsed.detectedCostEgp === 0);
    } catch {
      setOcrResult(parseEgyptianReceipt('', '', file.name));
      setSaveTarget('new');
    } finally {
      setScanning(false);
    }
  };

  const handleRunDemoOcr = () => {
    stopCamera();
    setPreviewUrl(null);
    setRawText('');
    setOcrResult(null);
    setScanning(true);
    setProgress(25);
    setTimeout(() => {
      setProgress(100);
      setScanning(false);
      setOcrResult({
        ...selectedPreset.device,
        id: `dev-scan-${Date.now()}`,
      });
    }, 900);
  };

  const handleFieldChange = (field, value) => {
    setOcrResult((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      if (field === 'purchaseDate' || field === 'warrantyYears') {
        const { expiryDate, daysLeft } = computeExpiryAndDays(
          updated.purchaseDate,
          updated.warrantyYears
        );
        updated.expiryDate = expiryDate;
        updated.daysLeft = daysLeft;
      }
      if (field === 'brand') {
        updated.brandAr = value;
      }
      return updated;
    });
  };

  const handleSaveDevice = () => {
    if (!ocrResult) return;
    if (saveTarget === 'maintenance' && targetDeviceId && onAddMaintenanceRecord) {
      const targetDev = devices.find((d) => d.id === targetDeviceId) || devices[0];
      const logEntry = {
        id: `log-${Date.now()}`,
        date: ocrResult.purchaseDate || new Date().toISOString().slice(0, 10),
        titleEn: ocrResult.repairTitleEn || 'Maintenance Service',
        titleAr: ocrResult.repairTitleAr || 'صيانة دورية',
        partEn: ocrResult.partEn || 'Verified Part / Inspection',
        partAr: ocrResult.partAr || 'فحص فني معتمد',
        costEgp: maintCovered ? 0 : Number(ocrResult.detectedCostEgp || 0),
        coveredByWarranty: maintCovered,
        techCenterEn: targetDev?.authorizedGroupEn || 'Authorized Service Egypt',
        techCenterAr: targetDev?.authorizedGroupAr || 'مركز الصيانة المعتمد',
      };
      onAddMaintenanceRecord(targetDeviceId, logEntry, previewUrl);
    } else {
      onAddDevice(ocrResult, previewUrl);
    }
    setOcrResult(null);
    setPreviewUrl(null);
    setRawText('');
  };

  return (
    <div className="space-y-4 pb-28 md:pb-10">
      <div>
        <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">
          {t.scanner.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t.scanner.subtitle}
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/70 dark:bg-slate-900/80 p-1.5 max-w-md">
        <button
          onClick={() => {
            setMode('ocr');
            setAntiFakeResult(null);
            setScanning(false);
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            mode === 'ocr'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>{t.scanner.modeOcr}</span>
        </button>
        <button
          onClick={() => {
            setMode('antifake');
            setOcrResult(null);
            setScanning(false);
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            mode === 'antifake'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{t.scanner.modeAntiFake}</span>
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFileUpload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          handleFileUpload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={qrGalleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFileUpload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {/* Responsive 2-Column Layout on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Left Column: Live Camera / AR Viewfinder & Input Actions */}
        <div className="space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer?.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className={`relative h-64 md:h-80 w-full overflow-hidden rounded-3xl border bg-slate-950 shadow-xl transition-colors ${
              dragOver ? 'border-emerald-400 ring-2 ring-emerald-400/50' : 'border-emerald-500/30'
            }`}
          >
            {/* Live Video Feed */}
            {cameraActive && (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            {/* Captured / Uploaded File Preview */}
            {!cameraActive && previewUrl && (
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="absolute inset-0 h-full w-full object-contain bg-slate-950/95 p-2"
              />
            )}

            {/* Subtle grid background when idle */}
            {!cameraActive && !previewUrl && (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              />
            )}

            {/* AR Corner Brackets */}
            <div className="absolute inset-4 pointer-events-none z-10">
              <div className="absolute top-0 left-0 h-7 w-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 h-7 w-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 h-7 w-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 h-7 w-7 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
            </div>

            {/* Animated Scanning Laser Beam */}
            {(cameraActive || scanning || !previewUrl) && (
              <motion.div
                animate={{ y: [20, 225, 20] }}
                transition={{
                  duration: scanning ? 1.0 : 2.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute left-6 right-6 z-10 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_16px_4px_rgba(16,185,129,0.7)] pointer-events-none"
              />
            )}

            {/* Top Camera Overlay Controls */}
            {cameraActive && (
              <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between">
                <button
                  onClick={stopCamera}
                  className="rounded-full bg-black/60 backdrop-blur-md p-2 text-white hover:bg-black/80"
                  aria-label={t.scanner.stopCamera}
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    const next = facingMode === 'environment' ? 'user' : 'environment';
                    setFacingMode(next);
                    startCamera(next);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-white"
                >
                  <SwitchCamera className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t.scanner.switchCamera}</span>
                </button>
              </div>
            )}

            {/* Center Idle / Scanning Overlay */}
            {!cameraActive && (scanning || !previewUrl) && (
              <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center bg-slate-950/40">
                {scanning ? (
                  <div className="space-y-3 w-full max-w-[230px]">
                    <Sparkles className="mx-auto h-9 w-9 text-emerald-400 animate-pulse" />
                    <p className="text-xs font-bold text-emerald-300">
                      {t.scanner.scanning} ({progress}%)
                    </p>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${progress}%` }}
                        className="h-full bg-emerald-400 transition-all duration-300"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ScanLine className="mx-auto h-10 w-10 text-emerald-400/85" />
                    <p className="text-xs font-medium text-slate-200 max-w-[260px]">
                      {mode === 'ocr' ? t.scanner.ocrHint : t.scanner.antiFakeHint}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Live Camera Bottom Shutter Button */}
            {cameraActive && (
              <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center px-4">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={captureFromCamera}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-xl shadow-emerald-500/40"
                >
                  <Camera className="h-4 w-4" />
                  <span>
                    {mode === 'ocr' ? t.scanner.capturePhoto : t.scanner.captureQr}
                  </span>
                </motion.button>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-xs font-medium text-amber-700 dark:text-amber-300">
              {cameraError}
            </div>
          )}

          {/* Action Buttons: Camera + Gallery + PDF/Word */}
          {mode === 'ocr' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => (cameraActive ? stopCamera() : startCamera())}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 px-3 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20"
              >
                <Camera className="h-4 w-4" />
                <span>{cameraActive ? t.scanner.stopCamera : t.scanner.openCamera}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={scanning}
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/80 py-3 px-3 text-xs font-bold text-slate-800 dark:text-white disabled:opacity-50"
              >
                <ImageIcon className="h-4 w-4 text-emerald-500" />
                <span>{t.scanner.uploadGallery}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={scanning}
                onClick={() => docInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/80 py-3 px-3 text-xs font-bold text-slate-800 dark:text-white disabled:opacity-50"
              >
                <FileUp className="h-4 w-4 text-amber-500" />
                <span>{t.scanner.uploadDoc}</span>
              </motion.button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => (cameraActive ? stopCamera() : startCamera())}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 px-3 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20"
              >
                <Camera className="h-4 w-4" />
                <span>{cameraActive ? t.scanner.stopCamera : t.scanner.openCamera}</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={scanning}
                onClick={() => qrGalleryInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/80 py-3 px-3 text-xs font-bold text-slate-800 dark:text-white"
              >
                <ImageIcon className="h-4 w-4 text-emerald-500" />
                <span>{t.scanner.scanQrImage}</span>
              </motion.button>
            </div>
          )}
        </div>

        {/* Right Column: Editable Extraction Form / Demo Samples / QR Result */}
        <div className="space-y-3">
          {mode === 'ocr' && (
            <>
              {!ocrResult ? (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 p-4 space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                    {t.scanner.chooseSample}
                  </label>
                  <div className="space-y-2">
                    {OCR_SAMPLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={`w-full text-start rounded-xl border p-3 text-xs font-semibold transition-all ${
                          selectedPresetId === preset.id
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isAr ? preset.labelAr : preset.labelEn}
                      </button>
                    ))}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    disabled={scanning}
                    onClick={handleRunDemoOcr}
                    className="w-full rounded-xl bg-slate-900 dark:bg-white/10 py-3 text-xs font-extrabold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {t.scanner.startScan}
                  </motion.button>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <h3 className="text-sm font-extrabold">{t.scanner.extractedTitle}</h3>
                    </div>

                    {/* Save Destination Toggle: New Appliance vs Maintenance Receipt */}
                    {devices.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-white/80 dark:bg-slate-950/60 p-1">
                        <button
                          type="button"
                          onClick={() => setSaveTarget('new')}
                          className={`rounded-lg py-2 px-2 text-[11px] font-bold transition-all ${
                            saveTarget === 'new'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {t.scanner.saveTargetNew}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSaveTarget('maintenance')}
                          className={`rounded-lg py-2 px-2 text-[11px] font-bold transition-all ${
                            saveTarget === 'maintenance'
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {t.scanner.saveTargetMaint}
                        </button>
                      </div>
                    )}

                    {saveTarget === 'new' ? (
                      /* Editable Extracted Fields for New Appliance */
                      <div className="rounded-xl bg-white/95 dark:bg-slate-900/90 p-3.5 text-xs space-y-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">
                          {t.scanner.fieldName}
                        </label>
                        <input
                          type="text"
                          value={isAr ? ocrResult.nameAr : ocrResult.nameEn}
                          onChange={(e) =>
                            handleFieldChange(isAr ? 'nameAr' : 'nameEn', e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">
                            {t.scanner.fieldBrand}
                          </label>
                          <input
                            type="text"
                            value={ocrResult.brand}
                            onChange={(e) => handleFieldChange('brand', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">
                            {t.scanner.fieldModel}
                          </label>
                          <input
                            type="text"
                            value={ocrResult.model}
                            onChange={(e) => handleFieldChange('model', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">
                          {t.scanner.fieldSerial}
                        </label>
                        <input
                          type="text"
                          value={ocrResult.serial}
                          onChange={(e) => handleFieldChange('serial', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">
                            {t.scanner.fieldDate}
                          </label>
                          <input
                            type="date"
                            value={ocrResult.purchaseDate}
                            onChange={(e) =>
                              handleFieldChange('purchaseDate', e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">
                            {t.scanner.fieldYears}
                          </label>
                          <select
                            value={ocrResult.warrantyYears}
                            onChange={(e) =>
                              handleFieldChange('warrantyYears', Number(e.target.value))
                            }
                            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={5}>5</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-between pt-1 text-[11px] border-t border-slate-200/70 dark:border-white/10">
                        <span className="text-slate-400">{t.vault.expires}</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {ocrResult.expiryDate}
                        </span>
                      </div>
                    </div>
                    ) : (
                      /* Maintenance Receipt Form for Existing Device */
                      <div className="rounded-xl bg-white/95 dark:bg-slate-900/90 p-3.5 text-xs space-y-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">
                            {t.scanner.chooseTargetDevice}
                          </label>
                          <select
                            value={targetDeviceId}
                            onChange={(e) => setTargetDeviceId(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                          >
                            {devices.map((d) => (
                              <option key={d.id} value={d.id}>
                                {isAr ? d.nameAr : d.nameEn} ({d.model})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">
                            {t.scanner.repairTitleLabel}
                          </label>
                          <input
                            type="text"
                            value={isAr ? ocrResult.repairTitleAr : ocrResult.repairTitleEn}
                            onChange={(e) =>
                              handleFieldChange(
                                isAr ? 'repairTitleAr' : 'repairTitleEn',
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">
                              {t.scanner.partLabel}
                            </label>
                            <input
                              type="text"
                              value={isAr ? ocrResult.partAr : ocrResult.partEn}
                              onChange={(e) =>
                                handleFieldChange(isAr ? 'partAr' : 'partEn', e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">
                              {t.scanner.costLabel}
                            </label>
                            <input
                              type="number"
                              disabled={maintCovered}
                              value={maintCovered ? 0 : ocrResult.detectedCostEgp || 0}
                              onChange={(e) =>
                                handleFieldChange('detectedCostEgp', Number(e.target.value) || 0)
                              }
                              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white disabled:opacity-50"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={maintCovered}
                            onChange={(e) => setMaintCovered(e.target.checked)}
                            className="h-4 w-4 accent-emerald-500 rounded"
                          />
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                            {t.scanner.coveredToggle}
                          </span>
                        </label>
                      </div>
                    )}

                    {rawText && (
                      <div>
                        <button
                          onClick={() => setShowRawText((s) => !s)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
                        >
                          {showRawText ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          <span>{t.scanner.rawTextToggle}</span>
                        </button>
                        {showRawText && (
                          <pre className="mt-1.5 max-h-28 overflow-y-auto rounded-xl bg-slate-950 p-2.5 text-[10px] text-slate-300 whitespace-pre-wrap font-mono">
                            {rawText}
                          </pre>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={handleSaveDevice}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-3 px-2 text-xs font-extrabold text-slate-950"
                      >
                        <Plus className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {saveTarget === 'maintenance'
                            ? t.scanner.saveMaintBtn
                            : t.scanner.addToVault}
                        </span>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          setOcrResult(null);
                          setPreviewUrl(null);
                          setRawText('');
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 py-3 text-xs font-bold text-slate-700 dark:text-slate-200"
                      >
                        <RefreshCw className="h-4 w-4" />
                        {t.scanner.scanAgain}
                      </motion.button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </>
          )}

          {mode === 'antifake' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={scanning}
                  onClick={() =>
                    setAntiFakeResult({
                      status: 'genuine',
                      payload: 'DAMANTY:EG-GEN-2026-441',
                    })
                  }
                  className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 py-3 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                >
                  {t.scanner.testGenuine}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={scanning}
                  onClick={() =>
                    setAntiFakeResult({
                      status: 'counterfeit',
                      payload: 'UNVERIFIED-PART-9921',
                    })
                  }
                  className="rounded-xl border border-rose-500/35 bg-rose-500/10 py-3 px-3 text-xs font-bold text-rose-600 dark:text-rose-300"
                >
                  {t.scanner.testCounterfeit}
                </motion.button>
              </div>

              <AnimatePresence>
                {antiFakeResult?.status === 'genuine' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
                      <ShieldCheck className="h-6 w-6" />
                      <h3 className="text-sm font-extrabold">{t.scanner.genuineTitle}</h3>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200">
                      {t.scanner.genuineDesc}
                    </p>
                    {antiFakeResult.payload && (
                      <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 break-all">
                        {t.scanner.qrScannedLabel} {antiFakeResult.payload}
                      </p>
                    )}
                  </motion.div>
                )}

                {antiFakeResult?.status === 'counterfeit' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-300">
                      <ShieldAlert className="h-6 w-6" />
                      <h3 className="text-sm font-extrabold">{t.scanner.counterfeitTitle}</h3>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200">
                      {t.scanner.counterfeitDesc}
                    </p>
                    {antiFakeResult.payload && (
                      <p className="text-[11px] font-mono text-rose-600 dark:text-rose-300 break-all">
                        {t.scanner.qrScannedLabel} {antiFakeResult.payload}
                      </p>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={async () => {
                        await reportFraudOnCloud({
                          qrPayload: antiFakeResult.payload,
                          notes: 'Reported via Damanty Anti-Counterfeit Scanner',
                        });
                        setReported(true);
                      }}
                      className="w-full rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-white"
                    >
                      {reported ? t.scanner.reported : t.scanner.reportFraud}
                    </motion.button>
                  </motion.div>
                )}

                {antiFakeResult?.status === 'not_found' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs font-semibold text-amber-700 dark:text-amber-300"
                  >
                    {t.scanner.noQrFound}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
