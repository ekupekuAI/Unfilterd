import { useMemo } from 'react';
<<<<<<< HEAD
=======
import { User } from 'lucide-react';
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6

interface AvatarProps {
  seed: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function Avatar({ seed, size = 'md', className = '' }: AvatarProps) {
  const hue = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
  }, [seed]);

  const bgColor = `hsl(${hue}, 50%, 30%)`;
  const textColor = `hsl(${hue}, 60%, 75%)`;
  const initial = seed.slice(0, 2).toUpperCase();

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-semibold shrink-0 ${className}`}
      style={{ backgroundColor: bgColor, color: textColor }}
      title={seed}
    >
      {initial}
    </div>
  );
}
<<<<<<< HEAD
=======

export function AnonymousAvatar({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return (
    <div className={`${sizeMap[size]} rounded-full bg-surface-50 flex items-center justify-center shrink-0 ${className}`}>
      <User className="text-primary-50 w-1/2 h-1/2" />
    </div>
  );
}
>>>>>>> 3b30a91baa8571129fde41509d79604630ce5df6
