
import React from 'react';
import { GlassCard } from '../components/GlassCard';
import { IMAGES, COLORS } from '../constants';
import { UserState } from '../types';
import { Droplet, Coffee, Plus, Bell } from 'lucide-react';

interface HomeProps {
    user: UserState;
    onAddWater: (amount: number) => void;
}

export const Home: React.FC<HomeProps> = ({ user, onAddWater }) => {
    const progress = Math.min(100, (user.currentIntake / user.dailyGoal) * 100);
    
    // Plant visual state logic
    let plantImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuAYF_kG5xY6Q3Z_9_S1-m0_W4V4W1-W-1-W1W1W1W1W1W1W1W1W1W1W1W1W"; // default seed
    let growthStage = "胚芽阶段 · 种子";
    
    if (progress > 80) {
        plantImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuB_S1-m0_W4V4W1-W-1-W1W1W1W1W1W1W1W1W1W1W1W1W";
        growthStage = "成熟阶段 · 成树";
    } else if (progress > 50) {
        plantImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuB-S1-m0_W4V4W1-W-1-W1W1W1W1W1W1W1W1W1W1W1W1W";
        growthStage = "生长期 · 幼苗";
    } else if (progress > 20) {
        plantImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuBnguUDpSxyQoCwPMYrwCv3wq6IlIctsuB_pwfs-w5ezmmWMrobB-TO1RNx07_YoUOo5ChI2p334TJOq_GoiSqHusT22nGR2oJVzeT1QYaVp_G3Q27BA9NzCiNqYdcAI_oCrbKhsg9HWoOg8G34ajBEclFZYpxKYyqFi-rKPemCYLQwv6AkA6n5ffYlNLv6YZqiBTgIQm82RDtpawpwN4pDx3iMmhYfVW0IGSgCEqYztw08cjG3CADSPe3SqGfApwwmZk_cxX9toAGj";
        growthStage = "发芽阶段 · 萌芽";
    }

    return (
        <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
            {/* User Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={IMAGES.AVATAR} className="w-10 h-10 rounded-full border border-white/30" alt="Avatar" />
                    <div className="text-white">
                        <p className="text-xs opacity-60 font-medium">林间漫步中</p>
                        <p className="font-bold">你好，旅人</p>
                    </div>
                </div>
                <GlassCard className="p-2 !rounded-full">
                    <Bell className="text-white w-5 h-5" />
                </GlassCard>
            </div>

            {/* Goal Card */}
            <GlassCard className="p-6 relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center">
                    <div className="text-white">
                        <p className="text-xs opacity-70 mb-1">今日饮水目标</p>
                        <p className="text-3xl font-black">
                            {user.currentIntake.toLocaleString()} 
                            <span className="text-sm font-medium opacity-60 ml-1">/ {user.dailyGoal.toLocaleString()} ml</span>
                        </p>
                    </div>
                    <div className="relative w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                            <circle cx="18" cy="18" r="16" fill="none" stroke={COLORS.PRIMARY_LIGHT} strokeWidth="3" 
                                strokeDasharray={`${progress}, 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                            {Math.round(progress)}%
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Plant Area */}
            <GlassCard className="flex-1 flex flex-col items-center justify-center relative overflow-hidden p-6 group">
                <div className="absolute top-6 px-4 py-1.5 bg-white/10 rounded-full border border-white/20 text-xs text-white/80">
                    {growthStage}
                </div>
                
                <div className="relative w-full aspect-square flex items-center justify-center">
                    {/* Glow effect for high progress */}
                    {progress > 80 && (
                        <div className="absolute inset-0 bg-yellow-400/20 blur-[60px] rounded-full scale-75 animate-pulse"></div>
                    )}
                    <img 
                        src={plantImg} 
                        className="max-h-[80%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-1000" 
                        alt="Growth stage" 
                    />
                </div>

                <div className="text-center">
                    <p className="text-white/60 italic text-sm mt-4">“每一滴水，都是森林生长的生命力。”</p>
                </div>
            </GlassCard>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 pb-4">
                <GlassCard 
                    className="p-5 flex flex-col items-center gap-3 cursor-pointer active:scale-95 transition-transform"
                    onClick={() => onAddWater(250)}
                >
                    <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                        <Droplet className="text-green-400 fill-green-400/20" />
                    </div>
                    <p className="text-white font-bold text-sm">喝水打卡</p>
                </GlassCard>
                <GlassCard 
                    className="p-5 flex flex-col items-center gap-3 cursor-pointer active:scale-95 transition-transform"
                    onClick={() => onAddWater(150)}
                >
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                        <Coffee className="text-blue-400" />
                    </div>
                    <p className="text-white font-bold text-sm">其他饮品</p>
                </GlassCard>
            </div>
        </div>
    );
};
