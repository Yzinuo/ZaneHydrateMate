import { afterEach, describe, expect, it, vi } from 'vitest';

const getDateRange = (): { today: string; tomorrow: string } => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  return { today, tomorrow };
};

describe('local data persistence', () => {
  afterEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('keeps profile/settings/intakes after module reload', async () => {
    localStorage.clear();
    const { today, tomorrow } = getDateRange();

    vi.resetModules();
    const apiFirst = await import('../api');

    await apiFirst.initializeLocalDataLayer();
    await apiFirst.settingsApi.update({
      daily_goal_ml: 2300,
      reminder_intensity: 3,
      reminder_enabled: true,
      reminder_interval_minutes: 90,
      quiet_hours_enabled: true,
      quiet_hours_start: '22:30',
      quiet_hours_end: '06:30'
    });
    await apiFirst.profileApi.update({
      height_cm: 178,
      weight_kg: 68,
      age: 31,
      apply_recommend: false
    });
    await apiFirst.intakeApi.add(250, 'water', new Date().toISOString());

    vi.resetModules();
    const apiSecond = await import('../api');
    await apiSecond.initializeLocalDataLayer();

    const settings = await apiSecond.settingsApi.get();
    const profile = await apiSecond.profileApi.get();
    const intakes = await apiSecond.intakeApi.list(today, tomorrow, 1, 50);
    const weekly = await apiSecond.statsApi.getWeekly();

    expect(settings.daily_goal_ml).toBe(2300);
    expect(settings.reminder_intensity).toBe(3);
    expect(settings.reminder_enabled).toBe(true);
    expect(settings.reminder_interval_minutes).toBe(90);
    expect(settings.quiet_hours_enabled).toBe(true);
    expect(settings.quiet_hours_start).toBe('22:30');
    expect(settings.quiet_hours_end).toBe('06:30');
    expect(profile.profile.height_cm).toBe(178);
    expect(profile.profile.weight_kg).toBe(68);
    expect(profile.profile.age).toBe(31);
    expect(intakes.total).toBeGreaterThanOrEqual(1);
    expect(weekly.total_ml).toBeGreaterThanOrEqual(250);
  });
});
