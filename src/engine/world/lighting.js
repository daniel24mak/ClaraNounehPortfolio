import * as THREE from "three";

export function addLighting(scene) {
  // Brighter ambient fill (still subtle)
  const ambient = new THREE.AmbientLight(0xfff5e6, 0.22);
  scene.add(ambient);

  // Warm hemisphere: lifts walls + floor gently
  const hemi = new THREE.HemisphereLight(0xfff1dd, 0x101018, 0.30);
  scene.add(hemi);
}