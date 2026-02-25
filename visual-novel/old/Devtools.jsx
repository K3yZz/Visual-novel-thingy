// Devtools.jsx
// import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js'

const bodyMap = new Map();

function registerBody(id, ref) {
  if (!id || !ref?.current) return
  bodyMap.set(id, ref.current)
}

function getBodyFromId(id) {
  return bodyMap.get(id) ?? null
}

function teleport(id, pos) {
  const body = getBodyFromId(id)
  if (!body) return

  const vec = Array.isArray(pos)
    ? { x: pos[0], y: pos[1], z: pos[2] }
    : pos

  body.setTranslation(vec, true)
}

export { teleport, getBodyFromId, registerBody };
