import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider, CapsuleCollider } from '@react-three/rapier'
import { KeyboardControls, useKeyboardControls, PerspectiveCamera, OrbitControls, useHelper } from '@react-three/drei'
import * as THREE from 'three'
import { useHotkeys } from 'react-hotkeys-hook'

//* Player
const controlsMap = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "left", keys: ["ArrowLeft", "KeyA"] },
    { name: "right", keys: ["ArrowRight", "KeyD"] }
];

function Player({ freecam }) {
    const body = useRef(null)
    const camera = useRef(null)

    const [, getKeys] = useKeyboardControls()
    const [camMode, setCamMode] = useState('third')
    const rotation = useRef({ yaw: 0, pitch: 0 })

    const speed = 6

    useHotkeys('v', () => {
        setCamMode(m => (m === 'third' ? 'first' : 'third'))
    })

    useEffect(() => {
        const handleMouseMove = e => {
            if (!document.pointerLockElement) return
            const sensitivity = 0.002
            rotation.current.yaw -= e.movementX * sensitivity
            if (camMode === 'first') {
                rotation.current.pitch -= e.movementY * sensitivity
            } else {
                rotation.current.pitch += e.movementY * sensitivity
            } rotation.current.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.current.pitch))
        }

        document.addEventListener('mousemove', handleMouseMove)
        return () => document.removeEventListener('mousemove', handleMouseMove)
    }, [])

    useEffect(() => {
        const canvas = document.querySelector('canvas')
        const handleClick = () => {
            if (!freecam) canvas.requestPointerLock()
        }

        canvas.addEventListener('click', handleClick)
        return () => canvas.removeEventListener('click', handleClick)
    }, [freecam])

    useEffect(() => {
        if (freecam && document.pointerLockElement) {
            document.exitPointerLock()
        }
    }, [freecam])

    useFrame(() => {
        if (!body.current || !camera.current) return

        const { forward, backward, left, right } = getKeys()
        const linvel = body.current.linvel()

        const dir = new THREE.Vector3(
            (right ? 1 : 0) - (left ? 1 : 0),
            0,
            (backward ? 1 : 0) - (forward ? 1 : 0)
        )

        if (dir.lengthSq() > 0) {
            dir.normalize().applyEuler(new THREE.Euler(0, rotation.current.yaw, 0)).multiplyScalar(speed)
        }

        body.current.setLinvel({ x: dir.x, y: linvel.y, z: dir.z }, true)

        const pos = body.current.translation()

        if (camMode === 'third') {
            const offset = new THREE.Vector3(0, 3, 6).applyEuler(new THREE.Euler(rotation.current.pitch, rotation.current.yaw, 0))
            const target = new THREE.Vector3(pos.x, pos.y, pos.z).add(offset)
            camera.current.position.lerp(target, 0.12)
            camera.current.lookAt(pos.x, pos.y + 1.5, pos.z)
        } else {
            camera.current.position.set(pos.x, pos.y + 1.6, pos.z)
            const lookDir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(rotation.current.pitch, rotation.current.yaw, 0))
            camera.current.lookAt(pos.x + lookDir.x, pos.y + 1.6 + lookDir.y, pos.z + lookDir.z)
        }
    })

    return (
        <>
            <PerspectiveCamera
                ref={camera}
                makeDefault
                fov={camMode === 'first' ? 75 : 60}
            />

            <RigidBody
                ref={body}
                name='Player'
                type="dynamic"
                colliders={false}
                position={[0, 2, 0]}
                enabledRotations={[false, false, false]}
            >
                <CapsuleCollider args={[0.5, 1]} />
                <mesh castShadow>
                    <capsuleGeometry args={[0.5, 2, 8, 16]} />
                    <meshStandardMaterial color="pink" />
                </mesh>
            </RigidBody>
        </>
    )
}

//* Props and stuff
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

function SensorBlock({ pos = [0, 0, -3], scale = [1, 0.5, 1], shown = true, onPlayerEnter }) {
    const [active, setActive] = useState(false);

    return (
        <RigidBody
            type="fixed"
            position={pos}
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
        >
            {shown && (
                <mesh receiveShadow castShadow>
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

//* Scene stuff
function DirectionalLight({ debug }) {
    const directionalLightRef = useRef()
    const shadowCameraRef = useRef()

    useHelper(debug ? directionalLightRef : null, THREE.DirectionalLightHelper, 5, 'hotpink')

    useEffect(() => {
        if (!debug || !directionalLightRef.current) return

        shadowCameraRef.current = new THREE.CameraHelper(directionalLightRef.current.shadow.camera)
        directionalLightRef.current.add(shadowCameraRef.current)

        return () => {
            directionalLightRef.current.remove(shadowCameraRef.current)
            shadowCameraRef.current.dispose()
        }
    }, [debug])

    return (
        <directionalLight
            ref={directionalLightRef}
            position={[10, 15, 10]}
            castShadow
            intensity={1}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={1}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
        />
    )
}

function DebugFreecam({ enabled }) {
    const cameraRef = useRef()

    if (!enabled) return null

    return (
        <>
            <PerspectiveCamera
                ref={cameraRef}
                makeDefault
                position={[0, 5, 10]}
                fov={75}
            />
            <OrbitControls />
        </>
    )
}

//* App
export default function App() {
    const [debug, setDebug] = useState(false)
    const [freecam, setFreecam] = useState(false)

    useHotkeys('f', () => setFreecam(v => !v))
    useHotkeys('o', () => setDebug(v => !v))

    return (
        <KeyboardControls map={controlsMap}>
            <Canvas shadows>
                <DebugFreecam enabled={freecam} />

                <ambientLight intensity={0.5} />
                <DirectionalLight debug={debug} />

                <Physics debug={debug}>
                    <Ground />
                    <Player freecam={freecam} />
                    <Wall />
                    <SensorBlock scale={[1, 4, 4]} shown={debug} onPlayerEnter={() => console.log("Player detected!")} />
                </Physics>
            </Canvas>
        </KeyboardControls>
    )
}

