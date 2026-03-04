import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

export function createPointerLockControls(camera, domElement) {
  const controls = new PointerLockControls(camera, domElement);

  function lock() {
    controls.lock();
  }

  function unlock() {
    controls.unlock();
  }

  return { controls, lock, unlock };
}