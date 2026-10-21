// Keyboard/mouse intent shared between the DOM and the render loop.
export const input = {
  keys: new Set(),
  attack: false,
  power: false,
  jump: false,
};

const HANDLED = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyZ',
  'KeyQ',
  'KeyE',
  'KeyJ',
  'Space',
  'ShiftLeft',
  'ShiftRight',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

let bound = false;

export function bindInput() {
  if (bound) return () => {};
  bound = true;

  const onKeyDown = (event) => {
    if (HANDLED.has(event.code)) event.preventDefault();
    if (event.repeat) return;
    input.keys.add(event.code);
    if (event.code === 'KeyJ') input.attack = true;
    if (event.code === 'KeyE') input.power = true;
    if (event.code === 'Space') input.jump = true;
  };

  const onKeyUp = (event) => {
    input.keys.delete(event.code);
  };

  const onBlur = () => input.keys.clear();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    bound = false;
  };
}

export function axisForward() {
  const k = input.keys;
  return (k.has('KeyW') || k.has('KeyZ') || k.has('ArrowUp') ? 1 : 0) -
    (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
}

export function axisRight() {
  const k = input.keys;
  return (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) -
    (k.has('KeyA') || k.has('KeyQ') || k.has('ArrowLeft') ? 1 : 0);
}

export function isSprinting() {
  return input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
}
