import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface GradientAvatarProps {
  username?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  onClick?: () => void;
}

const gradients = [
  'from-blue-500 to-purple-600', 'from-pink-500 to-rose-600', 'from-green-500 to-emerald-600',
  'from-yellow-500 to-orange-600', 'from-indigo-500 to-violet-600', 'from-red-500 to-pink-600',
  'from-teal-500 to-cyan-600', 'from-purple-500 to-fuchsia-600', 'from-orange-500 to-red-600',
  'from-lime-500 to-green-600', 'from-sky-500 to-blue-600', 'from-rose-500 to-red-600',
  'from-emerald-500 to-teal-600', 'from-violet-500 to-indigo-600', 'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600', 'from-fuchsia-500 to-purple-600', 'from-gray-500 to-slate-600',
  'from-blue-400 to-indigo-500', 'from-pink-400 to-rose-500', 'from-green-400 to-emerald-500',
  'from-yellow-400 to-amber-500', 'from-indigo-400 to-violet-500', 'from-red-400 to-pink-500',
  'from-teal-400 to-cyan-500', 'from-purple-400 to-fuchsia-500',
];

export const GradientAvatar: React.FC<GradientAvatarProps> = ({ username, src, size = 'md', className, alt, onClick }) => {
  const firstLetter = username ? username.charAt(0).toUpperCase() : '';
  const gradientIndex = firstLetter ? firstLetter.charCodeAt(0) % gradients.length : 0;
  const selectedGradient = gradients[gradientIndex];

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false); // Reset error when src or username changes
  }, [src, username]);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full overflow-hidden flex-shrink-0",
        sizeClasses[size],
        className,
        onClick && "cursor-pointer hover:opacity-80 transition-opacity"
      )}
      onClick={onClick}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || `${username || 'User'} avatar`}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          `bg-gradient-to-br ${selectedGradient} text-white font-bold`
        )}>
          {firstLetter || <User className={cn("text-white", {
            'w-4 h-4': size === 'sm',
            'w-5 h-5': size === 'md',
            'w-6 h-6': size === 'lg',
            'w-8 h-8': size === 'xl',
          })} />}
        </div>
      )}
    </div>
  );
};