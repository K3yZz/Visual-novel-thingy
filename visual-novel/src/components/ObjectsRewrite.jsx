//ObjectsRewrite.jsx
import { useState, useEffect, useRef, forwardRef } from 'react'
import { useLoader, useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CuboidCollider, CylinderCollider, BallCollider } from '@react-three/rapier'
import { PerspectiveCamera, useKeyboardControls } from '@react-three/drei'

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import * as THREE from 'three'

import { registerBody } from './Devtools.jsx';

//* Reusable props
/**
 * 
 * @param {*} type - Box or Sensor
 * @param name - The 'id' of the object
 * @param pos - Position
 * @param scale - Scale
 * @param rot - Rotation
 * @param color - Color of object
 * @param opacity - 0.0 - 1 range where 0.0 is fully transparent and 1 is fully opaque
 * @param texURL - The texture url 
 * @param visible - opacity 0.0 but can change
 * @param onPlayerEnter - run code based on collision with sensor
 */

function Box({
    type = 'Box',
    name = 'Name',
    pos = [0, 0, 0],
    scale = [0, 0, 0],
    rot = [0, 0, 0],
    color = 'orange',
    opacity = 1,
    texURL = '',
    visible = true,
    onPlayerEnter
}) {     
    // This is purely for development (Keep it though)
    const [active, setActive] = useState(false)

    const texture = texURL
        ? useLoader(THREE.TextureLoader, texURL)
        : null

    //Make the collider match the geometry
    const halfExtents = scale.map(v => v / 2);

    console.log(`${name}_Box Loaded.`)

    return (
        <RigidBody
            ref={(rb) => {
                registerBody(name, { current: rb });
            }}
            type='fixed'
            position={pos}
            rotation={rot}
            name={name}
        >
            {type === 'Sensor' ? (
                <CuboidCollider
                    args={halfExtents}
                    sensor
                    onIntersectionEnter={(other) => {
                        if (other.rigidBodyObject?.userData?.id === 'player') {
                            onPlayerEnter?.();
                            setActive(true);
                        }
                    }}
                    onIntersectionExit={(other) => {
                        if (other.rigidBodyObject?.userData?.id === 'player') {
                            setActive(false);
                        }
                    }}
                />
            ) : (
                <CuboidCollider
                    args={halfExtents}
                />
            )}
            {
                visible && (
                    <mesh receiveShadow>
                        <boxGeometry args={scale} />
                        <meshStandardMaterial
                            map={texture}
                            transparent
                            opacity={opacity}
                            color={active ? 'hotpink' : color}
                        />
                    </mesh>
                )
            }
        </RigidBody>
    );
}

//* Player
const Player = forwardRef(function Player(
    { freecam = false, name },
    externalRef
) {
    const body = useRef(null)
    const camera = useRef(null)


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

    console.log(`${name} Loaded.`)

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
                ref={(rb) => {
                    body.current = rb;
                    if (externalRef) externalRef.current = rb;
                    registerBody(name, { current: rb });
                }}
                name={name}
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
                        <meshStandardMaterial color='red' />
                    </mesh>
                }
            </RigidBody>
        </>
    )
})

export { Box, Player }
