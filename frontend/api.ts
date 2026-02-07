
import { UserState, UserProfile, DrinkRecord } from './types';

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
    days_logged: number;
    goals_met: number;
    daily_data: DailyStatsData[];
}

export interface TodayStatsResponse {
    today_ml: number;
    week_total: number;
    week_avg: number;
    goals_met: number;
}

export const statsApi = {
    async getWeekly(weekStart?: string): Promise<WeeklyStatsResponse> {
        const params = weekStart ? `?week_start=${weekStart}` : '';
        const res = await fetch(`${API_URL}/stats/weekly${params}`, {
            headers: authHeaders()
        });
        return handleResponse<WeeklyStatsResponse>(res);
    },

    async getMonthly(month?: string): Promise<any> {
        const params = month ? `?month=${month}` : '';
        const res = await fetch(`${API_URL}/stats/monthly${params}`, {
            headers: authHeaders()
        });
        return handleResponse<any>(res);
    },

    async getToday(): Promise<TodayStatsResponse> {
        const res = await fetch(`${API_URL}/stats/today`, {
            headers: authHeaders()
        });
        return handleResponse<TodayStatsResponse>(res);
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

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
    return !!getAccessToken();
};
