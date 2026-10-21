import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { coastRadius, mulberry32, terrainHeight } from './terrain.js';

const SAND = new THREE.Color('#e2caa0');
const WET_SAND = new THREE.Color('#c3a878');
const GRASS = new THREE.Color('#5f8d46');
const DEEP_GRASS = new THREE.Color('#31592f');
const ROCK = new THREE.Color('#7b7466');

function buildTerrainGeometry() {
  const size = 210;
  const segments = 150;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const y = terrainHeight(x, z);
    position.setY(i, y);

    if (y < 0.35) color.copy(WET_SAND);
    else if (y < 1.7) color.copy(WET_SAND).lerp(SAND, (y - 0.35) / 1.35);
    else if (y < 3.2) color.copy(SAND).lerp(GRASS, (y - 1.7) / 1.5);
    else if (y < 11) color.copy(GRASS).lerp(DEEP_GRASS, Math.min(1, (y - 3.2) / 8));
    else color.copy(DEEP_GRASS).lerp(ROCK, Math.min(1, (y - 11) / 6));

    // subtle per-vertex variation so large areas do not look flat
    const variation = 0.92 + ((Math.sin(x * 3.1) * Math.cos(z * 2.7) + 1) / 2) * 0.16;
    colors[i * 3] = color.r * variation;
    colors[i * 3 + 1] = color.g * variation;
    colors[i * 3 + 2] = color.b * variation;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function Palm({ position, scale, rotation, lean }) {
  return (
    <group position={position} rotation={[lean, rotation, 0]} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.16, 0.3, 4.2, 7, 3]} />
        <meshStandardMaterial color="#7a5b3a" roughness={0.9} flatShading />
      </mesh>
      {Array.from({ length: 7 }).map((_, index) => {
        const angle = (index / 7) * Math.PI * 2;
        return (
          <group key={index} rotation-y={angle} position={[0, 4.15, 0]}>
            <mesh rotation={[0.55, 0, 0]} position={[0, 0.15, 0.95]}>
              <coneGeometry args={[0.42, 2.5, 4]} />
              <meshStandardMaterial
                color={index % 2 ? '#3f7a3a' : '#4f9147'}
                roughness={0.75}
                flatShading
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0.16, 3.95, 0.1]} castShadow>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#5b4326" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale, rotation }) {
  return (
    <mesh castShadow receiveShadow position={position} scale={scale} rotation={rotation}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8b8375" roughness={0.95} flatShading />
    </mesh>
  );
}

function Dock({ shoreZ }) {
  const planks = useMemo(() => {
    const list = [];
    for (let i = 0; i < 14; i++) list.push(shoreZ - 5 + i * 1.15);
    return list;
  }, [shoreZ]);

  return (
    <group>
      {planks.map((z, index) => (
        <mesh key={index} castShadow receiveShadow position={[0, 1.05, z]}>
          <boxGeometry args={[4.2, 0.16, 1.05]} />
          <meshStandardMaterial color={index % 2 ? '#8a6a45' : '#7a5c3b'} roughness={0.9} />
        </mesh>
      ))}
      {[-1.9, 1.9].map((x) =>
        [0, 3, 6, 9].map((offset) => (
          <mesh key={`${x}-${offset}`} castShadow position={[x, -1.2, shoreZ - 4 + offset * 1.7]}>
            <cylinderGeometry args={[0.16, 0.16, 4.6, 8]} />
            <meshStandardMaterial color="#5b452c" roughness={0.95} />
          </mesh>
        ))
      )}
    </group>
  );
}

function Ship({ position }) {
  const group = useRef();

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.position.y = position[1] + Math.sin(t * 0.9) * 0.16;
    group.current.rotation.z = Math.sin(t * 0.7) * 0.02;
    group.current.rotation.x = Math.cos(t * 0.55) * 0.018;
  });

  return (
    <group ref={group} position={position} rotation-y={Math.PI}>
      {/* hull */}
      <mesh castShadow receiveShadow position={[0, 1.3, 0]} scale={[1, 0.62, 1]}>
        <sphereGeometry args={[3.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
        <meshStandardMaterial color="#8d5a34" roughness={0.8} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 2.1, 0]}>
        <boxGeometry args={[5.6, 1.5, 2.6]} />
        <meshStandardMaterial color="#a06a3d" roughness={0.75} />
      </mesh>
      {/* deck rail */}
      <mesh position={[0, 2.95, 0]}>
        <boxGeometry args={[5.8, 0.16, 2.8]} />
        <meshStandardMaterial color="#c99a63" roughness={0.7} />
      </mesh>
      {/* mast */}
      <mesh castShadow position={[0, 5.4, 0]}>
        <cylinderGeometry args={[0.13, 0.17, 6.2, 10]} />
        <meshStandardMaterial color="#6d4b2c" roughness={0.85} />
      </mesh>
      {/* sail */}
      <mesh position={[0, 5.6, 0.1]} rotation={[0, 0, 0.03]}>
        <boxGeometry args={[3.4, 3.7, 0.06]} />
        <meshStandardMaterial color="#f4ead2" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* pirate flag */}
      <mesh position={[0, 8.6, 0]}>
        <planeGeometry args={[1.5, 0.85]} />
        <meshStandardMaterial color="#141414" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      {/* figurehead */}
      <group position={[0, 1.6, 3.1]}>
        <mesh castShadow>
          <sphereGeometry args={[0.62, 14, 12]} />
          <meshStandardMaterial color="#f6f0e2" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.36, 0.36, 0.3, 12]} />
          <meshStandardMaterial color="#e8d9bd" roughness={0.7} />
        </mesh>
      </group>
      {/* bowsprit */}
      <mesh castShadow position={[0, 3.1, 2.4]} rotation={[0.55, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 3.4, 8]} />
        <meshStandardMaterial color="#6d4b2c" roughness={0.85} />
      </mesh>
    </group>
  );
}

export default function Island() {
  const geometry = useMemo(() => buildTerrainGeometry(), []);

  const props = useMemo(() => {
    const random = mulberry32(1337);
    const palms = [];
    const rocks = [];

    for (let attempt = 0; attempt < 900 && palms.length < 32; attempt++) {
      const angle = random() * Math.PI * 2;
      const radius = 14 + random() * 42;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = terrainHeight(x, z);
      if (y > 1.5 && y < 9.5) {
        palms.push({
          key: palms.length,
          position: [x, y - 0.15, z],
          scale: 0.8 + random() * 0.5,
          rotation: random() * Math.PI * 2,
          lean: (random() - 0.5) * 0.22,
        });
      }
    }

    for (let attempt = 0; attempt < 600 && rocks.length < 26; attempt++) {
      const angle = random() * Math.PI * 2;
      const radius = 8 + random() * 46;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = terrainHeight(x, z);
      if (y > 2.4) {
        const size = 0.35 + random() * 0.9;
        rocks.push({
          key: rocks.length,
          position: [x, y - size * 0.4, z],
          scale: [size, size * (0.6 + random() * 0.5), size],
          rotation: [random(), random() * Math.PI, random()],
        });
      }
    }

    return { palms, rocks };
  }, []);

  const shoreZ = useMemo(() => coastRadius(Math.PI / 2) - 2, []);

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.94} metalness={0.02} />
      </mesh>

      {props.palms.map(({ key, ...palm }) => (
        <Palm key={key} {...palm} />
      ))}
      {props.rocks.map(({ key, ...rock }) => (
        <Rock key={key} {...rock} />
      ))}

      <Dock shoreZ={shoreZ} />
      <Ship position={[0, 0, shoreZ + 15]} />
    </group>
  );
}
