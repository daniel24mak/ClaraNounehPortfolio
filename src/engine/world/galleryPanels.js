import * as THREE from "three";

export function addGalleryPanels(scene) {

  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f1e7,
    roughness: 0.9
  });

  const panelDepth = 0.25;
  const panelHeight = 3.2;

  const panels = [];

  function createPanel(width, x, z, rot = 0) {

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, panelHeight, panelDepth),
      panelMaterial
    );

    mesh.position.set(x, panelHeight / 2, z);
    mesh.rotation.y = rot;

    scene.add(mesh);

    panels.push(mesh);
  }

  // Main central island (like reference image)
  createPanel(10, 0, -2);
  createPanel(6, 3.5, -2, Math.PI / 2);
  createPanel(6, -3.5, -2, Math.PI / 2);

  // Secondary panels for navigation
  createPanel(7, -6, 4);
  createPanel(7, 6, 4);

  return panels;
}