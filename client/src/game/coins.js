import { useSyncExternalStore } from 'react';
import { hud, pushMessage, setHud } from './store.js';

const items = [];
let nextId = 0;
let version = 0;
const listeners = new Set();

function emit() {
  version += 1;
  listeners.forEach((fn) => fn());
}

export function addCoin(position, value = 20) {
  items.push({
    id: ++nextId,
    position: position.clone(),
    value,
    bornAt: performance.now() / 1000,
  });
  emit();
}

export function collectCoin(coin) {
  const index = items.indexOf(coin);
  if (index < 0) return;
  items.splice(index, 1);
  setHud({ gold: hud.gold + coin.value });
  pushMessage(`+${coin.value} Berry`);
  emit();
}

export function clearCoins() {
  items.length = 0;
  emit();
}

export function useCoins() {
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
