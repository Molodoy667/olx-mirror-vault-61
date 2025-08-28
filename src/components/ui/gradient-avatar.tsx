import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface GradientAvatarProps {
  src?: string | null;
  alt?: string;
  username?: string | null;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl'
};

// Генеруємо красивий градієнт на основі першої літери
const getGradientByLetter = (letter: string): string => {
  const gradients = [
    'bg-gradient-to-br from-blue-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-rose-600',
    'bg-gradient-to-br from-green-500 to-emerald-600',
    'bg-gradient-to-br from-yellow-500 to-orange-600',
    'bg-gradient-to-br from-purple-500 to-indigo-600',
    'bg-gradient-to-br from-cyan-500 to-blue-600',
    'bg-gradient-to-br from-red-500 to-pink-600',
    'bg-gradient-to-br from-emerald-500 to-teal-600',
    'bg-gradient-to-br from-orange-500 to-red-600',
    'bg-gradient-to-br from-indigo-500 to-purple-600',
    'bg-gradient-to-br from-teal-500 to-cyan-600',
    'bg-gradient-to-br from-rose-500 to-pink-600',
    'bg-gradient-to-br from-lime-500 to-green-600',
    'bg-gradient-to-br from-amber-500 to-yellow-600',
    'bg-gradient-to-br from-violet-500 to-purple-600',
    'bg-gradient-to-br from-sky-500 to-blue-600',
    'bg-gradient-to-br from-fuchsia-500 to-pink-600',
    'bg-gradient-to-br from-slate-500 to-gray-600',
    'bg-gradient-to-br from-zinc-500 to-slate-600',
    'bg-gradient-to-br from-stone-500 to-zinc-600',
    'bg-gradient-to-br from-neutral-500 to-gray-600',
    'bg-gradient-to-br from-gray-500 to-slate-600',
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-green-400 to-green-600',
    'bg-gradient-to-br from-red-400 to-red-600'
  ];

  const charCode = letter.toUpperCase().charCodeAt(0);
  const index = charCode % gradients.length;
  return gradients[index];
};

export function GradientAvatar({
  src,
  alt,
  username,
  fallbackText,
  size = 'md',
  className,
  onClick
}: GradientAvatarProps) {
  // Визначаємо текст для відображення (перша літера username або fallbackText)
  const displayText = username 
    ? username.charAt(0).toUpperCase() 
    : fallbackText?.charAt(0).toUpperCase() || 'U';

  const gradientClass = getGradientByLetter(displayText);

  return (
    <Avatar 
      className={cn(sizeClasses[size], className, onClick && 'cursor-pointer hover:opacity-80 transition-opacity')}
      onClick={onClick}
    >
      <AvatarImage src={src || undefined} alt={alt} />
      <AvatarFallback 
        className={cn(
          gradientClass,
          'text-white font-semibold border-0 shadow-lg',
          textSizeClasses[size]
        )}
      >
        {displayText}
      </AvatarFallback>
    </Avatar>
  );
}