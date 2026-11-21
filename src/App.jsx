import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  HelpCircle,
} from 'lucide-react';
import { INITIAL_DEVICES, TRANSLATIONS } from './data/mockData';
import VaultScreen from './components/VaultScreen';
import ScannerScreen from './components/ScannerScreen';
import DiagnosticsScreen from './components/DiagnosticsScreen';
import CentersScreen from './components/CentersScreen';
import AccountB2BScreen from './components/AccountB2BScreen';
import OnboardingTutorialModal, {
  TOUR_STEP_DEFS,
  TOUR_STEP_TABS,
} from './components/OnboardingTutorialModal';
import { getDisplayNickname } from './utils/userDisplay';
import {
  savePhotoDoc,
  getAllPhotoCounts,
  deletePhotosForDevice,
} from './utils/photoVault';
import {
  getSessionUser,
  fetchCloudVault,
  syncAllDevicesToCloud,
  syncNewDeviceToCloud,
  syncUpdateDeviceToCloud,
  syncDeleteDeviceToCloud,
  syncMaintenanceToCloud,
  uploadPhotoToCloud,
} from './utils/cloudSync';

const VALID_TABS = ['vault', 'diagnostics', 'scan', 'centers', 'account'];

function getInitialTabFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    return VALID_TABS.includes(t) ? t : 'vault';
  } catch {
    return 'vault';
  }
}

const STORAGE_KEYS = {
  DEVICES: 'damanty_devices_v1',
  CACHED_USER: 'damanty_last_user_v1',
  LANG: 'damanty_lang_v1',
  THEME: 'damanty_theme_v1',
  B2B: 'damanty_b2b_v1',
};

function readInitialCachedUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHED_USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id && parsed?.name ? parsed : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(readInitialCachedUser);

  const [devices, setDevices] = useState(() => {
    try {
      const cachedUser = readInitialCachedUser();
      if (cachedUser?.id) {
        const userSaved = localStorage.getItem(`damanty_devices_${cachedUser.id}`);
        return userSaved ? JSON.parse(userSaved) : [];
      }
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

  const [activeTab, setActiveTab] = useState(getInitialTabFromUrl);
  const [liveBanner, setLiveBanner] = useState(null);
  const [diagDeviceId, setDiagDeviceId] = useState(null);
  const [photoCounts, setPhotoCounts] = useState({});
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const mainScrollRef = useRef(null);

  // Sync browser History API so phone/browser Back navigates tabs & modals instead of closing app
  useEffect(() => {
    const initial = getInitialTabFromUrl();
    const url = initial === 'vault' ? window.location.pathname : `?tab=${initial}`;
    window.history.replaceState({ tab: initial, modal: null }, '', url);

    const onPopState = (e) => {
      const nextTab = e.state?.tab;
      if (VALID_TABS.includes(nextTab)) {
        setActiveTab(nextTab);
      } else {
        setActiveTab(getInitialTabFromUrl());
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTab = useCallback(
    (nextTab) => {
      if (!VALID_TABS.includes(nextTab)) return;
      if (nextTab === activeTab && !window.history.state?.modal) return;
      const url = nextTab === 'vault' ? window.location.pathname : `?tab=${nextTab}`;
      window.history.pushState({ tab: nextTab, modal: null }, '', url);
      setActiveTab(nextTab);
    },
    [activeTab]
  );

  const scrollToTop = useCallback(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignore scroll error
    }
  }, []);

  const openTour = useCallback(() => {
    const startTab = TOUR_STEP_TABS[0] || 'vault';
    setTutorialStep(0);
    if (window.history.state?.tab !== startTab) {
      const url = startTab === 'vault' ? window.location.pathname : `?tab=${startTab}`;
      window.history.pushState({ tab: startTab, modal: null }, '', url);
    }
    setActiveTab(startTab);
    setTutorialOpen(true);
    scrollToTop();
  }, [scrollToTop]);

  const handleTourStepChange = useCallback(
    (nextStep, nextTab) => {
      setTutorialStep(nextStep);
      if (VALID_TABS.includes(nextTab)) {
        setActiveTab(nextTab);
      }
      const nextId = TOUR_STEP_DEFS[nextStep]?.id;
      if (
        nextId === 'vault-overview' ||
        nextId === 'scan-overview' ||
        nextId === 'centers-live' ||
        nextId === 'account-signin'
      ) {
        scrollToTop();
      }
    },
    [scrollToTop]
  );

  const dismissTutorial = useCallback(
    (targetTab) => {
      setTutorialOpen(false);
      try {
        localStorage.setItem('damanty_tutorial_seen_v3', 'true');
      } catch {
        // Ignore storage error
      }
      if (targetTab && VALID_TABS.includes(targetTab)) {
        const url = targetTab === 'vault' ? window.location.pathname : `?tab=${targetTab}`;
        if (window.history.state?.tab !== targetTab) {
          window.history.pushState({ tab: targetTab, modal: null }, '', url);
        }
        setActiveTab(targetTab);
        scrollToTop();
      }
    },
    [scrollToTop]
  );

  const getDevicesStorageKey = useCallback((usr) => {
    return usr?.id ? `damanty_devices_${usr.id}` : STORAGE_KEYS.DEVICES;
  }, []);

  const refreshPhotoCounts = useCallback(() => {
    getAllPhotoCounts().then(setPhotoCounts);
  }, []);

  useEffect(() => {
    refreshPhotoCounts();
  }, [refreshPhotoCounts]);

  // Initial session + silent background Neon PostgreSQL sync
  useEffect(() => {
    let active = true;
    async function initCloudSync() {
      const sessionUser = await getSessionUser();
      if (!active) return;
      setUser(sessionUser);

      if (sessionUser) {
        try {
          localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(sessionUser));
          const cached = localStorage.getItem(getDevicesStorageKey(sessionUser));
          if (cached) setDevices(JSON.parse(cached));
          else setDevices([]);
        } catch {
          setDevices([]);
        }
      } else {
        try {
          localStorage.removeItem(STORAGE_KEYS.CACHED_USER);
          const guestSaved = localStorage.getItem(STORAGE_KEYS.DEVICES);
          setDevices(guestSaved ? JSON.parse(guestSaved) : INITIAL_DEVICES);
          if (!localStorage.getItem('damanty_tutorial_seen_v3')) {
            setTutorialStep(0);
            setActiveTab('vault');
            setTutorialOpen(true);
          }
        } catch {
          setDevices(INITIAL_DEVICES);
        }
      }

      const cloudData = await fetchCloudVault();
      if (!active) return;

      if (cloudData?.devices?.length > 0) {
        setDevices(cloudData.devices);
      } else if (!sessionUser) {
        await syncAllDevicesToCloud(INITIAL_DEVICES);
      }
    }
    initCloudSync();
    return () => {
      active = false;
    };
    // Run once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthChanged = async (newUser, isSignUp) => {
    setUser(newUser);
    if (!newUser) {
      // Signed out -> clear cached user, restore Guest Demo vault & banners
      try {
        localStorage.removeItem(STORAGE_KEYS.CACHED_USER);
      } catch {
        // Ignore storage error
      }
      setLiveBanner(null);
      try {
        const guestSaved = localStorage.getItem(STORAGE_KEYS.DEVICES);
        setDevices(guestSaved ? JSON.parse(guestSaved) : INITIAL_DEVICES);
      } catch {
        setDevices(INITIAL_DEVICES);
      }
      const cloudData = await fetchCloudVault();
      if (cloudData?.devices?.length > 0) {
        setDevices(cloudData.devices);
      }
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(newUser));
    } catch {
      // Ignore storage error
    }
    const nickname = getDisplayNickname(newUser.name);

    if (isSignUp) {
      // New user starts with a clean private vault
      setDevices([]);
      setLiveBanner(
        isAr
          ? `أهلاً بك يا ${nickname}! خزنتك الشخصية جاهزة الآن.`
          : `Welcome, ${nickname}! Your private vault is ready.`
      );
      navigateTab('vault');
      return;
    }

    // Existing user signed in -> load from Neon PostgreSQL
    const cloudData = await fetchCloudVault();
    if (cloudData?.devices) {
      setDevices(cloudData.devices);
    } else {
      try {
        const cached = localStorage.getItem(getDevicesStorageKey(newUser));
        setDevices(cached ? JSON.parse(cached) : []);
      } catch {
        setDevices([]);
      }
    }
    setLiveBanner(
      isAr ? `تم تسجيل الدخول باسم ${nickname}` : `Signed in as ${nickname}`
    );
    navigateTab('vault');
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;
  const isAr = lang === 'ar';
  const tourTab = tutorialOpen ? TOUR_STEP_TABS[tutorialStep] : null;
  const tourStepId = tutorialOpen ? TOUR_STEP_DEFS[tutorialStep]?.id || null : null;

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

  // Persist state in localStorage scoped by signed-in user
  useEffect(() => {
    try {
      localStorage.setItem(getDevicesStorageKey(user), JSON.stringify(devices));
    } catch {
      // Ignore storage quota errors
    }
  }, [devices, user, getDevicesStorageKey]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.B2B, String(b2bMode));
  }, [b2bMode]);

  const handleAddDevice = async (newDevice, previewUrl) => {
    let savedProof = null;
    if (previewUrl) {
      savedProof = await savePhotoDoc({
        deviceId: newDevice.id,
        title: isAr ? newDevice.nameAr : newDevice.nameEn,
        docType: 'warranty',
        dataUrl: previewUrl,
      }).catch(() => null);
      refreshPhotoCounts();
    }

    const enrichedDevice = savedProof
      ? {
          ...newDevice,
          cloudProofs: [
            {
              id: savedProof.id,
              title: savedProof.title,
              docType: savedProof.docType,
              sha256: savedProof.sha256,
              hasCloudBlob: true,
              capturedAt: savedProof.capturedAt,
            },
          ],
        }
      : newDevice;

    setDevices((prev) => [enrichedDevice, ...prev]);
    setLiveBanner(t.scanner.addedToast);
    navigateTab('vault');

    await syncNewDeviceToCloud(
      newDevice,
      savedProof
        ? {
            id: savedProof.id,
            title: savedProof.title,
            docType: savedProof.docType,
            sha256: savedProof.sha256,
            capturedAt: savedProof.capturedAt,
          }
        : null
    );

    if (savedProof?.dataUrl && user) {
      await uploadPhotoToCloud({
        deviceId: newDevice.id,
        proofId: savedProof.id,
        title: savedProof.title,
        docType: savedProof.docType,
        sha256: savedProof.sha256,
        capturedAt: savedProof.capturedAt,
        dataUrl: savedProof.dataUrl,
      });
    }
  };

  const handleUpdateDevice = (updatedDevice) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === updatedDevice.id ? updatedDevice : d))
    );
    syncUpdateDeviceToCloud(updatedDevice);
  };

  const handleDeleteDevice = async (deviceId) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    setLiveBanner(null);
    await deletePhotosForDevice(deviceId);
    refreshPhotoCounts();
    syncDeleteDeviceToCloud(deviceId);
  };

  const handleClaimedDevice = (claimedDevice) => {
    setDevices((prev) => [claimedDevice, ...prev]);
    setLiveBanner(t.vault.claimSuccess);
  };

  const handleAddMaintenanceRecord = async (deviceId, logEntry, previewUrl) => {
    let savedProof = null;
    if (previewUrl) {
      savedProof = await savePhotoDoc({
        deviceId,
        title: isAr ? logEntry.titleAr : logEntry.titleEn,
        docType: 'maintenance',
        dataUrl: previewUrl,
      }).catch(() => null);
      refreshPhotoCounts();
    }

    setDevices((prev) =>
      prev.map((dev) =>
        dev.id === deviceId
          ? {
              ...dev,
              maintenanceLog: [logEntry, ...(dev.maintenanceLog || [])],
              cloudProofs: savedProof
                ? [
                    {
                      id: savedProof.id,
                      title: savedProof.title,
                      docType: savedProof.docType,
                      sha256: savedProof.sha256,
                      hasCloudBlob: true,
                      capturedAt: savedProof.capturedAt,
                    },
                    ...(dev.cloudProofs || []),
                  ]
                : dev.cloudProofs,
            }
          : dev
      )
    );
    setLiveBanner(t.scanner.maintAddedToast);
    navigateTab('vault');

    await syncMaintenanceToCloud(
      deviceId,
      logEntry,
      savedProof
        ? {
            id: savedProof.id,
            title: savedProof.title,
            docType: savedProof.docType,
            sha256: savedProof.sha256,
            capturedAt: savedProof.capturedAt,
          }
        : null
    );

    if (savedProof?.dataUrl && user) {
      await uploadPhotoToCloud({
        deviceId,
        proofId: savedProof.id,
        title: savedProof.title,
        docType: savedProof.docType,
        sha256: savedProof.sha256,
        capturedAt: savedProof.capturedAt,
        dataUrl: savedProof.dataUrl,
      });
    }
  };

  const handleNavigateDiagnostics = (deviceId) => {
    setDiagDeviceId(deviceId);
    navigateTab('diagnostics');
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
                tourHighlight={tourTab === 'vault'}
                tourDimmed={Boolean(tourTab) && tourTab !== 'vault'}
                onClick={() => navigateTab('vault')}
                icon={<ShieldCheck className="h-5 w-5" />}
                label={t.tabs.vault}
              />
              <SidebarItem
                active={activeTab === 'scan'}
                tourHighlight={tourTab === 'scan'}
                tourDimmed={Boolean(tourTab) && tourTab !== 'scan'}
                onClick={() => navigateTab('scan')}
                icon={<ScanLine className="h-5 w-5" />}
                label={t.tabs.scan}
                highlight
              />
              <SidebarItem
                active={activeTab === 'diagnostics'}
                tourHighlight={tourTab === 'diagnostics'}
                tourDimmed={Boolean(tourTab) && tourTab !== 'diagnostics'}
                onClick={() => navigateTab('diagnostics')}
                icon={<Wrench className="h-5 w-5" />}
                label={t.tabs.diagnostics}
              />
              <SidebarItem
                active={activeTab === 'centers'}
                tourHighlight={tourTab === 'centers'}
                tourDimmed={Boolean(tourTab) && tourTab !== 'centers'}
                onClick={() => navigateTab('centers')}
                icon={<MapPin className="h-5 w-5" />}
                label={t.tabs.centers}
              />
              <SidebarItem
                active={activeTab === 'account'}
                tourHighlight={tourTab === 'account'}
                tourDimmed={Boolean(tourTab) && tourTab !== 'account'}
                onClick={() => navigateTab('account')}
                icon={<UserCircle2 className="h-5 w-5" />}
                label={t.tabs.account}
              />
            </nav>
          </div>

          {/* Desktop Quick Toggles & Account Status */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200/70 dark:border-white/10">
            <button
              onClick={() => navigateTab('account')}
              className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/70 px-3 py-2 text-start hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <UserCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
                  {user ? getDisplayNickname(user.name) : t.account.signInBtn}
                </span>
              </div>
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  user ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={openTour}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 p-2 text-emerald-600 dark:text-emerald-400"
                aria-label={t.tutorial.openTourBtn}
                title={t.tutorial.openTourBtn}
              >
                <HelpCircle className="h-4 w-4" />
              </motion.button>
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
        <div className="relative flex flex-1 min-w-0 flex-col min-h-[100dvh] md:h-[100dvh] md:overflow-hidden">
          {/* Mobile Top Bar (hidden on Desktop md+) */}
          <header className="md:hidden sticky top-0 pt-safe shrink-0 z-30 flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-white/10 bg-white/85 dark:bg-[#060913]/85 backdrop-blur-xl">
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

            {/* Instant Account + Tour + AR/EN & Night/Light Toggles */}
            <div className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={openTour}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 p-1.5 text-emerald-600 dark:text-emerald-400"
                aria-label={t.tutorial.openTourBtn}
              >
                <HelpCircle className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigateTab('account')}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 max-w-[132px]"
              >
                <UserCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">
                  {user ? getDisplayNickname(user.name) : isAr ? 'دخول' : 'Sign In'}
                </span>
              </motion.button>
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
          <main
            ref={mainScrollRef}
            className="flex-1 md:overflow-y-auto no-scrollbar px-4 md:px-8 pt-4 md:pt-7"
          >
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
                      onNavigateScan={() => navigateTab('scan')}
                      photoCounts={devices.reduce((acc, d) => {
                        const cloudCount = (d.cloudProofs || []).filter((p) => p.hasCloudBlob).length;
                        acc[d.id] = Math.max(photoCounts[d.id] || 0, cloudCount);
                        return acc;
                      }, {})}
                      onPhotoChanged={refreshPhotoCounts}
                      onUpdateDevice={handleUpdateDevice}
                      onDeleteDevice={handleDeleteDevice}
                      onClaimedDevice={handleClaimedDevice}
                      tourStepId={tourStepId}
                    />
                  )}
                  {activeTab === 'diagnostics' && (
                    <DiagnosticsScreen
                      devices={devices}
                      lang={lang}
                      t={t}
                      preselectedDeviceId={diagDeviceId}
                      onNavigateScan={() => navigateTab('scan')}
                      tourStepId={tourStepId}
                    />
                  )}
                  {activeTab === 'scan' && (
                    <ScannerScreen
                      devices={devices}
                      lang={lang}
                      t={t}
                      onAddDevice={handleAddDevice}
                      onAddMaintenanceRecord={handleAddMaintenanceRecord}
                      tourStepId={tourStepId}
                    />
                  )}
                  {activeTab === 'centers' && (
                    <CentersScreen lang={lang} t={t} tourStepId={tourStepId} />
                  )}
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
                      user={user}
                      onAuthChanged={handleAuthChanged}
                      onReplayTour={openTour}
                      tourStepId={tourStepId}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Mobile Floating Bottom Navigation Bar (fixed to viewport bottom, hidden on Desktop md+) */}
          <nav className="md:hidden pointer-events-none fixed bottom-0 inset-x-0 z-40 px-3 pb-safe">
            <div className="pointer-events-auto relative mx-auto flex items-center justify-between rounded-3xl border border-slate-200/80 dark:border-white/15 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl px-2 py-2 shadow-2xl shadow-black/25">
              <NavTab
                active={activeTab === 'vault'}
                tourHighlight={tourTab === 'vault'}
                tourDimmed={Boolean(tourTab) && tourTab !== 'vault'}
                onClick={() => navigateTab('vault')}
                icon={<ShieldCheck className="h-5 w-5" />}
                label={t.tabs.vault}
              />
              <NavTab
                active={activeTab === 'diagnostics'}
                tourHighlight={tourTab === 'diagnostics'}
                tourDimmed={Boolean(tourTab) && tourTab !== 'diagnostics'}
                onClick={() => navigateTab('diagnostics')}
                icon={<Wrench className="h-5 w-5" />}
                label={t.tabs.diagnostics}
              />

              {/* Central Floating Emerald AI Scan Button */}
              <div
                className={`relative -mt-8 flex flex-col items-center transition-all duration-300 ${
                  Boolean(tourTab) && tourTab !== 'scan'
                    ? 'blur-[1.5px] opacity-45'
                    : ''
                }`}
              >
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => navigateTab('scan')}
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-xl shadow-emerald-500/40 border-4 border-[#f8fafc] dark:border-[#060913] transition-all ${
                    tourTab === 'scan'
                      ? 'ring-4 ring-emerald-300 shadow-[0_0_26px_rgba(16,185,129,0.85)] scale-105'
                      : activeTab === 'scan'
                      ? 'ring-2 ring-emerald-400'
                      : ''
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
                tourHighlight={tourTab === 'centers'}
                tourDimmed={Boolean(tourTab) && tourTab !== 'centers'}
                onClick={() => navigateTab('centers')}
                icon={<MapPin className="h-5 w-5" />}
                label={t.tabs.centers}
              />
              <NavTab
                active={activeTab === 'account'}
                tourHighlight={tourTab === 'account'}
                tourDimmed={Boolean(tourTab) && tourTab !== 'account'}
                onClick={() => navigateTab('account')}
                icon={<UserCircle2 className="h-5 w-5" />}
                label={t.tabs.account}
              />
            </div>
          </nav>
        </div>
      </div>

      {/* Live Interactive Guided Walkthrough Tour */}
      <OnboardingTutorialModal
        open={tutorialOpen}
        step={tutorialStep}
        lang={lang}
        t={t}
        isSignedIn={Boolean(user)}
        onStepChange={handleTourStepChange}
        onCloseDemo={dismissTutorial}
        onGoToSignIn={() => dismissTutorial('account')}
      />
    </div>
  );
}

function SidebarItem({
  active,
  tourHighlight = false,
  tourDimmed = false,
  onClick,
  icon,
  label,
  highlight = false,
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold transition-all ${
        tourHighlight
          ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-white dark:ring-offset-[#090e1c] shadow-[0_0_24px_rgba(16,185,129,0.5)] '
          : tourDimmed
          ? 'blur-[1.5px] opacity-45 '
          : ''
      }${
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

function NavTab({
  active,
  tourHighlight = false,
  tourDimmed = false,
  onClick,
  icon,
  label,
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 rounded-2xl transition-all ${
        tourHighlight
          ? 'bg-emerald-500/15 ring-2 ring-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.45)] '
          : tourDimmed
          ? 'blur-[1.5px] opacity-45 '
          : ''
      }${
        active
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold leading-tight truncate max-w-[74px]">
        {label}
      </span>
    </motion.button>
  );
}
