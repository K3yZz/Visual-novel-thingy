import { useRef, useEffect } from '@/lib/react'
import { useFrame, useThree } from '@/lib/r3f'
import { create } from '@/lib/other'
import * as THREE from '@/lib/three'
import { RigidBody, CylinderCollider, BallCollider, useKeyboardControls, PerspectiveCamera } from '@/lib/physics'

const usePlayerStore = create((set) => ({
    freecam: false,
    speed: 6,
    rotation: { yaw: 0, pitch: 0 },
    position: { x: 0, y: 2, z: 0 },

    //actions
    setFreecam: (value) => set({ freecam: value }),
    setRotation: (rotation) => set({ rotation }),
    setPosition: (position) => set({ position }),
    setSpeed: (speed) => set({ speed }),
}))

function Player() {
    const playerRef = useRef()
    const cameraRef = useRef()
    const { gl } = useThree()
    const [, getKeys] = useKeyboardControls()

    const freecam = usePlayerStore((state) => state.freecam)
    const speedBase = usePlayerStore((state) => state.speed)
    const rotationStore = usePlayerStore((state) => state.rotation)
    const setRotationStore = usePlayerStore((state) => state.setRotation)
    const setPositionStore = usePlayerStore((state) => state.setPosition)

    const tmpVec = useRef(new THREE.Vector3())
    const rotation = useRef({ yaw: rotationStore.yaw, pitch: rotationStore.pitch })
    const lastStorePos = useRef({ ...usePlayerStore.getState().position })

    //handle camera rotation
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (document.pointerLockElement !== gl.domElement) return
            rotation.current.yaw -= e.movementX * 0.002
            rotation.current.pitch -= e.movementY * 0.002
            rotation.current.pitch = THREE.MathUtils.clamp(rotation.current.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01)
            setRotationStore({ ...rotation.current })
        }
        gl.domElement.addEventListener('mousemove', handleMouseMove)
        return () => gl.domElement.removeEventListener('mousemove', handleMouseMove)
    }, [gl, setRotationStore])

    //lock the pointer
    useEffect(() => {
        const handleClick = () => {
            if (!document.fullscreenElement) gl.domElement.requestFullscreen().catch(console.warn)
            gl.domElement.requestPointerLock()
        }
        gl.domElement.addEventListener('click', handleClick)
        return () => gl.domElement.removeEventListener('click', handleClick)
    }, [gl])

    //movement
    useFrame((_, delta) => {
        const storePos = usePlayerStore.getState().position
        if (
            storePos.x !== lastStorePos.current.x ||
            storePos.y !== lastStorePos.current.y ||
            storePos.z !== lastStorePos.current.z
        ) {
            if (playerRef.current) {
                const current = playerRef.current.translation()
                const newPos = {
                    x: THREE.MathUtils.lerp(current.x, storePos.x, 0.2),
                    y: THREE.MathUtils.lerp(current.y, storePos.y, 0.2),
                    z: THREE.MathUtils.lerp(current.z, storePos.z, 0.2)
                }
                playerRef.current.setTranslation(newPos, true)
                if (cameraRef.current) cameraRef.current.position.set(newPos.x, newPos.y + 1.6, newPos.z)
            }
            lastStorePos.current = { ...storePos }
            return
        }

        const keys = getKeys()
        const { forward, backward, left, right, jump, crouch, sprint } = keys
        const moveDir = tmpVec.current.set((right ? 1 : 0) - (left ? 1 : 0), 0, (backward ? 1 : 0) - (forward ? 1 : 0))
        let speed = speedBase
        if (sprint) speed *= 3

        if (freecam) {
            if (jump) moveDir.y += 1
            if (crouch) moveDir.y -= 1
            if (moveDir.lengthSq() > 0) moveDir.normalize().applyEuler(new THREE.Euler(0, rotation.current.yaw, 0))
            if (cameraRef.current) {
                cameraRef.current.position.addScaledVector(moveDir, speed * delta)
                cameraRef.current.quaternion.setFromEuler(new THREE.Euler(rotation.current.pitch, rotation.current.yaw, 0, 'YXZ'))
            }
            setPositionStore({ x: cameraRef.current.position.x, y: cameraRef.current.position.y - 1.6, z: cameraRef.current.position.z })
            lastStorePos.current = usePlayerStore.getState().position
            return
        }

        const player = playerRef.current
        if (!player) return
        if (moveDir.lengthSq() > 0) moveDir.normalize().applyEuler(new THREE.Euler(0, rotation.current.yaw, 0)).multiplyScalar(speed)
        const linvel = player.linvel()
        player.setLinvel({ x: moveDir.x, y: linvel.y, z: moveDir.z }, true)
        player.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotation.current.yaw, 0)), true)

        if (cameraRef.current) {
            const pos = player.translation()
            cameraRef.current.position.set(pos.x, pos.y + 1.6, pos.z)
            cameraRef.current.quaternion.setFromEuler(new THREE.Euler(rotation.current.pitch, rotation.current.yaw, 0, 'YXZ'))
            setPositionStore({ x: pos.x, y: pos.y, z: pos.z })
            lastStorePos.current = { x: pos.x, y: pos.y, z: pos.z }
        }
    })

    //model
    return (
        <>
            <PerspectiveCamera ref={cameraRef} makeDefault fov={75} near={0.1} far={1000} />
            <RigidBody ref={playerRef} colliders={false} enabledRotations={[false, false, false]} position={[0, 2, 0]} linearDamping={0.5}>
                <CylinderCollider args={[1, 0.5]} />
                <BallCollider args={[0.5]} position={[0, 1, 0]} />
                <BallCollider args={[0.5]} position={[0, -1, 0]} />
                {freecam && (
                    <mesh castShadow>
                        <capsuleGeometry args={[0.5, 2, 8, 16]} />
                        <meshStandardMaterial color="red" />
                    </mesh>
                )}
            </RigidBody>
        </>
    )
}

export { Player, usePlayerStore }