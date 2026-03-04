const interactables = new Map(); // object.uuid -> { project }

export function registerInteractable(object3D, data) {
  interactables.set(object3D.uuid, data);
}

export function getInteractable(object3D) {
  return interactables.get(object3D.uuid);
}

export function clearInteractables() {
  interactables.clear();
}