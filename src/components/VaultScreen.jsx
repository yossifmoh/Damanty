import React, { useState } from 'react';
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
} from 'lucide-react';
import QrCodeSvg from './QrCodeSvg';

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
}) {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [transferCode, setTransferCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [checkupBooked, setCheckupBooked] = useState(false);

  const isAr = lang === 'ar';

  const avgScore = devices.length
    ? Math.round(
        devices.reduce((acc, d) => acc + (d.remainingPct || 0), 0) / devices.length
      )
    : 100;
  // Display boosted protection score (e.g. 94% when 4+ devices or newly scanned)
  const protectionScore = Math.min(99, Math.max(82, avgScore + 18));

  const expiringDevice = devices.find((d) => d.status === 'expiring_soon');

  const openCertificate = (device) => {
    setSelectedDevice(device);
    setIsFlipped(false);
    setTransferCode(null);
    setCopiedCode(false);
  };

  const handleGenerateTransfer = () => {
    if (!selectedDevice) return;
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    setTransferCode(`DM-TR-${selectedDevice.brand.slice(0, 2).toUpperCase()}-${rand}`);
  };

  const handleCopyTransfer = () => {
    if (!transferCode) return;
    navigator.clipboard?.writeText(transferCode).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-4 pb-28">
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t.vault.protectionScore}
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
                  {protectionScore}% {t.vault.protected}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {devices.length} {t.vault.devicesCount}
              </p>
            </div>
          </div>

          <div className="text-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
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
                  onClick={() => setCheckupBooked(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20"
                >
                  {checkupBooked ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t.vault.checkupBooked}
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
      <div className="space-y-3">
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

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span>{t.vault.tapCertificate}</span>
                <span>{isAr ? device.authorizedGroupAr : device.authorizedGroupEn}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3D Holographic Flippable Warranty Certificate Bottom Sheet */}
      <AnimatePresence>
        {selectedDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedDevice(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] max-h-[90dvh] overflow-y-auto no-scrollbar rounded-t-3xl border-t border-white/15 bg-slate-50 dark:bg-[#0b1120] p-5 pb-safe shadow-2xl"
            >
              {/* Drag Handle & Close */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-8" />
                <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="rounded-full bg-slate-200/80 dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300"
                  aria-label={t.vault.close}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

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
    </div>
  );
}
