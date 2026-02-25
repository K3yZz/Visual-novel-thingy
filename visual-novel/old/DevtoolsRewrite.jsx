const objMap = new Map();

/**
 * Registers an object to the objMap for later access.
 * 
 * @param {string} name 
 * @param {object} ref 
 * @param {function} rootObj 
 * 
 * @category helper_DEV
 */
function registerSelf(name, ref, type) {
    objMap.set(name, {
        ref,
        type
    })
}

/**
 * 
 * @param {string} name
 * 
 * @returns obj ref
 * @category helper_DEV
 */
function getObjFromId(name) {
    return objMap.get(name)
}

/**
 * 
 * @param {object} ref
 * 
 * @returns all ids from a ref name
 * @example sensorRef -> sensor1, sensor2
 * @category helper_DEV
 */
function getIdsFromObjType(type) {
    const ids = [];

    for (const [key, value] of objMap.entries()) {
        if (value.type === type) {
            ids.push(key);
        }
    }

    return ids;
}

export { registerSelf, getObjFromId, getIdsFromObjType }
