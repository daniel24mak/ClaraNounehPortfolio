import * as THREE from "three";

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0b0f);
  scene.fog = new THREE.Fog(0x0b0b0f, 8, 55);
  return scene;
}