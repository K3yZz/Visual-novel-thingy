// Devtools.jsx
// import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js'

const bodyMap = new Map();

function registerBody(id, ref) {
  if (id && ref) bodyMap.set(id, ref);
}

function getBodyFromId(id) {
  return bodyMap.get(id) || null;
}

function teleport(id, pos) {
  const bodyRef = getBodyFromId(id);
  if (!bodyRef?.current) return;

  const vec = Array.isArray(pos)
    ? { x: pos[0], y: pos[1], z: pos[2] }
    : pos;

  bodyRef.current.setTranslation(vec, true);
}

export { teleport, getBodyFromId, registerBody };
