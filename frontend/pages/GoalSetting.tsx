
import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { ChevronLeft, Check, Edit2, Calendar } from 'lucide-react';

interface GoalSettingProps {
    onConfirm: (goal: number) => void;
    onBack: () => void;
}

export const GoalSetting: React.FC<GoalSettingProps> = ({ onConfirm, onBack }) => {
    const [goal, setGoal] = useState(2200);

    return (
        <div className="flex flex-col h-full p-6 relative">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="p-2 rounded-full text-white">
                    <ChevronLeft className="w-7 h-7" />
                </button>
                <h1 className="text-lg font-bold text-white tracking-wide">目标设定</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 flex flex-col justify-center">
                <GlassCard className="p-8 flex flex-col items-center text-center relative overflow-hidden transition-all">
                    <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                    
                    <div className="relative mb-6 mt-2 flex justify-center w-full">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 blur-[50px] rounded-full"></div>
                        <img 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnguUDpSxyQoCwPMYrwCv3wq6IlIctsuB_pwfs-w5ezmmWMrobB-TO1RNx07_YoUOo5ChI2p334TJOq_GoiSqHusT22nGR2oJVzeT1QYaVp_G3Q27BA9NzCiNqYdcAI_oCrbKhsg9HWoOg8G34ajBEclFZYpxKYyqFi-rKPemCYLQwv6AkA6n5ffYlNLv6YZqiBTgIQm82RDtpawpwN4pDx3iMmhYfVW0IGSgCEqYztw08cjG3CADSPe3SqGfApwwmZk_cxX9toAGj" 
                            className="w-48 h-auto relative z-10 drop-shadow-2xl object-contain" 
                            alt="Recommended goal plant" 
                        />
                    </div>

                    <div className="space-y-2 relative z-10">
                        <p className="text-green-300 font-medium text-xs tracking-wide opacity-90 uppercase">根据您的身体数据</p>
                        <div className="flex items-baseline justify-center gap-1.5 text-white my-3">
                            <span className="text-7xl font-black tracking-tighter">{goal}</span>
                            <span className="text-2xl font-bold opacity-60">ml</span>
                        </div>
                        <h2 className="text-xl font-bold text-white">你的推荐目标</h2>
                        
                        <div className="flex justify-center mt-6">
                            <div className="inline-flex items-center gap-1.5 px-5 py-2 bg-white/10 backdrop-blur-md text-white rounded-full text-[10px] font-bold border border-white/10">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>每天</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </main>

            <footer className="mt-8 space-y-4 pb-8">
                <button 
                    onClick={() => onConfirm(goal)}
                    className="w-full py-4 bg-green-500 rounded-full flex items-center justify-center gap-2 text-white font-bold text-lg shadow-[0_10px_30px_rgba(34,197,94,0.3)] active:scale-[0.98] transition-all"
                >
                    确认目标 <Check className="w-5 h-5" />
                </button>
                <button className="w-full py-2 text-white/60 hover:text-white transition-colors flex items-center justify-center gap-1.5 font-medium text-xs">
                    <span>手动调整</span>
                    <Edit2 className="w-3 h-3" />
                </button>
            </footer>
        </div>
    );
};
