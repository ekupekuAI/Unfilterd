import { useState, type ReactNode } from 'react';
import { EyeOff } from 'lucide-react';

/** Blurs a high-risk post for other readers until they choose to view it. */
export function SensitiveCover({ active, children }: { active: boolean; children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  if (!active || revealed) return <>{children}</>;
  return (
    <div className="relative">
      <div aria-hidden="true" className="select-none blur-md pointer-events-none">{children}</div>
      <button
        type="button"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setRevealed(true); }}
        className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-[#07060F]/70 text-sm text-gray-200 hover:text-white"
      >
        <EyeOff className="w-4 h-4" /> Sensitive — tap to view
      </button>
    </div>
  );
}
