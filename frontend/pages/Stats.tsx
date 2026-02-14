import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Tooltip
} from 'recharts';
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  TrendingUp,
  Zap,
  Droplet,
  Leaf,
  Clock,
  RefreshCw
} from 'lucide-react';
import {
  WeeklyStatsResponse,
  StreakResponse,
  BestTimeResponse,
  GapsResponse,
  HealthResponse,
  IntakeResponse,
  intakeApi
} from '../api';

interface StatsProps {
  weekly: WeeklyStatsResponse | null;
  streak: StreakResponse | null;
  bestTime: BestTimeResponse | null;
  gaps: GapsResponse | null;
  health: HealthResponse | null;
  todayIntakes: IntakeResponse[];
  loading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onBack: () => void;
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const CATEGORY_MAP: Record<string, string> = {
  water: '水',
  tea: '咖啡',
  juice: '果汁',
  milk: '牛奶',
  coffee: '咖啡',
  soda: '汽水',
};

const formatDay = (date: Date): string => WEEKDAY_LABELS[date.getDay()];

const getLocalISODate = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const formatHourTick = (value: string): string => {
  const hour = Number(value.split(':')[0]);
  if (!Number.isFinite(hour)) {
    return value;
  }
  // Keep full 2-hour data points, only show a label every 4 hours.
  return hour % 4 === 0 ? value : '';
};

const EmptyBlock: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">{text}</div>
);

export const Stats: React.FC<StatsProps> = ({
  weekly,
  streak,
  bestTime,
  gaps,
  health,
  todayIntakes,
  loading,
  errorMessage,
  onRetry,
  onBack
}) => {
  // Default to today
  const [selectedDate, setSelectedDate] = useState<string>(getLocalISODate(new Date()));
  const [dailyIntakes, setDailyIntakes] = useState<IntakeResponse[]>(todayIntakes);
  const [fetchingDaily, setFetchingDaily] = useState(false);

  // Sync dailyIntakes with todayIntakes when prop changes, if we are viewing today
  useEffect(() => {
    const today = getLocalISODate(new Date());
    if (selectedDate === today) {
      setDailyIntakes(todayIntakes);
    }
  }, [todayIntakes, selectedDate]);

  // Fetch data when selectedDate changes and it's not today
  useEffect(() => {
    const today = getLocalISODate(new Date());
    if (selectedDate === today) {
      setDailyIntakes(todayIntakes);
      return;
    }

    const fetchData = async () => {
      setFetchingDaily(true);
      try {
        // Calculate next day for range
        const current = new Date(selectedDate);
        const next = new Date(current);
        next.setDate(next.getDate() + 1);
        const nextStr = getLocalISODate(next);

        const res = await intakeApi.list(selectedDate, nextStr, 1, 1000);
        setDailyIntakes(res.intakes);
      } catch (err) {
        console.error('Failed to fetch daily stats', err);
        setDailyIntakes([]);
      } finally {
        setFetchingDaily(false);
      }
    };

    fetchData();
  }, [selectedDate, todayIntakes]); // dependency on todayIntakes included to ensure stability but logic guards it

  const isTodaySelected = selectedDate === getLocalISODate(new Date());
  const visibleIntakes = useMemo(
    () => (isTodaySelected ? todayIntakes : dailyIntakes),
    [isTodaySelected, todayIntakes, dailyIntakes]
  );

  const weeklyData = useMemo(() => {
    if (!weekly) {
      return [] as Array<{ name: string; value: number; fullDate: string }>;
    }

    const map = new Map<string, number>();
    weekly.daily_data.forEach((item) => {
      const key = new Date(item.stat_date).toDateString();
      map.set(key, item.total_ml);
    });

    const start = new Date(weekly.week_start);
    const points: Array<{ name: string; value: number; fullDate: string }> = [];

    for (let i = 0; i < 7; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = date.toDateString();
      const fullDate = getLocalISODate(date);
      
      points.push({
        name: formatDay(date),
        value: map.get(key) || 0,
        fullDate
      });
    }

    return points;
  }, [weekly]);

  const hourlyData = useMemo(() => {
    const hourlyMap = new Map<number, number>();
    visibleIntakes.forEach((intake) => {
      const hour = new Date(intake.intake_time).getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + intake.amount_ml);
    });

    const points: Array<{ hour: string; value: number }> = [];
    // Display every 2 hours but aggregate all data
    for (let hour = 0; hour < 24; hour += 2) {
      // Combine this hour and the next hour for a smoother 2-hour block display
      const combinedValue = (hourlyMap.get(hour) || 0) + (hourlyMap.get(hour + 1) || 0);
      points.push({
        hour: `${hour}:00`,
        value: combinedValue
      });
    }

    return points;
  }, [visibleIntakes]);

  const pieData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    visibleIntakes.forEach((intake) => {
      categoryMap.set(intake.category, (categoryMap.get(intake.category) || 0) + intake.amount_ml);
    });

    const total = Array.from(categoryMap.values()).reduce((sum, value) => sum + value, 0);
    if (total === 0) {
      return [] as Array<{ name: string; value: number; color: string }>;
    }

    const colors = ['#0dc792', '#6fc172', '#b2dfdb', '#93c5fd', '#fbbf24'];
    return Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name: CATEGORY_MAP[name] || name,
      value: Math.round((value / total) * 100),
      color: colors[index % colors.length]
    }));
  }, [visibleIntakes]);

  const weeklyLiters = ((weekly?.total_ml || 0) / 1000).toFixed(1);
  const avgLiters = ((weekly?.avg_daily || 0) / 1000).toFixed(1);
  const bestWindow = bestTime?.window || '--:--';
  const healthScore = health?.health_score ?? 0;

  // Reset to today when unmounting or navigating back (handled by parent remounting usually, but good to be safe if kept alive)
  // Actually, standard React behavior is fine here.

  return (
    <div className="flex flex-col h-full bg-[#fbffff] text-gray-800 p-6 gap-5 overflow-y-auto scrollbar-hide">
      <header className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 tracking-widest">统计报告</h1>
        <button
          onClick={onRetry}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label="刷新统计"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {errorMessage ? (
        <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl px-3 py-2 text-xs">{errorMessage}</div>
      ) : null}

      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-80 mb-1">每周洞察</h2>
            <h3 className="text-2xl font-bold text-gray-800">本周概览</h3>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-[#0dc792]">
              {weeklyLiters}
              <span className="text-sm font-medium text-gray-400 ml-1">L</span>
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6fc172] bg-green-50 px-2 py-0.5 rounded-full mt-1 border border-green-100">
              <TrendingUp className="w-3 h-3" />
              <span>达标天数 {weekly?.goals_met ?? 0}</span>
            </div>
          </div>
        </div>

        {weeklyData.length > 0 ? (
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
                <Bar
                  dataKey="value"
                  radius={[10, 10, 10, 10]}
                  onClick={(data) => {
                    if (data && data.fullDate) {
                      setSelectedDate(data.fullDate);
                    }
                  }}
                  cursor="pointer"
                >
                  {weeklyData.map((entry, index) => {
                    const isSelected = entry.fullDate === selectedDate;
                    return (
                      <Cell
                        key={`week-cell-${index}`}
                        fill={isSelected ? '#0dc792' : '#e5e7eb'}
                        className="transition-all duration-300"
                        style={{
                          filter: isSelected ? 'drop-shadow(0 4px 6px rgba(13, 199, 146, 0.4))' : 'none',
                          transform: isSelected ? 'scaleY(1.02)' : 'scaleY(1)',
                          transformOrigin: 'bottom'
                        }}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyBlock text={loading ? '统计加载中...' : '本周暂时没有饮水记录'} />
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-80 mb-1">每日节奏</h2>
            <h3 className="text-lg font-bold text-gray-800">
              {selectedDate === getLocalISODate(new Date()) ? '今日' : new Date(selectedDate).getMonth() + 1 + '月' + new Date(selectedDate).getDate() + '日'}时段
            </h3>
          </div>
          <Clock className="w-5 h-5 text-[#0dc792]" />
        </div>

        {fetchingDaily ? (
             <div className="h-32 flex items-center justify-center text-gray-300 text-xs">加载中...</div>
        ) : hourlyData.some((item) => item.value > 0) ? (
          <>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0dc792" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0dc792" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    interval={0}
                    tickFormatter={formatHourTick}
                    tickMargin={8}
                    minTickGap={16}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ stroke: '#0dc792', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#0dc792" strokeWidth={3} fillOpacity={1} fill="url(#colorHourly)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Best window logic is a bit complex to recalc client side perfectly without replicating logic, 
                so we might hide it or show "--" for non-today days unless we fetch it. 
                For now, keeping it as is (based on 'bestTime' prop which is weekly) or we could try to compute simple max hour locally.
            */}
          </>
        ) : (
          <EmptyBlock text={loading ? '正在分析...' : '该日暂无数据'} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col items-center justify-center">
          <Leaf className="text-[#6fc172] w-5 h-5 mb-2" />
          <span className="text-lg font-bold text-gray-800">
            {streak?.streak_days ?? 0}
            <span className="text-[10px] ml-1 font-normal text-gray-400">天</span>
          </span>
          <span className="text-[8px] text-gray-400 mt-1 uppercase">连续达标</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col items-center justify-center">
          <Droplet className="text-[#0dc792] w-5 h-5 mb-2" />
          <span className="text-lg font-bold text-gray-800">
            {weeklyLiters}
            <span className="text-[10px] ml-1 font-normal text-gray-400">L</span>
          </span>
          <span className="text-[8px] text-gray-400 mt-1 uppercase">本周累计</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col items-center justify-center">
          <Zap className="text-yellow-400 w-5 h-5 mb-2" />
          <span className="text-lg font-bold text-gray-800">
            {avgLiters}
            <span className="text-[10px] ml-1 font-normal text-gray-400">L</span>
          </span>
          <span className="text-[8px] text-gray-400 mt-1 uppercase">日均摄入</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800">饮水构成</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
            {selectedDate === getLocalISODate(new Date()) ? '今日' : new Date(selectedDate).getMonth() + 1 + '/' + new Date(selectedDate).getDate()}
          </span>
        </div>

        {fetchingDaily ? (
            <div className="h-32 flex items-center justify-center text-gray-300 text-xs">加载中...</div>
        ) : pieData.length > 0 ? (
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center text-gray-800">
                <span className="text-lg font-black">
                  {/* Health score is technically only computed for today in current API prop 'health', 
                      so for past days we might want to hide it or we'd need to fetch 'health' for that day too. 
                      For simplicity, I will only show it if selectedDate is today.
                  */}
                  {selectedDate === getLocalISODate(new Date()) ? healthScore : ''}
                  <span className="text-[10px] font-bold">{selectedDate === getLocalISODate(new Date()) ? '分' : ''}</span>
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-500">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyBlock text={loading ? '正在统计饮品分类...' : '暂无饮品分类数据'} />
        )}

        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
          {selectedDate === getLocalISODate(new Date()) ? (
             <>
               <div>最长间隔：{gaps ? `${gaps.longest_gap_minutes} 分钟` : '--'}</div>
               <div>健康评分：{health ? `${health.health_score} / 100` : '--'}</div>
             </>
          ) : (
            <div>点击柱状图查看具体时段分布</div>
          )}
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
};

