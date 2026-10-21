import { useMemo, useRef } from 'react';
import * as THREE from 'three';

export const SUN_DIR = new THREE.Vector3(-0.55, 0.34, -0.76).normalize();

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vDir = normalize(world.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  varying vec3 vDir;

  void main() {
    vec3 dir = normalize(vDir);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 color = mix(uHorizon, uTop, pow(h, 0.85));

    float cosAngle = max(dot(dir, normalize(uSunDir)), 0.0);
    float disc = pow(cosAngle, 900.0);
    float glow = pow(cosAngle, 12.0);
    float haze = pow(cosAngle, 2.5);

    color += uSunColor * (disc * 3.0 + glow * 0.55 + haze * 0.12);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function Sky() {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color('#1d3f6d') },
      uHorizon: { value: new THREE.Color('#ffb877') },
      uSunColor: { value: new THREE.Color('#ffe6ae') },
      uSunDir: { value: SUN_DIR.clone() },
    }),
    []
  );

  return (
    <mesh scale={[1400, 1400, 1400]} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 20]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

export function SunLight() {
  const light = useRef();
  return (
    <>
      <hemisphereLight args={['#bcdcff', '#4a3a28', 0.75]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        ref={light}
        castShadow
        position={[SUN_DIR.x * 90, SUN_DIR.y * 90, SUN_DIR.z * 90]}
        intensity={2.5}
        color="#ffd9a8"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
      >
        <orthographicCamera attach="shadow-camera" args={[-95, 95, 95, -95, 1, 400]} />
      </directionalLight>
      {/* cool rim light from the opposite side for shape readability */}
      <directionalLight position={[60, 40, 70]} intensity={0.55} color="#8fc4ff" />
    </>
  );
}
