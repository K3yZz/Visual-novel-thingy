//ObjectsRewrite.jsx
import { useState, useEffect, useRef, forwardRef, useMemo } from 'react'
import { useLoader, useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CuboidCollider, CylinderCollider, BallCollider } from '@react-three/rapier'
import { PerspectiveCamera, useKeyboardControls } from '@react-three/drei'

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import * as THREE from 'three'

import { registerBody } from './Devtools.jsx';

//* Helpers
function useTexture(texURL) {
    return useMemo(() => {
        if (!texURL) return null
        const loader = new THREE.TextureLoader()
        return loader.load(texURL)
    }, [texURL])
}

function useHalfExtents(scale) {
    return useMemo(() => {
        return scale.map(v => v / 2)
    }, [scale])
}

function useRegisterSelf(rbRef, externalRef, name) {
    useEffect(() => {
        if (!rbRef.current) return

        if (externalRef) externalRef.current = rbRef.current

        registerBody(name, rbRef)
        console.log(`${name} Loaded.`)
    }, [name, rbRef, externalRef])
}

//* Reusable props
/**
 * 
 * @param {*} sensorActive - Box or Sensor
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
    pos = [0, 0, 0],
    scale = [1, 1, 1],
    rot = [0, 0, 0],
    name = 'name',
    color = 'orange',
    sensorActive = false,
    visible = true,
    opacity = 1,
    texURL = '',
    onPlayerEnter
}) {
    const [active, setActive] = useState(false)
    const rbRef = useRef()

    const texture = useTexture(texURL)
    const halfExtents = useHalfExtents(scale)
    useRegisterSelf(rbRef, null, name)

    function SensorCollider() {
        return (
            <CuboidCollider
                args={halfExtents}
                sensor
                onIntersectionEnter={(other) => {
                    if (other.rigidBodyObject?.userData?.id === 'player') {
                        onPlayerEnter?.()
                        setActive(true)
                    }
                }}
                onIntersectionExit={(other) => {
                    if (other.rigidBodyObject?.userData?.id === 'player') {
                        setActive(false)
                    }
                }}
            />
        )
    }

    return (
        <RigidBody
            ref={rbRef}
            type='fixed'
            position={pos}
            rotation={rot}
            name={name}
        >
            {sensorActive ? (
                <SensorCollider />
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

function Model({
    name = 'Name',
    pos = [0, 0, 0],
    scale = [0, 0, 0],
    rot = [0, 0, 0],
    texURL = '',
    normalMapURL = '',
    materialsURL = '',
    modelURL = ''
}) {

}

//* Player
const Player = forwardRef(function Player(
    { freecam = false, name }, externalRef
) {
    const rbRef = useRef()
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

        if (!rbRef.current) return

        if (moveDir.lengthSq() > 0) {
            moveDir
                .normalize()
                .applyEuler(new THREE.Euler(0, rotation.current.yaw, 0))
                .multiplyScalar(speed)
        }

        const linvel = rbRef.current.linvel()

        rbRef.current.setLinvel(
            { x: moveDir.x, y: linvel.y, z: moveDir.z },
            true
        )

        rbRef.current.setRotation(
            new THREE.Quaternion().setFromEuler(
                new THREE.Euler(0, rotation.current.yaw, 0)
            ),
            true
        )

        if (camera.current) {
            const pos = rbRef.current.translation()
            camera.current.position.set(pos.x, pos.y + 1.6, pos.z)

            const q = new THREE.Quaternion()
            q.setFromEuler(
                new THREE.Euler(rotation.current.pitch, rotation.current.yaw, 0, 'YXZ')
            )
            camera.current.quaternion.copy(q)
        }
    })

    useRegisterSelf(rbRef, externalRef, name)
    
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
                ref={rbRef}
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
