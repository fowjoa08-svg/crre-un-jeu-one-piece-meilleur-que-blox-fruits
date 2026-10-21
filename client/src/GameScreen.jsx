import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Scene from './game/Scene.jsx';
import Hud from './ui/Hud.jsx';
import { bindInput } from './game/input.js';
import { serializeGame } from './game/world.js';
import { api } from './api.js';

const AUTOSAVE_INTERVAL = 20000;

export default function GameScreen({ user, onLogout }) {
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => bindInput(), []);

  useEffect(() => {
    let active = true;

    const persist = async () => {
      try {
        await api.save(serializeGame());
        if (active) setSavedAt(Date.now());
      } catch {
        // keep playing, the next tick retries
      }
    };

    const interval = window.setInterval(persist, AUTOSAVE_INTERVAL);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="game-screen">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 9, 41], fov: 55, near: 0.1, far: 1600 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Scene />
      </Canvas>
      <Hud user={user} savedAt={savedAt} onLogout={onLogout} />
    </div>
  );
}
