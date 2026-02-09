
import React, { useState } from 'react';
import { ChevronLeft, Trash2, Plus, X, Droplet, Coffee, Wine, Milk, Beer, CupSoda } from 'lucide-react';
import { DrinkOption, DrinkCategory } from '../types';

interface DrinkSettingsProps {
    options: DrinkOption[];
    onUpdateOptions: (newOptions: DrinkOption[]) => void;
    onBack: () => void;
}

const AVAILABLE_ICONS = [
    { id: 'droplet', icon: <Droplet size={20} />, label: '水滴' },
    { id: 'coffee', icon: <Coffee size={20} />, label: '咖啡' },
    { id: 'wine', icon: <Wine size={20} />, label: '酒杯' },
    { id: 'milk', icon: <Milk size={20} />, label: '牛奶' },
    { id: 'beer', icon: <Beer size={20} />, label: '啤酒' },
    { id: 'soda', icon: <CupSoda size={20} />, label: '饮料' },
];

const AVAILABLE_COLORS = [
    { bg: 'bg-[#e0f7fa]', text: 'text-[#00bcd4]', label: '蓝青' },
    { bg: 'bg-blue-50', text: 'text-blue-400', label: '淡蓝' },
    { bg: 'bg-[#fff3e0]', text: 'text-[#ff9800]', label: '橙色' },
    { bg: 'bg-[#fce4ec]', text: 'text-[#e91e63]', label: '粉红' },
    { bg: 'bg-gray-100', text: 'text-gray-600', label: '灰色' },
    { bg: 'bg-green-50', text: 'text-green-500', label: '绿色' },
    { bg: 'bg-purple-50', text: 'text-purple-500', label: '紫色' },
];

export const DrinkSettings: React.FC<DrinkSettingsProps> = ({ options, onUpdateOptions, onBack }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newDrink, setNewDrink] = useState<Partial<DrinkOption>>({
        amount: 250,
        category: 'water',
        colorClass: 'bg-blue-50 text-blue-400',
        iconId: 'droplet' // Store string ID for serialization
    });

    const handleDelete = (id: string) => {
        onUpdateOptions(options.filter(o => o.id !== id));
    };

    const handleAdd = () => {
        if (!newDrink.label?.trim()) {
            alert('请设置名称');
            return;
        }
        if (!newDrink.amount) return;
        
        const drinkToAdd: DrinkOption = {
            id: Date.now().toString(),
            label: newDrink.label,
            amount: newDrink.amount,
            category: newDrink.category as DrinkCategory || 'water',
            iconId: newDrink.iconId || 'droplet',
            colorClass: newDrink.colorClass || 'bg-blue-50 text-blue-400',
            // icon property is derived from iconId during render in other components, 
            // but we need to store it consistent with our type definition if we want to avoid complex mapping everywhere.
            // For this refactor, we will assume the consuming component handles iconId mapping or we stick to a simpler model.
            // Let's stick to storing iconId in the type definition in types.ts
        };

        onUpdateOptions([...options, drinkToAdd]);
        setIsAdding(false);
        setNewDrink({ amount: 250, category: 'water', colorClass: 'bg-blue-50 text-blue-400', iconId: 'droplet' });
    };

    return (
        <div className="flex flex-col h-full bg-[#fbffff] text-gray-800">
             {/* Header */}
             <div className="p-6 pt-12 flex items-center justify-between bg-white shadow-sm z-10">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-gray-800">快捷饮品管理</h1>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* List Existing */}
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">当前选项</h2>
                    {options.map(option => (
                        <div key={option.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${option.colorClass}`}>
                                    {/* Map iconId back to component for display */}
                                    {AVAILABLE_ICONS.find(i => i.id === (option.iconId || 'droplet'))?.icon}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{option.label}</p>
                                    <p className="text-xs text-gray-400">{option.amount} ml</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDelete(option.id)}
                                className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add New Section */}
                {isAdding ? (
                    <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-green-100 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">添加新饮品</h3>
                            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Name & Amount */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 font-bold mb-1 block">名称</label>
                                    <input 
                                        type="text" 
                                        placeholder="例如: 运动饮料"
                                        className="w-full p-3 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 ring-green-500/20"
                                        value={newDrink.label || ''}
                                        onChange={e => setNewDrink({...newDrink, label: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold mb-1 block">容量 (ml)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 ring-green-500/20"
                                        value={newDrink.amount}
                                        onChange={e => setNewDrink({...newDrink, amount: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>

                            {/* Icons Grid */}
                            <div>
                                <label className="text-xs text-gray-400 font-bold mb-2 block">图标</label>
                                <div className="flex gap-2 flex-wrap">
                                    {AVAILABLE_ICONS.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setNewDrink({...newDrink, iconId: item.id})}
                                            className={`p-3 rounded-xl border transition-all ${
                                                newDrink.iconId === item.id 
                                                ? 'bg-green-500 text-white border-green-500 shadow-md' 
                                                : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                            }`}
                                        >
                                            {item.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                             {/* Colors Grid */}
                             <div>
                                <label className="text-xs text-gray-400 font-bold mb-2 block">颜色主题</label>
                                <div className="flex gap-2 flex-wrap">
                                    {AVAILABLE_COLORS.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setNewDrink({...newDrink, colorClass: `${item.bg} ${item.text}`})}
                                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                                                newDrink.colorClass === `${item.bg} ${item.text}`
                                                ? 'border-green-500 scale-110 shadow-sm' 
                                                : 'border-transparent'
                                            } ${item.bg}`}
                                        >
                                           <div className={`w-2 h-2 rounded-full ${item.text.replace('text-', 'bg-')}`}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleAdd}
                                className="w-full py-3 bg-[#0dc792] hover:bg-[#0bb585] text-white font-bold rounded-xl shadow-lg shadow-green-500/30 active:scale-95 transition-all mt-2"
                            >
                                确认添加
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold hover:border-green-400 hover:text-green-500 hover:bg-green-50/50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        添加自定义饮品
                    </button>
                )}

            </div>
        </div>
    );
};
