import * as THREE from "three";
import { createGLTFLoader } from "../engine/loaders/gltfLoader.js";
import { registerInteractable } from "../engine/interaction/interactables.js";

export async function build3DExhibitsFromProjects({ scene, projects }) {
  const gltfLoader = createGLTFLoader();
  const exhibits = [];
  const colliders = [];

  for (const p of projects) {
    if (p.type !== "model") continue;

    const pos = p.placement ?? {};

    // Pedestal (table)
    const pedestalRadius = 0.85; // bottom radius
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, pedestalRadius, 0.9, 32),
      new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.92 })
    );
    pedestal.position.set(pos.x ?? 0, 0.45, pos.z ?? 0);
    scene.add(pedestal);

    // Collider for pedestal
    colliders.push({
      type: "cylinder",
      x: pedestal.position.x,
      z: pedestal.position.z,
      r: pedestalRadius
    });

    // Warm tight spotlight
    const spot = new THREE.SpotLight(0xfff1dd, 45, 14, Math.PI / 10, 0.35, 1);
    spot.position.set(pedestal.position.x, 4.8, pedestal.position.z + 0.2);
    spot.target.position.set(pedestal.position.x, 1.2, pedestal.position.z);
    scene.add(spot, spot.target);

    // Load model
    const gltf = await gltfLoader.loadAsync(p.asset);
    const model = gltf.scene;

    model.position.set(pedestal.position.x, 0.9, pedestal.position.z);
    model.rotation.y = ((pos.ry ?? 0) * Math.PI) / 180;
    model.scale.setScalar(p.scale ?? 1);

    model.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    scene.add(model);

    // Clickable: only model meshes (not pedestal)
    model.traverse((obj) => {
      if (obj.isMesh) registerInteractable(obj, { project: p, focusTarget: model });
    });

    const speed = (p.rotateSpeed ?? 6) * (Math.PI / 180);
    exhibits.push({ root: model, speed });
  }

  return { exhibits, colliders };
}