import React from 'react';
import { UserState } from '../types';
import { BarChart, Bar, ResponsiveContainer, XAxis, Cell, PieChart, Pie, AreaChart, Area, Tooltip } from 'recharts';
import { ChevronLeft, Calendar as CalendarIcon, TrendingUp, Zap, Droplet, Leaf, Clock } from 'lucide-react';

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

const hourlyData = [
    { hour: '6', value: 0 },
    { hour: '8', value: 300 },
    { hour: '10', value: 250 },
    { hour: '12', value: 400 },
    { hour: '14', value: 200 },
    { hour: '16', value: 350 },
    { hour: '18', value: 150 },
    { hour: '20', value: 200 },
    { hour: '22', value: 100 },
];

const pieData = [
    { name: '纯净水', value: 70, color: '#0dc792' },
    { name: '茶与咖啡', value: 20, color: '#6fc172' },
    { name: '天然果汁', value: 10, color: '#b2dfdb' },
];

export const Stats: React.FC<StatsProps> = ({ user, onBack }) => {
    return (
        <div className="flex flex-col h-full bg-[#fbffff] text-gray-800 p-6 gap-5 overflow-y-auto scrollbar-hide">
            <header className="flex items-center justify-between mb-2">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-800 tracking-widest">统计报告</h1>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                    <CalendarIcon className="w-6 h-6" />
                </button>
            </header>

            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-80 mb-1">Weekly Insight</h2>
                        <h3 className="text-2xl font-bold text-gray-800">本周概览</h3>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-[#0dc792]">14.0<span className="text-sm font-medium text-gray-400 ml-1">L</span></div>
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6fc172] bg-green-50 px-2 py-0.5 rounded-full mt-1 border border-green-100">
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
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                dy={10}
                            />
                            <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                                {weeklyData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.active ? '#0dc792' : '#f3f4f6'} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

             {/* Hourly Analysis Chart */}
             <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                         <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-80 mb-1">Daily Rhythm</h2>
                        <h3 className="text-lg font-bold text-gray-800">时段分析</h3>
                    </div>
                    <Clock className="w-5 h-5 text-[#0dc792]" />
                </div>
                <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyData}>
                            <defs>
                                <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0dc792" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#0dc792" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="hour" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#9ca3af', fontSize: 10 }}
                                interval={0}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ stroke: '#0dc792', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#0dc792" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorHourly)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
                    <span>最佳饮水时段</span>
                    <span className="font-bold text-gray-700">12:00 - 14:00</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col items-center justify-center">
                    <Leaf className="text-[#6fc172] w-5 h-5 mb-2" />
                    <span className="text-lg font-bold text-gray-800">5<span className="text-[10px] ml-1 font-normal text-gray-400">天</span></span>
                    <span className="text-[8px] text-gray-400 mt-1 uppercase">连续达标</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col items-center justify-center">
                    <Droplet className="text-[#0dc792] w-5 h-5 mb-2" />
                    <span className="text-lg font-bold text-gray-800">14.5<span className="text-[10px] ml-1 font-normal text-gray-400">L</span></span>
                    <span className="text-[8px] text-gray-400 mt-1 uppercase">累计饮水</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col items-center justify-center">
                    <Zap className="text-yellow-400 w-5 h-5 mb-2" />
                    <span className="text-lg font-bold text-gray-800">2.1<span className="text-[10px] ml-1 font-normal text-gray-400">L</span></span>
                    <span className="text-[8px] text-gray-400 mt-1 uppercase">日均摄入</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">饮水构成</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">本月</span>
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
                        <div className="absolute inset-0 flex items-center justify-center text-gray-800">
                            <span className="text-lg font-black">100<span className="text-[10px] font-bold">%</span></span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-3">
                        {pieData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-xs text-gray-500">{item.name}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-800">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="h-4"></div>
        </div>
    );
};