import type { Mood } from '../types';
import { MOOD_CONFIG } from '../types';

interface MoodBadgeProps {
  mood: Mood;
  size?: 'sm' | 'md';
}

export function MoodBadge({ mood, size = 'md' }: MoodBadgeProps) {
  const config = MOOD_CONFIG[mood];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`${config.bg} ${config.color} ${sizeClass} rounded-full font-medium inline-flex items-center`}>
      {config.label}
    </span>
  );
}
