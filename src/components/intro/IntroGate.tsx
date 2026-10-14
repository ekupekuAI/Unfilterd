import { lazy, Suspense, useState } from 'react';
import { getStartupAnimationMode, STARTUP_INSTALL_KEY } from '../../settings/startupAnimation';
import type { IntroMode } from './CinematicIntro';

const CinematicIntro = lazy(() => import('./CinematicIntro').then(m => ({ default: m.CinematicIntro })));

const SESSION_KEY = 'unfilterd:intro-played';

function readStorage(store: Storage, key: string) {
  try { return store.getItem(key); } catch { return null; }
}

function writeStorage(store: Storage, key: string, value: string) {
  try { store.setItem(key, value); } catch { /* private mode: the intro may replay */ }
}

/** Decides whether the opening plays: once per visit, full the first time ever. */
function pickMode(): IntroMode | null {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  if (readStorage(sessionStorage, SESSION_KEY)) return null;
  const setting = getStartupAnimationMode();
  if (setting === 'disabled') return null;
  const firstEver = readStorage(localStorage, STARTUP_INSTALL_KEY) !== '1';
  return firstEver ? 'full' : setting;
}

export function IntroGate() {
  const [mode, setMode] = useState<IntroMode | null>(() => {
    const picked = pickMode();
    if (picked) {
      writeStorage(sessionStorage, SESSION_KEY, '1');
      writeStorage(localStorage, STARTUP_INSTALL_KEY, '1');
    }
    return picked;
  });

  if (!mode) return null;
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[100] bg-[#040309]" />}>
      <CinematicIntro mode={mode} onDone={() => setMode(null)} />
    </Suspense>
  );
}
