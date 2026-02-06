
import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", onClick }) => {
    return (
        <div 
            onClick={onClick}
            className={`backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg rounded-3xl ${className}`}
        >
            {children}
        </div>
    );
};
