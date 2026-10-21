import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFx } from './fx.js';

const PRESETS = {
  slash: { color: '#fff6df', opacity: 0.95, from: 0.45, to: 1.25 },
  spark: { color: '#ffd166', opacity: 1, from: 0.5, to: 1.7 },
  burst: { color: '#ffb03a', opacity: 0.9, from: 0.4, to: 5.4 },
  fist: { color: '#ff8a3d', opacity: 0.95, from: 0.4, to: 1.6 },
};

function Effect({ item }) {
  const group = useRef();
  const material = useRef();
  const preset = PRESETS[item.type] ?? PRESETS.spark;

  useFrame(() => {
    if (!group.current || !material.current) return;
    const age = performance.now() / 1000 - item.bornAt;
    const progress = Math.min(1, Math.max(0, age / item.life));
    const eased = 1 - Math.pow(1 - progress, 2);
    const scale = preset.from + (preset.to - preset.from) * eased;
    group.current.scale.setScalar(scale);
    material.current.opacity = preset.opacity * (1 - progress);
    if (item.type === 'slash') group.current.rotation.z = -0.5 + progress * 1.4;
  });

  return (
    <group ref={group} position={item.position} rotation-y={item.rotationY ?? 0}>
      {item.type === 'slash' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.15, 0.075, 10, 40, Math.PI * 1.15]} />
          <meshBasicMaterial ref={material} color={preset.color} transparent depthWrite={false} />
        </mesh>
      )}
      {item.type === 'spark' && (
        <mesh>
          <octahedronGeometry args={[0.6, 0]} />
          <meshBasicMaterial ref={material} color={preset.color} transparent depthWrite={false} />
        </mesh>
      )}
      {item.type === 'burst' && (
        <mesh rotation-x={-Math.PI / 2}>
          <torusGeometry args={[1, 0.14, 8, 56]} />
          <meshBasicMaterial ref={material} color={preset.color} transparent depthWrite={false} />
        </mesh>
      )}
      {item.type === 'fist' && (
        <mesh>
          <sphereGeometry args={[0.65, 16, 12]} />
          <meshBasicMaterial ref={material} color={preset.color} transparent depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

export default function Fx() {
  const items = useFx();
  return (
    <group>
      {items.map((item) => (
        <Effect key={item.id} item={item} />
      ))}
    </group>
  );
}
