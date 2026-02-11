const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) || '/api/v1').replace(/\/+$/, '');

let accessToken: string | null = ((import.meta.env.VITE_ACCESS_TOKEN as string | undefined) || '').trim() || null;

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
};

export const getAccessToken = (): string | null => accessToken;

const authHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
});

const getErrorCode = (status: number, payload: unknown): string => {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const code = (payload as { error?: unknown }).error;
    if (typeof code === 'string' && code.trim().length > 0) {
      return code;
    }
  }
  return `http_${status}`;
};

const getErrorMessage = (status: number, payload: unknown): string => {
  if (payload && typeof payload === 'object') {
    const message = (payload as { message?: unknown; error?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    const error = (payload as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim().length > 0) {
      return error;
    }
  }

  return `Request failed (${status})`;
};

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const hasJsonBody = contentType.includes('application/json');
  const payload = hasJsonBody ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(getErrorMessage(response.status, payload), response.status, getErrorCode(response.status, payload));
  }

  return payload as T;
}

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

  logout(): void {
    setAccessToken(null);
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
    const body: IntakeAddRequest = {
      amount_ml: amountMl,
      category,
      intake_time: intakeTime || new Date().toISOString()
    };

    const res = await fetch(`${API_URL}/intakes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body)
    });

    return handleResponse<IntakeResponse>(res);
  },

  async list(from?: string, to?: string, page = 1, pageSize = 100): Promise<IntakeListResponse> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('page', String(page));
    params.set('page_size', String(pageSize));

    const res = await fetch(`${API_URL}/intakes?${params.toString()}`, {
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
    const params = weekStart ? `?week_start=${encodeURIComponent(weekStart)}` : '';
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

  async getBestTime(days = 7): Promise<BestTimeResponse | null> {
    const res = await fetch(`${API_URL}/stats/best-time?days=${days}`, {
      headers: authHeaders()
    });

    const data = await handleResponse<BestTimeResponse | BestTimeEmptyResponse>(res);
    return 'message' in data ? null : data;
  },

  async getGaps(date: string, threshold = 240): Promise<GapsResponse> {
    const res = await fetch(
      `${API_URL}/stats/gaps?date=${encodeURIComponent(date)}&threshold=${threshold}`,
      { headers: authHeaders() }
    );

    return handleResponse<GapsResponse>(res);
  },

  async getHealth(date: string, goal = 2000): Promise<HealthResponse> {
    const res = await fetch(
      `${API_URL}/stats/health?date=${encodeURIComponent(date)}&goal=${goal}`,
      { headers: authHeaders() }
    );

    return handleResponse<HealthResponse>(res);
  }
};

export interface ProfileData {
  user_id: string;
  height_cm: number;
  weight_kg: number;
  age: number;
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
  apply_recommend: boolean;
}

export const profileApi = {
  async get(): Promise<ProfileResponse> {
    const res = await fetch(`${API_URL}/profile`, {
      headers: authHeaders()
    });

    return handleResponse<ProfileResponse>(res);
  },

  async update(profile: ProfileUpdateRequest): Promise<ProfileResponse> {
    const res = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(profile)
    });

    return handleResponse<ProfileResponse>(res);
  }
};

export interface SettingsResponse {
  daily_goal_ml: number;
  reminder_intensity: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface SettingsUpdateRequest {
  daily_goal_ml?: number;
  reminder_intensity?: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export const settingsApi = {
  async get(): Promise<SettingsResponse> {
    const res = await fetch(`${API_URL}/settings`, {
      headers: authHeaders()
    });

    return handleResponse<SettingsResponse>(res);
  },

  async update(settings: SettingsUpdateRequest): Promise<SettingsResponse> {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(settings)
    });

    return handleResponse<SettingsResponse>(res);
  }
};

export const isAuthenticated = (): boolean => Boolean(getAccessToken());

export const getWebSocketBaseUrl = (): string => {
  const explicit = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, '');
  }

  if (typeof window === 'undefined') {
    return 'ws://localhost:8080';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};

export const getWebSocketToken = (): string | null => {
  const explicit = ((import.meta.env.VITE_WS_TOKEN as string | undefined) || '').trim();
  if (explicit) {
    return explicit;
  }

  return getAccessToken();
};

export const getWebSocketUserId = (): string | null => {
  const explicit = ((import.meta.env.VITE_WS_USER_ID as string | undefined) || '').trim();
  return explicit || null;
};

