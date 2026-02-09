import React, { useState, useEffect } from 'react';
import { Page, UserState, UserProfile, DrinkOption } from './types';
import { IMAGES } from './constants';
import { Home } from './pages/Home';
import { HomeModern } from './pages/HomeModern';
import { Stats } from './pages/Stats';
import { GoalSetting } from './pages/GoalSetting';
import { Profile } from './pages/Profile';
import { DrinkSettings } from './pages/DrinkSettings';
import { ReminderSettings } from './pages/ReminderSettings';
import { Home as HomeIcon, BarChart2, User, Plus, Palette, Bell } from 'lucide-react';

const DEFAULT_DRINKS: DrinkOption[] = [
    { id: '1', label: '一杯水', amount: 250, category: 'water', iconId: 'droplet', colorClass: 'bg-[#e0f7fa] text-[#00bcd4]' },
    { id: '2', label: '一小口', amount: 50, category: 'water', iconId: 'droplet', colorClass: 'bg-blue-50 text-blue-400' },
    { id: '3', label: '咖啡', amount: 150, category: 'coffee', iconId: 'coffee', colorClass: 'bg-[#fff3e0] text-[#ff9800]' },
    { id: '4', label: '果汁', amount: 300, category: 'juice', iconId: 'wine', colorClass: 'bg-[#fce4ec] text-[#e91e63]' },
];

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
    const [user, setUser] = useState<UserState>({
        dailyGoal: 2000,
        currentIntake: 0,
        streak: 5,
        totalIntake: 14500,
        records: []
    });
    const [drinkOptions, setDrinkOptions] = useState<DrinkOption[]>(DEFAULT_DRINKS);

    const addWater = (amount: number, category: string = 'water') => {
        setUser(prev => ({
            ...prev,
            currentIntake: prev.currentIntake + amount,
            totalIntake: prev.totalIntake + amount,
            records: [
                ...prev.records,
                { id: Math.random().toString(), amount, type: category, timestamp: Date.now() }
            ]
        }));
    };

    const confirmGoal = (newGoal: number) => {
        setUser(prev => ({ ...prev, dailyGoal: newGoal }));
        setCurrentPage(Page.HOME);
    };

    const handleSaveProfile = (profile: UserProfile, recommendedGoal: number) => {
        setUser(prev => ({ ...prev, profile, dailyGoal: recommendedGoal }));
        setCurrentPage(Page.HOME);
    };

    const renderPage = () => {
        switch (currentPage) {
            case Page.HOME:
                return <HomeModern 
                    user={user} 
                    drinkOptions={drinkOptions}
                    onAddWater={addWater} 
                    onOpenSettings={() => setCurrentPage(Page.DRINK_SETTINGS)}
                />;
            case Page.STATS:
                return <Stats user={user} onBack={() => setCurrentPage(Page.HOME)} />;
            case Page.GOAL_SETTING:
                return <GoalSetting onConfirm={confirmGoal} onBack={() => setCurrentPage(Page.HOME)} />;
            case Page.PROFILE:
                return <Profile initial={user.profile} onSave={handleSaveProfile} onBack={() => setCurrentPage(Page.HOME)} />;
            case Page.DRINK_SETTINGS:
                return <DrinkSettings 
                    options={drinkOptions} 
                    onUpdateOptions={setDrinkOptions} 
                    onBack={() => setCurrentPage(Page.HOME)} 
                />;
            case Page.REMINDER_SETTINGS:
                return <ReminderSettings onBack={() => setCurrentPage(Page.HOME)} />;
            default:
                return <HomeModern 
                    user={user} 
                    drinkOptions={drinkOptions}
                    onAddWater={addWater} 
                    onOpenSettings={() => setCurrentPage(Page.DRINK_SETTINGS)}
                />;
        }
    };

    return (
        <div className="relative w-full h-screen bg-[#fbffff] overflow-hidden flex flex-col shadow-2xl">

            {/* Page Content */}
            <div className="relative z-10 flex-1 overflow-hidden">
                {renderPage()}
            </div>

            {/* Navigation */}
            {[Page.HOME, Page.STATS, Page.PROFILE, Page.REMINDER_SETTINGS].includes(currentPage) && (
                <div className="relative z-20 px-6 pb-8">
                    <div className="backdrop-blur-xl border border-gray-100 bg-white/80 rounded-3xl h-16 flex items-center justify-around px-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]">
                        <NavButton
                            active={currentPage === Page.HOME}
                            onClick={() => setCurrentPage(Page.HOME)}
                            icon={<HomeIcon />}
                            label="首页"
                        />
                        <NavButton
                            active={currentPage === Page.STATS}
                            onClick={() => setCurrentPage(Page.STATS)}
                            icon={<BarChart2 />}
                            label="统计"
                        />
                        {/* Center Add Button -> Reminders Shortcut */}
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
        </div>
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
            active 
            ? 'text-[#0dc792] scale-110' 
            : 'text-gray-400'
        }`}
    >
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

export default App;