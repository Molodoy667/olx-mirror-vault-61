import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 3000 }: SplashScreenProps) {
  const [showSlogan, setShowSlogan] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Показываем слоган через 800мс
    const sloganTimer = setTimeout(() => {
      setShowSlogan(true);
    }, 800);

    // Анимация прогресса
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, duration / 50);

    // Завершение splash screen
    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(sloganTimer);
      clearTimeout(completeTimer);
      clearInterval(progressInterval);
    };
  }, [onComplete, duration]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 overflow-hidden"
      >
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating circles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center space-y-8">
          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              delay: 0.2 
            }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl scale-110" />
            
            {/* Logo container */}
            <div className="relative w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 flex items-center justify-center shadow-2xl">
              <motion.div
                animate={{ 
                  textShadow: [
                    "0 0 10px rgba(255,255,255,0.5)",
                    "0 0 20px rgba(255,255,255,0.8)",
                    "0 0 10px rgba(255,255,255,0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl font-bold text-white"
              >
                N
              </motion.div>
            </div>
          </motion.div>

          {/* Brand Name */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-wide">
              {'NOVADO'.split('').map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.8 + index * 0.1,
                    duration: 0.5 
                  }}
                  className="inline-block"
                >
                  {letter}
                </motion.span>
              ))}
            </h1>
            
            {/* Ukrainian accent */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className="h-1 bg-gradient-to-r from-blue-300 to-yellow-300 rounded-full mx-auto"
            />
          </motion.div>

          {/* Slogan */}
          <AnimatePresence>
            {showSlogan && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.6 }}
                className="text-center px-6"
              >
                <p className="text-lg md:text-xl text-white/90 font-medium leading-relaxed">
                  Безліч оголошень чекають на тебе
                </p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-sm text-white/70"
                >
                  Український маркетплейс №1
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-16 left-8 right-8"
        >
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-white to-blue-200 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-center text-white/60 text-sm mt-3"
          >
            Завантаження...
          </motion.p>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-white/40 rounded-full animate-pulse" />
        <div className="absolute top-20 right-16 w-1 h-1 bg-white/60 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-32 left-20 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse delay-500" />
        <div className="absolute bottom-40 right-12 w-1 h-1 bg-white/50 rounded-full animate-pulse delay-700" />
      </motion.div>
    </AnimatePresence>
  );
}