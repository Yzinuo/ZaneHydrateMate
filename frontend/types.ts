import React from 'react';

export enum Page {
    HOME = 'HOME',
    STATS = 'STATS',
    ACHIEVEMENTS = 'ACHIEVEMENTS',
    SETTINGS = 'SETTINGS',
    GOAL_SETTING = 'GOAL_SETTING',
    PROFILE = 'PROFILE',
    DRINK_SETTINGS = 'DRINK_SETTINGS',
    REMINDER_SETTINGS = 'REMINDER_SETTINGS'
}

export type ReminderType = 'quick' | 'recurring' | 'scene';

export interface ReminderConfig {
    id: string;
    type: ReminderType;
    label: string;
    time?: string;      // HH:mm for scene
    interval?: number;  // Hours for recurring
    enabled: boolean;
}

export interface DoNotDisturbConfig {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
}

export type DrinkCategory = 'water' | 'tea' | 'juice' | 'milk' | 'coffee' | 'alcohol' | 'soda';

export interface DrinkOption {
    id: string;
    label: string;
    amount: number;
    category: string;
    icon?: React.ReactNode; // Optional, can be derived from iconId
    iconId?: string;       // For serialization/storage
    colorClass?: string;   // For styling (Tailwind classes)
    color?: string;        // Legacy support
}

export interface UserProfile {
    age: number;
    weightKg: number;
    heightCm: number;
    activityLevel: 'sedentary' | 'moderate' | 'active';
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
    id?: string;
    profile?: UserProfile;
    dailyGoal: number;
    currentIntake: number;
    streak: number;
    totalIntake: number;
    records: DrinkRecord[];
}
