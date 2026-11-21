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
  LogIn,
  LogOut,
  UserPlus,
  BadgeCheck,
  Eye,
  EyeOff,
  PlayCircle,
} from 'lucide-react';
import { B2B_ANALYTICS } from '../data/mockData';
import QrCodeSvg from './QrCodeSvg';
import {
  signInAccount,
  signUpAccount,
  signOutAccount,
} from '../utils/cloudSync';
import { getDisplayNickname } from '../utils/userDisplay';

export default function AccountB2BScreen({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  b2bMode,
  onToggleB2B,
  t,
  user,
  onAuthChanged,
  onReplayTour,
}) {
  const isAr = lang === 'ar';
  const [batchBrand, setBatchBrand] = useState('LG');
  const [batchPrefix, setBatchPrefix] = useState('F4V5-EG26');
  const [batchQty, setBatchQty] = useState(500);
  const [generatedBatch, setGeneratedBatch] = useState(null);

  // Auth form state
  const [authTab, setAuthTab] = useState('signin'); // 'signin' | 'signup' | null
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const mapAuthError = (code) => {
    if (code === 'INVALID_INPUT') return t.account.authErrInvalid;
    if (code === 'EMAIL_EXISTS') return t.account.authErrEmailExists;
    if (code === 'INVALID_CREDENTIALS') return t.account.authErrCredentials;
    if (code === 'RATE_LIMITED') return t.account.authErrRateLimit;
    return t.account.authErrServer;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res =
        authTab === 'signup'
          ? await signUpAccount({
              name: authName,
              phone: authPhone,
              email: authEmail,
              password: authPassword,
            })
          : await signInAccount({
              identifier: authIdentifier,
              password: authPassword,
            });
      if (!res?.ok || !res.user) {
        setAuthError(mapAuthError(res?.error));
      } else {
        setAuthPassword('');
        setShowPassword(false);
        await onAuthChanged?.(res.user, authTab === 'signup');
      }
    } catch {
      setAuthError(t.account.authErrServer);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    await signOutAccount();
    setAuthPassword('');
    setShowPassword(false);
    setAuthError('');
    await onAuthChanged?.(null, false);
    setAuthLoading(false);
  };

  const handleGenerateBatch = () => {
    const batchId = `${batchBrand}-${batchPrefix}-${batchQty}-${Date.now()
      .toString()
      .slice(-4)}`;
    setGeneratedBatch(batchId);
  };

  return (
    <div className="space-y-4 pb-28 md:pb-10">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
          {t.account.title}
        </h2>
      </div>

      {/* User Account & Sign In / Sign Up / Sign Out Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/75 backdrop-blur-xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {user ? getDisplayNickname(user.name) : t.account.userName}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    user
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                  }`}
                >
                  {user && <BadgeCheck className="h-3 w-3" />}
                  {user ? t.account.signedInBadge : t.account.guestBadge}
                </span>
              </div>
              {user && getDisplayNickname(user.name) !== user.name.trim() && (
                <p className="text-[11px] text-slate-400 truncate">
                  {user.name}
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                {user ? user.email : t.account.userPhone}
              </p>
              {user?.phone && (
                <p className="text-[11px] text-slate-400 font-mono">{user.phone}</p>
              )}
            </div>
          </div>

          {user && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={authLoading}
              onClick={handleSignOut}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-300 disabled:opacity-60"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t.account.signOutBtn}</span>
            </motion.button>
          )}
        </div>

        {/* Sign In / Sign Up Form when Guest */}
        {!user && (
          <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-3">
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setAuthError('');
                  setAuthPassword('');
                  setShowPassword(false);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                  authTab === 'signin'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{t.account.signInBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signup');
                  setAuthError('');
                  setAuthPassword('');
                  setShowPassword(false);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                  authTab === 'signup'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{t.account.signUpBtn}</span>
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-2.5 text-xs">
              {authTab === 'signup' ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      {t.account.authNameLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        {t.account.authEmailLabel}
                      </label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        {t.account.authPhoneLabel}
                      </label>
                      <input
                        type="tel"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        placeholder="+20 10..."
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    {t.account.authIdentifierLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={authIdentifier}
                    onChange={(e) => setAuthIdentifier(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  {t.account.authPasswordLabel}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 ps-3 pe-10 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? t.account.hidePassword : t.account.showPassword}
                    className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                  {authError}
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 disabled:opacity-60"
              >
                {authLoading
                  ? '...'
                  : authTab === 'signup'
                  ? t.account.authSubmitSignUp
                  : t.account.authSubmitSignIn}
              </motion.button>
            </form>
          </div>
        )}
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

      {/* Dedicated Replayable Tutorial Section */}
      {onReplayTour && (
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <PlayCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                {t.account.tourSectionTitle}
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                {t.account.tourSectionDesc}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onReplayTour}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20"
          >
            <PlayCircle className="h-4 w-4" />
            <span>{t.account.tourReplayBtn}</span>
          </motion.button>
        </div>
      )}

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
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
