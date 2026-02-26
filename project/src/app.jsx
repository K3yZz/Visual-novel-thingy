import { React, ReactThreeFiber as R3F, Rapier, Drei, Hotkeys } from '@lib/imports'

import { Box } from './components/box/box'
import { Sensor } from './components/sensor/sensor'
import { Model } from './components/model/model'
import { Player } from './components/player/player'

const controlsMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },

  //freecam
  { name: 'jump', keys: ['Space'] },
  { name: 'crouch', keys: ['KeyC'] },
  { name: 'sprint', keys: ['Shift'] }
];

function LoaderOverlay() {
  const { active, progress, loaded, total } = Drei.useProgress()
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    if (active || total > 0 || loaded > 0) setShow(true)
    if (!active && total > 0 && loaded >= total) {
      const t = setTimeout(() => setShow(false), 300)
      return () => clearTimeout(t)
    }
  }, [active, loaded, total])

  if (!show) return null

  const percent = total > 0 ? Math.round((loaded / total) * 100) : Math.round(progress)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none', zIndex: 50 }}>
      <div style={{ background: 'rgba(0,0,0,0.6)', padding: '18px 24px', borderRadius: 8, color: '#fff', textAlign: 'center', pointerEvents: 'auto' }}>
        <div style={{ fontSize: 14, marginBottom: 8 }}>Loading assets — {percent}% ({loaded}/{total || '??'})</div>
        <div style={{ width: 240, height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: '#fff', transition: 'width 120ms linear' }} />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [freecam, setFreecam] = React.useState(false)
  Hotkeys.useHotkeys('f', () => setFreecam(v => !v))

  return (
    <div className="app" style={{ position: 'relative' }}>
      <Drei.KeyboardControls map={controlsMap}>
        <R3F.Canvas>
          
          <ambientLight intensity={3} />
          <pointLight position={[10, 10, 10]} />

          <React.Suspense fallback={null}>
            <Rapier.Physics debug>
              <Player id='player' freecam={freecam} />
              <Box id='ground' pos={[0, 0, 0]} size={[300, 1, 300]} textures={{ arm: '/textures/ground_1/arm.jpg', diffuse: '/textures/ground_1/diff.jpg', normal: '/textures/ground_1/normal.jpg' }} />
              <Sensor id='voidCatcher' pos={[0, -10, 0]} size={[350, 1, 350]} visible={false} />
              <Model id='fish' pos={[0, 0.5, 0]} modelPath='/models/Fish.glb' />
            </Rapier.Physics>
          </React.Suspense>
          
        </R3F.Canvas>
      </Drei.KeyboardControls>
      <LoaderOverlay />

    </div>
  );
}