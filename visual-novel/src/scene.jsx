import { useState } from '@/lib/react'
import { Canvas } from '@/lib/r3f'
import { Physics, KeyboardControls } from '@/lib/physics'
import { useHotkeys } from '@/lib/other'

import { useBoxStore, Box } from './components/box'
import { usePlayerStore, Player } from './components/player'

const controlsMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },

  // free cam
  { name: 'jump', keys: ['Space'] },
  { name: 'crouch', keys: ['KeyC'] },
  { name: 'sprint', keys: ['Shift'] }
];

export default function Scene() {
  const [debug, setDebug] = useState(false)

  const freecam = usePlayerStore((state) => state.freecam)
  const toggleFreecam = usePlayerStore((state) => state.setFreecam)

  const playerPosition = usePlayerStore((state) => state.position)
  const setPlayerPosition = usePlayerStore((state) => state.setPosition)

  useHotkeys('f', () => toggleFreecam(!freecam))
  useHotkeys('p', () => setDebug(v => !v))
  useHotkeys('r', () => {
    setPlayerPosition({ x: 0, y: 10, z: 0 })
    const pos = usePlayerStore.getState().position
    console.log('Player position reset to', pos)
  })

  const boxes = useBoxStore((state) => state.boxes);

  return (
    <KeyboardControls map={controlsMap}>
      <Canvas className='bg-black' shadows>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={6} shadow-mapSize-width={2048} shadow-mapSize-height={2048} castShadow />

        <Physics debug={debug}>
          {boxes.map((b, i) => (
            <Box key={b.id || i} {...b} />
          ))}
          <Player />
        </Physics>

      </Canvas>
    </KeyboardControls>
  )
}