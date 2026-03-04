import * as THREE from "three";
import { getInteractable } from "./interactables.js";

export function createRaycastInteractor({ camera, scene }) {
  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2(0, 0); // center of screen
  let lastHit = null;

  function cast() {
    raycaster.setFromCamera(center, camera);

    const hits = raycaster.intersectObjects(scene.children, true);
    for (const hit of hits) {
      const data = getInteractable(hit.object);
      if (data) {
        lastHit = { object: hit.object, data };
        return lastHit;
      }
    }
    lastHit = null;
    return null;
  }

  function getLastHit() {
    return lastHit;
  }

  return { cast, getLastHit };
}