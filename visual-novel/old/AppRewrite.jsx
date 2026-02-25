//app.jsx
import { useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { useHotkeys } from 'react-hotkeys-hook'

import * as obj from './components/ObjectsRewriteRewrite'
import { DirectionalLight } from './components/LightsCameraAction'

const controlsMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
    { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'right', keys: ['ArrowRight', 'KeyD'] },
    { name: 'jump', keys: ['Space'] }, // only for freecam (up)
    { name: 'crouch', keys: ['KeyC'] }, // only for freecam (down)
    { name: 'sprint', keys: ['Shift'] } // only for freecam AND EVENTUALLY GAME (speed+)
];

export default function App() {
    // const playerRef = useRef();

    const [debug, setDebug] = useState(false)
    // const [freecam, setFreecam] = useState(false)

    // useHotkeys('f', () => setFreecam(v => !v))
    useHotkeys('o', () => setDebug(v => !v))

    return (
        <KeyboardControls map={controlsMap}>
            <Canvas className='bg-black' shadows>
                <ambientLight intensity={0.5} />
                <DirectionalLight debug={debug} />

                <Physics debug={debug}>
                    <obj.Box pos={[0, 0, 0]} name={'box1'} />
                    <obj.Sensor visible={debug} pos={[1, 0, 0]} name={'sensor'} />
                    <obj.Sensor visible={debug} pos={[3, 0, 0]} name={'yeah'} />
                    <obj.Sensor visible={debug} pos={[5, 0, 0]} name={'ahwuisadh'} />
                </Physics>

            </Canvas>
        </KeyboardControls>
    )
}