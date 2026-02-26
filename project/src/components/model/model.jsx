import { React, Rapier, Zustand, Immer, Leva, Drei } from '@lib/imports'

const modelStore = Zustand.create((set) => ({
    models: {},
    setModel: (id, newData) =>
        set((state) =>
            Immer.produce(state, (draft) => {
                draft.models[id] = { ...draft.models[id], ...newData }
            })
        ),
}))

function Model({ id, pos=[0,0,0], rot=[0,0,0], size=[1,1,1], visible=true, modelPath }) {
    const modelRef = React.useRef()
    const setModel = Zustand.useStore(modelStore, state => state.setModel)
    const modelState = Zustand.useStore(modelStore, state => state.models[id] ?? {})
    const { scene } = Drei.useGLTF(modelPath)

    React.useEffect(() => {
        if (!modelState.pos) setModel(id, { pos, rot, size, visible })
    }, [])

    const controls = Leva.useControls(id, React.useMemo(() => ({
        pos: modelState.pos || pos,
        rot: modelState.rot || rot,
        size: modelState.size || size,
        visible: modelState.visible ?? visible
    }), [modelState.pos, modelState.rot, modelState.size, modelState.visible, pos, rot, size, visible]))

    React.useEffect(() => {
        setModel(id, {
            pos: [...controls.pos],
            rot: [...controls.rot],
            size: [...controls.size],
            visible: controls.visible
        })
    }, [id, controls.visible, ...controls.pos, ...controls.rot, ...controls.size])

    const clonedScene = React.useMemo(() => scene?.clone(), [scene])

    return (
        <Rapier.RigidBody ref={modelRef} type="fixed" position={modelState.pos || pos} rotation={modelState.rot || rot}>
            {(modelState.visible !== undefined ? modelState.visible : visible) && clonedScene &&
                <primitive object={clonedScene} scale={modelState.size || size} />
            }
        </Rapier.RigidBody>
    )
}

export { Model, modelStore }
