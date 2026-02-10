//Props.jsx
import { useState } from 'react'
import { useLoader } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { TextureLoader } from 'three';

function Ground() {
    return (
        <RigidBody type="fixed">
            <CuboidCollider args={[100, 0.01, 100]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="blue" />
            </mesh>
        </RigidBody>
    );
}

function Wall({ pos = [0, 0, 3], scale = [1, 0.5, 1]}) {
    return (
        <RigidBody type="fixed" position={pos}>
            <mesh receiveShadow>
                <boxGeometry args={scale} />
                <meshStandardMaterial color="orange" />
            </mesh>
        </RigidBody>
    );
}

function House({ pos = [0, 6, -10] }) {
    const texture = useLoader(TextureLoader, '/models/cottage_diffuse.png');
    const normalMap = useLoader(TextureLoader, '/models/cottage_normal.png');

    const materials = useLoader(MTLLoader, '/models/cottage_obj.mtl')
    const obj = useLoader(
        OBJLoader,
        '/models/cottage_obj.obj',
        (loader) => {
            materials.preload()
            loader.setMaterials(materials)
        }
    )
    obj.scale.setScalar(0.8)

    obj.traverse((child) => {
        if (child.isMesh) {
            if (!child.name.toLowerCase().includes("cube")) {
                child.visible = false;
            }

            child.geometry.computeBoundingBox()
            child.geometry.center()
            child.castShadow = true
            child.receiveShadow = true

            child.material.map = texture;
            child.material.normalMap = normalMap;
            child.material.needsUpdate = true;
        }
    })

    return (
        <RigidBody type="fixed" colliders={false}>
            <primitive object={obj} position={pos} />
            <CuboidCollider args={[15, 6, 8]} rotation={[0, 0.1, 0]} position={pos} />
        </RigidBody>
    );
}

function SensorBlock({ pos = [0, 0, -3], scale = [1, 0.5, 1], visible = true, onPlayerEnter }) {
    const [active, setActive] = useState(false);

    const halfExtents = [scale[0] / 2, scale[1] / 2, scale[2] / 2];

    return (
        <RigidBody type="fixed" position={pos} >
            <CuboidCollider
                args={halfExtents}
                sensor
                onIntersectionEnter={(other) => {
                    if (other.rigidBodyObject?.name === "Player") {
                        onPlayerEnter?.();
                        setActive(true);
                    }
                }}
                onIntersectionExit={(other) => {
                    if (other.rigidBodyObject?.name === "Player") {
                        setActive(false);
                    }
                }}
            />

            {visible && (
                <mesh>
                    <boxGeometry args={scale} />
                    <meshStandardMaterial
                        color="orange"
                        transparent
                        opacity={0.5}
                        emissive={active ? "yellow" : "black"}
                        emissiveIntensity={active ? 1 : 0}
                    />
                </mesh>
            )}
        </RigidBody>
    );
}

export { Ground, Wall, House, SensorBlock }