import { React, Rapier, ReactThreeFiber as r3f, Zustand, Immer, Leva, THREE, Drei } from '@lib/imports'

const playerStore = Zustand.create((set) => ({
  pos: [0, 2, 0],
  setPos: (newPos) => set({ pos: newPos }),
  rotation: { yaw: 0, pitch: 0 },
  setRotation: (rot) => set({ rotation: rot }),
}))

function Player({ freecam = false, speed = 6 }) {
  const rbRef = React.useRef()
  const cameraRef = React.useRef()
  const { gl } = r3f.useThree()
  const tmpVec = React.useRef(new THREE.Vector3())
  const [, getKeys] = Drei.useKeyboardControls()
  const mouseSensitivity = 0.002
  const rotation = React.useRef({ yaw: 0, pitch: 0 })
  const setPos = Zustand.useStore(playerStore, (state) => state.setPos)
  const setRotation = Zustand.useStore(playerStore, (state) => state.setRotation)
  const pos = Zustand.useStore(playerStore, (state) => state.pos)

  React.useEffect(() => {
    const onMouseMove = (e) => {
      if (document.pointerLockElement !== gl.domElement) return
      rotation.current.yaw -= e.movementX * mouseSensitivity
      rotation.current.pitch -= e.movementY * mouseSensitivity
      rotation.current.pitch = THREE.MathUtils.clamp(rotation.current.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01)
      setRotation({ ...rotation.current })
    }
    gl.domElement.addEventListener('mousemove', onMouseMove)
    return () => gl.domElement.removeEventListener('mousemove', onMouseMove)
  }, [gl, setRotation])

  React.useEffect(() => {
    const handleClick = () => {
      if (!document.fullscreenElement) gl.domElement.requestFullscreen().catch(() => {})
      gl.domElement.requestPointerLock()
    }
    gl.domElement.addEventListener('click', handleClick)
    return () => gl.domElement.removeEventListener('click', handleClick)
  }, [gl])

  r3f.useFrame((_, delta) => {
    const { forward, backward, left, right, jump, crouch, sprint } = getKeys()
    const moveDir = tmpVec.current.set((right ? 1 : 0) - (left ? 1 : 0), 0, (backward ? 1 : 0) - (forward ? 1 : 0))

    if (freecam) {
      if (jump) moveDir.y += 1
      if (crouch) moveDir.y -= 1
      if (moveDir.lengthSq() > 0) {
        moveDir.normalize().applyEuler(new THREE.Euler(0, rotation.current.yaw, 0)).multiplyScalar(speed * delta * (sprint ? 3 : 1))
      }
      if (cameraRef.current) {
        cameraRef.current.position.add(moveDir)
        cameraRef.current.quaternion.setFromEuler(new THREE.Euler(rotation.current.pitch, rotation.current.yaw, 0, 'YXZ'))
      }
      setPos(cameraRef.current.position.toArray())
      return
    }

    if (!rbRef.current) return
    if (moveDir.lengthSq() > 0) {
      moveDir.normalize().applyEuler(new THREE.Euler(0, rotation.current.yaw, 0)).multiplyScalar(speed)
    }

    const linvel = rbRef.current.linvel()
    rbRef.current.setLinvel({ x: moveDir.x, y: linvel.y, z: moveDir.z }, true)
    rbRef.current.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotation.current.yaw, 0)), true)

    if (cameraRef.current) {
      const t = rbRef.current.translation()
      cameraRef.current.position.set(t.x, t.y + 1.6, t.z)
      cameraRef.current.quaternion.setFromEuler(new THREE.Euler(rotation.current.pitch, rotation.current.yaw, 0, 'YXZ'))
    }

    const t = rbRef.current.translation()
    setPos([t.x, t.y, t.z])
  })

  return (
    <>
      <r3f.PerspectiveCamera ref={cameraRef} makeDefault fov={75} near={0.1} far={1000} />
      <Rapier.RigidBody
        ref={rbRef}
        type={freecam ? 'kinematicPosition' : 'dynamic'}
        position={pos}
        enabledRotations={!freecam ? [false, false, false] : undefined}
        linearDamping={!freecam ? 0.5 : undefined}
      >
        <Rapier.CylinderCollider args={[1, 0.5]} />
        <Rapier.BallCollider args={[0.5]} position={[0, 1, 0]} />
        <Rapier.BallCollider args={[0.5]} position={[0, -1, 0]} />
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[0.5, 2, 8, 16]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </Rapier.RigidBody>
    </>
  )
}

export { Player, playerStore }