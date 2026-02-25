import { create } from '@/lib/other';
import { useRef } from '@/lib/react';
import { useLoader } from '@/lib/r3f';
import * as THREE from '@/lib/three';
import { RigidBody, CuboidCollider } from '@/lib/physics';

const defaultBox = {
  pos: [0, 0, 0],
  rot: [0, 0, 0],
  size: [1, 1, 1],
  textures: {
    diffuse: '',
    normal: '',
    arm: ''
  },
  visible: true
};

const useBoxStore = create((set) => ({
  boxes: [{
    id: crypto.randomUUID(), ...defaultBox, pos: [0, 0, 0], size: [100, 2, 100],
    textures: {
      diffuse: '/floor_texture/rocky_terrain_02_diff_4k.jpg', normal: '/floor_texture/rocky_terrain_02_nor_gl_4k.jpg', arm: '/floor_texture/rocky_terrain_02_arm_4k.jpg'
    }
  }],

  addBox: (box = {}) =>
    set((state) => ({
      boxes: [...state.boxes, { id: crypto.randomUUID(), ...defaultBox, ...box }],
    })),

  updateBox: (index, updates) =>
    set((state) => ({
      boxes: state.boxes.map((box, i) => (i === index ? { ...box, ...updates } : box)),
    })),

  removeBox: (index) =>
    set((state) => ({
      boxes: state.boxes.filter((_, i) => i !== index),
    })),
}));

function Box({ pos, rot, size, textures = {}, rounded = 0, visible = true }) {
  const boxRef = useRef();

  const diffuseTexture = textures.diffuse ? useLoader(THREE.TextureLoader, textures.diffuse) : null;
  const normalTexture = textures.normal ? useLoader(THREE.TextureLoader, textures.normal) : null;
  const armTexture = textures.arm ? useLoader(THREE.TextureLoader, textures.arm) : null;

  const halfSize = size.map((s) => s / 2);

  return (
    <RigidBody
      ref={boxRef}
      type="fixed"
      position={pos}
      rotation={rot}
    >
      <CuboidCollider args={halfSize} />
      {visible &&
        <mesh receiveShadow castShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial
            map={diffuseTexture}
            normalMap={normalTexture}
            aoMap={armTexture}
            metalnessMap={armTexture}
            roughnessMap={armTexture}
            metalness={1}
            roughness={1}
            color={!diffuseTexture ? 'orange' : undefined}
          />
        </mesh>
      }
    </RigidBody>
  );
}

export { useBoxStore, Box };