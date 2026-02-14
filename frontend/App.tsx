import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Page, UserState, UserProfile, DrinkOption } from './types';
import { HomeModern } from './pages/HomeModern';
import { Stats } from './pages/Stats';
import { GoalSetting } from './pages/GoalSetting';
import { Profile } from './pages/Profile';
import { DrinkSettings } from './pages/DrinkSettings';
import { ReminderSettings } from './pages/ReminderSettings';
import { Home as HomeIcon, BarChart2, User, Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SplashScreen } from './components/SplashScreen';
import { SplashScreen as CapacitorSplashScreen } from '@capacitor/splash-screen';
import {
  ApiError,
  intakeApi,
  initializeLocalDataLayer,
  getLocalDataLayerHealth,
  profileApi,
  settingsApi,
  statsApi,
  IntakeResponse,
  WeeklyStatsResponse,
  StreakResponse,
  BestTimeResponse,
  GapsResponse,
  HealthResponse,
  ProfileResponse,
  SettingsResponse,
  SettingsUpdateRequest
} from './api';
import {
  connectReminderService,
  ensureNotificationPermission,
  getNotificationPermissionState,
  NotificationPermissionState
} from './services/notifications';
import { notificationService } from './services/notificationService';

const DEFAULT_DRINKS: DrinkOption[] = [
  { id: '1', label: '一杯水', amount: 250, category: 'water', iconId: 'droplet', colorClass: 'bg-[#e0f7fa] text-[#00bcd4]' },
  { id: '2', label: '小口喝', amount: 50, category: 'water', iconId: 'droplet', colorClass: 'bg-blue-50 text-blue-400' },
  { id: '3', label: '咖啡', amount: 150, category: 'coffee', iconId: 'coffee', colorClass: 'bg-[#fff3e0] text-[#ff9800]' },
  { id: '4', label: '果汁', amount: 300, category: 'juice', iconId: 'wine', colorClass: 'bg-[#fce4ec] text-[#e91e63]' }
];

const DRINK_OPTIONS_KEY = 'drink_options';
const FORCE_REFRESH_KEY = 'drink_options_refreshed_v2';

const getTodayDate = (): string => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const getTomorrowDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const toUserProfile = (profile: ProfileResponse | null): UserProfile | undefined => {
  if (!profile?.profile) {
    return undefined;
  }

  return {
    age: profile.profile.age,
    weightKg: profile.profile.weight_kg,
    heightCm: profile.profile.height_cm,
    activityLevel: profile.profile.activity_level || 'moderate'
  };
};

const toUserState = (
  profile: ProfileResponse | null,
  settings: SettingsResponse | null,
  intakes: IntakeResponse[],
  streak: StreakResponse | null,
  weekly: WeeklyStatsResponse | null
): UserState => {
  const currentIntake = intakes.reduce((sum, item) => sum + item.amount_ml, 0);

  return {
    profile: toUserProfile(profile),
    dailyGoal: settings?.daily_goal_ml || 2000,
    currentIntake,
    streak: streak?.streak_days || 0,
    totalIntake: weekly?.total_ml || currentIntake,
    records: intakes.map((item) => ({
      id: item.id,
      amount: item.amount_ml,
      type: item.category,
      timestamp: new Date(item.intake_time).getTime()
    }))
  };
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiError) {
    return `${fallback}（${error.code}）`;
  }

  if (error instanceof Error && error.message) {
    return `${fallback}（${error.message}）`;
  }

  return fallback;
};

const loadDrinkOptions = (): DrinkOption[] => {
  try {
    // Force refresh cached options once.
    if (!window.localStorage.getItem(FORCE_REFRESH_KEY)) {
      window.localStorage.setItem(DRINK_OPTIONS_KEY, JSON.stringify(DEFAULT_DRINKS));
      window.localStorage.setItem(FORCE_REFRESH_KEY, 'true');
      return DEFAULT_DRINKS;
    }

    const raw = window.localStorage.getItem(DRINK_OPTIONS_KEY);
    if (!raw) {
      return DEFAULT_DRINKS;
    }

    const parsed = JSON.parse(raw) as DrinkOption[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_DRINKS;
    }

    return parsed;
  } catch {
    return DEFAULT_DRINKS;
  }
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);

  const [drinkOptions, setDrinkOptions] = useState<DrinkOption[]>(() => loadDrinkOptions());

  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [settingsData, setSettingsData] = useState<SettingsResponse | null>(null);
  const [todayIntakes, setTodayIntakes] = useState<IntakeResponse[]>([]);

  const [weeklyData, setWeeklyData] = useState<WeeklyStatsResponse | null>(null);
  const [streakData, setStreakData] = useState<StreakResponse | null>(null);
  const [bestTimeData, setBestTimeData] = useState<BestTimeResponse | null>(null);
  const [gapsData, setGapsData] = useState<GapsResponse | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);

  const [homeLoading, setHomeLoading] = useState(false);
  const [homeMutating, setHomeMutating] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);

  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [goalSaving, setGoalSaving] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>(getNotificationPermissionState());

  const user = useMemo(
    () => toUserState(profileData, settingsData, todayIntakes, streakData, weeklyData),
    [profileData, settingsData, todayIntakes, streakData, weeklyData]
  );

  const bootstrapApp = useCallback(async () => {
    setInitError(null);
    const minDelay = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 2500);
    });

    try {
      await Promise.all([initializeLocalDataLayer(), minDelay]);
      setShowSplash(false);
    } catch {
      const health = getLocalDataLayerHealth();
      setInitError(health.lastError ? `本地初始化失败: ${health.lastError}` : '本地初始化失败');
    }
  }, []);

  useEffect(() => {
    // Hide the native splash screen when the React app is mounted
    const hideSplash = async () => {
      try {
        await CapacitorSplashScreen.hide();
      } catch (e) {
        console.warn('SplashScreen hide failed', e);
      }
    };
    hideSplash();
    
    let cancelled = false;

    const run = async () => {
      await bootstrapApp();
      if (cancelled) {
        return;
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [bootstrapApp]);

  useEffect(() => {
    window.localStorage.setItem(DRINK_OPTIONS_KEY, JSON.stringify(drinkOptions));
  }, [drinkOptions]);

  const loadHomeData = useCallback(async () => {
    setHomeLoading(true);
    setHomeError(null);

    try {
      const today = getTodayDate();
      const tomorrow = getTomorrowDate();

      const [profile, settings, intakeList, streak, weekly] = await Promise.all([
        profileApi.get(),
        settingsApi.get(),
        intakeApi.list(today, tomorrow, 1, 200),
        statsApi.getStreak(),
        statsApi.getWeekly()
      ]);

      setProfileData(profile);
      setSettingsData(settings);
      setTodayIntakes(intakeList.intakes);
      setStreakData(streak);
      setWeeklyData(weekly);
    } catch (error) {
      setHomeError(getErrorMessage(error, '首页数据加载失败'));
    } finally {
      setHomeLoading(false);
    }
  }, []);

  const refreshAfterIntakeMutation = useCallback(async () => {
    const today = getTodayDate();
    const tomorrow = getTomorrowDate();

    const [settings, intakeList, streak, weekly] = await Promise.all([
      settingsApi.get(),
      intakeApi.list(today, tomorrow, 1, 200),
      statsApi.getStreak(),
      statsApi.getWeekly()
    ]);

    setSettingsData(settings);
    setTodayIntakes(intakeList.intakes);
    setStreakData(streak);
    setWeeklyData(weekly);
  }, []);
  const loadStatsData = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);

    try {
      const today = getTodayDate();
      const tomorrow = getTomorrowDate();
      const goal = settingsData?.daily_goal_ml || 2000;

      const [weekly, streak, bestTime, gaps, health, intakeList] = await Promise.all([
        statsApi.getWeekly(),
        statsApi.getStreak(),
        statsApi.getBestTime(7),
        statsApi.getGaps(today, 240),
        statsApi.getHealth(today, goal),
        intakeApi.list(today, tomorrow, 1, 200)
      ]);

      setWeeklyData(weekly);
      setStreakData(streak);
      setBestTimeData(bestTime);
      setGapsData(gaps);
      setHealthData(health);
      setTodayIntakes(intakeList.intakes);
    } catch (error) {
      setStatsError(getErrorMessage(error, '统计数据加载失败'));
    } finally {
      setStatsLoading(false);
    }
  }, [settingsData?.daily_goal_ml]);

  useEffect(() => {
    if (!showSplash) {
      loadHomeData();
    }
  }, [showSplash, loadHomeData]);

  const handleAddWater = useCallback(
    async (amount: number, category = 'water') => {
      if (amount <= 0) {
        return;
      }

      setHomeMutating(true);
      setHomeError(null);

      try {
        await intakeApi.add(amount, category);
        await refreshAfterIntakeMutation();
      } catch (error) {
        setHomeError(getErrorMessage(error, '饮水记录写入失败'));
      } finally {
        setHomeMutating(false);
      }
    },
    [refreshAfterIntakeMutation]
  );

  const handleGoalConfirm = useCallback(async (goal: number) => {
    setGoalSaving(true);
    setGoalError(null);

    try {
      const updated = await settingsApi.update({ daily_goal_ml: goal });
      setSettingsData(updated);
      setCurrentPage(Page.HOME);
    } catch (error) {
      setGoalError(getErrorMessage(error, '目标保存失败'));
    } finally {
      setGoalSaving(false);
    }
  }, []);

  const handleSaveProfile = useCallback(async (profile: UserProfile, applyRecommend: boolean) => {
    setProfileSaving(true);
    setProfileError(null);

    try {
      const updated = await profileApi.update({
        height_cm: profile.heightCm,
        weight_kg: profile.weightKg,
        age: profile.age,
        activity_level: profile.activityLevel,
        apply_recommend: applyRecommend
      });

      setProfileData(updated);
      setSettingsData((prev) =>
        prev
          ? {
              ...prev,
              daily_goal_ml: updated.current_goal_ml
            }
          : prev
      );
      setCurrentPage(Page.HOME);
    } catch (error) {
      setProfileError(getErrorMessage(error, '档案保存失败'));
    } finally {
      setProfileSaving(false);
    }
  }, []);

  const handleSaveSettings = useCallback(async (patch: SettingsUpdateRequest) => {
    setSettingsSaving(true);
    setSettingsError(null);

    try {
      const updated = await settingsApi.update(patch);
      setSettingsData(updated);
    } catch (error) {
      setSettingsError(getErrorMessage(error, '提醒设置保存失败'));
    } finally {
      setSettingsSaving(false);
    }
  }, []);

  const handleRequestNotificationPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    const permission = await ensureNotificationPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  useEffect(() => {
    if (!settingsData) {
      return;
    }

    void notificationService.syncIntervalReminder(settingsData);
  }, [settingsData]);

  useEffect(() => {
    const disconnect = connectReminderService(null, profileData?.profile.user_id || null, {
      onConnectionChange: (connected) => setWsConnected(connected)
    });

    return () => {
      disconnect();
      setWsConnected(false);
    };
  }, [profileData?.profile.user_id]);

  if (showSplash && initError) {
    return (
      <div className="w-full h-screen bg-[#fbffff] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white border border-red-100 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 text-center">
          <p className="text-sm text-red-500">{initError}</p>
          <button
            onClick={() => {
              setShowSplash(true);
              bootstrapApp();
            }}
            className="mt-4 px-4 py-2 rounded-full bg-[#0dc792] text-white text-sm font-semibold"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case Page.HOME:
        return (
          <HomeModern
            user={user}
            drinkOptions={drinkOptions}
            onAddWater={handleAddWater}
            onOpenSettings={() => setCurrentPage(Page.DRINK_SETTINGS)}
            onOpenGoalSettings={() => setCurrentPage(Page.GOAL_SETTING)}
            adding={homeMutating}
            loading={homeLoading}
            errorMessage={homeError}
          />
        );

      case Page.STATS:
        return (
          <Stats
            weekly={weeklyData}
            streak={streakData}
            bestTime={bestTimeData}
            gaps={gapsData}
            health={healthData}
            todayIntakes={todayIntakes}
            loading={statsLoading}
            errorMessage={statsError}
            onRetry={loadStatsData}
            onBack={() => setCurrentPage(Page.HOME)}
          />
        );

      case Page.GOAL_SETTING:
        return (
          <GoalSetting
            initialGoal={settingsData?.daily_goal_ml || 2000}
            saving={goalSaving}
            errorMessage={goalError}
            onConfirm={handleGoalConfirm}
            onBack={() => setCurrentPage(Page.HOME)}
          />
        );

      case Page.PROFILE:
        return (
          <Profile
            initial={toUserProfile(profileData)}
            recommendedMl={profileData?.recommended_ml || 0}
            currentGoalMl={profileData?.current_goal_ml || settingsData?.daily_goal_ml || 2000}
            saving={profileSaving}
            errorMessage={profileError}
            onSave={handleSaveProfile}
            onBack={() => setCurrentPage(Page.HOME)}
          />
        );

      case Page.DRINK_SETTINGS:
        return (
          <DrinkSettings
            options={drinkOptions}
            onUpdateOptions={setDrinkOptions}
            onBack={() => setCurrentPage(Page.HOME)}
          />
        );

      case Page.REMINDER_SETTINGS:
        return (
          <ReminderSettings
            settings={settingsData}
            saving={settingsSaving}
            errorMessage={settingsError}
            wsConnected={wsConnected}
            notificationPermission={notificationPermission}
            onRequestNotificationPermission={handleRequestNotificationPermission}
            onSaveSettings={handleSaveSettings}
            onBack={() => setCurrentPage(Page.HOME)}
          />
        );

      default:
        return (
          <HomeModern
            user={user}
            drinkOptions={drinkOptions}
            onAddWater={handleAddWater}
            onOpenSettings={() => setCurrentPage(Page.DRINK_SETTINGS)}
          />
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <SplashScreen key="splash" />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full h-screen bg-[#fbffff] overflow-hidden flex flex-col shadow-2xl pt-[env(safe-area-inset-top)]"
        >
          <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide">{renderPage()}</div>

          {[Page.HOME, Page.STATS, Page.PROFILE, Page.REMINDER_SETTINGS].includes(currentPage) && (
            <div className="relative z-20 px-6 pb-8">
              <div className="backdrop-blur-xl border border-gray-100 bg-white/80 rounded-3xl h-16 flex items-center justify-around px-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]">
                <NavButton
                  active={currentPage === Page.HOME}
                  onClick={() => {
                    setCurrentPage(Page.HOME);
                    loadHomeData();
                  }}
                  icon={<HomeIcon />}
                  label="首页"
                />
                <NavButton
                  active={currentPage === Page.STATS}
                  onClick={() => {
                    setCurrentPage(Page.STATS);
                    loadStatsData();
                  }}
                  icon={<BarChart2 />}
                  label="统计"
                />
                <NavButton
                  active={currentPage === Page.REMINDER_SETTINGS}
                  onClick={() => setCurrentPage(Page.REMINDER_SETTINGS)}
                  icon={<Bell />}
                  label="提醒"
                />
                <NavButton
                  active={currentPage === Page.PROFILE}
                  onClick={() => setCurrentPage(Page.PROFILE)}
                  icon={<User />}
                  label="档案"
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${
      active ? 'text-[#0dc792] scale-110' : 'text-gray-400'
    }`}
  >
    {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

export default App;
