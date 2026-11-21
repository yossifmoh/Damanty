import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ScanLine,
  Wrench,
  MapPin,
  UserCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react';

export const TOUR_STEP_TABS = [
  'vault',
  'vault',
  'diagnostics',
  'scan',
  'centers',
  'account',
];

const STEP_ICONS = [
  Sparkles,
  ShieldCheck,
  Wrench,
  ScanLine,
  MapPin,
  UserCheck,
];

const STEP_ACCENTS = [
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
  'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
  'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
  'bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30',
  'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
];

/**
 * Floating non-blocking guided tour that navigates the live app across all tabs
 * while keeping the active screen visible and interactive behind it.
 */
export default function OnboardingTutorialModal({
  open,
  step,
  lang,
  t,
  isSignedIn = false,
  onStepChange,
  onCloseDemo,
  onGoToSignIn,
}) {
  const isAr = lang === 'ar';
  const steps = t?.tutorial?.steps || [];
  const total = steps.length || TOUR_STEP_TABS.length;
  const safeIndex = Math.max(0, Math.min(step, total - 1));
  const current = steps[safeIndex];

  if (!open || !current) return null;

  const StepIcon = STEP_ICONS[safeIndex] || Sparkles;
  const accentClass = STEP_ACCENTS[safeIndex] || STEP_ACCENTS[0];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === total - 1;
  const progressPct = ((safeIndex + 1) / total) * 100;
  const stepLabel = (t.tutorial.stepOf || '{current}/{total}')
    .replace('{current}', safeIndex + 1)
    .replace('{total}', total);

  const PrevIcon = isAr ? ArrowRight : ArrowLeft;
  const NextIcon = isAr ? ArrowLeft : ArrowRight;

  const goToIndex = (nextIdx) => {
    const clamped = Math.max(0, Math.min(nextIdx, total - 1));
    const nextTab = steps[clamped]?.tab || TOUR_STEP_TABS[clamped] || 'vault';
    onStepChange?.(clamped, nextTab);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom,0px))] md:bottom-6 z-[70] px-3 md:px-6 pointer-events-none flex justify-center md:justify-end"
        role="dialog"
        aria-label={t.tutorial.headerBadge}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-auto w-full max-w-md md:max-w-[390px] overflow-hidden rounded-3xl border border-emerald-500/35 bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        >
          {/* Animated Live Step Progress Bar */}
          <div className="h-1 w-full bg-slate-200 dark:bg-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>

          <div className="p-4 space-y-3">
            {/* Compact Top Meta Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold truncate ${accentClass}`}>
                  <StepIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{current.badge}</span>
                </span>
                {!isSignedIn && safeIndex === 0 && (
                  <span className="hidden sm:inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-300 shrink-0">
                    {t.tutorial.demoTag}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                  {stepLabel}
                </span>
                <button
                  type="button"
                  onClick={() => onCloseDemo?.()}
                  className="rounded-full bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                  aria-label={t.tutorial.skipDemo}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Active Step Title & Description */}
            <motion.div
              key={safeIndex}
              initial={{ opacity: 0, x: isAr ? -14 : 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-1"
            >
              <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                {current.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {current.desc}
              </p>
            </motion.div>

            {/* Clickable Step Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-0.5">
              {steps.map((s, idx) => (
                <button
                  key={`${s.tab}-${idx}`}
                  type="button"
                  onClick={() => goToIndex(idx)}
                  aria-label={s.badge}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === safeIndex
                      ? 'w-5 bg-emerald-500'
                      : idx < safeIndex
                      ? 'w-2 bg-emerald-500/45'
                      : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Footer Controls */}
            {isLast && !isSignedIn ? (
              <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
                <button
                  type="button"
                  onClick={onGoToSignIn}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 py-2.5 px-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25"
                >
                  <UserCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>{t.tutorial.ctaSignIn}</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToIndex(safeIndex - 1)}
                    className="rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-800/70 py-2.5 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1"
                  >
                    <PrevIcon className="h-3.5 w-3.5" />
                    <span>{t.tutorial.prevBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCloseDemo?.('vault')}
                    className="flex-1 sm:flex-initial rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-800/70 py-2.5 px-3 text-xs font-extrabold text-slate-700 dark:text-slate-200"
                  >
                    {t.tutorial.ctaExploreDemo}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 pt-0.5">
                {isFirst ? (
                  <button
                    type="button"
                    onClick={() => onCloseDemo?.()}
                    className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {t.tutorial.skipDemo}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => goToIndex(safeIndex - 1)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-800/70 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-200"
                  >
                    <PrevIcon className="h-3.5 w-3.5" />
                    <span>{t.tutorial.prevBtn}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    isLast ? onCloseDemo?.('vault') : goToIndex(safeIndex + 1)
                  }
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-2 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  <span>{isLast ? t.tutorial.finishBtn : t.tutorial.nextBtn}</span>
                  {!isLast && <NextIcon className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
