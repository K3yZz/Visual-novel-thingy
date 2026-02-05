//Props.jsx
import { useState, forwardRef } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'

function Ground() {
    return (
        <RigidBody type="fixed">
            <CuboidCollider args={[25, 0.01, 25]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="blue" />
            </mesh>
        </RigidBody>
    );
}

function Wall({ pos = [0, 0, 3], scale = [1, 0.5, 1] }) {
    return (
        <RigidBody type="fixed" position={pos}>
            <mesh receiveShadow>
                <boxGeometry args={scale} />
                <meshStandardMaterial color="orange" />
            </mesh>
        </RigidBody>
    );
}

const SensorBlock = forwardRef(({ pos = [0, 0, -3], scale = [1, 0.5, 1], shown = false, onPlayerEnter }, ref) => {
    const [active, setActive] = useState(false)

    return (
        <RigidBody
            ref={ref}
            type="fixed"
            position={pos}
            sensor={true}
            onIntersectionEnter={(other) => {
                if (other.rigidBodyObject?.name === "Player") {
                    onPlayerEnter?.()
                    setActive(true)
                }
            }}
            onIntersectionExit={(other) => {
                if (other.rigidBodyObject?.name === "Player") {
                    setActive(false)
                }
            }}
        >
            {shown && (
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
    )
})

export { Ground, Wall, SensorBlock }