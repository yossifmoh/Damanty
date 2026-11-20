import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  CheckCircle2,
  Circle,
  Wrench,
  Sparkles,
  X,
  PhoneCall,
} from 'lucide-react';
import { TROUBLESHOOTING_GUIDES } from '../data/mockData';

export default function DiagnosticsScreen({
  devices,
  lang,
  t,
  preselectedDeviceId,
}) {
  const isAr = lang === 'ar';
  const [selectedDeviceId, setSelectedDeviceId] = useState(
    preselectedDeviceId || devices[0]?.id || ''
  );
  const [customCode, setCustomCode] = useState('');
  const [checkedSteps, setCheckedSteps] = useState({});
  const [resolved, setResolved] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    if (preselectedDeviceId) {
      setSelectedDeviceId(preselectedDeviceId);
      setCheckedSteps({});
      setResolved(false);
    }
  }, [preselectedDeviceId]);

  const activeDevice =
    devices.find((d) => d.id === selectedDeviceId) || devices[0];

  // Pick matching guide by category or typed error code
  const matchingGuides = TROUBLESHOOTING_GUIDES.filter((g) => {
    if (customCode.trim()) {
      return g.code.toLowerCase().includes(customCode.trim().toLowerCase());
    }
    return activeDevice ? g.category === activeDevice.category : true;
  });

  const activeGuide = matchingGuides[0] || TROUBLESHOOTING_GUIDES[0];

  const toggleStep = (stepId) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const completedCount = activeGuide.steps.filter((s) => checkedSteps[s.id]).length;

  return (
    <div className="space-y-4 pb-28">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
          {t.diagnostics.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t.diagnostics.subtitle}
        </p>
      </div>

      {/* 1. Select Device */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
          {t.diagnostics.selectDevice}
        </label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {devices.map((dev) => {
            const active = dev.id === activeDevice?.id;
            return (
              <motion.button
                key={dev.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setSelectedDeviceId(dev.id);
                  setCustomCode('');
                  setCheckedSteps({});
                  setResolved(false);
                }}
                className={`shrink-0 rounded-2xl border px-3.5 py-2.5 text-start transition-all ${
                  active
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-[10px] font-bold uppercase block opacity-75">
                  {isAr ? dev.brandAr : dev.brand}
                </span>
                <span className="text-xs font-bold">
                  {isAr ? dev.nameAr.slice(0, 22) : dev.nameEn.slice(0, 22)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. Error Code Quick Chips + Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
          {t.diagnostics.selectError}
        </label>
        <div className="flex flex-wrap gap-2">
          {TROUBLESHOOTING_GUIDES.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setCustomCode(g.code);
                setCheckedSteps({});
                setResolved(false);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-mono font-bold border transition-all ${
                activeGuide.id === g.id
                  ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 text-slate-700 dark:text-slate-300'
              }`}
            >
              {g.code}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={customCode}
          onChange={(e) => setCustomCode(e.target.value)}
          placeholder={t.diagnostics.customCodePlaceholder}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Diagnostic Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/75 backdrop-blur-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {isAr ? activeGuide.titleAr : activeGuide.titleEn}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? activeGuide.summaryAr : activeGuide.summaryEn}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-300">
            {t.diagnostics.saveBadge} {activeGuide.savedEgp} {t.diagnostics.egp}
          </span>
        </div>

        {/* Checklist Progress */}
        <div className="flex items-center justify-between text-[11px] pt-1">
          <span className="font-bold text-slate-600 dark:text-slate-300">
            {t.diagnostics.stepsTitle}
          </span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            {t.diagnostics.completedOf} {completedCount} {t.diagnostics.from}{' '}
            {activeGuide.steps.length}
          </span>
        </div>

        <div className="space-y-2">
          {activeGuide.steps.map((step) => {
            const done = !!checkedSteps[step.id];
            return (
              <motion.button
                key={step.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleStep(step.id)}
                className={`w-full flex items-start gap-2.5 rounded-xl border p-3 text-start transition-all ${
                  done
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/40'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                )}
                <span
                  className={`text-xs leading-relaxed ${
                    done
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {isAr ? step.ar : step.en}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Actions */}
        {!resolved ? (
          <div className="pt-2 space-y-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setResolved(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="h-4 w-4" />
              {t.diagnostics.solvedBtn}
            </motion.button>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.diagnostics.stillBroken}
              </span>
              <button
                onClick={() => {
                  setBookingConfirmed(false);
                  setBookingOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                <Wrench className="h-3.5 w-3.5" />
                {t.diagnostics.bookTechBtn}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <span>{t.diagnostics.solvedMsg}</span>
          </div>
        )}
      </div>

      {/* Fallback Official Technician Booking Sheet */}
      <AnimatePresence>
        {bookingOpen && activeDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setBookingOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] rounded-t-3xl border-t border-white/15 bg-white dark:bg-[#0b1120] p-5 pb-safe space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t.diagnostics.bookingTitle}
                </h3>
                <button
                  onClick={() => setBookingOpen(false)}
                  className="rounded-full bg-slate-100 dark:bg-slate-800 p-1.5"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 p-3.5 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'الجهاز' : 'Device'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {isAr ? activeDevice.nameAr : activeDevice.nameEn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.vault.serialLabel}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {activeDevice.serial}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.diagnostics.warrantyStatus}</span>
                  <span
                    className={`font-bold ${
                      activeDevice.status === 'expiring_soon'
                        ? 'text-amber-500'
                        : 'text-emerald-500'
                    }`}
                  >
                    {activeDevice.status === 'expiring_soon'
                      ? t.diagnostics.warrantyExpiring
                      : t.diagnostics.warrantyActive}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'التوكيل' : 'Official Group'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {isAr ? activeDevice.authorizedGroupAr : activeDevice.authorizedGroupEn} (
                    {activeDevice.hotline})
                  </span>
                </div>
              </div>

              {!bookingConfirmed ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setBookingConfirmed(true)}
                  className="w-full rounded-xl bg-emerald-500 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25"
                >
                  {t.diagnostics.confirmBooking}
                </motion.button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>{t.diagnostics.bookingConfirmed}</span>
                  </div>
                  <a
                    href={`tel:${activeDevice.hotline}`}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white/10 py-3 text-xs font-bold text-white"
                  >
                    <PhoneCall className="h-4 w-4 text-emerald-400" />
                    {t.vault.callHotline} ({activeDevice.hotline})
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
