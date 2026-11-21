import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  AlertTriangle,
  PhoneCall,
  Calendar,
  Wrench,
  ArrowLeftRight,
  RotateCw,
  X,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Tv,
  Wind,
  Refrigerator,
  Waves,
  Microwave,
  Image as ImageIcon,
  Lock,
  Trash2,
  Plus,
  Pencil,
  KeyRound,
} from 'lucide-react';
import QrCodeSvg from './QrCodeSvg';
import {
  getPhotosForDevice,
  savePhotoDoc,
  deletePhotoDoc,
} from '../utils/photoVault';
import {
  syncProofToCloud,
  createTransferOnCloud,
  claimTransferOnCloud,
  bookServiceOnCloud,
  uploadPhotoToCloud,
  fetchCloudPhotoAsDataUrl,
  deleteCloudPhoto,
} from '../utils/cloudSync';

const CategoryIcon = ({ category, className = 'w-5 h-5' }) => {
  switch (category) {
    case 'washer':
      return <Waves className={className} />;
    case 'ac':
      return <Wind className={className} />;
    case 'fridge':
      return <Refrigerator className={className} />;
    case 'tv':
      return <Tv className={className} />;
    default:
      return <Microwave className={className} />;
  }
};

export default function VaultScreen({
  devices,
  lang,
  t,
  liveBanner,
  onClearBanner,
  onNavigateDiagnostics,
  onNavigateScan,
  photoCounts = {},
  onPhotoChanged,
  onUpdateDevice,
  onDeleteDevice,
  onClaimedDevice,
  tourStepId = null,
}) {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [transferCode, setTransferCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [checkupBooked, setCheckupBooked] = useState(false);
  const [checkupTicket, setCheckupTicket] = useState('');
  const [devicePhotos, setDevicePhotos] = useState([]);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const attachInputRef = useRef(null);
  const openedByTourRef = useRef(false);
  const prevTourStepRef = useRef(null);
  const certModalScrollRef = useRef(null);

  // Sync interactive guided tour device preview & 3D QR flip
  useEffect(() => {
    if (prevTourStepRef.current === tourStepId) return;
    prevTourStepRef.current = tourStepId;

    if (tourStepId === 'vault-open-device' || tourStepId === 'vault-device-qr') {
      const target =
        devices.find((d) => d.id === 'dev-sharp-tv') || devices[0] || null;
      if (target) {
        openedByTourRef.current = true;
        setSelectedDevice(target);
        setIsFlipped(tourStepId === 'vault-device-qr');
        setEditingDevice(null);
        setConfirmDelete(false);
        setTimeout(() => {
          if (certModalScrollRef.current) {
            certModalScrollRef.current.scrollTop = 0;
          }
        }, 60);
      }
    } else if (openedByTourRef.current) {
      openedByTourRef.current = false;
      setSelectedDevice(null);
      setIsFlipped(false);
      setEditingDevice(null);
      setConfirmDelete(false);
    }
  }, [tourStepId, devices]);

  // Sync browser Back button with open modals & lightbox
  useEffect(() => {
    const onPopState = (e) => {
      const modal = e.state?.modal;
      if (modal === 'lightbox') return;
      setLightboxPhoto(null);
      if (modal === 'cert') return;
      setSelectedDevice(null);
      setEditingDevice(null);
      setConfirmDelete(false);
      if (modal === 'claim') return;
      setClaimOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedDevice?.id) {
      setDevicePhotos([]);
      return;
    }

    async function loadPhotosAndSyncFromBlob() {
      const localList = await getPhotosForDevice(selectedDevice.id);
      if (!active) return;
      setDevicePhotos(localList);

      const localIds = new Set(localList.map((p) => p.id));
      const cloudProofs = selectedDevice.cloudProofs || [];
      const missingCloud = cloudProofs.filter(
        (p) => p.hasCloudBlob && !localIds.has(p.id)
      );

      if (missingCloud.length === 0) return;

      for (const proof of missingCloud) {
        const dataUrl = await fetchCloudPhotoAsDataUrl(proof.id);
        if (!active || !dataUrl) continue;
        await savePhotoDoc({
          id: proof.id,
          deviceId: selectedDevice.id,
          title: proof.title,
          docType: proof.docType,
          capturedAt: proof.capturedAt,
          dataUrl,
        }).catch(() => {});
      }

      if (!active) return;
      const updated = await getPhotosForDevice(selectedDevice.id);
      if (active) {
        setDevicePhotos(updated);
        onPhotoChanged?.();
      }
    }

    loadPhotosAndSyncFromBlob();
    return () => {
      active = false;
    };
  }, [selectedDevice, onPhotoChanged]);

  const handleAttachPhotoFile = (file) => {
    if (!file || !selectedDevice) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const saved = await savePhotoDoc({
        deviceId: selectedDevice.id,
        title: file.name || t.vault.docTypeWarranty,
        docType: 'warranty',
        dataUrl: reader.result,
      });
      if (saved) {
        const blobRes = await uploadPhotoToCloud({
          deviceId: selectedDevice.id,
          proofId: saved.id,
          title: saved.title,
          docType: saved.docType,
          sha256: saved.sha256,
          capturedAt: saved.capturedAt,
          dataUrl: saved.dataUrl,
        });
        if (!blobRes?.ok) {
          syncProofToCloud(selectedDevice.id, {
            id: saved.id,
            title: saved.title,
            docType: saved.docType,
            sha256: saved.sha256,
            capturedAt: saved.capturedAt,
          });
        }
      }
      const updated = await getPhotosForDevice(selectedDevice.id);
      setDevicePhotos(updated);
      onPhotoChanged?.();
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async (photoId) => {
    await deletePhotoDoc(photoId);
    deleteCloudPhoto(photoId);
    if (selectedDevice) {
      const updated = await getPhotosForDevice(selectedDevice.id);
      setDevicePhotos(updated);
      onPhotoChanged?.();
    }
    if (lightboxPhoto?.id === photoId) closeLightbox();
  };

  const isAr = lang === 'ar';

  const avgScore = devices.length
    ? Math.round(
        devices.reduce((acc, d) => acc + (d.remainingPct || 0), 0) / devices.length
      )
    : 0;
  const protectionScore = devices.length
    ? Math.min(99, Math.max(82, avgScore + 18))
    : 0;

  const expiringDevice = devices.find((d) => d.status === 'expiring_soon');

  const openCertificate = (device) => {
    openedByTourRef.current = false;
    setSelectedDevice(device);
    setIsFlipped(false);
    setTransferCode(null);
    setCopiedCode(false);
    setEditingDevice(null);
    setConfirmDelete(false);
    if (window.history.state?.modal !== 'cert') {
      window.history.pushState(
        { ...(window.history.state || { tab: 'vault' }), modal: 'cert' },
        ''
      );
    }
  };

  const closeCertificate = () => {
    openedByTourRef.current = false;
    if (window.history.state?.modal === 'cert' || window.history.state?.modal === 'lightbox') {
      window.history.back();
    } else {
      setSelectedDevice(null);
      setEditingDevice(null);
      setConfirmDelete(false);
    }
  };

  const openLightbox = (photo) => {
    setLightboxPhoto(photo);
    if (window.history.state?.modal !== 'lightbox') {
      window.history.pushState(
        { ...(window.history.state || { tab: 'vault' }), modal: 'lightbox' },
        ''
      );
    }
  };

  const closeLightbox = () => {
    if (window.history.state?.modal === 'lightbox') {
      window.history.back();
    } else {
      setLightboxPhoto(null);
    }
  };

  const openClaimModal = () => {
    setClaimCode('');
    setClaimError('');
    setClaimOpen(true);
    if (window.history.state?.modal !== 'claim') {
      window.history.pushState(
        { ...(window.history.state || { tab: 'vault' }), modal: 'claim' },
        ''
      );
    }
  };

  const closeClaimModal = () => {
    if (window.history.state?.modal === 'claim') {
      window.history.back();
    } else {
      setClaimOpen(false);
    }
  };

  const handleGenerateTransfer = async () => {
    if (!selectedDevice) return;
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `DM-TR-${selectedDevice.brand.slice(0, 2).toUpperCase()}-${rand}`;
    setTransferCode(code);
    await createTransferOnCloud(selectedDevice.id, code);
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimCode.trim()) return;
    setClaimError('');
    setClaimLoading(true);
    const res = await claimTransferOnCloud(claimCode.trim());
    setClaimLoading(false);
    if (!res?.ok || !res.device) {
      if (res?.error === 'AUTH_REQUIRED') {
        setClaimError(t.vault.claimAuthRequired);
      } else if (res?.error === 'TRANSFER_ALREADY_CLAIMED') {
        setClaimError(t.vault.claimAlreadyUsed);
      } else {
        setClaimError(t.vault.claimNotFound);
      }
      return;
    }
    onClaimedDevice?.(res.device);
    closeClaimModal();
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingDevice) return;
    const years = Number(editingDevice.warrantyYears || 3);
    const base = new Date(`${editingDevice.purchaseDate || '2026-01-01'}T00:00:00`);
    const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
    const exp = new Date(safeBase);
    exp.setFullYear(exp.getFullYear() + years);
    const totalMs = Math.max(1, exp.getTime() - safeBase.getTime());
    const remMs = Math.max(0, exp.getTime() - Date.now());
    const daysLeft = Math.max(0, Math.round(remMs / (1000 * 60 * 60 * 24)));
    const remainingPct = Math.min(100, Math.max(0, Math.round((remMs / totalMs) * 100)));
    const updated = {
      ...editingDevice,
      warrantyYears: years,
      expiryDate: exp.toISOString().slice(0, 10),
      daysLeft,
      remainingPct,
      status: daysLeft <= 60 ? 'expiring_soon' : 'active',
    };
    onUpdateDevice?.(updated);
    setSelectedDevice(updated);
    setEditingDevice(null);
  };

  const handleDeleteClick = () => {
    if (!selectedDevice) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const id = selectedDevice.id;
    closeCertificate();
    onDeleteDevice?.(id);
  };

  const handleCopyTransfer = () => {
    if (!transferCode) return;
    navigator.clipboard?.writeText(transferCode).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-4 pb-28 md:pb-10">
      {/* Interactive Dynamic Header Pill */}
      <motion.div
        layout
        className="rounded-2xl border border-emerald-500/25 bg-white/90 dark:bg-slate-900/75 backdrop-blur-xl p-3.5 shadow-lg shadow-emerald-500/5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <ShieldCheck className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t.vault.protectionScore}
                </span>
                {devices.length > 0 ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
                    {protectionScore}% {t.vault.protected}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
                    {t.vault.vaultReadyBadge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {devices.length > 0
                  ? `${devices.length} ${t.vault.devicesCount}`
                  : t.vault.vaultReadyHint}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-end">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openClaimModal}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
            >
              <KeyRound className="h-3 w-3" />
              <span>{t.vault.claimTransferOpen}</span>
            </motion.button>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              <Sparkles className="h-3 w-3 text-amber-500" />
              {t.appName}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {liveBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="font-medium">{liveBanner}</span>
                </div>
                <button
                  onClick={onClearBanner}
                  className="rounded-lg p-1 hover:bg-emerald-500/20"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Expiring Soon Alert Banner */}
      {expiringDevice && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/35 bg-amber-500/10 dark:bg-amber-500/10 backdrop-blur-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  {t.vault.expiringTitle}
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  {expiringDevice.daysLeft} {t.vault.daysLeft}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100">
                {isAr ? expiringDevice.nameAr : expiringDevice.nameEn}
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                {t.vault.expiringDesc}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={async () => {
                    if (checkupBooked) return;
                    const res = await bookServiceOnCloud({
                      deviceId: expiringDevice.id,
                      deviceSerial: expiringDevice.serial,
                      bookingType: 'preventive_checkup',
                      hotline: expiringDevice.hotline,
                    });
                    setCheckupTicket(res?.ticketId || '');
                    setCheckupBooked(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20"
                >
                  {checkupBooked ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t.vault.checkupBooked} {checkupTicket ? `(#${checkupTicket})` : ''}
                    </>
                  ) : (
                    <>
                      <Calendar className="h-3.5 w-3.5" />
                      {t.vault.bookCheckup}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Device Warranty Cards */}
      {devices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-dashed border-emerald-500/35 bg-white/80 dark:bg-slate-900/60 p-8 text-center space-y-3"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t.vault.emptyVaultTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {t.vault.emptyVaultDesc}
          </p>
          {onNavigateScan && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onNavigateScan}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25"
            >
              <Plus className="h-4 w-4" />
              <span>{t.vault.emptyVaultBtn}</span>
            </motion.button>
          )}
          <p className="text-[11px] text-slate-400 dark:text-slate-400 max-w-xs mx-auto pt-1">
            {t.vault.claimEmptyTip}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {devices.map((device, index) => {
          const isExpiring = device.status === 'expiring_soon';
          return (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => openCertificate(device)}
              className="cursor-pointer rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/70 backdrop-blur-xl p-4 shadow-sm hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      isExpiring
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-emerald-500/15 text-emerald-500'
                    }`}
                  >
                    <CategoryIcon category={device.category} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {isAr ? device.brandAr : device.brand}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        {device.model}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {isAr ? device.nameAr : device.nameEn}
                    </h3>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    isExpiring
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                  }`}
                >
                  {device.remainingPct}%
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 p-2.5 text-[11px]">
                <div>
                  <span className="text-slate-400 block">{t.vault.purchased}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                    {device.purchaseDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t.vault.expires}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                    {device.expiryDate}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200/70 dark:border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">{t.vault.serialLabel}</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {device.serial}
                  </span>
                </div>
              </div>

              {/* Animated Gradient Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500 dark:text-slate-400">
                    {t.vault.remaining}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {device.daysLeft} {t.vault.daysLeft}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${device.remainingPct}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      isExpiring
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400'
                    }`}
                  />
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span>{t.vault.tapCertificate}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {photoCounts[device.id] > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                      <ImageIcon className="h-3 w-3" />
                      {photoCounts[device.id]}
                    </span>
                  )}
                  <span>{isAr ? device.authorizedGroupAr : device.authorizedGroupEn}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
        </div>
      )}

      {/* 3D Holographic Flippable Warranty Certificate Bottom Sheet */}
      <AnimatePresence>
        {selectedDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm md:p-4"
            onClick={closeCertificate}
          >
            <motion.div
              ref={certModalScrollRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] md:max-w-xl max-h-[90dvh] overflow-y-auto no-scrollbar rounded-t-3xl md:rounded-3xl border border-white/15 bg-slate-50 dark:bg-[#0b1120] p-5 pb-safe shadow-2xl"
            >
              {/* Drag Handle & Close */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingDevice(
                        editingDevice ? null : { ...selectedDevice }
                      )
                    }
                    className="rounded-full bg-slate-200/80 dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-500"
                    aria-label={t.vault.editDeviceBtn}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className={`rounded-full px-2 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 ${
                      confirmDelete
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-rose-500'
                    }`}
                    aria-label={t.vault.deleteDeviceBtn}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {confirmDelete && <span>{t.vault.deleteDeviceBtn}</span>}
                  </button>
                </div>
                <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
                <button
                  onClick={closeCertificate}
                  className="rounded-full bg-slate-200/80 dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300"
                  aria-label={t.vault.close}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {confirmDelete && (
                <p className="mb-3 text-center text-[11px] font-bold text-rose-500">
                  {t.vault.confirmDeleteMsg}
                </p>
              )}

              {/* Inline Edit Device Form */}
              {editingDevice && (
                <form
                  onSubmit={handleSaveEdit}
                  className="mb-4 rounded-2xl border border-emerald-500/30 bg-white dark:bg-slate-900 p-3.5 text-xs space-y-2.5"
                >
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      {t.scanner.fieldName}
                    </label>
                    <input
                      type="text"
                      required
                      value={isAr ? editingDevice.nameAr : editingDevice.nameEn}
                      onChange={(e) =>
                        setEditingDevice((prev) => ({
                          ...prev,
                          [isAr ? 'nameAr' : 'nameEn']: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        {t.scanner.fieldModel}
                      </label>
                      <input
                        type="text"
                        value={editingDevice.model}
                        onChange={(e) =>
                          setEditingDevice((prev) => ({ ...prev, model: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        {t.scanner.fieldSerial}
                      </label>
                      <input
                        type="text"
                        value={editingDevice.serial}
                        onChange={(e) =>
                          setEditingDevice((prev) => ({ ...prev, serial: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        {t.scanner.fieldDate}
                      </label>
                      <input
                        type="date"
                        value={editingDevice.purchaseDate}
                        onChange={(e) =>
                          setEditingDevice((prev) => ({ ...prev, purchaseDate: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        {t.scanner.fieldYears}
                      </label>
                      <select
                        value={editingDevice.warrantyYears || 3}
                        onChange={(e) =>
                          setEditingDevice((prev) => ({
                            ...prev,
                            warrantyYears: Number(e.target.value),
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 font-bold text-slate-900 dark:text-white"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-emerald-500 py-2 font-extrabold text-slate-950"
                    >
                      {t.vault.saveEditBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingDevice(null)}
                      className="rounded-xl bg-slate-200 dark:bg-slate-800 px-3 py-2 font-bold text-slate-700 dark:text-slate-200"
                    >
                      {t.vault.cancelEditBtn}
                    </button>
                  </div>
                </form>
              )}

              {/* 3D Flippable Card */}
              <div
                className="perspective-1200 cursor-pointer select-none"
                onClick={() => setIsFlipped((prev) => !prev)}
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                  className="preserve-3d relative h-56 w-full"
                >
                  {/* Front Side: Holographic Certificate */}
                  <div className="backface-hidden absolute inset-0 rounded-2xl p-5 text-white shadow-xl overflow-hidden border border-white/25 holo-foil bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900">
                    <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-2xl" />
                    <div className="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-amber-400/20 blur-2xl" />

                    <div className="relative flex h-full flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            <ShieldCheck className="h-3 w-3 text-emerald-300" />
                            {t.vault.officialCert}
                          </span>
                          <h3 className="mt-2 text-lg font-extrabold leading-tight">
                            {isAr ? selectedDevice.nameAr : selectedDevice.nameEn}
                          </h3>
                        </div>
                        <RotateCw className="h-5 w-5 text-white/75 shrink-0" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-white/65 text-[10px] block">
                            {t.vault.serialLabel}
                          </span>
                          <span className="font-mono font-bold">{selectedDevice.serial}</span>
                        </div>
                        <div>
                          <span className="text-white/65 text-[10px] block">
                            {t.vault.expires}
                          </span>
                          <span className="font-mono font-bold">{selectedDevice.expiryDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/15 pt-2 text-[11px] text-white/85">
                        <span>
                          {isAr
                            ? selectedDevice.authorizedGroupAr
                            : selectedDevice.authorizedGroupEn}
                        </span>
                        <span className="font-semibold text-emerald-300">
                          {selectedDevice.warrantyYears}Y • {selectedDevice.remainingPct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Back Side: Verified Digital QR */}
                  <div className="backface-hidden rotate-y-180 absolute inset-0 rounded-2xl p-4 bg-slate-900 text-white border border-emerald-500/40 shadow-xl flex items-center justify-between gap-4">
                    <div className="shrink-0">
                      <QrCodeSvg value={`DAMANTY:${selectedDevice.serial}`} size={132} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        {t.vault.verifiedBy}
                      </div>
                      <p className="text-xs font-bold truncate">
                        {isAr ? selectedDevice.brandAr : selectedDevice.brand} •{' '}
                        {selectedDevice.model}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 break-all">
                        {selectedDevice.serial}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {isAr ? selectedDevice.retailerAr : selectedDevice.retailerEn}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
                {t.vault.flipHint}
              </p>

              {/* Direct Call to Brand Hotline + Troubleshoot */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <motion.a
                  whileTap={{ scale: 0.96 }}
                  href={`tel:${selectedDevice.hotline}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>
                    {t.vault.callHotline} ({selectedDevice.hotline})
                  </span>
                </motion.a>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const id = selectedDevice.id;
                    setSelectedDevice(null);
                    onNavigateDiagnostics(id);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-800/80 px-3 py-3 text-xs font-bold text-slate-800 dark:text-white"
                >
                  <Wrench className="h-4 w-4 text-emerald-500" />
                  <span>{t.tabs.diagnostics}</span>
                </motion.button>
              </div>

              {/* Encrypted Receipt & Warranty Photo Vault */}
              <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-white dark:bg-slate-900/70 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {t.vault.savedPhotosTitle}
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300 shrink-0">
                    <Lock className="h-2.5 w-2.5" />
                    {t.vault.encryptedBadge}
                  </span>
                </div>

                <input
                  ref={attachInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleAttachPhotoFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />

                {devicePhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {devicePhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-950"
                      >
                        <button
                          type="button"
                          onClick={() => openLightbox(photo)}
                          className="block w-full text-start"
                        >
                          <img
                            src={photo.dataUrl}
                            alt={photo.title}
                            className="h-24 w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="p-1.5 bg-slate-900/95 text-[10px]">
                            <span
                              className={`inline-block font-bold ${
                                photo.docType === 'maintenance'
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {photo.docType === 'maintenance'
                                ? t.vault.docTypeMaintenance
                                : t.vault.docTypeWarranty}
                            </span>
                            <span className="block font-mono text-slate-400 text-[9px]">
                              {photo.capturedAt}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="absolute top-1.5 end-1.5 rounded-full bg-black/70 p-1 text-rose-400 hover:bg-rose-500 hover:text-white"
                          aria-label={t.vault.deletePhoto}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.vault.savedPhotosEmpty}
                  </p>
                )}

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => attachInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.vault.attachPhotoBtn}</span>
                </motion.button>
              </div>

              {/* Device Maintenance History Log */}
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  {t.vault.maintenanceLog}
                </h4>
                {selectedDevice.maintenanceLog?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDevice.maintenanceLog.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-slate-400">
                            {log.date}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              log.coveredByWarranty
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                            }`}
                          >
                            {log.coveredByWarranty
                              ? t.vault.covered
                              : `${log.costEgp} ${t.vault.paid}`}
                          </span>
                        </div>
                        <p className="mt-1 font-bold text-slate-900 dark:text-white">
                          {isAr ? log.titleAr : log.titleEn}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {isAr ? log.partAr : log.partEn} •{' '}
                          {isAr ? log.techCenterAr : log.techCenterEn}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 text-xs text-slate-500 dark:text-slate-400">
                    {t.vault.noMaintenance}
                  </div>
                )}
              </div>

              {/* 1-Tap Warranty Ownership Transfer */}
              <div className="mt-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {t.vault.transferTitle}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.vault.transferDesc}
                    </p>
                  </div>
                  <ArrowLeftRight className="h-4 w-4 text-emerald-500 shrink-0" />
                </div>

                {!transferCode ? (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleGenerateTransfer}
                    className="mt-3 w-full rounded-xl bg-slate-900 dark:bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    {t.vault.transferBtn}
                  </motion.button>
                ) : (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-300 block">
                        {t.vault.transferActive}
                      </span>
                      <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                        {transferCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <QrCodeSvg value={transferCode} size={52} />
                      <button
                        onClick={handleCopyTransfer}
                        className="rounded-lg bg-emerald-500 p-2 text-slate-950"
                        aria-label="Copy transfer code"
                      >
                        {copiedCode ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Photo Lightbox with Integrity Verification */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={closeLightbox}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-950 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="text-xs">
                  <span className="font-bold text-white block">{lightboxPhoto.title}</span>
                  <span className="font-mono text-[10px] text-emerald-400">
                    {t.vault.hashLabel} {lightboxPhoto.sha256} • {lightboxPhoto.capturedAt}
                  </span>
                </div>
                <button
                  onClick={closeLightbox}
                  className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20"
                  aria-label={t.vault.close}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-2 flex items-center justify-center bg-black max-h-[75dvh]">
                <img
                  src={lightboxPhoto.dataUrl}
                  alt={lightboxPhoto.title}
                  className="max-h-[70dvh] w-auto object-contain rounded-lg"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Warranty Transfer Code Modal */}
      <AnimatePresence>
        {claimOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm md:p-4"
            onClick={closeClaimModal}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] md:max-w-md rounded-t-3xl md:rounded-3xl border border-white/15 bg-white dark:bg-[#0b1120] p-5 pb-safe space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t.vault.claimTransferTitle}
                </h3>
                <button
                  onClick={closeClaimModal}
                  className="rounded-full bg-slate-100 dark:bg-slate-800 p-1.5"
                  aria-label={t.vault.close}
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {t.vault.claimTransferDesc}
              </p>
              <form onSubmit={handleClaimSubmit} className="space-y-3 text-xs">
                <input
                  type="text"
                  required
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value)}
                  placeholder={t.vault.claimTransferPlaceholder}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 py-3 font-mono font-bold uppercase text-slate-900 dark:text-white"
                />
                {claimError && (
                  <p className="text-[11px] font-semibold text-rose-500">{claimError}</p>
                )}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  disabled={claimLoading}
                  className="w-full rounded-xl bg-emerald-500 py-3 font-extrabold text-slate-950 disabled:opacity-60"
                >
                  {claimLoading ? '...' : t.vault.claimTransferBtn}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
