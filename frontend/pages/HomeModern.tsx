import React, { useEffect, useRef, useState } from 'react';
import { Bell, Droplet, Plus, Coffee, Wine, Milk, Settings, Target } from 'lucide-react';
import { IMAGES } from '../constants';
import { UserState, DrinkOption } from '../types';

const PLANT_STAGES = [
  { img: '/img/1阶段.png', label: '萌芽阶段 · 种子', threshold: 0 },
  { img: '/img/2阶段.png', label: '发芽阶段 · 新芽', threshold: 20 },
  { img: '/img/3阶段.png', label: '生长阶段 · 幼苗', threshold: 50 },
  { img: '/img/4阶段.png', label: '成熟阶段 · 成树', threshold: 80 }
];

interface HomeProps {
  user: UserState;
  drinkOptions: DrinkOption[];
  onAddWater: (amount: number, category?: string) => Promise<void> | void;
  onOpenSettings: () => void;
  onOpenGoalSettings?: () => void;
  adding?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
}

interface QuickDrinkBtnProps {
  icon: React.ReactNode;
  label: string;
  amount: number;
  colorClass: string;
  disabled: boolean;
  onClick: () => void;
}

const getStageIndex = (progress: number): number => {
  for (let i = PLANT_STAGES.length - 1; i >= 0; i -= 1) {
    if (progress >= PLANT_STAGES[i].threshold) {
      return i;
    }
  }
  return 0;
};

const QuickDrinkBtn: React.FC<QuickDrinkBtnProps> = ({ icon, label, amount, colorClass, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] active:scale-95 transition-all border border-transparent hover:border-gray-100 min-w-[80px] disabled:opacity-60 disabled:cursor-not-allowed"
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${colorClass}`}>{icon}</div>
    <span className="text-xs font-bold text-gray-700">{label}</span>
    <span className="text-[10px] text-gray-400">{amount}ml</span>
  </button>
);

const iconMap: Record<string, React.ReactNode> = {
  droplet: <Droplet size={18} fill="currentColor" />,
  coffee: <Coffee size={18} />,
  wine: <Wine size={18} />,
  milk: <Milk size={18} />,
  beer: <Wine size={18} />,
  soda: <Wine size={18} />
};

export const HomeModern: React.FC<HomeProps> = ({
  user,
  drinkOptions,
  onAddWater,
  onOpenSettings,
  onOpenGoalSettings,
  adding = false,
  loading = false,
  errorMessage = null
}) => {
  const safeDailyGoal = user.dailyGoal > 0 ? user.dailyGoal : 2000;
  const safeCurrentIntake = Math.max(0, user.currentIntake);
  const progress = Math.min(100, (safeCurrentIntake / safeDailyGoal) * 100);
  const targetStageIndex = getStageIndex(progress);

  const [currentStageIndex, setCurrentStageIndex] = useState<number>(() => getStageIndex(progress));
  const [isTransitioning, setIsTransitioning] = useState(false);

  const stageSwitchTimerRef = useRef<number | null>(null);
  const transitionEndTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetStageIndex === currentStageIndex || isTransitioning) {
      return;
    }

    setIsTransitioning(true);

    if (stageSwitchTimerRef.current !== null) {
      window.clearTimeout(stageSwitchTimerRef.current);
    }

    stageSwitchTimerRef.current = window.setTimeout(() => {
      setCurrentStageIndex(targetStageIndex);

      if (transitionEndTimerRef.current !== null) {
        window.clearTimeout(transitionEndTimerRef.current);
      }

      transitionEndTimerRef.current = window.setTimeout(() => {
        setIsTransitioning(false);
      }, 600);
    }, 300);
  }, [targetStageIndex, currentStageIndex, isTransitioning]);

  useEffect(
    () => () => {
      if (stageSwitchTimerRef.current !== null) {
        window.clearTimeout(stageSwitchTimerRef.current);
      }
      if (transitionEndTimerRef.current !== null) {
        window.clearTimeout(transitionEndTimerRef.current);
      }
    },
    []
  );

  const growthStage = PLANT_STAGES[currentStageIndex].label;

  return (
    <div className="flex flex-col min-h-full bg-[#fbffff] text-gray-800">
      <div className="px-6 pt-4 pb-12 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-800">喝了么 by Zane</h1>
          <p className="text-xs text-gray-400">坚持喝水，见证成长</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
            <img src="/img/icon.png" className="w-full h-full object-cover" alt="Profile" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative -mt-6">
        <div className="mb-8 flex flex-col items-center z-10">
          <span className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">今日目标</span>
          <div className="text-4xl font-black text-gray-800 flex items-baseline">
            {safeCurrentIntake}
            <span className="text-lg font-bold text-gray-400 ml-1">/ {safeDailyGoal}</span>
            <span className="text-xs font-normal text-gray-400 ml-1">ml</span>
          </div>
        </div>

        <div className="relative w-[75vw] h-[75vw] max-w-[320px] max-h-[320px] flex items-center justify-center z-0">
          <div
            className={`absolute inset-0 bg-[#6fc172] rounded-full filter blur-[60px] opacity-10 transition-all duration-1000 ${
              isTransitioning ? 'scale-110 opacity-20' : 'scale-100'
            }`}
          />

          <div className="relative w-full h-full flex items-center justify-center">
            {PLANT_STAGES.map((stage, index) => (
              <img
                key={stage.img}
                src={stage.img}
                className={`absolute max-h-[90%] object-contain drop-shadow-xl transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-[transform,opacity] ${
                  index === currentStageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
                alt={stage.label}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 px-4 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white shadow-sm text-xs font-semibold text-[#0dc792]">
          {growthStage}
        </div>
      </div>

      <div className="relative z-10 w-full bg-transparent pb-8 px-6 flex flex-col gap-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-400 italic">“每一滴水，都是成长的生命力。”</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">连续达标</p>
              <p className="text-xl font-bold text-gray-800">
                {user.streak} <span className="text-xs font-normal">天</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">完成率</p>
              <p className="text-xl font-bold text-gray-800">
                {Math.round(progress)} <span className="text-xs font-normal">%</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
              <Droplet size={16} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <span className="text-sm font-bold text-gray-700">快速打卡</span>
            <button
              onClick={onOpenSettings}
              className="text-xs text-[#0dc792] flex items-center gap-1 hover:bg-[#0dc792]/10 px-2 py-1 rounded-full transition-colors"
            >
              管理 <Settings size={12} />
            </button>
          </div>

          {errorMessage ? (
            <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{errorMessage}</div>
          ) : null}

          {loading ? (
            <div className="text-xs text-gray-400 bg-white rounded-xl px-3 py-2 border border-gray-100">正在同步今日饮水数据...</div>
          ) : null}

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            {drinkOptions.map((option) => (
              <QuickDrinkBtn
                key={option.id}
                icon={iconMap[option.iconId || 'droplet'] || <Droplet size={18} />}
                label={option.label}
                amount={option.amount}
                colorClass={option.colorClass || 'bg-blue-50 text-blue-400'}
                disabled={adding || loading}
                onClick={() => onAddWater(option.amount, option.category)}
              />
            ))}

            <button
              onClick={onOpenSettings}
              className="flex flex-col items-center justify-center bg-gray-50 p-3 rounded-2xl border border-dashed border-gray-300 min-w-[80px]"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-white text-gray-400">
                <Plus size={20} />
              </div>
              <span className="text-xs font-medium text-gray-400">自定义</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};