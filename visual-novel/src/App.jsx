//App.jsx
import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { useHotkeys } from 'react-hotkeys-hook'

const controlsMap = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "left", keys: ["ArrowLeft", "KeyA"] },
    { name: "right", keys: ["ArrowRight", "KeyD"] }
];

import Player from './components/Player'
import { Ground, Wall, SensorBlock } from './components/Props'
import { DirectionalLight, DebugFreecam } from './components/LightsCameraAction'

export default function App() {
    const [debug, setDebug] = useState(false)
    const [freecam, setFreecam] = useState(false)

    useHotkeys('f', () => setFreecam(v => !v))
    useHotkeys('o', () => setDebug(v => !v))

    return (
        <KeyboardControls map={controlsMap}>
            <Canvas shadows>
                <DebugFreecam enabled={freecam} />

                <ambientLight intensity={0.5} />
                <DirectionalLight debug={debug} />

                <Physics debug={debug}>
                    <Ground />
                    <Player freecam={freecam} />
                    <Wall />
                    <SensorBlock scale={[1, 4, 4]} shown={debug} onPlayerEnter={() => console.log("Player detected!")} />
                </Physics>
            </Canvas>
        </KeyboardControls>
    )
}