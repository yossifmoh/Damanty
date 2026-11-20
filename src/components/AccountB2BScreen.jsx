import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Globe,
  Moon,
  Sun,
  Building2,
  TrendingDown,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  BarChart3,
  Map,
} from 'lucide-react';
import { B2B_ANALYTICS } from '../data/mockData';
import QrCodeSvg from './QrCodeSvg';

export default function AccountB2BScreen({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  b2bMode,
  onToggleB2B,
  t,
}) {
  const isAr = lang === 'ar';
  const [batchBrand, setBatchBrand] = useState('LG');
  const [batchPrefix, setBatchPrefix] = useState('F4V5-EG26');
  const [batchQty, setBatchQty] = useState(500);
  const [generatedBatch, setGeneratedBatch] = useState(null);

  const handleGenerateBatch = () => {
    const batchId = `${batchBrand}-${batchPrefix}-${batchQty}-${Date.now()
      .toString()
      .slice(-4)}`;
    setGeneratedBatch(batchId);
  };

  return (
    <div className="space-y-4 pb-28">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
          {t.account.title}
        </h2>
      </div>

      {/* User Profile Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/75 backdrop-blur-xl p-4 flex items-center gap-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {t.account.userName}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {t.account.userPhone}
          </p>
        </div>
      </div>

      {/* Preferences: Language & Theme */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/75 p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {t.account.preferences}
        </h4>

        {/* Language Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t.account.languageLabel}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleLang}
            className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-white/10"
          >
            {lang === 'ar' ? 'English (EN)' : 'العربية (AR)'}
          </motion.button>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Moon className="h-4 w-4 text-amber-400" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t.account.themeLabel}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleTheme}
            className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10"
          >
            {theme === 'dark' ? t.account.lightMode : t.account.nightMode}
          </motion.button>
        </div>
      </div>

      {/* Prominent B2B Enterprise Pitch Mode Toggle */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onToggleB2B}
        className={`cursor-pointer rounded-2xl border p-4 transition-all ${
          b2bMode
            ? 'border-amber-500 bg-gradient-to-br from-amber-500/20 via-emerald-500/10 to-slate-900 shadow-lg shadow-amber-500/10'
            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/75'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                b2bMode
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-amber-500/15 text-amber-500'
              }`}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {t.account.b2bTitle}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.account.b2bDesc}
              </p>
            </div>
          </div>

          <div
            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
              b2bMode ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <motion.div
              animate={{ x: b2bMode ? (isAr ? -20 : 20) : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="h-5 w-5 rounded-full bg-white shadow"
            />
          </div>
        </div>
      </motion.div>

      {/* B2B Executive Analytics Dashboard */}
      <AnimatePresence>
        {b2bMode && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>{t.account.b2bHeadline}</span>
            </div>

            {/* Executive KPIs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-slate-900/80 p-3.5">
                <div className="flex items-center justify-between text-emerald-500">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-lg font-extrabold font-mono">
                    {B2B_ANALYTICS.callCenterReduction}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {t.account.kpiCallCenter}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3.5">
                <div className="flex items-center justify-between text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-lg font-extrabold font-mono">
                    {B2B_ANALYTICS.firstTimeFixRate}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {t.account.kpiFirstFix}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3.5">
                <div className="flex items-center justify-between text-amber-500">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-lg font-extrabold font-mono">
                    {B2B_ANALYTICS.counterfeitBlocked}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {t.account.kpiCounterfeit}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3.5">
                <div className="flex items-center justify-between text-emerald-500">
                  <span className="text-xs font-bold">EGP</span>
                  <span className="text-lg font-extrabold font-mono">
                    {B2B_ANALYTICS.monthlySavingsEgp}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {t.account.kpiSavings}
                </p>
              </div>
            </div>

            {/* Top Recurring Fault Codes */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                {t.account.topFaultsTitle}
              </h4>
              <div className="space-y-2.5">
                {B2B_ANALYTICS.topFaults.map((f) => (
                  <div
                    key={f.code}
                    className="rounded-xl bg-slate-50 dark:bg-slate-950/50 p-3 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-amber-500">
                        {f.code} • {f.model}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-500">
                        {f.aiResolvedPct}% {t.account.aiSolved}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      {isAr ? f.labelAr : f.labelEn} ({f.tickets.toLocaleString()})
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Egyptian Governorate Breakdown */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-emerald-500" />
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {t.account.govTitle}
                </h4>
              </div>
              <div className="space-y-2.5">
                {B2B_ANALYTICS.governorates.map((gov) => (
                  <div key={gov.nameEn} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {isAr ? gov.nameAr : gov.nameEn}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {gov.devices} ({gov.pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${gov.pct}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Factory Batch QR Code Generator */}
            <div className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-slate-900/80 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-emerald-500" />
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {t.account.batchQrTitle}
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    {t.account.batchBrand}
                  </label>
                  <select
                    value={batchBrand}
                    onChange={(e) => setBatchBrand(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="LG">LG</option>
                    <option value="TOR">Tornado</option>
                    <option value="SHP">Sharp</option>
                    <option value="SAM">Samsung</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    {t.account.batchPrefix}
                  </label>
                  <input
                    type="text"
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    {t.account.batchQty}
                  </label>
                  <input
                    type="number"
                    value={batchQty}
                    onChange={(e) => setBatchQty(Number(e.target.value) || 100)}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-2 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleGenerateBatch}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-extrabold text-slate-950"
              >
                {t.account.generateBatch}
              </motion.button>

              {generatedBatch && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 block">
                      {t.account.batchReady}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white break-all">
                      {generatedBatch}
                    </span>
                  </div>
                  <QrCodeSvg value={generatedBatch} size={64} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
