import React, { useEffect, useState } from 'react';
import { ChevronLeft, Save, User, Activity, Ruler, Scale } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileProps {
  initial?: UserProfile;
  recommendedMl: number;
  currentGoalMl: number;
  loading?: boolean;
  saving?: boolean;
  errorMessage?: string | null;
  onSave: (profile: UserProfile, applyRecommend: boolean) => Promise<void> | void;
  onBack: () => void;
}

const getSafeProfile = (profile?: UserProfile): UserProfile => ({
  age: profile?.age ?? 25,
  weightKg: profile?.weightKg ?? 70,
  heightCm: profile?.heightCm ?? 170,
  activityLevel: profile?.activityLevel ?? 'moderate'
});

export const Profile: React.FC<ProfileProps> = ({
  initial,
  recommendedMl,
  currentGoalMl,
  loading = false,
  saving = false,
  errorMessage = null,
  onSave,
  onBack
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => getSafeProfile(initial));
  const [applyRecommend, setApplyRecommend] = useState(true);

  useEffect(() => {
    setProfile(getSafeProfile(initial));
  }, [initial]);

  const handleSubmit = async () => {
    await onSave(profile, applyRecommend);
  };

  return (
    <div className="flex flex-col h-full bg-[#fbffff] text-gray-800 p-6 gap-6 overflow-y-auto scrollbar-hide">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">个人档案</h1>
        <div className="w-10" />
      </header>

      {errorMessage ? (
        <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl px-3 py-2 text-xs">{errorMessage}</div>
      ) : null}

      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-[#0dc792]" />
          </div>
          <div>
            <h2 className="text-gray-800 font-bold">身体数据</h2>
            <p className="text-gray-400 text-xs">用于计算推荐饮水目标</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              <User className="w-3 h-3" />
              年龄
            </label>
            <input
              type="number"
              value={profile.age}
              onChange={(event) => setProfile({ ...profile, age: Math.max(1, Number(event.target.value) || 1) })}
              className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-green-200 rounded-xl p-3 text-gray-800 text-lg font-bold outline-none transition-all"
              min="1"
              max="120"
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              <Scale className="w-3 h-3" />
              体重 (kg)
            </label>
            <input
              type="number"
              value={profile.weightKg}
              onChange={(event) => setProfile({ ...profile, weightKg: Math.max(1, Number(event.target.value) || 1) })}
              className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-green-200 rounded-xl p-3 text-gray-800 text-lg font-bold outline-none transition-all"
              min="1"
              max="300"
              disabled={loading || saving}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
            <Ruler className="w-3 h-3" />
            身高 (cm)
          </label>
          <input
            type="number"
            value={profile.heightCm}
            onChange={(event) => setProfile({ ...profile, heightCm: Math.max(1, Number(event.target.value) || 1) })}
            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-green-200 rounded-xl p-3 text-gray-800 text-lg font-bold outline-none transition-all"
            min="1"
            max="250"
            disabled={loading || saving}
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
            <Activity className="w-3 h-3" />
            活动强度
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'sedentary', label: '久坐' },
              { value: 'moderate', label: '适中' },
              { value: 'active', label: '活跃' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setProfile({ ...profile, activityLevel: option.value as UserProfile['activityLevel'] })}
                className={`p-3 rounded-xl border transition-all text-left ${
                  profile.activityLevel === option.value
                    ? 'bg-green-50 border-[#6fc172] text-[#0dc792]'
                    : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                }`}
                disabled={loading || saving}
              >
                <div className="text-sm font-bold">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 text-center">
        <p className="text-xs text-gray-400 mb-2">推荐饮水量</p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-4xl font-black text-[#0dc792]">{recommendedMl.toLocaleString()}</span>
          <span className="text-lg text-gray-400">ml</span>
        </div>
        <p className="text-[10px] text-gray-300 mt-3">当前目标：{currentGoalMl.toLocaleString()} ml</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={applyRecommend}
          onChange={(event) => setApplyRecommend(event.target.checked)}
          disabled={loading || saving}
        />
        保存时同步应用推荐目标
      </label>

      <button
        onClick={handleSubmit}
        disabled={loading || saving}
        className="w-full py-4 bg-[#0dc792] hover:bg-[#0bb585] rounded-2xl flex items-center justify-center gap-2 text-white font-bold shadow-lg shadow-green-500/30 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Save className="w-5 h-5" />
        {saving ? '保存中...' : '保存资料'}
      </button>

      <div className="h-4" />
    </div>
  );
};