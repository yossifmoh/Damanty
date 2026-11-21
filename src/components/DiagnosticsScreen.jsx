import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ShieldCheck,
  Lock,
  Plus,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { bookServiceOnCloud, requestAiDiagnosis } from '../utils/cloudSync';
import { diagnoseQuery } from '../utils/troubleshootEngine';

export default function DiagnosticsScreen({
  devices,
  lang,
  t,
  preselectedDeviceId,
  onNavigateScan,
  tourStepId = null,
}) {
  const isAr = lang === 'ar';
  const [symptomInput, setSymptomInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [checkedSteps, setCheckedSteps] = useState({});
  const [resolved, setResolved] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Live Gemini AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { query, lang, source, title, summary, steps, recommendTechnician, statusHint }
  const aiCacheRef = useRef(new Map());
  const requestSeqRef = useRef(0);

  const demoInjectedRef = useRef(false);
  const prevTourStepRef = useRef(null);
  const diagResultRef = useRef(null);

  useEffect(() => {
    const onPopState = (e) => {
      if (!e.state?.modal) {
        setBookingOpen(false);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Live guided tour demo step (0-token local showcase)
  useEffect(() => {
    if (prevTourStepRef.current === tourStepId) return;
    prevTourStepRef.current = tourStepId;

    if (tourStepId === 'diagnostics-live' && Array.isArray(devices) && devices.length > 0) {
      const sampleQuery = isAr ? 'التكييف بينقط مية' : 'AC dripping water';
      demoInjectedRef.current = true;
      setAiResult(null);
      setAiLoading(false);
      setSymptomInput(sampleQuery);
      setSubmittedQuery(sampleQuery);
      setCheckedSteps({});
      setResolved(false);
      setTimeout(() => {
        if (window.innerWidth < 768) {
          diagResultRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 220);
    } else if (demoInjectedRef.current) {
      demoInjectedRef.current = false;
      setAiResult(null);
      setAiLoading(false);
      setSymptomInput('');
      setSubmittedQuery('');
      setCheckedSteps({});
      setResolved(false);
    }
  }, [tourStepId, devices, isAr]);

  // When navigated from a specific card in My Vault, prefill that product seamlessly
  useEffect(() => {
    if (preselectedDeviceId && Array.isArray(devices)) {
      const preDev = devices.find((d) => d.id === preselectedDeviceId);
      if (preDev) {
        const devTitle = isAr ? preDev.nameAr : preDev.nameEn;
        demoInjectedRef.current = false;
        setAiResult(null);
        setSymptomInput(devTitle);
        setSubmittedQuery(devTitle);
        setCheckedSteps({});
        setResolved(false);
      }
    }
  }, [preselectedDeviceId, devices, isAr]);

  const safeDevices = Array.isArray(devices) ? devices : [];
  const localGuide = diagnoseQuery({
    query: submittedQuery,
    devices: safeDevices,
  });

  const activeDevice = localGuide.matchedDevice || null;
  const activeProfile = localGuide.profile || {};

  // Execute token-efficient Gemini AI call with Vault gating + session cache
  const runDiagnosisQuery = async (rawText) => {
    const clean = String(rawText || '').trim();
    demoInjectedRef.current = false;
    setSubmittedQuery(clean);
    setCheckedSteps({});
    setResolved(false);

    if (!clean || safeDevices.length === 0) {
      setAiResult(null);
      setAiLoading(false);
      return;
    }

    const preCheck = diagnoseQuery({ query: clean, devices: safeDevices });
    if (preCheck.locked || preCheck.notInVault) {
      setAiResult(null);
      setAiLoading(false);
      return;
    }

    const targetDev = preCheck.matchedDevice || null;
    const cacheKey = `${lang}::${targetDev?.id || 'any'}::${clean.toLowerCase()}`;
    const cached = aiCacheRef.current.get(cacheKey);
    if (cached) {
      setAiResult(cached);
      setAiLoading(false);
      return;
    }

    const seq = ++requestSeqRef.current;
    setAiLoading(true);
    setAiResult(null);

    const apiRes = await requestAiDiagnosis({
      query: clean,
      lang,
      device: targetDev,
      devices: safeDevices,
    });

    if (requestSeqRef.current !== seq) return;
    setAiLoading(false);

    if (apiRes?.ok && apiRes.diagnosis) {
      const formatted = {
        query: clean,
        lang,
        source: 'gemini',
        title: apiRes.diagnosis.title,
        summary: apiRes.diagnosis.summary,
        steps: apiRes.diagnosis.steps.map((text, idx) => ({
          id: `ai-${seq}-${idx}`,
          ar: text,
          en: text,
        })),
        recommendTechnician: Boolean(apiRes.diagnosis.recommendTechnician),
        statusHint: '',
      };
      aiCacheRef.current.set(cacheKey, formatted);
      setAiResult(formatted);
    } else {
      let statusHint = '';
      if (apiRes?.configured === false) {
        statusHint = t.diagnostics.aiKeyMissingHint;
      } else if (apiRes?.error === 'AI_RATE_LIMITED') {
        statusHint = t.diagnostics.aiRateLimitHint;
      }
      setAiResult({
        query: clean,
        lang,
        source: 'local_fallback',
        title: isAr ? preCheck.titleAr : preCheck.titleEn,
        summary: isAr ? preCheck.replyAr : preCheck.replyEn,
        steps: preCheck.steps || [],
        recommendTechnician: false,
        statusHint,
      });
    }
  };

  // Tailor prompt pills strictly to appliances present in the user's Vault
  const quickPrompts = useMemo(() => {
    if (safeDevices.length === 0) return [];
    const seen = new Set();
    const prompts = [];
    for (const dev of safeDevices) {
      const label = isAr ? dev.nameAr : dev.nameEn;
      if (!label || seen.has(label)) continue;
      seen.add(label);
      if (dev.category === 'ac') {
        prompts.push(isAr ? 'التكييف بينقط مية' : 'AC dripping water');
      } else if (dev.category === 'washer') {
        prompts.push(
          isAr ? `صيانة وتنظيف ${dev.brandAr || dev.brand}` : `${dev.brand} washer maintenance`
        );
      } else if (dev.category === 'fridge') {
        prompts.push(
          isAr ? `تبريد ${dev.brandAr || dev.brand}` : `${dev.brand} fridge cooling`
        );
      } else {
        prompts.push(isAr ? `فحص وصيانة ${label.slice(0, 24)}` : `Check ${label.slice(0, 24)}`);
      }
      if (prompts.length >= 4) break;
    }
    return prompts;
  }, [safeDevices, isAr]);

  const handleAskAssistant = (e) => {
    e?.preventDefault();
    runDiagnosisQuery(symptomInput);
  };

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

  const bookingHotline = activeDevice?.hotline || activeProfile.hotline || '19960';

  const handleConfirmBooking = async () => {
    setBookingLoading(true);
    const res = await bookServiceOnCloud({
      deviceId: activeDevice?.id || `general-${activeProfile.key || 'electrical'}`,
      deviceSerial: activeDevice?.serial || 'GENERAL-CHECKUP',
      bookingType: 'technician',
      hotline: bookingHotline,
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

  const useAiPayload =
    aiResult &&
    aiResult.query === submittedQuery &&
    aiResult.lang === lang &&
    !localGuide.locked &&
    !localGuide.notInVault;

  const displayTitle = useAiPayload
    ? aiResult.title
    : isAr
    ? localGuide.titleAr
    : localGuide.titleEn;
  const displayReply = useAiPayload
    ? aiResult.summary
    : isAr
    ? localGuide.replyAr
    : localGuide.replyEn;
  const steps = useAiPayload ? aiResult.steps || [] : localGuide.steps || [];
  const completedCount = steps.filter((s) => checkedSteps[s.id]).length;
  const recommendTech = Boolean(useAiPayload && aiResult.recommendTechnician);

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

      {/* Exclusive Gate: AI Diagnostics unlocks ONLY when user has registered appliances */}
      {localGuide.locked ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-dashed border-amber-500/40 bg-white/85 dark:bg-slate-900/75 p-7 text-center space-y-3.5 shadow-sm"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
            <Lock className="h-7 w-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t.diagnostics.lockedTitle}
          </h3>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t.diagnostics.lockedDesc}
          </p>
          {onNavigateScan && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onNavigateScan}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25"
            >
              <Plus className="h-4 w-4" />
              <span>{t.diagnostics.lockedCtaScan}</span>
            </motion.button>
          )}
        </motion.div>
      ) : (
        <>
          {/* AI Electrical Appliances & Vault Product Assistant */}
          <form
            onSubmit={handleAskAssistant}
            className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-slate-900/80 p-4 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                <Bot className="h-4 w-4 shrink-0" />
                <span>{t.diagnostics.botTitle}</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300 shrink-0">
                <ShieldCheck className="h-3 w-3" />
                {safeDevices.length} {isAr ? 'في خزنتك' : 'in Vault'}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {t.diagnostics.universalHint}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                placeholder={t.diagnostics.askPlaceholder}
                className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              />
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={aiLoading}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 shrink-0 disabled:opacity-65"
              >
                {aiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>{t.diagnostics.askBtn}</span>
              </motion.button>
            </div>

            {quickPrompts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    disabled={aiLoading}
                    onClick={() => {
                      setSymptomInput(sym);
                      runDiagnosisQuery(sym);
                    }}
                    className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-500/15 hover:text-emerald-600 transition-colors disabled:opacity-55"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Unregistered Appliance Notice OR Loading OR Diagnostic Assistant Response Card */}
          {localGuide.notInVault ? (
            <div
              ref={diagResultRef}
              id="tour-diag-result"
              className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-5 text-center space-y-3"
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {t.diagnostics.unregisteredNoticeTitle}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {t.diagnostics.unregisteredNoticeDesc}
              </p>
              {onNavigateScan && (
                <button
                  type="button"
                  onClick={onNavigateScan}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.diagnostics.addDeviceCtaScan}</span>
                </button>
              )}
            </div>
          ) : aiLoading ? (
            <div
              ref={diagResultRef}
              id="tour-diag-result"
              className="rounded-2xl border border-emerald-500/35 bg-white dark:bg-slate-900/75 p-6 text-center space-y-2.5"
            >
              <Loader2 className="mx-auto h-7 w-7 text-emerald-500 animate-spin" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {t.diagnostics.aiLoadingText}
              </p>
            </div>
          ) : (
            <div
              ref={diagResultRef}
              id="tour-diag-result"
              className={`scroll-mt-20 rounded-2xl border bg-white dark:bg-slate-900/75 backdrop-blur-xl p-4 space-y-3 shadow-sm transition-all ${
                tourStepId === 'diagnostics-live'
                  ? 'border-emerald-500/70 ring-2 ring-emerald-400/50'
                  : 'border-slate-200 dark:border-white/10'
              }`}
            >
              {/* Source + Linked Vault Device Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                {useAiPayload && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                      aiResult.source === 'gemini'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Sparkles className="h-3 w-3 shrink-0" />
                    {aiResult.source === 'gemini'
                      ? t.diagnostics.aiBadgeLive
                      : t.diagnostics.aiBadgeLocalFallback}
                  </span>
                )}
                {activeDevice && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="h-3 w-3 shrink-0" />
                    {isAr
                      ? `مرتبط بجهازك المسجل: ${activeDevice.nameAr}`
                      : `Linked to your Vault: ${activeDevice.nameEn}`}
                  </span>
                )}
              </div>

              {useAiPayload && aiResult.statusHint && (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  {aiResult.statusHint}
                </p>
              )}

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {displayTitle}
                    </h3>
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {displayReply}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-300">
                  {t.diagnostics.saveBadge} {localGuide.savedEgp || 500} {t.diagnostics.egp}
                </span>
              </div>

              {/* Checklist Progress */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {t.diagnostics.stepsTitle}
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {t.diagnostics.completedOf} {completedCount} {t.diagnostics.from}{' '}
                  {steps.length}
                </span>
              </div>

              <div className="space-y-2">
                {steps.map((step) => {
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

              {/* AI Urgent Technician Escalation Alert when Gemini flags hardware/safety issue */}
              {recommendTech && !resolved && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2.5 flex items-center gap-2 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>{t.diagnostics.aiRecommendTech}</span>
                </div>
              )}

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
                      className={`inline-flex items-center gap-1 text-xs font-bold hover:underline ${
                        recommendTech
                          ? 'rounded-lg bg-amber-500 px-3 py-1.5 text-slate-950 shadow-sm'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
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
          )}
        </>
      )}

      {/* Official Technician Booking Sheet */}
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
                  aria-label={t.vault.close}
                  className="rounded-full bg-slate-100 dark:bg-slate-800 p-1.5"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 p-3.5 text-xs space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 shrink-0">
                    {isAr ? 'الجهاز' : 'Device'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-end">
                    {activeDevice
                      ? isAr
                        ? activeDevice.nameAr
                        : activeDevice.nameEn
                      : isAr
                      ? activeProfile.labelAr || 'جهاز كهربائي'
                      : activeProfile.labelEn || 'Electrical Appliance'}
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
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 shrink-0">
                    {isAr ? 'التوكيل' : 'Official Group'}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-end">
                    {activeDevice
                      ? isAr
                        ? activeDevice.authorizedGroupAr
                        : activeDevice.authorizedGroupEn
                      : isAr
                      ? activeProfile.brandAr || 'مركز الصيانة المعتمد'
                      : activeProfile.brandEn || 'Authorized Service Center'}{' '}
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
