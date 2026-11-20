import React, { useState } from 'react';
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
} from 'lucide-react';
import { OCR_SAMPLE_PRESETS } from '../data/mockData';

export default function ScannerScreen({ lang, t, onAddDevice }) {
  const isAr = lang === 'ar';
  const [mode, setMode] = useState('ocr'); // 'ocr' | 'antifake'
  const [selectedPresetId, setSelectedPresetId] = useState(OCR_SAMPLE_PRESETS[0].id);
  const [scanning, setScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [antiFakeResult, setAntiFakeResult] = useState(null); // 'genuine' | 'counterfeit' | null
  const [reported, setReported] = useState(false);

  const selectedPreset =
    OCR_SAMPLE_PRESETS.find((p) => p.id === selectedPresetId) || OCR_SAMPLE_PRESETS[0];

  const handleRunOcr = () => {
    setOcrResult(null);
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setOcrResult({
        ...selectedPreset.device,
        id: `dev-scan-${Date.now()}`,
      });
    }, 1500);
  };

  const handleRunAntiFake = (outcome) => {
    setAntiFakeResult(null);
    setReported(false);
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setAntiFakeResult(outcome);
    }, 1200);
  };

  return (
    <div className="space-y-4 pb-28">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
          {t.scanner.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t.scanner.subtitle}
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/70 dark:bg-slate-900/80 p-1.5">
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

      {/* Simulated AR Viewfinder */}
      <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-950 shadow-xl">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(#10b981 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />

        {/* AR Corner Brackets */}
        <div className="absolute inset-5 pointer-events-none">
          <div className="absolute top-0 left-0 h-7 w-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 h-7 w-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 h-7 w-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 h-7 w-7 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
        </div>

        {/* Animated Scanning Laser Beam */}
        <motion.div
          animate={{ y: [24, 215, 24] }}
          transition={{
            duration: scanning ? 1.1 : 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_16px_4px_rgba(16,185,129,0.65)]"
        />

        {/* Center AR Overlay Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          {scanning ? (
            <div className="space-y-2">
              <Sparkles className="mx-auto h-9 w-9 text-emerald-400 animate-pulse" />
              <p className="text-xs font-bold text-emerald-300">
                {t.scanner.scanning}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <ScanLine className="mx-auto h-10 w-10 text-emerald-400/80" />
              <p className="text-xs font-medium text-slate-300 max-w-[240px]">
                {mode === 'ocr' ? t.scanner.ocrHint : t.scanner.antiFakeHint}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mode 1: OCR Controls & Extracted Preview */}
      {mode === 'ocr' && (
        <div className="space-y-3">
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
                onClick={handleRunOcr}
                className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 disabled:opacity-60"
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
                  <CheckCircle2 className="h-5 w-5" />
                  <h3 className="text-sm font-extrabold">{t.scanner.extractedTitle}</h3>
                </div>
                <div className="rounded-xl bg-white/90 dark:bg-slate-900/80 p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isAr ? 'الجهاز' : 'Appliance'}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isAr ? ocrResult.nameAr : ocrResult.nameEn}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t.vault.serialLabel}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {ocrResult.serial}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t.vault.expires}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {ocrResult.expiryDate} (3Y)
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      onAddDevice(ocrResult);
                      setOcrResult(null);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-3 text-xs font-extrabold text-slate-950"
                  >
                    <Plus className="h-4 w-4" />
                    {t.scanner.addToVault}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setOcrResult(null)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 py-3 text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t.scanner.scanAgain}
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Mode 2: Anti-Counterfeit Spare Part QR */}
      {mode === 'antifake' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={scanning}
              onClick={() => handleRunAntiFake('genuine')}
              className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 py-3 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-300"
            >
              {t.scanner.testGenuine}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={scanning}
              onClick={() => handleRunAntiFake('counterfeit')}
              className="rounded-xl border border-rose-500/35 bg-rose-500/10 py-3 px-3 text-xs font-bold text-rose-600 dark:text-rose-300"
            >
              {t.scanner.testCounterfeit}
            </motion.button>
          </div>

          <AnimatePresence>
            {antiFakeResult === 'genuine' && (
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
              </motion.div>
            )}

            {antiFakeResult === 'counterfeit' && (
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
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setReported(true)}
                  className="w-full rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-white"
                >
                  {reported ? t.scanner.reported : t.scanner.reportFraud}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
