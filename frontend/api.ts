import {
  getLocalDbHealth,
  initializeLocalDb,
  readLocalDbState,
  writeLocalDbState
} from './services/localDb';

const LOCAL_SESSION_KEY = 'hydratemate_local_session_v1';
const LOCAL_USER_ID = 'local-user';
const DEFAULT_EMAIL = 'local@hydratemate.app';

export interface SceneReminderSetting {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
}

const DEFAULT_SCENE_REMINDERS: SceneReminderSetting[] = [
  { id: '1', label: '晨间喝水', time: '07:30', enabled: true },
  { id: '2', label: '睡前补水', time: '22:00', enabled: false }
];

const DEFAULT_SETTINGS: SettingsResponse = {
  daily_goal_ml: 2000,
  reminder_intensity: 2,
  reminder_enabled: false,
  reminder_interval_minutes: 60,
  quiet_hours_enabled: true,
  quiet_hours_start: '23:00',
  quiet_hours_end: '07:00',
  scene_reminders: DEFAULT_SCENE_REMINDERS
};

const DEFAULT_PROFILE: ProfileData = {
  user_id: LOCAL_USER_ID,
  height_cm: 170,
  weight_kg: 60,
  age: 25,
  activity_level: 'moderate'
};

interface LocalDbState {
  profile: ProfileData;
  settings: SettingsResponse;
  intakes: IntakeResponse[];
}

interface LocalSession {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

const canUseLocalStorage = (): boolean => typeof window !== 'undefined' && !!window.localStorage;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const round1 = (value: number): number => Math.round(value * 10) / 10;
const pad2 = (value: number): string => String(value).padStart(2, '0');
const isValidTimeString = (value: string): boolean => /^\d{2}:\d{2}$/.test(value);

const normalizeSceneReminders = (input: unknown): SceneReminderSetting[] => {
  if (!Array.isArray(input)) {
    return DEFAULT_SCENE_REMINDERS.map((item) => ({ ...item }));
  }

  const normalized: SceneReminderSetting[] = [];
  input.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const raw = entry as Partial<SceneReminderSetting>;
    const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `scene-${index + 1}`;
    const label = typeof raw.label === 'string' ? raw.label.trim() : '';
    const time = typeof raw.time === 'string' && isValidTimeString(raw.time) ? raw.time : '09:00';
    const enabled = typeof raw.enabled === 'boolean' ? raw.enabled : true;
    normalized.push({ id, label, time, enabled });
  });

  return normalized;
};

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const toLocalDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseDateKey = (value: string): Date => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const getDayBounds = (value: string): { start: Date; end: Date } => {
  const start = parseDateKey(value);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
};

const readJson = <T>(key: string): T | null => {
  if (!canUseLocalStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown): void => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const getDefaultDbState = (): LocalDbState => ({
  profile: { ...DEFAULT_PROFILE },
  settings: {
    ...DEFAULT_SETTINGS,
    scene_reminders: DEFAULT_SCENE_REMINDERS.map((item) => ({ ...item }))
  },
  intakes: []
});

let localDbReady = false;
let localDbReadyPromise: Promise<void> | null = null;

const ensureLocalDbReady = async (): Promise<void> => {
  if (localDbReady) {
    return;
  }

  if (!localDbReadyPromise) {
    localDbReadyPromise = initializeLocalDb(getDefaultDbState())
      .then(() => {
        localDbReady = true;
      })
      .finally(() => {
        localDbReadyPromise = null;
      });
  }

  await localDbReadyPromise;
};

const readDbState = async (): Promise<LocalDbState> => {
  await ensureLocalDbReady();
  return readLocalDbState(getDefaultDbState()) as Promise<LocalDbState>;
};

const writeDbState = async (state: LocalDbState): Promise<void> => {
  await ensureLocalDbReady();
  await writeLocalDbState(state, getDefaultDbState());
};

export const initializeLocalDataLayer = async (): Promise<void> => {
  await ensureLocalDbReady();
};

export const getLocalDataLayerHealth = (): ReturnType<typeof getLocalDbHealth> => getLocalDbHealth();

const readSession = (): LocalSession | null => {
  const session = readJson<LocalSession>(LOCAL_SESSION_KEY);
  if (!session) {
    return null;
  }

  if (
    typeof session.token !== 'string' ||
    typeof session.refreshToken !== 'string' ||
    !session.user ||
    typeof session.user.id !== 'string' ||
    typeof session.user.email !== 'string'
  ) {
    return null;
  }

  return session;
};

const writeSession = (session: LocalSession | null): void => {
  if (!canUseLocalStorage()) {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(LOCAL_SESSION_KEY);
    return;
  }

  window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
};

const getWeekStart = (weekStart?: string): Date => {
  if (weekStart) {
    return parseDateKey(weekStart);
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = (now.getDay() + 6) % 7;
  now.setDate(now.getDate() - diff);
  return now;
};

const buildDailyTotals = (intakes: IntakeResponse[]): Map<string, number> => {
  const totals = new Map<string, number>();

  intakes.forEach((item) => {
    const key = toLocalDateKey(new Date(item.intake_time));
    totals.set(key, (totals.get(key) || 0) + item.amount_ml);
  });

  return totals;
};

const calculateStreakForDate = (targetDate: Date, totals: Map<string, number>, goal: number): number => {
  if (goal <= 0) {
    return 0;
  }

  const cursor = new Date(targetDate);
  let streak = 0;

  while (true) {
    const key = toLocalDateKey(cursor);
    const total = totals.get(key) || 0;

    if (total < goal) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const calculateRecommendedGoal = (profile: ProfileData): number => {
  let base = profile.weight_kg * 30;

  switch (profile.activity_level) {
    case 'active':
      base += 800;
      break;
    case 'moderate':
      base += 400;
      break;
    case 'sedentary':
    default:
      // No extra addition
      break;
  }

  const ageAdjustment = profile.age >= 55 ? -200 : profile.age <= 18 ? 200 : 0;
  return clamp(Math.round(base + ageAdjustment), 1200, 4000);
};

const createLocalAuthResponse = (email: string): AuthResponse => {
  const session: LocalSession = {
    token: `local-token-${generateId()}`,
    refreshToken: `local-refresh-${generateId()}`,
    user: {
      id: LOCAL_USER_ID,
      email
    }
  };

  writeSession(session);
  setAccessToken(session.token);

  return {
    access_token: session.token,
    refresh_token: session.refreshToken,
    user: session.user
  };
};

const getInitialToken = (): string | null => {
  const fromSession = readSession()?.token;
  if (fromSession) {
    return fromSession;
  }

  const fromEnv = (import.meta.env.VITE_ACCESS_TOKEN as string | undefined)?.trim();
  return fromEnv || null;
};

let accessToken: string | null = getInitialToken();

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const setAccessToken = (token: string | null): void => {
  accessToken = token;

  const session = readSession();
  if (!session) {
    return;
  }

  if (!token) {
    writeSession(null);
    return;
  }

  writeSession({
    ...session,
    token
  });
};

export const getAccessToken = (): string | null => accessToken;

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string };
}

export const authApi = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const safeEmail = email.trim() || DEFAULT_EMAIL;
    if (!password.trim()) {
      throw new ApiError('Password is required', 400, 'password_required');
    }

    return createLocalAuthResponse(safeEmail);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const safeEmail = email.trim() || readSession()?.user.email || DEFAULT_EMAIL;
    if (!password.trim()) {
      throw new ApiError('Password is required', 400, 'password_required');
    }

    return createLocalAuthResponse(safeEmail);
  },

  logout(): void {
    setAccessToken(null);
    writeSession(null);
  }
};

export interface IntakeResponse {
  id: string;
  amount_ml: number;
  category: string;
  intake_time: string;
}

export interface IntakeListResponse {
  intakes: IntakeResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface IntakeAddRequest {
  amount_ml: number;
  category?: string;
  intake_time?: string;
}

export const intakeApi = {
  async add(amountMl: number, category = 'water', intakeTime?: string): Promise<IntakeResponse> {
    if (!Number.isFinite(amountMl) || amountMl <= 0) {
      throw new ApiError('Invalid intake amount', 400, 'invalid_amount');
    }

    const state = await readDbState();
    const intake: IntakeResponse = {
      id: generateId(),
      amount_ml: Math.round(amountMl),
      category: category || 'water',
      intake_time: intakeTime || new Date().toISOString()
    };

    state.intakes.push(intake);
    await writeDbState(state);

    return intake;
  },

  async list(from?: string, to?: string, page = 1, pageSize = 100): Promise<IntakeListResponse> {
    const state = await readDbState();
    const fromTime = from ? parseDateKey(from).getTime() : Number.NEGATIVE_INFINITY;
    const toTime = to ? parseDateKey(to).getTime() : Number.POSITIVE_INFINITY;

    const filtered = state.intakes
      .filter((item) => {
        const ts = new Date(item.intake_time).getTime();
        return ts >= fromTime && ts < toTime;
      })
      .sort((a, b) => new Date(b.intake_time).getTime() - new Date(a.intake_time).getTime());

    const safePage = Math.max(1, Math.floor(page));
    const safePageSize = Math.max(1, Math.floor(pageSize));
    const total = filtered.length;
    const start = (safePage - 1) * safePageSize;

    return {
      intakes: filtered.slice(start, start + safePageSize),
      total,
      page: safePage,
      page_size: safePageSize
    };
  },

  async delete(id: string): Promise<void> {
    const state = await readDbState();
    const before = state.intakes.length;
    state.intakes = state.intakes.filter((item) => item.id !== id);

    if (state.intakes.length === before) {
      throw new ApiError('Intake not found', 404, 'intake_not_found');
    }

    await writeDbState(state);
  }
};

export interface DailyStatsData {
  stat_date: string;
  total_ml: number;
  is_goal_met: boolean;
  streak_days: number;
}

export interface WeeklyStatsResponse {
  week_start: string;
  total_ml: number;
  avg_daily: number;
  days_logged: number;
  goals_met: number;
  daily_data: DailyStatsData[];
}

export interface StreakResponse {
  streak_days: number;
}

export interface BestTimeResponse {
  best_hour: number;
  window: string;
  total_ml: number;
  avg_ml: number;
  days: number;
}

interface BestTimeEmptyResponse {
  message: string;
}

export interface GapInfo {
  start: string;
  end: string;
  minutes: number;
}

export interface GapsResponse {
  date: string;
  threshold_minutes: number;
  gaps: GapInfo[];
  longest_gap_minutes: number;
}

export interface HealthBreakdown {
  goal_completion: number;
  regularity: number;
  category_diversity: number;
  interval_uniformity: number;
}

export interface HealthResponse {
  date: string;
  health_score: number;
  breakdown: HealthBreakdown;
}

export const statsApi = {
  async getWeekly(weekStart?: string): Promise<WeeklyStatsResponse> {
    const state = await readDbState();
    const goal = state.settings.daily_goal_ml > 0 ? state.settings.daily_goal_ml : DEFAULT_SETTINGS.daily_goal_ml;
    const weekStartDate = getWeekStart(weekStart);
    const totals = buildDailyTotals(state.intakes);

    const dailyData: DailyStatsData[] = [];
    let totalMl = 0;
    let daysLogged = 0;
    let goalsMet = 0;

    for (let i = 0; i < 7; i += 1) {
      const current = new Date(weekStartDate);
      current.setDate(weekStartDate.getDate() + i);
      const key = toLocalDateKey(current);
      const dayTotal = totals.get(key) || 0;
      const met = dayTotal >= goal;

      totalMl += dayTotal;
      if (dayTotal > 0) {
        daysLogged += 1;
      }
      if (met) {
        goalsMet += 1;
      }

      dailyData.push({
        stat_date: key,
        total_ml: dayTotal,
        is_goal_met: met,
        streak_days: calculateStreakForDate(current, totals, goal)
      });
    }

    return {
      week_start: toLocalDateKey(weekStartDate),
      total_ml: totalMl,
      avg_daily: Math.round(totalMl / 7),
      days_logged: daysLogged,
      goals_met: goalsMet,
      daily_data: dailyData
    };
  },

  async getStreak(): Promise<StreakResponse> {
    const state = await readDbState();
    const totals = buildDailyTotals(state.intakes);
    const goal = state.settings.daily_goal_ml > 0 ? state.settings.daily_goal_ml : DEFAULT_SETTINGS.daily_goal_ml;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      streak_days: calculateStreakForDate(today, totals, goal)
    };
  },

  async getBestTime(days = 7): Promise<BestTimeResponse | null> {
    const state = await readDbState();
    const safeDays = clamp(Math.floor(days), 1, 365);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - safeDays + 1);

    const endTime = Date.now();
    const startTime = start.getTime();
    const relevant = state.intakes.filter((item) => {
      const ts = new Date(item.intake_time).getTime();
      return ts >= startTime && ts <= endTime;
    });

    if (relevant.length === 0) {
      return null;
    }

    const hourlyTotals = new Map<number, number>();
    const activeDays = new Set<string>();

    relevant.forEach((item) => {
      const date = new Date(item.intake_time);
      const hour = date.getHours();
      hourlyTotals.set(hour, (hourlyTotals.get(hour) || 0) + item.amount_ml);
      activeDays.add(toLocalDateKey(date));
    });

    let bestHour = 0;
    let bestTotal = -1;
    hourlyTotals.forEach((total, hour) => {
      if (total > bestTotal) {
        bestTotal = total;
        bestHour = hour;
      }
    });

    const daysWithData = Math.max(1, activeDays.size);
    return {
      best_hour: bestHour,
      window: `${pad2(bestHour)}:00-${pad2((bestHour + 1) % 24)}:00`,
      total_ml: bestTotal,
      avg_ml: Math.round(bestTotal / daysWithData),
      days: daysWithData
    };
  },

  async getGaps(date: string, threshold = 240): Promise<GapsResponse> {
    const state = await readDbState();
    const safeThreshold = Math.max(1, Math.floor(threshold));
    const bounds = getDayBounds(date);
    const startMs = bounds.start.getTime();
    const endMs = bounds.end.getTime();

    const timestamps = state.intakes
      .map((item) => new Date(item.intake_time).getTime())
      .filter((ts) => ts >= startMs && ts < endMs)
      .sort((a, b) => a - b);

    if (timestamps.length === 0) {
      return {
        date: toLocalDateKey(bounds.start),
        threshold_minutes: safeThreshold,
        gaps: [],
        longest_gap_minutes: 0
      };
    }

    const points = [startMs, ...timestamps, endMs];
    const gaps: GapInfo[] = [];
    let longest = 0;

    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const next = points[i];
      const minutes = Math.round((next - prev) / 60000);

      if (minutes > longest) {
        longest = minutes;
      }

      if (minutes >= safeThreshold) {
        gaps.push({
          start: new Date(prev).toISOString(),
          end: new Date(next).toISOString(),
          minutes
        });
      }
    }

    return {
      date: toLocalDateKey(bounds.start),
      threshold_minutes: safeThreshold,
      gaps,
      longest_gap_minutes: longest
    };
  },

  async getHealth(date: string, goal = 2000): Promise<HealthResponse> {
    const state = await readDbState();
    const bounds = getDayBounds(date);
    const startMs = bounds.start.getTime();
    const endMs = bounds.end.getTime();

    const intakes = state.intakes
      .filter((item) => {
        const ts = new Date(item.intake_time).getTime();
        return ts >= startMs && ts < endMs;
      })
      .sort((a, b) => new Date(a.intake_time).getTime() - new Date(b.intake_time).getTime());

    const safeGoal = goal > 0 ? goal : DEFAULT_SETTINGS.daily_goal_ml;
    const total = intakes.reduce((sum, item) => sum + item.amount_ml, 0);
    const goalCompletion = clamp((total / safeGoal) * 100, 0, 100);

    const uniqueCategories = new Set(intakes.map((item) => item.category));
    const categoryDiversity = clamp((uniqueCategories.size / 4) * 100, 0, 100);

    let regularity = 0;
    let intervalUniformity = 0;

    if (intakes.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < intakes.length; i += 1) {
        const prev = new Date(intakes[i - 1].intake_time).getTime();
        const next = new Date(intakes[i].intake_time).getTime();
        intervals.push((next - prev) / 60000);
      }

      const longest = Math.max(...intervals);
      regularity = clamp(100 - (longest / 360) * 100, 0, 100);

      const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
      const variance = intervals.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const cv = mean === 0 ? 1 : stdDev / mean;
      intervalUniformity = clamp(100 - cv * 100, 0, 100);
    } else if (intakes.length === 1) {
      regularity = 40;
      intervalUniformity = 40;
    }

    const healthScore = Math.round((goalCompletion + regularity + categoryDiversity + intervalUniformity) / 4);

    return {
      date: toLocalDateKey(bounds.start),
      health_score: healthScore,
      breakdown: {
        goal_completion: round1(goalCompletion),
        regularity: round1(regularity),
        category_diversity: round1(categoryDiversity),
        interval_uniformity: round1(intervalUniformity)
      }
    };
  }
};

export interface ProfileData {
  user_id: string;
  height_cm: number;
  weight_kg: number;
  age: number;
  activity_level?: 'sedentary' | 'moderate' | 'active';
}

export interface ProfileResponse {
  profile: ProfileData;
  recommended_ml: number;
  current_goal_ml: number;
}

export interface ProfileUpdateRequest {
  height_cm: number;
  weight_kg: number;
  age: number;
  activity_level?: 'sedentary' | 'moderate' | 'active';
  apply_recommend: boolean;
}

export const profileApi = {
  async get(): Promise<ProfileResponse> {
    const state = await readDbState();
    if (!state.profile.activity_level) {
      state.profile.activity_level = 'moderate';
    }
    return {
      profile: state.profile,
      recommended_ml: calculateRecommendedGoal(state.profile),
      current_goal_ml: state.settings.daily_goal_ml
    };
  },

  async update(profile: ProfileUpdateRequest): Promise<ProfileResponse> {
    if (!Number.isFinite(profile.height_cm) || profile.height_cm <= 0) {
      throw new ApiError('Invalid height', 400, 'invalid_height');
    }
    if (!Number.isFinite(profile.weight_kg) || profile.weight_kg <= 0) {
      throw new ApiError('Invalid weight', 400, 'invalid_weight');
    }
    if (!Number.isFinite(profile.age) || profile.age <= 0) {
      throw new ApiError('Invalid age', 400, 'invalid_age');
    }

    const state = await readDbState();
    state.profile = {
      ...state.profile,
      height_cm: Math.round(profile.height_cm),
      weight_kg: round1(profile.weight_kg),
      age: Math.round(profile.age),
      activity_level: profile.activity_level || state.profile.activity_level || 'moderate'
    };

    if (profile.apply_recommend) {
      state.settings.daily_goal_ml = calculateRecommendedGoal(state.profile);
    }

    await writeDbState(state);

    return {
      profile: state.profile,
      recommended_ml: calculateRecommendedGoal(state.profile),
      current_goal_ml: state.settings.daily_goal_ml
    };
  }
};

export interface SettingsResponse {
  daily_goal_ml: number;
  reminder_intensity: number;
  reminder_enabled: boolean;
  reminder_interval_minutes: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  scene_reminders: SceneReminderSetting[];
}

export interface SettingsUpdateRequest {
  daily_goal_ml?: number;
  reminder_intensity?: number;
  reminder_enabled?: boolean;
  reminder_interval_minutes?: number;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  scene_reminders?: SceneReminderSetting[];
}

export const settingsApi = {
  async get(): Promise<SettingsResponse> {
    return (await readDbState()).settings;
  },

  async update(settings: SettingsUpdateRequest): Promise<SettingsResponse> {
    const state = await readDbState();

    if (settings.daily_goal_ml !== undefined) {
      if (!Number.isFinite(settings.daily_goal_ml) || settings.daily_goal_ml <= 0) {
        throw new ApiError('Invalid daily goal', 400, 'invalid_daily_goal');
      }
      state.settings.daily_goal_ml = Math.round(settings.daily_goal_ml);
    }

    if (settings.reminder_intensity !== undefined) {
      if (!Number.isFinite(settings.reminder_intensity) || settings.reminder_intensity < 0) {
        throw new ApiError('Invalid reminder intensity', 400, 'invalid_reminder_intensity');
      }
      state.settings.reminder_intensity = Math.round(settings.reminder_intensity);
    }

    if (settings.reminder_enabled !== undefined) {
      if (typeof settings.reminder_enabled !== 'boolean') {
        throw new ApiError('Invalid reminder enabled flag', 400, 'invalid_reminder_enabled');
      }
      state.settings.reminder_enabled = settings.reminder_enabled;
    }

    if (settings.reminder_interval_minutes !== undefined) {
      if (!Number.isFinite(settings.reminder_interval_minutes)) {
        throw new ApiError('Invalid reminder interval', 400, 'invalid_reminder_interval');
      }

      const rounded = Math.round(settings.reminder_interval_minutes);
      if (rounded < 15 || rounded > 720) {
        throw new ApiError('Reminder interval out of range', 400, 'invalid_reminder_interval');
      }
      state.settings.reminder_interval_minutes = rounded;
    }

    if (settings.quiet_hours_enabled !== undefined) {
      if (typeof settings.quiet_hours_enabled !== 'boolean') {
        throw new ApiError('Invalid quiet hours enabled flag', 400, 'invalid_quiet_hours_enabled');
      }
      state.settings.quiet_hours_enabled = settings.quiet_hours_enabled;
    }

    if (settings.quiet_hours_start !== undefined) {
      if (!isValidTimeString(settings.quiet_hours_start)) {
        throw new ApiError('Invalid quiet hours start', 400, 'invalid_quiet_hours_start');
      }
      state.settings.quiet_hours_start = settings.quiet_hours_start;
    }

    if (settings.quiet_hours_end !== undefined) {
      if (!isValidTimeString(settings.quiet_hours_end)) {
        throw new ApiError('Invalid quiet hours end', 400, 'invalid_quiet_hours_end');
      }
      state.settings.quiet_hours_end = settings.quiet_hours_end;
    }

    if (settings.scene_reminders !== undefined) {
      state.settings.scene_reminders = normalizeSceneReminders(settings.scene_reminders);
    }

    await writeDbState(state);
    return state.settings;
  }
};

export const isAuthenticated = (): boolean => true;
