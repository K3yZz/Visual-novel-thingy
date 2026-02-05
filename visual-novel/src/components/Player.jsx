import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { useKeyboardControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useHotkeys } from 'react-hotkeys-hook'

export default function Player({ freecam }) {
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
                name="Player"
                type="dynamic"
                colliders={false}
                position={[0, 2, 0]}
                enabledRotations={[false, false, false]}
            >
                <CapsuleCollider args={[0.5, 1]} />
                <mesh castShadow>
                    <capsuleGeometry args={[0.5, 2, 8, 16]} />
                    <meshStandardMaterial color="red" />
                </mesh>
            </RigidBody>
        </>
    )
}