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
  Bot,
  Send,
} from 'lucide-react';
import { TROUBLESHOOTING_GUIDES } from '../data/mockData';
import { bookServiceOnCloud } from '../utils/cloudSync';
import { diagnoseQuery } from '../utils/troubleshootEngine';

const CATEGORY_OPTIONS = [
  { key: 'washer', labelAr: 'غسالة', labelEn: 'Washer', hotline: '19960', brandAr: 'توكيل الغسالات', brandEn: 'Official Washer Care' },
  { key: 'ac', labelAr: 'تكييف', labelEn: 'Split AC', hotline: '19319', brandAr: 'توكيل التكييف', brandEn: 'Official AC Care' },
  { key: 'fridge', labelAr: 'ثلاجة', labelEn: 'Fridge', hotline: '16580', brandAr: 'توكيل الثلاجات', brandEn: 'Official Fridge Care' },
  { key: 'tv', labelAr: 'شاشة', labelEn: 'Smart TV', hotline: '19319', brandAr: 'توكيل الشاشات', brandEn: 'Official TV Care' },
];

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
  const [fallbackCategory, setFallbackCategory] = useState('washer');
  const [customCode, setCustomCode] = useState('');
  const [symptomInput, setSymptomInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [checkedSteps, setCheckedSteps] = useState({});
  const [resolved, setResolved] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const onPopState = (e) => {
      if (!e.state?.modal) {
        setBookingOpen(false);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (preselectedDeviceId) {
      setSelectedDeviceId(preselectedDeviceId);
      setCheckedSteps({});
      setResolved(false);
    }
  }, [preselectedDeviceId]);

  const activeDevice =
    devices.find((d) => d.id === selectedDeviceId) || devices[0] || null;
  const activeCategory = activeDevice?.category || fallbackCategory;
  const fallbackMeta =
    CATEGORY_OPTIONS.find((c) => c.key === activeCategory) || CATEGORY_OPTIONS[0];

  const activeGuide = diagnoseQuery({
    query: submittedQuery || customCode,
    category: activeCategory,
  });

  const handleAskAssistant = (e) => {
    e?.preventDefault();
    setSubmittedQuery(symptomInput.trim());
    setCheckedSteps({});
    setResolved(false);
  };

  const quickSymptoms = isAr
    ? ['التكييف بينقط مية', 'الغسالة مبتعصرش', 'الثلاجة مش بتسقع', 'الشاشة بتفصل']
    : ['AC dripping water', 'Washer not spinning', 'Weak fridge cooling', 'TV no signal'];

  const openBookingSheet = () => {
    setBookingConfirmed(false);
    setTicketId('');
    setBookingOpen(true);
    if (window.history.state?.modal !== 'diag_booking') {
      window.history.pushState(
        { ...(window.history.state || { tab: 'diagnostics' }), modal: 'diag_booking' },
        ''
      );
    }
  };

  const closeBookingSheet = () => {
    if (window.history.state?.modal === 'diag_booking') {
      window.history.back();
    } else {
      setBookingOpen(false);
    }
  };

  const handleConfirmBooking = async () => {
    setBookingLoading(true);
    const res = await bookServiceOnCloud({
      deviceId: activeDevice?.id || `cat-${activeCategory}`,
      deviceSerial: activeDevice?.serial || 'NEW-CHECKUP',
      bookingType: 'technician',
      hotline: activeDevice?.hotline || fallbackMeta.hotline,
    });
    setTicketId(res?.ticketId || 'DM-8942');
    setBookingConfirmed(true);
    setBookingLoading(false);
  };

  const toggleStep = (stepId) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const completedCount = activeGuide.steps.filter((s) => checkedSteps[s.id]).length;
  const bookingHotline = activeDevice?.hotline || fallbackMeta.hotline;

  return (
    <div className="space-y-4 pb-28 md:pb-10">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
          {t.diagnostics.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t.diagnostics.subtitle}
        </p>
      </div>

      {/* 1. Select Device or Category if 0 devices */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
          {devices.length > 0 ? t.diagnostics.selectDevice : t.diagnostics.categoryPick}
        </label>
        {devices.length > 0 ? (
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
                    setSubmittedQuery('');
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
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-amber-600 dark:text-amber-300 font-medium">
              {t.diagnostics.noDevicesHint}
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setFallbackCategory(cat.key);
                    setSubmittedQuery('');
                    setCustomCode('');
                    setCheckedSteps({});
                    setResolved(false);
                  }}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold border transition-all ${
                    fallbackCategory === cat.key
                      ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive AI Symptom Assistant Box */}
      <form
        onSubmit={handleAskAssistant}
        className="rounded-2xl border border-emerald-500/25 bg-white dark:bg-slate-900/75 p-3.5 space-y-2.5"
      >
        <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
          <Bot className="h-4 w-4" />
          <span>{t.diagnostics.botTitle}</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
            placeholder={t.diagnostics.askPlaceholder}
            className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-extrabold text-slate-950 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{t.diagnostics.askBtn}</span>
          </motion.button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickSymptoms.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => {
                setSymptomInput(sym);
                setSubmittedQuery(sym);
                setCustomCode('');
                setCheckedSteps({});
                setResolved(false);
              }}
              className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-500/15 hover:text-emerald-600"
            >
              {sym}
            </button>
          ))}
        </div>
      </form>

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
                setSubmittedQuery('');
                setCheckedSteps({});
                setResolved(false);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-mono font-bold border transition-all ${
                activeGuide.code === g.code
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
          onChange={(e) => {
            setCustomCode(e.target.value);
            setSubmittedQuery('');
          }}
          placeholder={t.diagnostics.customCodePlaceholder}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Diagnostic Assistant Response Card */}
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
                {isAr ? activeGuide.replyAr : activeGuide.replyEn}
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
                onClick={openBookingSheet}
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
        {bookingOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm md:p-4"
            onClick={closeBookingSheet}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] md:max-w-lg rounded-t-3xl md:rounded-3xl border border-white/15 bg-white dark:bg-[#0b1120] p-5 pb-safe space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t.diagnostics.bookingTitle}
                </h3>
                <button
                  onClick={closeBookingSheet}
                  className="rounded-full bg-slate-100 dark:bg-slate-800 p-1.5"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 p-3.5 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'الجهاز' : 'Device'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeDevice
                      ? isAr
                        ? activeDevice.nameAr
                        : activeDevice.nameEn
                      : isAr
                      ? fallbackMeta.labelAr
                      : fallbackMeta.labelEn}
                  </span>
                </div>
                {activeDevice && (
                  <>
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
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'التوكيل' : 'Official Group'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeDevice
                      ? isAr
                        ? activeDevice.authorizedGroupAr
                        : activeDevice.authorizedGroupEn
                      : isAr
                      ? fallbackMeta.brandAr
                      : fallbackMeta.brandEn}{' '}
                    ({bookingHotline})
                  </span>
                </div>
              </div>

              {!bookingConfirmed ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={bookingLoading}
                  onClick={handleConfirmBooking}
                  className="w-full rounded-xl bg-emerald-500 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 disabled:opacity-60"
                >
                  {bookingLoading ? '...' : t.diagnostics.confirmBooking}
                </motion.button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>
                      {t.diagnostics.bookingConfirmed.replace('DM-8942', ticketId || 'DM-8942')}
                    </span>
                  </div>
                  <a
                    href={`tel:${bookingHotline}`}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white/10 py-3 text-xs font-bold text-white"
                  >
                    <PhoneCall className="h-4 w-4 text-emerald-400" />
                    {t.vault.callHotline} ({bookingHotline})
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
