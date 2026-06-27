export type StartupAnimationMode = 'full' | 'short' | 'disabled';

export const STARTUP_ANIMATION_KEY = 'unfilterd:startup-animation';
export const STARTUP_SOUND_KEY = 'unfilterd:startup-sound';
export const STARTUP_INSTALL_KEY = 'unfilterd:install-seen';

export function getStartupAnimationMode(): StartupAnimationMode {
  const stored = localStorage.getItem(STARTUP_ANIMATION_KEY);
  return stored === 'full' || stored === 'short' || stored === 'disabled' ? stored : 'short';
}

export function getStartupSoundEnabled(): boolean {
  return localStorage.getItem(STARTUP_SOUND_KEY) === 'on';
}
