import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';

export interface StoredProfile {
  user_id: string;
  height_cm: number;
  weight_kg: number;
  age: number;
}

export interface StoredSettings {
  daily_goal_ml: number;
  reminder_intensity: number;
  reminder_enabled: boolean;
  reminder_interval_minutes: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface StoredIntake {
  id: string;
  amount_ml: number;
  category: string;
  intake_time: string;
}

export interface StoredState {
  profile: StoredProfile;
  settings: StoredSettings;
  intakes: StoredIntake[];
}

export interface LocalDbHealth {
  ready: boolean;
  mode: 'sqlite' | 'localstorage';
  lastError: string | null;
}

const LEGACY_STATE_KEY = 'hydratemate_local_db_v1';
const SQLITE_DB_NAME = 'hydratemate_local';
const SQLITE_MIGRATION_MARKER = 'legacy_localstorage_migrated_v1';
const MIN_REMINDER_INTERVAL_MINUTES = 15;
const MAX_REMINDER_INTERVAL_MINUTES = 720;

const canUseLocalStorage = (): boolean => typeof window !== 'undefined' && !!window.localStorage;

const parseJson = <T>(raw: string | null): T | null => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const normalizeIntervalMinutes = (value: unknown, fallback: number): number => {
  const candidate = Number(value);
  if (!Number.isFinite(candidate)) {
    return fallback;
  }

  const rounded = Math.round(candidate);
  if (rounded < MIN_REMINDER_INTERVAL_MINUTES) {
    return MIN_REMINDER_INTERVAL_MINUTES;
  }
  if (rounded > MAX_REMINDER_INTERVAL_MINUTES) {
    return MAX_REMINDER_INTERVAL_MINUTES;
  }
  return rounded;
};

const normalizeBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return fallback;
};

const isValidIntake = (value: unknown): value is StoredIntake => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<StoredIntake>;
  return (
    typeof item.id === 'string' &&
    typeof item.amount_ml === 'number' &&
    typeof item.category === 'string' &&
    typeof item.intake_time === 'string'
  );
};

const normalizeState = (value: unknown, defaults: StoredState): StoredState => {
  if (!value || typeof value !== 'object') {
    return {
      profile: { ...defaults.profile },
      settings: { ...defaults.settings },
      intakes: []
    };
  }

  const source = value as Partial<StoredState>;
  const profile = source.profile || defaults.profile;
  const settings = source.settings || defaults.settings;
  const intakes = Array.isArray(source.intakes) ? source.intakes.filter(isValidIntake) : [];

  return {
    profile: {
      user_id: typeof profile.user_id === 'string' ? profile.user_id : defaults.profile.user_id,
      height_cm: Number.isFinite(profile.height_cm) ? Number(profile.height_cm) : defaults.profile.height_cm,
      weight_kg: Number.isFinite(profile.weight_kg) ? Number(profile.weight_kg) : defaults.profile.weight_kg,
      age: Number.isFinite(profile.age) ? Number(profile.age) : defaults.profile.age
    },
    settings: {
      daily_goal_ml: Number.isFinite(settings.daily_goal_ml)
        ? Number(settings.daily_goal_ml)
        : defaults.settings.daily_goal_ml,
      reminder_intensity: Number.isFinite(settings.reminder_intensity)
        ? Number(settings.reminder_intensity)
        : defaults.settings.reminder_intensity,
      reminder_enabled: normalizeBoolean(settings.reminder_enabled, defaults.settings.reminder_enabled),
      reminder_interval_minutes: normalizeIntervalMinutes(
        settings.reminder_interval_minutes,
        defaults.settings.reminder_interval_minutes
      ),
      quiet_hours_enabled: normalizeBoolean(settings.quiet_hours_enabled, defaults.settings.quiet_hours_enabled),
      quiet_hours_start:
        typeof settings.quiet_hours_start === 'string'
          ? settings.quiet_hours_start
          : defaults.settings.quiet_hours_start,
      quiet_hours_end:
        typeof settings.quiet_hours_end === 'string'
          ? settings.quiet_hours_end
          : defaults.settings.quiet_hours_end
    },
    intakes
  };
};

class LocalDbStore {
  private connection: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private mode: 'sqlite' | 'localstorage' = 'localstorage';
  private ready = false;
  private lastError: string | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(defaults: StoredState): Promise<void> {
    if (this.ready) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initializeInternal(defaults)
      .catch((error) => {
        this.lastError = error instanceof Error ? error.message : String(error);
        this.mode = 'localstorage';
      })
      .finally(() => {
        this.ready = true;
        this.initPromise = null;
      });

    return this.initPromise;
  }

  async readState(defaults: StoredState): Promise<StoredState> {
    await this.initialize(defaults);

    if (this.mode === 'sqlite' && this.db) {
      return this.readStateFromSQLite(defaults);
    }

    return this.readStateFromLocalStorage(defaults);
  }

  async writeState(nextState: StoredState, defaults: StoredState): Promise<void> {
    await this.initialize(defaults);
    const normalized = normalizeState(nextState, defaults);

    if (this.mode === 'sqlite' && this.db) {
      await this.writeStateToSQLite(normalized);
      return;
    }

    if (canUseLocalStorage()) {
      window.localStorage.setItem(LEGACY_STATE_KEY, JSON.stringify(normalized));
    }
  }

  getHealth(): LocalDbHealth {
    return {
      ready: this.ready,
      mode: this.mode,
      lastError: this.lastError
    };
  }

  private async initializeInternal(defaults: StoredState): Promise<void> {
    if (!this.shouldUseSQLite()) {
      this.mode = 'localstorage';
      return;
    }

    try {
      this.connection = new SQLiteConnection(CapacitorSQLite);
      await this.connection.checkConnectionsConsistency();

      const existing = await this.connection.isConnection(SQLITE_DB_NAME, false);
      this.db = existing.result
        ? await this.connection.retrieveConnection(SQLITE_DB_NAME, false)
        : await this.connection.createConnection(SQLITE_DB_NAME, false, 'no-encryption', 1, false);

      await this.db.open();
      await this.createSchema(defaults);
      await this.migrateLegacyData(defaults);

      this.mode = 'sqlite';
      this.lastError = null;
    } catch (error) {
      this.mode = 'localstorage';
      this.lastError = error instanceof Error ? error.message : String(error);
      this.db = null;
      this.connection = null;
    }
  }

  private shouldUseSQLite(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return Capacitor.getPlatform() !== 'web';
  }

  private async createSchema(defaults: StoredState): Promise<void> {
    const db = this.getDb();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS profile (
        user_id TEXT PRIMARY KEY NOT NULL,
        height_cm INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        age INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        daily_goal_ml INTEGER NOT NULL,
        reminder_intensity INTEGER NOT NULL,
        reminder_enabled INTEGER NOT NULL DEFAULT 0,
        reminder_interval_minutes INTEGER NOT NULL DEFAULT 60,
        quiet_hours_enabled INTEGER NOT NULL DEFAULT 1,
        quiet_hours_start TEXT NOT NULL,
        quiet_hours_end TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS intakes (
        id TEXT PRIMARY KEY NOT NULL,
        amount_ml INTEGER NOT NULL,
        category TEXT NOT NULL,
        intake_time TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    await this.ensureSettingsColumns(defaults);

    const profileRows = (await db.query('SELECT user_id FROM profile LIMIT 1;')).values || [];
    if (profileRows.length === 0) {
      await db.run(
        'INSERT INTO profile (user_id, height_cm, weight_kg, age, updated_at) VALUES (?, ?, ?, ?, ?);',
        [
          defaults.profile.user_id,
          defaults.profile.height_cm,
          defaults.profile.weight_kg,
          defaults.profile.age,
          new Date().toISOString()
        ]
      );
    }

    const settingsRows = (await db.query('SELECT id FROM settings WHERE id = 1;')).values || [];
    if (settingsRows.length === 0) {
      await db.run(
        'INSERT INTO settings (id, daily_goal_ml, reminder_intensity, reminder_enabled, reminder_interval_minutes, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?);',
        [
          defaults.settings.daily_goal_ml,
          defaults.settings.reminder_intensity,
          defaults.settings.reminder_enabled ? 1 : 0,
          defaults.settings.reminder_interval_minutes,
          defaults.settings.quiet_hours_enabled ? 1 : 0,
          defaults.settings.quiet_hours_start,
          defaults.settings.quiet_hours_end,
          new Date().toISOString()
        ]
      );
    }
  }

  private async ensureSettingsColumns(defaults: StoredState): Promise<void> {
    const db = this.getDb();
    const tableInfoRows = (await db.query('PRAGMA table_info(settings);')).values || [];
    const existingColumns = new Set(
      tableInfoRows
        .map((row) => (row && typeof row === 'object' ? (row as { name?: unknown }).name : undefined))
        .filter((name): name is string => typeof name === 'string')
    );

    if (!existingColumns.has('reminder_enabled')) {
      await db.execute(
        `ALTER TABLE settings ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT ${
          defaults.settings.reminder_enabled ? 1 : 0
        };`
      );
    }
    if (!existingColumns.has('reminder_interval_minutes')) {
      await db.execute(
        `ALTER TABLE settings ADD COLUMN reminder_interval_minutes INTEGER NOT NULL DEFAULT ${defaults.settings.reminder_interval_minutes};`
      );
    }
    if (!existingColumns.has('quiet_hours_enabled')) {
      await db.execute(
        `ALTER TABLE settings ADD COLUMN quiet_hours_enabled INTEGER NOT NULL DEFAULT ${
          defaults.settings.quiet_hours_enabled ? 1 : 0
        };`
      );
    }
  }

  private async migrateLegacyData(defaults: StoredState): Promise<void> {
    const db = this.getDb();
    const markerRows = (await db.query('SELECT value FROM meta WHERE key = ?;', [SQLITE_MIGRATION_MARKER]))
      .values || [];
    if (markerRows.length > 0) {
      return;
    }

    if (!canUseLocalStorage()) {
      await db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?);', [SQLITE_MIGRATION_MARKER, 'empty']);
      return;
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_STATE_KEY);
    if (!legacyRaw) {
      await db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?);', [SQLITE_MIGRATION_MARKER, 'empty']);
      return;
    }

    const parsed = parseJson<unknown>(legacyRaw);
    if (!parsed) {
      await db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?);', [SQLITE_MIGRATION_MARKER, 'malformed']);
      return;
    }

    const normalized = normalizeState(parsed, defaults);
    await this.writeStateToSQLite(normalized);

    const intakeCountRows = (await db.query('SELECT COUNT(1) AS count FROM intakes;')).values || [];
    const count = Number((intakeCountRows[0] as { count?: unknown } | undefined)?.count || 0);
    if (count !== normalized.intakes.length) {
      throw new Error('Legacy migration integrity check failed: intake row count mismatch');
    }

    await db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?);', [SQLITE_MIGRATION_MARKER, 'done']);
  }

  private async readStateFromSQLite(defaults: StoredState): Promise<StoredState> {
    const db = this.getDb();

    const profileRows = (
      await db.query('SELECT user_id, height_cm, weight_kg, age FROM profile LIMIT 1;')
    ).values || [];
    const settingsRows = (
      await db.query(
        'SELECT daily_goal_ml, reminder_intensity, reminder_enabled, reminder_interval_minutes, quiet_hours_enabled, quiet_hours_start, quiet_hours_end FROM settings WHERE id = 1 LIMIT 1;'
      )
    ).values || [];
    const intakeRows = (
      await db.query('SELECT id, amount_ml, category, intake_time FROM intakes ORDER BY intake_time DESC;')
    ).values || [];

    const profileRow = (profileRows[0] as Partial<StoredProfile> | undefined) || defaults.profile;
    const settingsRow = (settingsRows[0] as Partial<StoredSettings> | undefined) || defaults.settings;

    return normalizeState(
      {
        profile: {
          user_id: profileRow.user_id,
          height_cm: Number(profileRow.height_cm),
          weight_kg: Number(profileRow.weight_kg),
          age: Number(profileRow.age)
        },
        settings: {
          daily_goal_ml: Number(settingsRow.daily_goal_ml),
          reminder_intensity: Number(settingsRow.reminder_intensity),
          reminder_enabled: normalizeBoolean(settingsRow.reminder_enabled, defaults.settings.reminder_enabled),
          reminder_interval_minutes: normalizeIntervalMinutes(
            settingsRow.reminder_interval_minutes,
            defaults.settings.reminder_interval_minutes
          ),
          quiet_hours_enabled: normalizeBoolean(
            settingsRow.quiet_hours_enabled,
            defaults.settings.quiet_hours_enabled
          ),
          quiet_hours_start: settingsRow.quiet_hours_start,
          quiet_hours_end: settingsRow.quiet_hours_end
        },
        intakes: intakeRows
      },
      defaults
    );
  }

  private readStateFromLocalStorage(defaults: StoredState): StoredState {
    if (!canUseLocalStorage()) {
      return {
        profile: { ...defaults.profile },
        settings: { ...defaults.settings },
        intakes: []
      };
    }

    const parsed = parseJson<unknown>(window.localStorage.getItem(LEGACY_STATE_KEY));
    return normalizeState(parsed, defaults);
  }

  private async writeStateToSQLite(nextState: StoredState): Promise<void> {
    const db = this.getDb();
    const nowIso = new Date().toISOString();

    await db.beginTransaction();
    try {
      await db.run(
        'INSERT OR REPLACE INTO profile (user_id, height_cm, weight_kg, age, updated_at) VALUES (?, ?, ?, ?, ?);',
        [nextState.profile.user_id, nextState.profile.height_cm, nextState.profile.weight_kg, nextState.profile.age, nowIso],
        false
      );

      await db.run(
        'INSERT OR REPLACE INTO settings (id, daily_goal_ml, reminder_intensity, reminder_enabled, reminder_interval_minutes, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?);',
        [
          nextState.settings.daily_goal_ml,
          nextState.settings.reminder_intensity,
          nextState.settings.reminder_enabled ? 1 : 0,
          nextState.settings.reminder_interval_minutes,
          nextState.settings.quiet_hours_enabled ? 1 : 0,
          nextState.settings.quiet_hours_start,
          nextState.settings.quiet_hours_end,
          nowIso
        ],
        false
      );

      await db.run('DELETE FROM intakes;', [], false);

      for (const intake of nextState.intakes) {
        await db.run(
          'INSERT OR REPLACE INTO intakes (id, amount_ml, category, intake_time, created_at) VALUES (?, ?, ?, ?, ?);',
          [intake.id, intake.amount_ml, intake.category, intake.intake_time, nowIso],
          false
        );
      }

      await db.commitTransaction();
    } catch (error) {
      try {
        const isActive = await db.isTransactionActive();
        if (isActive.result) {
          await db.rollbackTransaction();
        }
      } catch {
        // Ignore rollback cleanup failures and rethrow original write error.
      }
      throw error;
    }
  }

  private getDb(): SQLiteDBConnection {
    if (!this.db) {
      throw new Error('SQLite database is not initialized');
    }

    return this.db;
  }
}

const store = new LocalDbStore();

export const initializeLocalDb = async (defaults: StoredState): Promise<void> => store.initialize(defaults);
export const readLocalDbState = async (defaults: StoredState): Promise<StoredState> => store.readState(defaults);
export const writeLocalDbState = async (state: StoredState, defaults: StoredState): Promise<void> =>
  store.writeState(state, defaults);
export const getLocalDbHealth = (): LocalDbHealth => store.getHealth();
