import * as THREE from "three";

let last = null;

function setEmissive(obj, intensity) {
  // Works for MeshStandardMaterial / MeshPhysicalMaterial
  const m = obj.material;
  if (!m) return;

  // If material is an array (rare), handle each
  const mats = Array.isArray(m) ? m : [m];

  for (const mat of mats) {
    if (!mat) continue;
    if ("emissive" in mat) {
      if (!mat.userData.__baseEmissive) {
        mat.userData.__baseEmissive = mat.emissive.clone();
      }
      mat.emissive = mat.userData.__baseEmissive.clone();
      mat.emissive.lerp(new THREE.Color(0xffffff), intensity);
      mat.emissiveIntensity = 0.35 + intensity * 0.85;
      mat.needsUpdate = true;
    }
  }
}

export function updateHoverGlow(hitObject, timeSeconds) {
  // remove glow from previous
  if (last && last !== hitObject) {
    setEmissive(last, 0);
    last = null;
  }

  if (!hitObject) return;

  // pulse gently
  const pulse = 0.25 + 0.25 * Math.sin(timeSeconds * 5.0);
  setEmissive(hitObject, pulse);
  last = hitObject;
}

export function clearHoverGlow() {
  if (last) setEmissive(last, 0);
  last = null;
}