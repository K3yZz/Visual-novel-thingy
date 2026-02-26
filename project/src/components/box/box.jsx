import { React, Rapier, Zustand, Immer, Leva, Drei } from '@lib/imports'

const boxStore = Zustand.create((set) => ({
  boxes: {},
  setBox: (id, newData) =>
    set((state) =>
      Immer.produce(state, (draft) => {
        draft.boxes[id] = { ...draft.boxes[id], ...newData }
      })
    ),
}))

function Box({ id, pos=[0,0,0], rot=[0,0,0], size=[1,1,1], visible=true, textures={} }) {
  const boxRef = React.useRef()
  const setBox = Zustand.useStore(boxStore, state => state.setBox)
  const boxState = Zustand.useStore(boxStore, state => state.boxes[id] ?? {})

  React.useEffect(() => {
    if (!boxState.pos) setBox(id, { pos, rot, size, visible })
  }, [])

  const controls = Leva.useControls(id, React.useMemo(() => ({
    pos: boxState.pos || pos,
    rot: boxState.rot || rot,
    size: boxState.size || size,
    visible: boxState.visible ?? visible
  }), [boxState.pos, boxState.rot, boxState.size, boxState.visible, pos, rot, size, visible]))

  React.useEffect(() => {
    setBox(id, {
      pos: [...controls.pos],
      rot: [...controls.rot],
      size: [...controls.size],
      visible: controls.visible
    })
  }, [id, controls.visible, ...controls.pos, ...controls.rot, ...controls.size])

  const _blankDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEX///+nxBvIAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII='
  const diffuseTex = Drei.useTexture(textures.diffuse || _blankDataUrl)
  const normalTex = Drei.useTexture(textures.normal || _blankDataUrl)
  const armTex = Drei.useTexture(textures.arm || _blankDataUrl)

  const materialProps = React.useMemo(() => ({
    map: diffuseTex,
    normalMap: normalTex,
    roughnessMap: armTex
  }), [diffuseTex, normalTex, armTex])

  const finalSize = boxState.size || size
  const halfSize = finalSize.map(s => s / 2)

  return (
    <Rapier.RigidBody ref={boxRef} type="fixed" position={boxState.pos || pos} rotation={boxState.rot || rot}>
      <Rapier.CuboidCollider args={halfSize} />
      {(boxState.visible !== undefined ? boxState.visible : visible) &&
        <mesh receiveShadow castShadow>
          <boxGeometry args={finalSize} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      }
    </Rapier.RigidBody>
  )
}

export { Box, boxStore }