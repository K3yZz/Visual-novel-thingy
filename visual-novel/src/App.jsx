import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { useHotkeys } from 'react-hotkeys-hook'

const controlsMap = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "left", keys: ["ArrowLeft", "KeyA"] },
    { name: "right", keys: ["ArrowRight", "KeyD"] },
    { name: "jump", keys: ["Space"] }, // only for freecam (up)
    { name: "crouch", keys: ["KeyC"] }, // only for freecam (down)
    { name: "sprint", keys: ["Shift"] } // only for freecam AND EVENTUALLY GAME (speed+)
];

import Player from './components/Player'
import { Ground, Wall, House, SensorBlock } from './components/Props'
import { DirectionalLight } from './components/LightsCameraAction'

export default function App() {
    const [debug, setDebug] = useState(false)
    const [freecam, setFreecam] = useState(false)

    useHotkeys('f', () => setFreecam(v => !v))
    useHotkeys('o', () => setDebug(v => !v))

    return (
        <KeyboardControls map={controlsMap}>
            <Canvas className='bg-black' shadows>
                <ambientLight intensity={0.5} />
                <DirectionalLight debug={debug} />

                <Physics debug={debug}>
                    <Ground />
                    <Player freecam={freecam} />
                    <House />

                    <Wall />
                    {/* <SensorBlock scale={[2, 6.2, 2]} visible={debug} onPlayerEnter={() => console.log("Player detected!")} /> */}
                </Physics>

            </Canvas>
        </KeyboardControls>
    )
}