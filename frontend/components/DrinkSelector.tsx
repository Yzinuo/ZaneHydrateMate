
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { X, Droplet, Coffee, Milk, Wine, Plus, Minus } from 'lucide-react';

interface DrinkOption {
    id: string;
    label: string;
    amount: number;
    category: string;
    icon: React.ReactNode;
    color: string;
}

const DRINK_OPTIONS: DrinkOption[] = [
    { id: 'sip', label: '一小口', amount: 30, category: 'water', icon: <Droplet className="w-5 h-5" />, color: 'bg-blue-500/20 text-blue-400' },
  { id: 'small', label: '小杯水', amount: 50, category: 'water', icon: <Droplet className="w-5 h-5" />, color: 'bg-blue-500/20 text-blue-400' },
    { id: 'cup', label: '一杯水', amount: 250, category: 'water', icon: <Droplet className="w-5 h-5" />, color: 'bg-blue-500/20 text-blue-400' },
    { id: 'bottle', label: '一瓶水', amount: 500, category: 'water', icon: <Droplet className="w-5 h-5" />, color: 'bg-blue-500/20 text-blue-400' },
    { id: 'tea', label: '咖啡', amount: 150, category: 'tea', icon: <Coffee className="w-5 h-5" />, color: 'bg-amber-500/20 text-amber-400' },
    { id: 'juice', label: '果汁饮料', amount: 300, category: 'juice', icon: <Wine className="w-5 h-5" />, color: 'bg-orange-500/20 text-orange-400' },
    { id: 'milk', label: '牛奶豆浆', amount: 200, category: 'milk', icon: <Milk className="w-5 h-5" />, color: 'bg-white/20 text-white' },
];

interface DrinkSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (amount: number, category: string) => void;
}

export const DrinkSelector: React.FC<DrinkSelectorProps> = ({ isOpen, onClose, onSelect }) => {
    const [customAmount, setCustomAmount] = useState(250);
    const [showCustom, setShowCustom] = useState(false);

    const handleSelect = (option: DrinkOption) => {
        onSelect(option.amount, option.category);
        onClose();
    };

    const handleCustomSubmit = () => {
        if (customAmount > 0) {
            onSelect(customAmount, 'water');
            onClose();
            setShowCustom(false);
            setCustomAmount(250);
        }
    };

    const adjustCustomAmount = (delta: number) => {
        setCustomAmount(prev => Math.max(10, Math.min(2000, prev + delta)));
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Bottom Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-slide-up">
                <GlassCard className="rounded-b-none p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">记录饮水</h2>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {!showCustom ? (
                        <>
                            {/* Quick Options */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {DRINK_OPTIONS.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleSelect(option)}
                                        className="flex flex-col items-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 active:scale-95 transition-all"
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${option.color}`}>
                                            {option.icon}
                                        </div>
                                        <span className="text-white text-xs font-medium">{option.label}</span>
                                        <span className="text-white/50 text-[10px]">{option.amount}ml</span>
                                    </button>
                                ))}
                            </div>

                            {/* Custom Button */}
                            <button
                                onClick={() => setShowCustom(true)}
                                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white/70 font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                自定义容量
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Custom Input */}
                            <div className="flex flex-col items-center py-6">
                                <p className="text-white/60 text-sm mb-4">输入饮水量</p>

                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => adjustCustomAmount(-50)}
                                        className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>

                                    <div className="text-center">
                                        <input
                                            type="number"
                                            value={customAmount}
                                            onChange={e => setCustomAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-24 text-4xl font-black text-white bg-transparent text-center outline-none"
                                        />
                                        <span className="text-white/60 text-sm">ml</span>
                                    </div>

                                    <button
                                        onClick={() => adjustCustomAmount(50)}
                                        className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Quick Adjust Buttons */}
                                <div className="flex gap-2 mt-6">
                                    {[100, 250, 500].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setCustomAmount(val)}
                                            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                                                customAmount === val
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                            }`}
                                        >
                                            {val}ml
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCustom(false)}
                                    className="flex-1 py-4 bg-white/10 rounded-2xl text-white font-medium"
                                >
                                    返回
                                </button>
                                <button
                                    onClick={handleCustomSubmit}
                                    className="flex-1 py-4 bg-green-500 rounded-2xl text-white font-bold shadow-[0_8px_20px_rgba(34,197,94,0.4)] active:scale-95 transition-transform"
                                >
                                    确认
                                </button>
                            </div>
                        </>
                    )}

                    {/* Bottom Safe Area */}
                    <div className="h-6" />
                </GlassCard>
            </div>

            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </>
    );
};
