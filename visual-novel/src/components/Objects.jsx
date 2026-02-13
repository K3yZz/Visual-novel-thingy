//Props.jsx
import { useState, useEffect, useRef } from 'react'
import { useLoader, useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CuboidCollider, CylinderCollider, BallCollider } from '@react-three/rapier'
import { PerspectiveCamera, useKeyboardControls } from '@react-three/drei'

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import * as THREE from 'three'

// Can be created > 1
function Wall({ pos = [0, 0, 3], scale = [1, 0.5, 1] }) {
    const id = useRef(createId("wall"))
    const body = useRef(null);

    useEffect(() => {
        if (body.current) registerBody(id.current, body);
    }, []);


    const halfExtents = [scale[0] / 2, scale[1] / 2, scale[2] / 2];

    return (
        <RigidBody ref={body} type="fixed" position={pos} userData={{ id: id.current }} >
            <CuboidCollider args={halfExtents} />
            <mesh receiveShadow>
                <boxGeometry args={scale} />
                <meshStandardMaterial color="orange" />
            </mesh>
        </RigidBody>
    );
}

function Sensor({ pos = [0, 0, -3], scale = [1, 0.5, 1], visible = false, onPlayerEnter }) {
    const id = useRef(createId("sensor"))
    const body = useRef(null);

    useEffect(() => {
        if (body.current) registerBody(id.current, body);
    }, []);

    const [active, setActive] = useState(false);

    const halfExtents = [scale[0] / 2, scale[1] / 2, scale[2] / 2];

    return (
        <RigidBody ref={body} type="fixed" position={pos} userData={{ id: id.current }} >
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

//change this later to support any mesh 
// (basically a helper tool instead of a hardcoded house)
function House({ pos = [0, 6, -10], scale = 0.8 }) {
    const id = useRef(createId("house"))
    const body = useRef(null);

    useEffect(() => {
        if (body.current) registerBody(id.current, body);
    }, []);

    const texture = useLoader(THREE.TextureLoader, '/models/cottage_diffuse.png');
    const normalMap = useLoader(THREE.TextureLoader, '/models/cottage_normal.png');

    const materials = useLoader(MTLLoader, '/models/cottage_obj.mtl')
    const obj = useLoader(
        OBJLoader,
        '/models/cottage_obj.obj',
        (loader) => {
            materials.preload()
            loader.setMaterials(materials)
        }
    )
    obj.scale.setScalar(scale)

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
        <RigidBody ref={body} type="fixed" colliders={false} userData={{ id: id.current }} >
            <primitive object={obj} position={pos} />
            <CuboidCollider args={[15, 6, 8]} rotation={[0, 0.1, 0]} position={pos} />
        </RigidBody>
    );
}

// Created once
function Ground() {
    const id = useRef(createId("ground"))
    const body = useRef(null);

    useEffect(() => {
        if (body.current) registerBody(id.current, body);
    }, []);

    return (
        <RigidBody ref={body} type="fixed" userData={{ id: id.current }} >
            <CuboidCollider args={[100, 0.01, 100]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="blue" />
            </mesh>
        </RigidBody>
    );
}

//clean this up + add comments later
function Player({ freecam = false }) {
    const body = useRef(null)
    const camera = useRef(null)

    useEffect(() => {
        if (body.current) registerBody(id.current, body);
    }, []);

    const { gl } = useThree()
    const [, getKeys] = useKeyboardControls()

    const speed = 6
    const mouseSensitivity = 0.002

    const tmpVec = useRef(new THREE.Vector3())

    const rotation = useRef({ yaw: 0, pitch: 0 })

    useEffect(() => {
        const onMouseMove = (e) => {
            if (document.pointerLockElement !== gl.domElement) return

            rotation.current.yaw -= e.movementX * mouseSensitivity
            rotation.current.pitch -= e.movementY * mouseSensitivity

            rotation.current.pitch = THREE.MathUtils.clamp(
                rotation.current.pitch,
                -Math.PI / 2 + 0.01,
                Math.PI / 2 - 0.01
            )
        }

        gl.domElement.addEventListener('mousemove', onMouseMove)
        return () => gl.domElement.removeEventListener('mousemove', onMouseMove)
    }, [gl])

    useEffect(() => {
        const handleClick = () => {
            if (!document.fullscreenElement) {
                gl.domElement.requestFullscreen().catch(console.warn)
            }
            gl.domElement.requestPointerLock()
        }
        gl.domElement.addEventListener('click', handleClick)
        return () => gl.domElement.removeEventListener('click', handleClick)
    }, [gl])

    useFrame((_, delta) => {
        const { forward, backward, left, right, jump, crouch, sprint } = getKeys()

        const moveDir = tmpVec.current.set(
            (right ? 1 : 0) - (left ? 1 : 0),
            0,
            (backward ? 1 : 0) - (forward ? 1 : 0)
        )

        if (freecam) {
            if (jump) moveDir.y += 1
            if (crouch) moveDir.y -= 1

            if (moveDir.lengthSq() > 0) {
                moveDir
                    .normalize()
                    .applyEuler(new THREE.Euler(0, rotation.current.yaw, 0))
            }

            let currentSpeed = speed
            if (sprint) currentSpeed *= 3

            if (camera.current) {
                camera.current.position.addScaledVector(moveDir, currentSpeed * delta)

                const q = new THREE.Quaternion()
                q.setFromEuler(
                    new THREE.Euler(rotation.current.pitch, rotation.current.yaw, 0, 'YXZ')
                )
                camera.current.quaternion.copy(q)
            }

            return
        }

        if (!body.current) return

        if (moveDir.lengthSq() > 0) {
            moveDir
                .normalize()
                .applyEuler(new THREE.Euler(0, rotation.current.yaw, 0))
                .multiplyScalar(speed)
        }

        const linvel = body.current.linvel()
        body.current.setLinvel(
            { x: moveDir.x, y: linvel.y, z: moveDir.z },
            true
        )

        body.current.setRotation(
            new THREE.Quaternion().setFromEuler(
                new THREE.Euler(0, rotation.current.yaw, 0)
            ),
            true
        )

        if (camera.current) {
            const pos = body.current.translation()
            camera.current.position.set(pos.x, pos.y + 1.6, pos.z)

            const q = new THREE.Quaternion()
            q.setFromEuler(
                new THREE.Euler(rotation.current.pitch, rotation.current.yaw, 0, 'YXZ')
            )
            camera.current.quaternion.copy(q)
        }
    })

    return (
        <>
            <PerspectiveCamera
                ref={camera}
                makeDefault
                fov={75}
                near={0.1}
                far={1000}
            />

            <RigidBody
                ref={body}
                userData={{ id: id.current }}
                colliders={false}
                enabledRotations={[false, false, false]}
                position={[0, 2, 0]}
                linearDamping={0.5}
            >
                <CylinderCollider args={[1, 0.5]} />
                <BallCollider args={[0.5]} position={[0, 1, 0]} />
                <BallCollider args={[0.5]} position={[0, -1, 0]} />

                {freecam &&
                    <mesh castShadow>
                        <capsuleGeometry args={[0.5, 2, 8, 16]} />
                        <meshStandardMaterial color="red" />
                    </mesh>
                }
            </RigidBody>
        </>
    )
}

export { Wall, House, Sensor, Ground, Player }