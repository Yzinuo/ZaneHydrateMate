import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import icon from '../img/icon.png';

export const SplashScreen: React.FC = () => {
    return (
        <motion.div 
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#051405] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="relative flex flex-col items-center justify-center">
                {/* Lamp/Tubelight Effect */}
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                        delay: 0.2, 
                        duration: 1,
                        type: "spring",
                        stiffness: 100,
                        damping: 20
                    }}
                    className="absolute -top-32"
                >
                    <div className="relative w-40 h-2 bg-[#008E6B] rounded-full shadow-[0_0_20px_rgba(0,142,107,0.5)]">
                        {/* Primary Glow */}
                        <motion.div 
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#46B065]/20 rounded-full blur-3xl" 
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        {/* Secondary Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#46B065]/30 rounded-full blur-2xl" />
                        {/* Core Light */}
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-10 bg-[#DCECB5]/40 rounded-full blur-xl" />
                    </div>
                </motion.div>

                {/* Icon Container */}
                <motion.div
                    className="relative z-10 p-8"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <motion.img 
                        src={icon} 
                        alt="HydrateMate Logo" 
                        className="w-32 h-32 object-contain drop-shadow-[0_0_15px_rgba(0,142,107,0.3)]"
                        animate={{ 
                            y: [0, -5, 0],
                            filter: [
                                "drop-shadow(0 0 15px rgba(0,142,107,0.3))", 
                                "drop-shadow(0 0 25px rgba(0,142,107,0.6))", 
                                "drop-shadow(0 0 15px rgba(0,142,107,0.3))"
                            ]
                        }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity,
                            ease: "easeInOut" 
                        }}
                    />
                </motion.div>
            </div>
        </motion.div>
    );
};
