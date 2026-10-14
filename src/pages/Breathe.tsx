import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Pause, Play, Vibrate, LifeBuoy } from 'lucide-react';

type Step = { label: 'Breathe in' | 'Hold' | 'Breathe out'; seconds: number };
type Pattern = { id: string; name: string; hint: string; steps: Step[] };

const PATTERNS: Pattern[] = [
  { id: 'calm', name: 'Calm', hint: 'Longer out-breath. Slows a racing heart.', steps: [{ label: 'Breathe in', seconds: 4 }, { label: 'Breathe out', seconds: 6 }] },
  { id: 'box', name: 'Box', hint: 'Steady and even. Good before something hard.', steps: [{ label: 'Breathe in', seconds: 4 }, { label: 'Hold', seconds: 4 }, { label: 'Breathe out', seconds: 4 }, { label: 'Hold', seconds: 4 }] },
  { id: '478', name: '4-7-8', hint: 'Deep and slow. Helps when you can\'t sleep.', steps: [{ label: 'Breathe in', seconds: 4 }, { label: 'Hold', seconds: 7 }, { label: 'Breathe out', seconds: 8 }] },
];

const SESSION_OPTIONS = [1, 3, 5];

export function BreathePage() {
  const [patternId, setPatternId] = useState('calm');
  const [minutes, setMinutes] = useState(3);
  const [running, setRunning] = useState(false);
  const [{ stepIndex, remaining }, setCycle] = useState({ stepIndex: 0, remaining: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [haptics, setHaptics] = useState(true);
  const tickRef = useRef<number | null>(null);

  const pattern = useMemo(() => PATTERNS.find(p => p.id === patternId) ?? PATTERNS[0], [patternId]);
  const step = pattern.steps[stepIndex];
  const total = minutes * 60;
  const finished = elapsed >= total;

  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      setElapsed(e => e + 1);
      setCycle(prev => {
        if (prev.remaining > 1) return { ...prev, remaining: prev.remaining - 1 };
        const next = (prev.stepIndex + 1) % pattern.steps.length;
        return { stepIndex: next, remaining: pattern.steps[next].seconds };
      });
    }, 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [running, pattern]);

  // a short buzz at every change of step (phones that support it)
  useEffect(() => {
    if (running && haptics && 'vibrate' in navigator) navigator.vibrate?.(25);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  useEffect(() => {
    if (finished && running) setRunning(false);
  }, [finished, running]);

  const start = () => {
    if (finished || elapsed === 0) {
      setElapsed(0);
      setCycle({ stepIndex: 0, remaining: pattern.steps[0].seconds });
    }
    setRunning(true);
  };

  const choosePattern = (id: string) => {
    setRunning(false);
    setPatternId(id);
    setElapsed(0);
    setCycle({ stepIndex: 0, remaining: 0 });
  };

  const scale = !running && elapsed === 0 ? 0.8 : step.label === 'Breathe in' ? 1.15 : step.label === 'Breathe out' ? 0.7 : undefined;
  const mins = Math.floor((total - elapsed) / 60);
  const secs = (total - elapsed) % 60;

  return (
    <div className="min-h-screen bg-ink relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(600px_400px_at_50%_35%,rgba(157,124,255,0.18),transparent_70%)]" />
      <div className="relative max-w-xl mx-auto px-5 pt-6 pb-28 flex flex-col items-center">
        <div className="w-full flex items-center justify-between">
          <Link to="/" className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link to="/help" className="text-xs text-secondary-50 hover:text-white flex items-center gap-1.5">
            <LifeBuoy className="w-4 h-4" /> Need to talk to someone now?
          </Link>
        </div>

        <h1 className="font-display text-4xl text-white mt-6">Breathe with me</h1>
        <p className="text-sm text-gray-400 mt-2 text-center">{pattern.hint}</p>

        <div className="flex gap-2 mt-6 p-1 rounded-full bg-white/5 border border-white/10">
          {PATTERNS.map(p => (
            <button
              key={p.id}
              onClick={() => choosePattern(p.id)}
              className={`relative px-4 py-1.5 rounded-full text-sm transition-colors ${p.id === patternId ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {p.id === patternId && (
                <motion.span layoutId="pattern-pill" className="absolute inset-0 rounded-full bg-primary/30 border border-primary/40" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{p.name}</span>
            </button>
          ))}
        </div>

        <div className="relative w-72 h-72 sm:w-80 sm:h-80 mt-10 flex items-center justify-center" aria-live="polite">
          <motion.div
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_38%_32%,rgba(217,204,255,0.85)_0%,rgba(157,124,255,0.5)_32%,rgba(106,71,224,0.22)_58%,transparent_70%)] blur-[1px]"
            animate={{ scale: scale ?? undefined }}
            transition={{ duration: running ? step.seconds : 0.8, ease: 'easeInOut' }}
            style={{ boxShadow: '0 0 120px 30px rgba(157,124,255,0.25)' }}
          />
          <motion.div
            className="absolute inset-6 rounded-full border border-white/10"
            animate={{ rotate: running ? 360 : 0 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />
          <div className="relative text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={running ? `${stepIndex}-${step.label}` : finished ? 'done' : 'idle'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="font-display text-3xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]"
              >
                {finished ? 'Well done' : running || elapsed > 0 ? step.label : 'Ready'}
              </motion.p>
            </AnimatePresence>
            {running && <p className="text-5xl font-light text-white/90 mt-2 tabular-nums">{remaining}</p>}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-5 w-full">
          <div className="flex items-center gap-2">
            {SESSION_OPTIONS.map(m => (
              <button
                key={m}
                onClick={() => { setMinutes(m); setElapsed(0); setRunning(false); }}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${minutes === m ? 'border-primary/60 text-white bg-primary/15' : 'border-white/10 text-gray-400 hover:text-white'}`}
              >
                {m} min
              </button>
            ))}
            <button
              onClick={() => setHaptics(h => !h)}
              aria-pressed={haptics}
              title="Vibrate on each change (phones)"
              className={`p-1.5 rounded-full border ${haptics ? 'border-secondary/50 text-secondary' : 'border-white/10 text-gray-500'}`}
            >
              <Vibrate className="w-3.5 h-3.5" />
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => (running ? setRunning(false) : start())}
            className="w-44 py-3.5 rounded-full bg-white text-ink font-semibold flex items-center justify-center gap-2 shadow-[0_10px_40px_-10px_rgba(157,124,255,0.7)]"
          >
            {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> {finished ? 'Again' : elapsed > 0 ? 'Resume' : 'Begin'}</>}
          </motion.button>

          <p className="text-xs text-gray-500 tabular-nums">
            {finished ? 'Notice how you feel now. You can come back anytime.' : `${mins}:${String(secs).padStart(2, '0')} left`}
          </p>
        </div>
      </div>
    </div>
  );
}
