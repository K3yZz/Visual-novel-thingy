import { useRef, useEffect } from 'react'
import { PerspectiveCamera, OrbitControls, useHelper } from '@react-three/drei'
import * as THREE from 'three'

function DirectionalLight({ debug }) {
    const directionalLightRef = useRef()
    const shadowCameraRef = useRef()

    useHelper(debug ? directionalLightRef : null, THREE.DirectionalLightHelper, 5, 'hotpink')

    useEffect(() => {
        if (!debug || !directionalLightRef.current) return

        shadowCameraRef.current = new THREE.CameraHelper(directionalLightRef.current.shadow.camera)
        directionalLightRef.current.add(shadowCameraRef.current)

        return () => {
            directionalLightRef.current.remove(shadowCameraRef.current)
            shadowCameraRef.current.dispose()
        }
    }, [debug])

    return (
        <directionalLight
            ref={directionalLightRef}
            position={[10, 15, 10]}
            castShadow
            intensity={1}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={1}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
        />
    )
}

export {DirectionalLight }