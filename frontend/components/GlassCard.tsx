
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
            className={`backdrop-blur-3xl backdrop-saturate-[1.8] bg-white/[0.16] border border-white/[0.24] shadow-[0_12px_40px_rgba(0,0,0,0.3)] rounded-3xl ${className}`}
        >
            {children}
        </div>
    );
};
