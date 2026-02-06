
export enum Page {
    HOME = 'HOME',
    STATS = 'STATS',
    ACHIEVEMENTS = 'ACHIEVEMENTS',
    SETTINGS = 'SETTINGS',
    GOAL_SETTING = 'GOAL_SETTING'
}

export interface DrinkRecord {
    id: string;
    amount: number;
    type: string;
    timestamp: number;
}

export interface Badge {
    id: string;
    name: string;
    icon: string;
    unlocked: boolean;
}

export interface UserState {
    dailyGoal: number;
    currentIntake: number;
    streak: number;
    totalIntake: number;
    records: DrinkRecord[];
}
