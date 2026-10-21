import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Sky, { SunLight } from './Sky.jsx';
import Ocean from './Ocean.jsx';
import Island from './Island.jsx';
import Player from './Player.jsx';
import Enemies from './Enemies.jsx';
import Coins from './Coins.jsx';
import Fx from './Fx.jsx';
import CameraRig from './CameraRig.jsx';
import { setHud } from './store.js';

function FrameStats() {
  const stats = useRef({ frames: 0, since: performance.now() });

  useFrame(() => {
    const current = stats.current;
    current.frames += 1;
    const now = performance.now();
    const elapsed = now - current.since;
    if (elapsed >= 500) {
      setHud({ fps: Math.round((current.frames * 1000) / elapsed) });
      current.frames = 0;
      current.since = now;
    }
  });

  return null;
}

export default function Scene() {
  return (
    <>
      <fogExp2 attach="fog" args={['#f0b887', 0.0042]} />
      <Sky />
      <SunLight />
      <Ocean />
      <Island />
      <Player />
      <Enemies />
      <Coins />
      <Fx />
      <CameraRig />
      <FrameStats />
    </>
  );
}
