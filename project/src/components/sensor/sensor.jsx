import { React, Rapier, Zustand, Immer, Leva } from '@lib/imports'

const sensorStore = Zustand.create((set) => ({
    sensors: {},
    setSensor: (id, newData) =>
        set((state) =>
            Immer.produce(state, (draft) => {
                draft.sensors[id] = { ...draft.sensors[id], ...newData }
            })
        ),
}))

function Sensor({ id, pos = [0, 0, 0], rot = [0, 0, 0], size = [1, 1, 1], visible = true }) {
    const sensorRef = React.useRef()
    const setSensor = Zustand.useStore(sensorStore, state => state.setSensor)
    const sensorState = Zustand.useStore(sensorStore, state => state.sensors[id] ?? {})

    React.useEffect(() => {
        if (!sensorState.pos) setSensor(id, { pos, rot, size, visible })
    }, [])

    const controls = Leva.useControls(id, React.useMemo(() => ({
        pos: sensorState.pos || pos,
        rot: sensorState.rot || rot,
        size: sensorState.size || size,
        visible: sensorState.visible ?? visible
    }), [sensorState.pos, sensorState.rot, sensorState.size, sensorState.visible, pos, rot, size, visible]))

    React.useEffect(() => {
        setSensor(id, {
            pos: [...controls.pos],
            rot: [...controls.rot],
            size: [...controls.size],
            visible: controls.visible
        })
    }, [id, controls.visible, ...controls.pos, ...controls.rot, ...controls.size])

    const finalSize = sensorState.size || size
    const halfSize = finalSize.map(s => s / 2)

    return (
        <Rapier.RigidBody ref={sensorRef} type="fixed" position={sensorState.pos || pos} rotation={sensorState.rot || rot}>
            <Rapier.CuboidCollider
                args={halfSize}
                sensor
                onIntersectionEnter={(other) => {
                    if (other.rigidBodyObject?.userData?.id === 'player') {
                        console.log(`Player entered sensor ${id}`)
                    }
                }}
                onIntersectionExit={(other) => {
                    if (other.rigidBodyObject?.userData?.id === 'player') {
                        console.log(`Player exited sensor ${id}`)
                    }
                }}
            />
            {(sensorState.visible !== undefined ? sensorState.visible : visible) &&
                <mesh receiveShadow castShadow>
                    <boxGeometry args={finalSize} />
                    <meshStandardMaterial
                        color="red"
                        transparent
                        opacity={0.5}
                    />
                </mesh>
            }
        </Rapier.RigidBody>
    )
}

export { Sensor, sensorStore }