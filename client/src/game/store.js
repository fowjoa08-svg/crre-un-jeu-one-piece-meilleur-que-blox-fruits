import { useSyncExternalStore } from 'react';

const INITIAL = {
  hp: 100,
  maxHp: 100,
  level: 1,
  xp: 0,
  xpToNext: 100,
  gold: 0,
  kills: 0,
  message: '',
  messageAt: 0,
  fps: 0,
};

// HUD-facing state. Kept outside React so the render loop can mutate it every
// frame without re-rendering; listeners only fire on real changes.
export const hud = { ...INITIAL };

let version = 0;
const listeners = new Set();

function emit() {
  version += 1;
  listeners.forEach((fn) => fn());
}

export function setHud(patch) {
  Object.assign(hud, patch);
  emit();
}

export function resetHud() {
  Object.assign(hud, INITIAL);
  emit();
}

export function pushMessage(text) {
  setHud({ message: text, messageAt: performance.now() });
}

export function useHud() {
  useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => version,
    () => version
  );
  return hud;
}
