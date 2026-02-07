
import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { UserProfile } from '../types';
import { ChevronLeft, Save, User, Activity, Ruler, Scale } from 'lucide-react';

interface ProfileProps {
    initial?: UserProfile;
    onSave: (profile: UserProfile, recommendedGoal: number) => void;
    onBack: () => void;
}

// 计算推荐饮水量
const calcRecommendedGoal = (profile: UserProfile): number => {
    let base = profile.weightKg * 30;

    // 年龄调整
    if (profile.age < 14) {
        base = profile.weightKg * 40;
    } else if (profile.age >= 65) {
        base = profile.weightKg * 28;
    }

    // 活动强度调整
    if (profile.activityLevel === 'active') {
        base += 500;
    } else if (profile.activityLevel === 'sedentary') {
        base -= 200;
    }

    // Clamp 1200-4000
    base = Math.max(1200, Math.min(4000, base));

    // 取整到 50ml
    return Math.round(base / 50) * 50;
};

export const Profile: React.FC<ProfileProps> = ({ initial, onSave, onBack }) => {
    const [profile, setProfile] = useState<UserProfile>(initial || {
        age: 25,
        weightKg: 70,
        heightCm: 170,
        activityLevel: 'moderate'
    });

    const recommendedGoal = calcRecommendedGoal(profile);

    const handleSubmit = () => {
        onSave(profile, recommendedGoal);
    };

    return (
        <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto scrollbar-hide">
            {/* Header */}
            <header className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="p-2 backdrop-blur-xl bg-white/10 rounded-full text-white"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-white">个人档案</h1>
                <div className="w-10"></div>
            </header>

            {/* Profile Form */}
            <GlassCard className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold">身体数据</h2>
                        <p className="text-white/60 text-xs">用于计算每日推荐饮水量</p>
                    </div>
                </div>

                {/* Age & Weight Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] text-green-200 uppercase font-bold tracking-wider">
                            <User className="w-3 h-3" />
                            年龄
                        </label>
                        <input
                            type="number"
                            value={profile.age}
                            onChange={e => setProfile({ ...profile, age: Math.max(1, +e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-lg font-bold outline-none focus:border-green-500 transition-colors"
                            min="1"
                            max="120"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] text-green-200 uppercase font-bold tracking-wider">
                            <Scale className="w-3 h-3" />
                            体重 (kg)
                        </label>
                        <input
                            type="number"
                            value={profile.weightKg}
                            onChange={e => setProfile({ ...profile, weightKg: Math.max(1, +e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-lg font-bold outline-none focus:border-green-500 transition-colors"
                            min="1"
                            max="300"
                        />
                    </div>
                </div>

                {/* Height */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] text-green-200 uppercase font-bold tracking-wider">
                        <Ruler className="w-3 h-3" />
                        身高 (cm)
                    </label>
                    <input
                        type="number"
                        value={profile.heightCm}
                        onChange={e => setProfile({ ...profile, heightCm: Math.max(1, +e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-lg font-bold outline-none focus:border-green-500 transition-colors"
                        min="1"
                        max="250"
                    />
                </div>

                {/* Activity Level */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] text-green-200 uppercase font-bold tracking-wider">
                        <Activity className="w-3 h-3" />
                        活动强度
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { value: 'sedentary', label: '久坐', desc: '办公室工作' },
                            { value: 'moderate', label: '适度', desc: '偶尔运动' },
                            { value: 'active', label: '活跃', desc: '经常运动' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setProfile({ ...profile, activityLevel: option.value as any })}
                                className={`p-3 rounded-xl border transition-all ${
                                    profile.activityLevel === option.value
                                        ? 'bg-green-500/20 border-green-500 text-green-400'
                                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                                }`}
                            >
                                <div className="text-sm font-bold">{option.label}</div>
                                <div className="text-[10px] opacity-60">{option.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* Recommended Goal Card */}
            <GlassCard className="p-6 text-center">
                <p className="text-xs text-white/60 mb-2">根据您的身体数据，推荐每日饮水量为</p>
                <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-black text-green-400">{recommendedGoal.toLocaleString()}</span>
                    <span className="text-lg text-white/60">ml</span>
                </div>
                <p className="text-[10px] text-white/40 mt-3">
                    基于体重 × 30ml 公式，结合年龄与活动强度调整
                </p>
            </GlassCard>

            {/* Save Button */}
            <button
                onClick={handleSubmit}
                className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-2xl flex items-center justify-center gap-2 text-white font-bold shadow-[0_8px_20px_rgba(34,197,94,0.4)] active:scale-95 transition-all"
            >
                <Save className="w-5 h-5" />
                保存并应用推荐目标
            </button>

            <div className="h-4"></div>
        </div>
    );
};
