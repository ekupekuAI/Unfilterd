import { useEffect, useMemo, useState } from 'react';
import { getStartupAnimationMode, getStartupSoundEnabled, STARTUP_INSTALL_KEY, type StartupAnimationMode } from '../settings/startupAnimation';

type StartupPhase = 'idle' | 'dark' | 'atmosphere' | 'glow' | 'logo' | 'pulse' | 'dissolve' | 'feed' | 'ready' | 'skip';

type StartupState = {
  active: boolean;
  phase: StartupPhase;
  mode: StartupAnimationMode;
  reducedMotion: boolean;
  soundEnabled: boolean;
};

const FULL_DURATION = 3350;
const SHORT_DURATION = 950;

function playStartupSound() {
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(196, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.25);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 1.3);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    // No-op: browsers may block autoplay or not expose Web Audio.
  }
}

export function useStartupAnimation() {
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const [state, setState] = useState<StartupState>(() => ({
    active: false,
    phase: 'idle',
    mode: 'short',
    reducedMotion,
    soundEnabled: false,
  }));

  useEffect(() => {
    if (reducedMotion) {
      setState(prev => ({ ...prev, active: false, phase: 'skip', mode: 'disabled', soundEnabled: false }));
      return;
    }

    const persistedMode = getStartupAnimationMode();
    const firstInstall = localStorage.getItem(STARTUP_INSTALL_KEY) !== '1';
    const mode = firstInstall ? 'full' : persistedMode;
    const shouldShow = mode !== 'disabled';

    if (!shouldShow) {
      setState(prev => ({ ...prev, active: false, phase: 'ready', mode, soundEnabled: getStartupSoundEnabled() }));
      return;
    }

    localStorage.setItem(STARTUP_INSTALL_KEY, '1');
    setState({
      active: true,
      phase: 'dark',
      mode,
      reducedMotion,
      soundEnabled: getStartupSoundEnabled(),
    });

    if (getStartupSoundEnabled()) {
      playStartupSound();
    }

    const timings = mode === 'full'
      ? [450, 900, 1450, 1950, 2350, 2850, FULL_DURATION]
      : [200, 360, 520, 660, 760, 860, SHORT_DURATION];

    const phases: StartupPhase[] = ['atmosphere', 'glow', 'logo', 'pulse', 'dissolve', 'feed', 'ready'];
    const timers = timings.map((ms, index) => window.setTimeout(() => {
      setState(prev => ({
        ...prev,
        phase: phases[index] ?? 'ready',
      }));
    }, ms));

    const finish = window.setTimeout(() => {
      setState(prev => ({ ...prev, active: false, phase: 'ready' }));
    }, mode === 'full' ? FULL_DURATION + 150 : SHORT_DURATION + 100);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
  }, [reducedMotion]);

  return state;
}
