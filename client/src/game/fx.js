import { useSyncExternalStore } from 'react';

// Transient visual effects (slash arcs, sparks, shockwaves). Each effect
// removes itself after its lifetime.
const items = [];
let nextId = 0;
let version = 0;
const listeners = new Set();

function emit() {
  version += 1;
  listeners.forEach((fn) => fn());
}

export function spawnFx(effect) {
  const item = { ...effect, id: ++nextId };
  items.push(item);
  emit();
  window.setTimeout(() => {
    const index = items.indexOf(item);
    if (index >= 0) {
      items.splice(index, 1);
      emit();
    }
  }, (effect.life ?? 0.4) * 1000);
}

export function clearFx() {
  items.length = 0;
  emit();
}

export function useFx() {
  useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => version,
    () => version
  );
  return items;
}
