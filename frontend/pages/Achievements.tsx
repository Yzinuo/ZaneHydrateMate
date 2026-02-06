
import React from 'react';
import { GlassCard } from '../components/GlassCard';
import { ChevronLeft, HelpCircle, Star, Sun, Shield, Droplets, Map, Waves, Calendar, Users, Lock, Milestone } from 'lucide-react';

interface AchievementsProps {
    onBack: () => void;
}

export const Achievements: React.FC<AchievementsProps> = ({ onBack }) => {
    const badges = [
        { id: 1, name: '早起鸟', icon: <Sun className="w-8 h-8" />, unlocked: true },
        { id: 2, name: '倒水大师', icon: <Droplets className="w-8 h-8" />, unlocked: true },
        { id: 3, name: '补水英雄', icon: <Shield className="w-8 h-8" />, unlocked: true },
        { id: 4, name: '马拉松', icon: <Milestone className="w-8 h-8" />, unlocked: false },
        { id: 5, name: '深潜', icon: <Map className="w-8 h-8" />, unlocked: false },
        { id: 6, name: '海洋', icon: <Waves className="w-8 h-8" />, unlocked: false },
        { id: 7, name: '30天', icon: <Calendar className="w-8 h-8" />, unlocked: false },
        { id: 8, name: '社交达人', icon: <Users className="w-8 h-8" />, unlocked: false },
        { id: 9, name: '???', icon: <Lock className="w-8 h-8" />, unlocked: false },
    ];

    return (
        <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto scrollbar-hide">
            <header className="flex justify-between items-center">
                <button onClick={onBack} className="p-2 rounded-full glass-panel bg-white/10 text-white">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-white">成就</h1>
                <button className="p-2 rounded-full glass-panel bg-white/10 text-white">
                    <HelpCircle className="w-6 h-6" />
                </button>
            </header>

            <GlassCard className="p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-green-500/20 to-transparent"></div>
                <div className="relative mx-auto mb-4 w-24 h-24 bg-white/10 rounded-full flex items-center justify-center shadow-lg border-2 border-green-500/50">
                    <div className="absolute -top-3 px-3 py-1 bg-green-900 rounded-full text-[10px] font-bold text-green-300 border border-green-700">
                        最新解锁
                    </div>
                    <span className="text-4xl">🌷</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">今日目标已达成！</h2>
                <p className="text-white/60 text-xs mb-6 font-medium">你今天喝了 2,000ml。继续保持！</p>
                <button className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Star className="w-4 h-4 fill-white" />
                    领取奖励
                </button>
            </GlassCard>

            <div className="flex items-center justify-between glass-panel bg-white/5 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <Star className="w-5 h-5 fill-green-400/20" />
                    </div>
                    <div>
                        <div className="font-bold text-white">5天连续</div>
                        <div className="text-[10px] text-white/50">你真棒！🌱</div>
                    </div>
                </div>
                <button className="text-green-400 font-bold text-xs">查看统计</button>
            </div>

            <div className="mt-2">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="font-bold text-white">徽章收藏</h3>
                    <span className="text-[10px] font-bold text-green-400 bg-white/5 px-2 py-0.5 rounded-md">3 / 12 已解锁</span>
                </div>
                <div className="grid grid-cols-3 gap-6">
                    {badges.map((badge) => (
                        <div key={badge.id} className="flex flex-col items-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 border transition-all ${
                                badge.unlocked 
                                ? 'bg-white/10 border-green-500 text-green-400 shadow-[0_0_15px_rgba(76,175,80,0.3)]' 
                                : 'bg-white/5 border-transparent text-white/20'
                            }`}>
                                {badge.icon}
                            </div>
                            <span className={`text-[10px] font-medium ${badge.unlocked ? 'text-white' : 'text-white/30'}`}>{badge.name}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="h-20"></div>
        </div>
    );
};
