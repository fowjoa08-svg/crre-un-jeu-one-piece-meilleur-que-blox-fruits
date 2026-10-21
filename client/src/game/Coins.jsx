import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { collectCoin, useCoins } from './coins.js';
import { world } from './world.js';

function Coin({ coin }) {
  const mesh = useRef();

  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += delta * 3.4;
    mesh.current.position.y = coin.position.y + Math.sin(state.clock.elapsedTime * 3 + coin.id) * 0.12;
    if (coin.position.distanceTo(world.player.position) < 2.1) {
      collectCoin(coin);
    }
  });

  return (
    <group ref={mesh} position={coin.position}>
      <mesh castShadow rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.3, 0.3, 0.08, 18]} />
        <meshStandardMaterial
          color="#ffd45e"
          metalness={0.95}
          roughness={0.22}
          emissive="#7a4a05"
          emissiveIntensity={0.6}
        />
      </mesh>
      <pointLight color="#ffcf6b" intensity={0.9} distance={4.5} />
    </group>
  );
}

export default function Coins() {
  const coins = useCoins();
  return (
    <group>
      {coins.map((coin) => (
        <Coin key={coin.id} coin={coin} />
      ))}
    </group>
  );
}
