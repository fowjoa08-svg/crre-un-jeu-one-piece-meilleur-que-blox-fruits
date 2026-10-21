import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { input } from './input.js';
import { terrainHeight } from './terrain.js';
import { world } from './world.js';

const MIN_PITCH = 0.06;
const MAX_PITCH = 1.15;

export default function CameraRig() {
  const { gl, camera } = useThree();

  useEffect(() => {
    const element = gl.domElement;
    let drag = null;

    const onPointerDown = (event) => {
      if (event.button !== 0 && event.button !== 2) return;
      drag = { x: event.clientX, y: event.clientY, moved: 0 };
    };

    const onPointerMove = (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      world.camera.yaw -= dx * 0.005;
      world.camera.pitch = THREE.MathUtils.clamp(world.camera.pitch + dy * 0.004, MIN_PITCH, MAX_PITCH);
    };

    const onPointerUp = () => {
      if (drag && drag.moved < 6) input.attack = true;
      drag = null;
    };

    const onWheel = (event) => {
      event.preventDefault();
      world.camera.distance = THREE.MathUtils.clamp(
        world.camera.distance + Math.sign(event.deltaY) * 0.9,
        4,
        18
      );
    };

    const onContextMenu = (event) => event.preventDefault();

    element.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('contextmenu', onContextMenu);

    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('contextmenu', onContextMenu);
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const player = world.player.position;
    const cam = world.camera;

    const horizontal = cam.distance * Math.cos(cam.pitch);
    const desired = new THREE.Vector3(
      player.x + Math.sin(cam.yaw) * horizontal,
      player.y + 1.6 + cam.distance * Math.sin(cam.pitch),
      player.z + Math.cos(cam.yaw) * horizontal
    );

    const ground = terrainHeight(desired.x, desired.z) + 1.1;
    if (desired.y < ground) desired.y = ground;

    camera.position.lerp(desired, 1 - Math.pow(0.0009, delta));
    camera.lookAt(player.x, player.y + 1.45, player.z);
  });

  return null;
}
