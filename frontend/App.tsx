
import React, { useState, useEffect } from 'react';
import { Page, UserState, UserProfile } from './types';
import { IMAGES } from './constants';
import { Home } from './pages/Home';
import { Stats } from './pages/Stats';
import { Achievements } from './pages/Achievements';
import { GoalSetting } from './pages/GoalSetting';
import { Profile } from './pages/Profile';
import { Home as HomeIcon, BarChart2, Award, User, Plus } from 'lucide-react';

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
    const [user, setUser] = useState<UserState>({
        dailyGoal: 2000,
        currentIntake: 1250,
        streak: 5,
        totalIntake: 14500,
        records: []
    });

    const addWater = (amount: number) => {
        setUser(prev => ({
            ...prev,
            currentIntake: prev.currentIntake + amount,
            totalIntake: prev.totalIntake + amount,
            records: [
                ...prev.records,
                { id: Math.random().toString(), amount, type: 'water', timestamp: Date.now() }
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
                return <Home user={user} onAddWater={addWater} />;
            case Page.STATS:
                return <Stats user={user} onBack={() => setCurrentPage(Page.HOME)} />;
            case Page.ACHIEVEMENTS:
                return <Achievements onBack={() => setCurrentPage(Page.HOME)} />;
            case Page.GOAL_SETTING:
                return <GoalSetting onConfirm={confirmGoal} onBack={() => setCurrentPage(Page.HOME)} />;
            case Page.PROFILE:
                return <Profile initial={user.profile} onSave={handleSaveProfile} onBack={() => setCurrentPage(Page.HOME)} />;
            default:
                return <Home user={user} onAddWater={addWater} />;
        }
    };

    return (
        <div className="relative max-w-md mx-auto h-screen w-full bg-transparent overflow-hidden flex flex-col shadow-2xl">
            {/* Immersive Forest Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src={IMAGES.BACKGROUND}
                    className="w-full h-full object-cover"
                    alt="Forest Background"
                />
                {/* 雾气渐变遮罩 - 匹配设计稿冷灰绿色调 */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#2a3a2e]/30 via-transparent to-[#1a2a1e]/60"></div>
            </div>

            {/* Foreground Leaf Overlay (Floating effect) */}
            <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 z-0 opacity-20 pointer-events-none transform rotate-45">
                <img src={IMAGES.LEAF_OVERLAY} className="w-full h-full object-contain" alt="Leaf overlay" />
            </div>

            {/* Page Content */}
            <div className="relative z-10 flex-1 overflow-hidden">
                {renderPage()}
            </div>

            {/* Navigation (Only show on certain pages) */}
            {[Page.HOME, Page.STATS, Page.ACHIEVEMENTS, Page.PROFILE].includes(currentPage) && (
                <div className="relative z-20 px-6 pb-8">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/15 rounded-3xl h-16 flex items-center justify-around px-4">
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
                        {/* Center Add Button */}
                        <div className="relative -top-6">
                            <button
                                onClick={() => setCurrentPage(Page.GOAL_SETTING)}
                                className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-[0_8px_20px_rgba(34,197,94,0.4)] border-4 border-[#0a1f0d] active:scale-90 transition-transform"
                            >
                                <Plus className="w-8 h-8" />
                            </button>
                        </div>
                        <NavButton
                            active={currentPage === Page.ACHIEVEMENTS}
                            onClick={() => setCurrentPage(Page.ACHIEVEMENTS)}
                            icon={<Award />}
                            label="花园"
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
        className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-green-400 scale-110' : 'text-white/40'}`}
    >
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

export default App;
