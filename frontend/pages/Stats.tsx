
import React from 'react';
import { GlassCard } from '../components/GlassCard';
import { UserState } from '../types';
import { BarChart, Bar, ResponsiveContainer, XAxis, Cell, PieChart, Pie } from 'recharts';
import { ChevronLeft, Calendar as CalendarIcon, TrendingUp, Zap, Droplet, Leaf } from 'lucide-react';

interface StatsProps {
    user: UserState;
    onBack: () => void;
}

const weeklyData = [
    { name: '一', value: 40 },
    { name: '二', value: 60 },
    { name: '三', value: 85, active: true },
    { name: '四', value: 50 },
    { name: '五', value: 70 },
    { name: '六', value: 35 },
    { name: '日', value: 45 },
];

const pieData = [
    { name: '纯净水', value: 70, color: '#4CAF50' },
    { name: '茶与咖啡', value: 20, color: '#81C784' },
    { name: '天然果汁', value: 10, color: '#C8E6C9' },
];

export const Stats: React.FC<StatsProps> = ({ user, onBack }) => {
    return (
        <div className="flex flex-col h-full p-6 gap-5 overflow-y-auto scrollbar-hide">
            <header className="flex items-center justify-between mb-2">
                <button onClick={onBack} className="p-2 glass-panel bg-white/10 rounded-full text-white">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-white tracking-widest">统计报告</h1>
                <button className="p-2 glass-panel bg-white/10 rounded-full text-white">
                    <CalendarIcon className="w-6 h-6" />
                </button>
            </header>

            <GlassCard className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-[10px] font-bold text-green-200 uppercase tracking-widest opacity-80 mb-1">Weekly Insight</h2>
                        <h3 className="text-2xl font-bold text-white">本周概览</h3>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-green-400">14.0<span className="text-sm font-medium text-white ml-1">L</span></div>
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-green-300 bg-green-900/40 px-2 py-0.5 rounded-full mt-1 border border-green-500/30">
                            <TrendingUp className="w-3 h-3" />
                            <span>高于上周 12%</span>
                        </div>
                    </div>
                </div>

                <div className="h-40 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                                dy={10}
                            />
                            <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                                {weeklyData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.active ? '#4CAF50' : 'rgba(255,255,255,0.1)'} 
                                        style={{ filter: entry.active ? 'drop-shadow(0 0 8px rgba(76, 175, 80, 0.6))' : 'none' }}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            <div className="grid grid-cols-3 gap-3">
                <GlassCard className="p-4 flex flex-col items-center justify-center">
                    <Leaf className="text-green-400 w-5 h-5 mb-2" />
                    <span className="text-lg font-bold text-white">5<span className="text-[10px] ml-1 font-normal opacity-70">天</span></span>
                    <span className="text-[8px] text-white/60 mt-1 uppercase">连续达标</span>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col items-center justify-center">
                    <Droplet className="text-green-400 w-5 h-5 mb-2" />
                    <span className="text-lg font-bold text-white">14.5<span className="text-[10px] ml-1 font-normal opacity-70">L</span></span>
                    <span className="text-[8px] text-white/60 mt-1 uppercase">累计饮水</span>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col items-center justify-center">
                    <Zap className="text-green-400 w-5 h-5 mb-2" />
                    <span className="text-lg font-bold text-white">2.1<span className="text-[10px] ml-1 font-normal opacity-70">L</span></span>
                    <span className="text-[8px] text-white/60 mt-1 uppercase">日均摄入</span>
                </GlassCard>
            </div>

            <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">饮水构成</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-green-200">本月</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="w-32 h-32 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={35}
                                    outerRadius={55}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            <span className="text-lg font-black">100<span className="text-[10px] font-bold">%</span></span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-3">
                        {pieData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-xs text-white/80">{item.name}</span>
                                </div>
                                <span className="text-xs font-bold text-white">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
