import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  varying float vWave;

  void main() {
    vec3 p = position;
    vec3 world = (modelMatrix * vec4(p, 1.0)).xyz;

    float wave =
      sin(world.x * 0.11 + uTime * 0.85) * 0.36 +
      sin(world.z * 0.17 - uTime * 1.05) * 0.28 +
      sin((world.x + world.z) * 0.06 + uTime * 0.55) * 0.42 +
      sin((world.x - world.z) * 0.31 + uTime * 1.7) * 0.09;

    p.z += wave;
    vWave = wave;

    vec4 outWorld = modelMatrix * vec4(p, 1.0);
    vWorld = outWorld.xyz;
    gl_Position = projectionMatrix * viewMatrix * outWorld;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSkyColor;
  uniform vec3 uSunDir;
  varying vec3 vWorld;
  varying float vWave;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - clamp(viewDir.y, 0.0, 1.0), 3.2);

    vec3 color = mix(uDeep, uShallow, smoothstep(-0.6, 0.75, vWave));
    color = mix(color, uSkyColor, clamp(fresnel * 0.9, 0.0, 1.0));

    // animated ripple normals for sparkle
    float ripple =
      sin(vWorld.x * 0.9 + uTime * 2.1) * 0.5 +
      sin(vWorld.z * 1.3 - uTime * 1.6) * 0.5;
    vec3 normal = normalize(vec3(ripple * 0.06, 1.0, ripple * 0.045));

    vec3 halfVec = normalize(normalize(uSunDir) + viewDir);
    float specular = pow(max(dot(normal, halfVec), 0.0), 160.0);
    float sheen = pow(max(dot(normal, halfVec), 0.0), 14.0);

    // foam ring where the swell meets the island
    float distanceToShore = length(vWorld.xz);
    float foamBand = smoothstep(70.0, 58.0, distanceToShore);
    float foamNoise = smoothstep(0.25, 0.95, sin(vWorld.x * 0.8 + uTime * 1.9) * 0.5 + 0.5)
                    * smoothstep(0.25, 0.95, sin(vWorld.z * 0.9 - uTime * 1.4) * 0.5 + 0.5);

    color += specular * vec3(1.0, 0.96, 0.86) * 2.2;
    color += sheen * vec3(1.0, 0.9, 0.75) * 0.35;
    color = mix(color, vec3(1.0, 0.99, 0.95), foamBand * foamNoise * 0.55);

    gl_FragColor = vec4(color, 0.96);
  }
`;

export default function Ocean() {
  const material = useRef();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#082f4d') },
      uShallow: { value: new THREE.Color('#1c8ba8') },
      uSkyColor: { value: new THREE.Color('#ffc48b') },
      uSunDir: { value: new THREE.Vector3(-0.55, 0.34, -0.76).normalize() },
    }),
    []
  );

  useFrame((state) => {
    if (material.current) material.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0} receiveShadow>
      <planeGeometry args={[1500, 1500, 140, 140]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
