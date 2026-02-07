
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { IMAGES, COLORS } from '../constants';
import { UserState } from '../types';
import { Droplet, Coffee, Plus, Bell } from 'lucide-react';

// 本地植物生长阶段图片
const PLANT_STAGES = [
    { img: '/img/1阶段.png', label: '胚芽阶段 · 种子', threshold: 0 },
    { img: '/img/2阶段.png', label: '发芽阶段 · 萌芽', threshold: 20 },
    { img: '/img/3阶段.png', label: '生长期 · 幼苗', threshold: 50 },
    { img: '/img/4阶段.png', label: '成熟阶段 · 成树', threshold: 80 },
];

interface HomeProps {
    user: UserState;
    onAddWater: (amount: number) => void;
}

export const Home: React.FC<HomeProps> = ({ user, onAddWater }) => {
    const progress = Math.min(100, (user.currentIntake / user.dailyGoal) * 100);
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const prevStageRef = useRef(0);

    // 根据进度计算当前阶段
    const getStageIndex = (prog: number) => {
        for (let i = PLANT_STAGES.length - 1; i >= 0; i--) {
            if (prog > PLANT_STAGES[i].threshold) return i;
        }
        return 0;
    };

    const targetStageIndex = getStageIndex(progress);
    const plantImg = PLANT_STAGES[currentStageIndex].img;
    const growthStage = PLANT_STAGES[currentStageIndex].label;

    // 平滑切换动画
    useEffect(() => {
        if (targetStageIndex !== currentStageIndex && !isTransitioning) {
            setIsTransitioning(true);
            prevStageRef.current = currentStageIndex;

            // 延迟切换，让淡出动画先执行
            const timer = setTimeout(() => {
                setCurrentStageIndex(targetStageIndex);
                setTimeout(() => setIsTransitioning(false), 600);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [targetStageIndex, currentStageIndex, isTransitioning]);

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
                    {/* 植物发光效果 - 黄绿渐变光芒 */}
                    <div className={`absolute w-32 h-32 rounded-full transition-all duration-1000 ${
                        currentStageIndex >= 2
                            ? 'bg-gradient-radial from-yellow-300/40 via-green-400/20 to-transparent blur-[40px] scale-150'
                            : currentStageIndex >= 1
                                ? 'bg-gradient-radial from-yellow-200/20 via-green-300/10 to-transparent blur-[30px] scale-100'
                                : 'opacity-0'
                    }`}></div>

                    {/* 植物图片容器 - 支持平滑切换动画 */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        {PLANT_STAGES.map((stage, index) => (
                            <img
                                key={stage.img}
                                src={stage.img}
                                className={`absolute max-h-[70%] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all duration-700 ease-in-out ${
                                    index === currentStageIndex
                                        ? 'opacity-100 scale-100'
                                        : 'opacity-0 scale-90'
                                }`}
                                alt={stage.label}
                            />
                        ))}
                    </div>
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
