//app.jsx
import { useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { useHotkeys } from 'react-hotkeys-hook'

import * as obj from './components/ObjectsRewrite'
import { teleport } from './components/Devtools'
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
    const playerRef = useRef();

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
                    <obj.Box name={'ground'} scale={[100, 0.1, 100]} color={'blue'} /> {/* Default rotation and position*/}
                    {/* create player */}
                    <obj.Player  name={'player'} ref={playerRef} freecam={freecam} />

                    {/* create world */}
                    <obj.Box type={'Box'} name={'testBlock'} pos={[0, 0, 3]} scale={[1, 0.5, 1]} />
                    <obj.Box type={'Box'} name={'testBlock2'} pos={[0, 0, 5]} scale={[1, 0.5, 1]} />
                    <obj.Box
                        type={'Sensor'}
                        name={'antiVoidSensor'}
                        pos={[0, -15, 0]}
                        scale={[300, 5, 300]}
                        visible={debug}
                        opacity={0.3}
                        onPlayerEnter={() => {
                            console.log('Teleport triggered!');
                            teleport('player', { x: 0, y: 10, z: 0 });
                        }}
                    />
                </Physics>

            </Canvas>
        </KeyboardControls>
    )
}