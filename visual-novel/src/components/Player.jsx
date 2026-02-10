import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CylinderCollider, BallCollider } from '@react-three/rapier'
import { PerspectiveCamera } from '@react-three/drei'
import { useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

export default function Player({ freecam = false }) {
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

  gl.domElement.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      gl.domElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen failed:', err)
      })
    }
    gl.domElement.requestPointerLock()
  })

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
        name="Player"
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
