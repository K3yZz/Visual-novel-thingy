import { useState, useEffect, useRef } from 'react'
import { useLoader, useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CuboidCollider, CylinderCollider, BallCollider } from '@react-three/rapier'
import { PerspectiveCamera, useKeyboardControls } from '@react-three/drei'

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import * as THREE from 'three'

import { registerSelf, getObjFromId, getIdsFromObjType } from './DevtoolsRewrite'

//* Helpers
/** 
 * @param {object} size object size
 * 
 * @returns half of size
 * @category helper
 */
function getHalfExtents(size) {
    return size.map(v => v / 2)
}

/**
 * Register a object.
 * 
 * @param {string} name id of object
 * @param {object} ref object body
 * @param {function} type type of object
 * 
 * @category helper
 */
function useRegister(name, ref, type) {
    useEffect(() => {
        if (ref.current) registerSelf(name, ref.current, type)
    }, [name, ref, type])
}







//* Objects
/**
 * @todo Add texture loader 
 * 
 * @param {object} pos position
 * @param {object} size dimensions
 * @param {object} rot rotation
 * @param {string} name ID for object
 * @param {string} color (will be replaced with a texture loader)
 * @param {boolean} visible Determines visiblity of object
 * 
 * @example <Box pos={[0, 0, 0]} size={[2, 4, 5] rot={[23, 54, 0]} name={'exampleBox'} />
 * @category object
 */
function Box({
    pos = [0, 0, 0],
    size = [1, 1, 1],
    rot = [0, 0, 0],
    name = 'name',
    color = 'red',
    visible
}) {
    const boxRef = useRef()
    useRegister(name, boxRef, Box)

    return (
        <RigidBody
            ref={boxRef}
            type='fixed'
            position={pos}
            rotation={rot}
            name={name}
        >
            {/* Collider */}
            <CuboidCollider
                args={getHalfExtents(size)}
            />

            {/* Mesh */}
            {!visible && (
                <mesh receiveShadow>
                    <boxGeometry args={size} />
                    <meshStandardMaterial color={color} />
                </mesh>
            )}
        </RigidBody>
    )
}

/**
 * @param {object} pos position
 * @param {object} size dimensions
 * @param {object} rot rotation
 * @param {string} name ID for object
 * @param {boolean} visible Determines visiblity of object
 * @param {object} onPlayerEnter what runs on sensor contact
 * 
 * @example <Sensor 
 * pos={[0, 0, 0]} 
 * size={[2, 4, 5] 
 * name={'exampleSensor'}  
 * onPlayerEnter={() => { console.log('Teleport triggered!'); }} />
 * @category object
 */
function Sensor({
    pos = [0, 0, 0],
    size = [1, 1, 1],
    rot = [0, 0, 0],
    name = 'name',
    visible,
    onPlayerEnter
}) {
    const [active, setActive] = useState(false);

    const sensorRef = useRef()
    useRegister(name, sensorRef, Sensor)


    useEffect(() => {
        console.log(getIdsFromObjType(Sensor))
    }, [])

    return (
        <RigidBody
            ref={sensorRef}
            type='fixed'
            position={pos}
            rotation={rot}
            name={name}
        >
            {/* Collider */}
            <CuboidCollider
                args={getHalfExtents(size)}
                sensor
                onIntersectionEnter={(other) => {
                    if (other.rigidBodyObject?.userData?.id === 'player') {
                        onPlayerEnter?.()
                        setActive(true)
                    }
                }}
                onIntersectionExit={(other) => {
                    if (other.rigidBodyObject?.userData?.id === 'player') {
                        setActive(false)
                    }
                }}
            />

            {/* mesh */}
            {visible && (
                <mesh receiveShadow>
                    <boxGeometry args={size} />
                    <meshStandardMaterial
                        transparent
                        opacity={!active ? 0.3 : 0.5}
                        color={!active ? 'red' : 'gray'}
                    />
                </mesh>
            )}
        </RigidBody>
    )
}

export { Box, Sensor }