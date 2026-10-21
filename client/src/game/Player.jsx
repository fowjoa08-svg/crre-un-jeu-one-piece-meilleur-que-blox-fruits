import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerAttack, usePower, world } from './world.js';
import { axisForward, axisRight, input, isSprinting } from './input.js';
import { terrainHeight } from './terrain.js';

function lerpAngle(current, target, t) {
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * t;
}

const SKIN = '#f2c49b';

export default function Player() {
  const root = useRef();
  const body = useRef();
  const leftLeg = useRef();
  const rightLeg = useRef();
  const leftArm = useRef();
  const rightArm = useRef();

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const p = world.player;

    if (input.attack) {
      input.attack = false;
      playerAttack();
    }
    if (input.power) {
      input.power = false;
      usePower();
    }

    const forwardAmount = axisForward();
    const rightAmount = axisRight();
    const sprinting = isSprinting();

    const forward = new THREE.Vector3(-Math.sin(world.camera.yaw), 0, -Math.cos(world.camera.yaw));
    const right = new THREE.Vector3(Math.cos(world.camera.yaw), 0, -Math.sin(world.camera.yaw));
    const move = new THREE.Vector3()
      .addScaledVector(forward, forwardAmount)
      .addScaledVector(right, rightAmount);

    if (move.lengthSq() > 0.0001) {
      move.normalize();
      const step = (sprinting ? 9.2 : 5.4) * delta;
      const nextX = p.position.x + move.x * step;
      const nextZ = p.position.z + move.z * step;
      if (terrainHeight(nextX, nextZ) > -0.9) {
        p.position.x = nextX;
        p.position.z = nextZ;
      }
      p.yaw = lerpAngle(p.yaw, Math.atan2(move.x, move.z), 1 - Math.pow(0.0008, delta));
      p.moveAmount = Math.min(1, p.moveAmount + delta * 6);
      p.walkPhase += delta * (sprinting ? 14 : 9);
    } else {
      p.moveAmount = Math.max(0, p.moveAmount - delta * 8);
    }

    if (input.jump) {
      input.jump = false;
      if (p.grounded) {
        p.velocityY = 8.4;
        p.grounded = false;
      }
    }
    p.velocityY -= 26 * delta;
    p.position.y += p.velocityY * delta;
    const groundY = terrainHeight(p.position.x, p.position.z);
    if (p.position.y <= groundY) {
      p.position.y = groundY;
      p.velocityY = 0;
      p.grounded = true;
    }

    if (!root.current) return;
    root.current.position.copy(p.position);
    root.current.rotation.y = p.yaw;

    const swing = Math.sin(p.walkPhase) * 0.7 * p.moveAmount;
    const time = state.clock.elapsedTime;
    const sinceAttack = performance.now() / 1000 - p.attackAt;
    const attackSwing = sinceAttack >= 0 && sinceAttack < 0.3 ? Math.sin((sinceAttack / 0.3) * Math.PI) : 0;

    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) {
      leftArm.current.rotation.x = -swing * 0.8;
      leftArm.current.rotation.z = 0.16;
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = swing * 0.8 - attackSwing * 2.2;
      rightArm.current.rotation.z = -0.16;
    }
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(p.walkPhase)) * 0.05 * p.moveAmount;
      body.current.rotation.z = Math.sin(time * 1.6) * 0.012;
    }
  });

  return (
    <group ref={root}>
      <group ref={body}>
        <mesh castShadow position={[0, 1.16, 0]}>
          <capsuleGeometry args={[0.33, 0.44, 6, 14]} />
          <meshStandardMaterial color="#c8402f" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.16, 16]} />
          <meshStandardMaterial color="#f2c14e" roughness={0.55} metalness={0.25} />
        </mesh>
        <mesh castShadow position={[0, 1.36, 0.28]}>
          <boxGeometry args={[0.34, 0.3, 0.1]} />
          <meshStandardMaterial color="#8c2f22" roughness={0.7} />
        </mesh>

        <mesh castShadow position={[0, 1.76, 0]}>
          <sphereGeometry args={[0.3, 20, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.62} />
        </mesh>
        <mesh position={[0, 1.72, 0.27]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color="#2c2320" roughness={0.6} />
        </mesh>

        <group position={[0, 1.99, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.55, 0.57, 0.05, 22]} />
            <meshStandardMaterial color="#e6ce87" roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.3, 0.33, 0.22, 18]} />
            <meshStandardMaterial color="#e6ce87" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.335, 0.335, 0.07, 18]} />
            <meshStandardMaterial color="#c8402f" roughness={0.7} />
          </mesh>
        </group>

        <group ref={leftArm} position={[-0.44, 1.4, 0]}>
          <mesh castShadow position={[0, -0.26, 0]}>
            <capsuleGeometry args={[0.12, 0.34, 4, 10]} />
            <meshStandardMaterial color="#c8402f" roughness={0.72} />
          </mesh>
          <mesh castShadow position={[0, -0.52, 0]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <meshStandardMaterial color={SKIN} roughness={0.62} />
          </mesh>
        </group>

        <group ref={rightArm} position={[0.44, 1.4, 0]}>
          <mesh castShadow position={[0, -0.26, 0]}>
            <capsuleGeometry args={[0.12, 0.34, 4, 10]} />
            <meshStandardMaterial color="#c8402f" roughness={0.72} />
          </mesh>
          <mesh castShadow position={[0, -0.52, 0]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <meshStandardMaterial color={SKIN} roughness={0.62} />
          </mesh>
          <group position={[0, -0.55, 0.02]} rotation={[0.2, 0, 0]}>
            <mesh castShadow position={[0, 0.05, 0.35]}>
              <boxGeometry args={[0.07, 0.02, 1.0]} />
              <meshStandardMaterial color="#d9dee3" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh castShadow position={[0, 0, 0.02]}>
              <cylinderGeometry args={[0.05, 0.05, 0.18, 8]} />
              <meshStandardMaterial color="#2b2b2b" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0, -0.18]}>
              <boxGeometry args={[0.2, 0.03, 0.06]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.35} />
            </mesh>
          </group>
        </group>

        <group ref={leftLeg} position={[-0.17, 0.84, 0]}>
          <mesh castShadow position={[0, -0.36, 0]}>
            <capsuleGeometry args={[0.15, 0.36, 4, 10]} />
            <meshStandardMaterial color="#2a3a52" roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.62, 0.06]}>
            <boxGeometry args={[0.22, 0.12, 0.36]} />
            <meshStandardMaterial color="#4a3220" roughness={0.85} />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.17, 0.84, 0]}>
          <mesh castShadow position={[0, -0.36, 0]}>
            <capsuleGeometry args={[0.15, 0.36, 4, 10]} />
            <meshStandardMaterial color="#2a3a52" roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.62, 0.06]}>
            <boxGeometry args={[0.22, 0.12, 0.36]} />
            <meshStandardMaterial color="#4a3220" roughness={0.85} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
