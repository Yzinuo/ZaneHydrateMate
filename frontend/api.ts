const API_URL = '/api/v1';

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const getAccessToken = (): string | null => {
  if (!accessToken) {
    accessToken = localStorage.getItem('access_token');
  }
  return accessToken;
};

// Auth header helper
const authHeaders = (): HeadersInit => {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// API response handler
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'unknown_error' }));
    throw new Error(error.error || 'request_failed');
  }
  return response.json();
}

// Auth API
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string };
}

export const authApi = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse<AuthResponse>(res);
    setAccessToken(data.access_token);
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse<AuthResponse>(res);
    setAccessToken(data.access_token);
    return data;
  },

  logout() {
    setAccessToken(null);
  }
};

// Intake API
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

export const intakeApi = {
  async add(amountMl: number, category: string = 'water'): Promise<IntakeResponse> {
    const res = await fetch(`${API_URL}/intakes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount_ml: amountMl,
        category,
        intake_time: new Date().toISOString()
      })
    });
    return handleResponse<IntakeResponse>(res);
  },

  async list(from?: string, to?: string, page: number = 1): Promise<IntakeListResponse> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('page', String(page));

    const res = await fetch(`${API_URL}/intakes?${params}`, {
      headers: authHeaders()
    });
    return handleResponse<IntakeListResponse>(res);
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/intakes/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    await handleResponse<{ message: string }>(res);
  }
};

// Stats API
export interface DailyStatsData {
  stat_date: string;
  total_ml: number;
  is_goal_met: boolean;
}

export interface WeeklyStatsResponse {
  week_start: string;
  total_ml: number;
  avg_daily: number;
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
    const params = weekStart ? `?week_start=${weekStart}` : '';
    const res = await fetch(`${API_URL}/stats/weekly${params}`, {
      headers: authHeaders()
    });
    return handleResponse<WeeklyStatsResponse>(res);
  },

  async getStreak(): Promise<StreakResponse> {
    const res = await fetch(`${API_URL}/stats/streak`, {
      headers: authHeaders()
    });
    return handleResponse<StreakResponse>(res);
  },

  async getBestTime(days: number = 7): Promise<BestTimeResponse> {
    const res = await fetch(`${API_URL}/stats/best-time?days=${days}`, {
      headers: authHeaders()
    });
    return handleResponse<BestTimeResponse>(res);
  },

  async getGaps(date: string, threshold: number = 240): Promise<GapsResponse> {
    const res = await fetch(`${API_URL}/stats/gaps?date=${date}&threshold=${threshold}`, {
      headers: authHeaders()
    });
    return handleResponse<GapsResponse>(res);
  },

  async getHealth(date: string, goal: number = 2000): Promise<HealthResponse> {
    const res = await fetch(`${API_URL}/stats/health?date=${date}&goal=${goal}`, {
      headers: authHeaders()
    });
    return handleResponse<HealthResponse>(res);
  }
};

// Profile API
export interface ProfileResponse {
  profile: {
    user_id: string;
    height_cm: number;
    weight_kg: number;
    age: number;
  };
  recommended_ml: number;
  current_goal_ml: number;
}

export const profileApi = {
  async get(): Promise<ProfileResponse> {
    const res = await fetch(`${API_URL}/profile`, {
      headers: authHeaders()
    });
    return handleResponse<ProfileResponse>(res);
  },

  async update(profile: { heightCm: number; weightKg: number; age: number }, applyRecommend: boolean = true): Promise<ProfileResponse> {
    const res = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        height_cm: profile.heightCm,
        weight_kg: profile.weightKg,
        age: profile.age,
        apply_recommend: applyRecommend
      })
    });
    return handleResponse<ProfileResponse>(res);
  }
};

// Settings API
export interface SettingsResponse {
  daily_goal_ml: number;
  reminder_intensity: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export const settingsApi = {
  async get(): Promise<SettingsResponse> {
    const res = await fetch(`${API_URL}/settings`, {
      headers: authHeaders()
    });
    return handleResponse<SettingsResponse>(res);
  },

  async update(settings: Partial<{
    dailyGoalMl: number;
    reminderIntensity: number;
    quietHoursStart: string;
    quietHoursEnd: string;
  }>): Promise<SettingsResponse> {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        daily_goal_ml: settings.dailyGoalMl,
        reminder_intensity: settings.reminderIntensity,
        quiet_hours_start: settings.quietHoursStart,
        quiet_hours_end: settings.quietHoursEnd
      })
    });
    return handleResponse<SettingsResponse>(res);
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};
