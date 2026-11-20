import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Wrench,
  ScanLine,
  MapPin,
  UserCircle2,
  Moon,
  Sun,
  Building2,
} from 'lucide-react';
import { INITIAL_DEVICES, TRANSLATIONS } from './data/mockData';
import VaultScreen from './components/VaultScreen';
import ScannerScreen from './components/ScannerScreen';
import DiagnosticsScreen from './components/DiagnosticsScreen';
import CentersScreen from './components/CentersScreen';
import AccountB2BScreen from './components/AccountB2BScreen';

const STORAGE_KEYS = {
  DEVICES: 'damanty_devices_v1',
  LANG: 'damanty_lang_v1',
  THEME: 'damanty_theme_v1',
  B2B: 'damanty_b2b_v1',
};

export default function App() {
  const [devices, setDevices] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEVICES);
      return saved ? JSON.parse(saved) : INITIAL_DEVICES;
    } catch {
      return INITIAL_DEVICES;
    }
  });

  const [lang, setLang] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.LANG) || 'ar';
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  });

  const [b2bMode, setB2bMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.B2B) === 'true';
  });

  const [activeTab, setActiveTab] = useState('vault');
  const [liveBanner, setLiveBanner] = useState(null);
  const [diagDeviceId, setDiagDeviceId] = useState(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;
  const isAr = lang === 'ar';

  // Sync HTML dir, lang, and dark class
  useEffect(() => {
    const root = document.documentElement;
    root.dir = isAr ? 'rtl' : 'ltr';
    root.lang = lang;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [lang, theme, isAr]);

  // Persist state in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
    } catch {
      // Ignore storage quota errors
    }
  }, [devices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.B2B, String(b2bMode));
  }, [b2bMode]);

  const handleAddDevice = (newDevice) => {
    setDevices((prev) => [newDevice, ...prev]);
    setLiveBanner(t.scanner.addedToast);
    setActiveTab('vault');
  };

  const handleNavigateDiagnostics = (deviceId) => {
    setDiagDeviceId(deviceId);
    setActiveTab('diagnostics');
  };

  return (
    <div
      className={`min-h-[100dvh] w-full bg-[#f8fafc] dark:bg-[#060913] text-slate-900 dark:text-slate-100 transition-colors duration-300 ${
        isAr ? 'font-cairo' : 'font-jakarta'
      }`}
    >
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 start-1/3 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      {/* Responsive Shell: Sidebar on Desktop (md+), Mobile App Shell on Mobile */}
      <div className="relative flex min-h-[100dvh] md:h-[100dvh] w-full flex-col md:flex-row">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col justify-between border-e border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-[#090e1c]/90 backdrop-blur-xl p-5 z-20">
          <div className="space-y-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/25">
                <ShieldCheck className="h-5 w-5 stroke-[2.4]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-extrabold tracking-tight leading-none">
                    {t.appName}
                  </h1>
                  {b2bMode && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-600 dark:text-amber-300">
                      <Building2 className="h-2.5 w-2.5" />
                      B2B
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  {t.appSub}
                </span>
              </div>
            </div>

            {/* Desktop Nav Links */}
            <nav className="space-y-1.5">
              <SidebarItem
                active={activeTab === 'vault'}
                onClick={() => setActiveTab('vault')}
                icon={<ShieldCheck className="h-5 w-5" />}
                label={t.tabs.vault}
              />
              <SidebarItem
                active={activeTab === 'scan'}
                onClick={() => setActiveTab('scan')}
                icon={<ScanLine className="h-5 w-5" />}
                label={t.tabs.scan}
                highlight
              />
              <SidebarItem
                active={activeTab === 'diagnostics'}
                onClick={() => setActiveTab('diagnostics')}
                icon={<Wrench className="h-5 w-5" />}
                label={t.tabs.diagnostics}
              />
              <SidebarItem
                active={activeTab === 'centers'}
                onClick={() => setActiveTab('centers')}
                icon={<MapPin className="h-5 w-5" />}
                label={t.tabs.centers}
              />
              <SidebarItem
                active={activeTab === 'account'}
                onClick={() => setActiveTab('account')}
                icon={<UserCircle2 className="h-5 w-5" />}
                label={t.tabs.account}
              />
            </nav>
          </div>

          {/* Desktop Quick Toggles */}
          <div className="space-y-2 pt-4 border-t border-slate-200/70 dark:border-white/10">
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
                className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 py-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400"
              >
                {lang === 'ar' ? 'English (EN)' : 'العربية (AR)'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme((th) => (th === 'dark' ? 'light' : 'dark'))}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 p-2 text-slate-700 dark:text-amber-400"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </motion.button>
            </div>
          </div>
        </aside>

        {/* Main Content Column */}
        <div className="relative flex flex-1 min-w-0 flex-col h-[100dvh] overflow-hidden">
          {/* Mobile Top Bar (hidden on Desktop md+) */}
          <header className="md:hidden pt-safe shrink-0 z-20 flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-[#060913]/80 backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/25">
                <ShieldCheck className="h-5 w-5 stroke-[2.4]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold tracking-tight leading-none">
                    {t.appName}
                  </h1>
                  {b2bMode && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-600 dark:text-amber-300">
                      <Building2 className="h-2.5 w-2.5" />
                      B2B
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-slate-400">
                  {t.appSub}
                </span>
              </div>
            </div>

            {/* Instant AR/EN & Night/Light Toggles */}
            <div className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400"
                aria-label="Toggle Language"
              >
                {lang === 'ar' ? 'EN' : 'AR'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setTheme((th) => (th === 'dark' ? 'light' : 'dark'))}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 p-1.5 text-slate-700 dark:text-amber-400"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </motion.button>
            </div>
          </header>

          {/* Scrollable Screen Body */}
          <main className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-8 pt-4 md:pt-7">
            <div className="mx-auto w-full max-w-5xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeTab === 'vault' && (
                    <VaultScreen
                      devices={devices}
                      lang={lang}
                      t={t}
                      liveBanner={liveBanner}
                      onClearBanner={() => setLiveBanner(null)}
                      onNavigateDiagnostics={handleNavigateDiagnostics}
                    />
                  )}
                  {activeTab === 'diagnostics' && (
                    <DiagnosticsScreen
                      devices={devices}
                      lang={lang}
                      t={t}
                      preselectedDeviceId={diagDeviceId}
                    />
                  )}
                  {activeTab === 'scan' && (
                    <ScannerScreen
                      lang={lang}
                      t={t}
                      onAddDevice={handleAddDevice}
                    />
                  )}
                  {activeTab === 'centers' && <CentersScreen lang={lang} t={t} />}
                  {activeTab === 'account' && (
                    <AccountB2BScreen
                      lang={lang}
                      onToggleLang={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
                      theme={theme}
                      onToggleTheme={() =>
                        setTheme((th) => (th === 'dark' ? 'light' : 'dark'))
                      }
                      b2bMode={b2bMode}
                      onToggleB2B={() => setB2bMode((b) => !b)}
                      t={t}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Mobile Floating Bottom Navigation Bar (hidden on Desktop md+) */}
          <nav className="md:hidden pointer-events-none absolute bottom-0 inset-x-0 z-30 px-3 pb-safe">
            <div className="pointer-events-auto relative mx-auto flex items-center justify-between rounded-3xl border border-slate-200/80 dark:border-white/15 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl px-2 py-2 shadow-2xl shadow-black/25">
              <NavTab
                active={activeTab === 'vault'}
                onClick={() => setActiveTab('vault')}
                icon={<ShieldCheck className="h-5 w-5" />}
                label={t.tabs.vault}
              />
              <NavTab
                active={activeTab === 'diagnostics'}
                onClick={() => setActiveTab('diagnostics')}
                icon={<Wrench className="h-5 w-5" />}
                label={t.tabs.diagnostics}
              />

              {/* Central Floating Emerald AI Scan Button */}
              <div className="relative -mt-8 flex flex-col items-center">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setActiveTab('scan')}
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-xl shadow-emerald-500/40 border-4 border-[#f8fafc] dark:border-[#060913] ${
                    activeTab === 'scan' ? 'ring-2 ring-emerald-400' : ''
                  }`}
                  aria-label={t.tabs.scan}
                >
                  <ScanLine className="h-6 w-6 stroke-[2.4]" />
                </motion.button>
                <span className="mt-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  {t.tabs.scan}
                </span>
              </div>

              <NavTab
                active={activeTab === 'centers'}
                onClick={() => setActiveTab('centers')}
                icon={<MapPin className="h-5 w-5" />}
                label={t.tabs.centers}
              />
              <NavTab
                active={activeTab === 'account'}
                onClick={() => setActiveTab('account')}
                icon={<UserCircle2 className="h-5 w-5" />}
                label={t.tabs.account}
              />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ active, onClick, icon, label, highlight = false }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold transition-all ${
        active
          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
          : highlight
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
      }`}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}

function NavTab({ active, onClick, icon, label }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 rounded-2xl transition-colors ${
        active
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold leading-tight truncate max-w-[66px]">
        {label}
      </span>
    </motion.button>
  );
}
