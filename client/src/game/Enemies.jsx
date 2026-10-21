import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damagePlayer, world } from './world.js';
import { terrainHeight } from './terrain.js';

const CHASE_RANGE = 24;
const ATTACK_RANGE = 1.9;

function Marine() {
  return (
    <group>
      <mesh castShadow position={[0, 1.08, 0]}>
        <capsuleGeometry args={[0.32, 0.42, 6, 12]} />
        <meshStandardMaterial color="#1d3963" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.84, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.14, 14]} />
        <meshStandardMaterial color="#e9e6dc" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 1.66, 0]}>
        <sphereGeometry args={[0.28, 18, 14]} />
        <meshStandardMaterial color="#e8bd93" roughness={0.65} />
      </mesh>
      <group position={[0, 1.88, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.48, 0.5, 0.05, 18]} />
          <meshStandardMaterial color="#f6f4ee" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.26, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#f6f4ee" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.305, 0.305, 0.07, 16]} />
          <meshStandardMaterial color="#1d3963" roughness={0.7} />
        </mesh>
      </group>
      <group position={[-0.42, 1.3, 0]}>
        <mesh castShadow position={[0, -0.24, 0]}>
          <capsuleGeometry args={[0.11, 0.3, 4, 8]} />
          <meshStandardMaterial color="#1d3963" roughness={0.75} />
        </mesh>
      </group>
      <group position={[0.42, 1.3, 0]}>
        <mesh castShadow position={[0, -0.24, 0]}>
          <capsuleGeometry args={[0.11, 0.3, 4, 8]} />
          <meshStandardMaterial color="#1d3963" roughness={0.75} />
        </mesh>
      </group>
      <group position={[-0.16, 0.78, 0]}>
        <mesh castShadow position={[0, -0.34, 0]}>
          <capsuleGeometry args={[0.14, 0.32, 4, 8]} />
          <meshStandardMaterial color="#e9e6dc" roughness={0.75} />
        </mesh>
      </group>
      <group position={[0.16, 0.78, 0]}>
        <mesh castShadow position={[0, -0.34, 0]}>
          <capsuleGeometry args={[0.14, 0.32, 4, 8]} />
          <meshStandardMaterial color="#e9e6dc" roughness={0.75} />
        </mesh>
      </group>
      {/* rifle slung on the back */}
      <mesh castShadow position={[0.16, 1.2, -0.34]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.06, 1.3, 0.06]} />
        <meshStandardMaterial color="#4a3520" roughness={0.85} />
      </mesh>
    </group>
  );
}

export default function Enemies() {
  const groupRefs = useRef([]);
  const barRefs = useRef([]);
  const fillRefs = useRef([]);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const time = performance.now() / 1000;
    const playerPosition = world.player.position;

    world.enemies.forEach((enemy, index) => {
      const group = groupRefs.current[index];
      const bar = barRefs.current[index];
      const fill = fillRefs.current[index];
      if (!group) return;

      if (!enemy.alive) {
        if (time > enemy.respawnAt) {
          enemy.alive = true;
          enemy.hp = enemy.maxHp;
          const angle = Math.random() * Math.PI * 2;
          const radius = 18 + Math.random() * 32;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = terrainHeight(x, z);
          if (y > 1.2) enemy.position.set(x, y, z);
          else enemy.position.set(0, terrainHeight(0, 0), 0);
        } else {
          group.visible = false;
          if (bar) bar.visible = false;
          return;
        }
      }

      group.visible = true;
      const dx = playerPosition.x - enemy.position.x;
      const dz = playerPosition.z - enemy.position.z;
      const distance = Math.hypot(dx, dz);
      const direction = distance > 0.001 ? { x: dx / distance, z: dz / distance } : { x: 0, z: 1 };

      if (distance < CHASE_RANGE && distance > ATTACK_RANGE) {
        enemy.position.x += direction.x * 2.5 * delta;
        enemy.position.z += direction.z * 2.5 * delta;
        enemy.yaw = Math.atan2(direction.x, direction.z);
        enemy.phase += delta * 9;
      } else if (distance <= ATTACK_RANGE) {
        enemy.yaw = Math.atan2(direction.x, direction.z);
        if (time > enemy.nextHit) {
          enemy.nextHit = time + 1.15;
          damagePlayer(7);
        }
      } else {
        enemy.wanderAngle += delta * 0.5;
        const nextX = enemy.position.x + Math.cos(enemy.wanderAngle) * delta * 0.9;
        const nextZ = enemy.position.z + Math.sin(enemy.wanderAngle) * delta * 0.9;
        if (terrainHeight(nextX, nextZ) > 1.1) {
          enemy.position.x = nextX;
          enemy.position.z = nextZ;
          enemy.yaw = Math.atan2(Math.cos(enemy.wanderAngle), Math.sin(enemy.wanderAngle));
        }
        enemy.phase += delta * 3;
      }

      enemy.position.y = terrainHeight(enemy.position.x, enemy.position.z);
      group.position.copy(enemy.position);
      group.rotation.y = enemy.yaw;
      group.position.y += Math.abs(Math.sin(enemy.phase)) * 0.05;

      if (bar) {
        bar.visible = enemy.hp < enemy.maxHp;
        bar.position.set(enemy.position.x, enemy.position.y + 2.45, enemy.position.z);
        bar.quaternion.copy(camera.quaternion);
        if (fill) fill.scale.x = Math.max(0.02, enemy.hp / enemy.maxHp);
      }
    });
  });

  return (
    <group>
      {world.enemies.map((enemy, index) => (
        <group
          key={enemy.id}
          ref={(el) => {
            groupRefs.current[index] = el;
          }}
        >
          <Marine />
        </group>
      ))}
      {world.enemies.map((enemy, index) => (
        <group
          key={`bar-${enemy.id}`}
          ref={(el) => {
            barRefs.current[index] = el;
          }}
          visible={false}
        >
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.1, 0.14]} />
            <meshBasicMaterial color="#160d0d" transparent opacity={0.75} />
          </mesh>
          <mesh
            ref={(el) => {
              fillRefs.current[index] = el;
            }}
          >
            <planeGeometry args={[1.06, 0.1]} />
            <meshBasicMaterial color="#ff5a45" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
