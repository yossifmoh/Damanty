import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ScanLine,
  Bot,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';

export default function OnboardingTutorialModal({
  open,
  lang,
  t,
  onCloseDemo,
  onGoToSignIn,
}) {
  const [step, setStep] = useState(0);
  const isAr = lang === 'ar';

  if (!open) return null;

  const slides = [
    {
      icon: <ShieldCheck className="h-8 w-8 text-emerald-400" />,
      badge: t.tutorial.demoTag,
      title: t.tutorial.s1Title,
      desc: t.tutorial.s1Desc,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    },
    {
      icon: <ScanLine className="h-8 w-8 text-emerald-400" />,
      badge: t.tabs.scan,
      title: t.tutorial.s2Title,
      desc: t.tutorial.s2Desc,
      color: 'from-teal-500/20 to-cyan-500/10 border-teal-500/30',
    },
    {
      icon: <Bot className="h-8 w-8 text-amber-400" />,
      badge: t.tabs.diagnostics,
      title: t.tutorial.s3Title,
      desc: t.tutorial.s3Desc,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
    },
    {
      icon: <UserCheck className="h-8 w-8 text-emerald-400" />,
      badge: t.account.signInBtn,
      title: t.tutorial.s4Title,
      desc: t.tutorial.s4Desc,
      color: 'from-emerald-500/25 to-slate-900 border-emerald-500/40',
    },
  ];

  const current = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
        onClick={onCloseDemo}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 14 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl border border-white/15 bg-white dark:bg-[#0b1120] p-6 shadow-2xl space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t.tutorial.headerBadge}
            </span>
            <button
              type="button"
              onClick={onCloseDemo}
              className="rounded-full bg-slate-100 dark:bg-slate-800 p-1.5 text-slate-500"
              aria-label={t.vault.close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Slide Body */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: isAr ? -18 : 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22 }}
            className={`rounded-2xl border bg-gradient-to-br p-5 space-y-3 ${current.color}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950/80 border border-white/10">
                {current.icon}
              </div>
              <span className="rounded-full bg-white/80 dark:bg-slate-950/60 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                {current.badge}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {current.title}
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {current.desc}
            </p>
          </motion.div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === step
                    ? 'w-7 bg-emerald-500'
                    : 'w-2 bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Footer Navigation */}
          {!isLast ? (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onCloseDemo}
                className="rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                {t.tutorial.skipDemo}
              </button>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                  </button>
                )}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/25"
                >
                  <span>{t.tutorial.nextBtn}</span>
                  {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={onGoToSignIn}
                className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25"
              >
                {t.tutorial.ctaSignIn}
              </motion.button>
              <button
                type="button"
                onClick={onCloseDemo}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-800/80 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                {t.tutorial.ctaExploreDemo}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
