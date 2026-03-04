import * as THREE from "three";

/**
 * zones: array of rects for room clamp
 * colliders: array of cylinders {type:"cylinder", x, z, r}
 */
export function createMovementController({ controls, zones, colliders = [] }) {
  const state = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    enabled: false,
  };

  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();

  const walkSpeed = 1.5;
  const sprintMult = 1.0;
  const damping = 10;

  // player "radius" (collision padding)
  const playerR = 0.55;

  function onKeyDown(e) {
    switch (e.code) {
      case "KeyW": state.forward = true; break;
      case "KeyS": state.backward = true; break;
      case "KeyA": state.left = true; break;
      case "KeyD": state.right = true; break;
      case "ShiftLeft":
      case "ShiftRight": state.sprint = true; break;
    }
  }

  function onKeyUp(e) {
    switch (e.code) {
      case "KeyW": state.forward = false; break;
      case "KeyS": state.backward = false; break;
      case "KeyA": state.left = false; break;
      case "KeyD": state.right = false; break;
      case "ShiftLeft":
      case "ShiftRight": state.sprint = false; break;
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  function insideRect(p, r) {
    return p.x >= r.minX && p.x <= r.maxX && p.z >= r.minZ && p.z <= r.maxZ;
  }

  function clampToRect(p, r, margin) {
    p.x = Math.max(r.minX + margin, Math.min(r.maxX - margin, p.x));
    p.z = Math.max(r.minZ + margin, Math.min(r.maxZ - margin, p.z));
  }

  function clampToZones(pos) {
    const margin = 0.6;

    // If inside any zone, keep it clamped to that zone
    for (const z of zones) {
      if (insideRect(pos, z)) {
        clampToRect(pos, z, margin);
        return;
      }
    }

    // If outside all zones, clamp to nearest zone (simple fallback)
    // pick the first zone as fallback
    if (zones[0]) clampToRect(pos, zones[0], margin);
  }

  function resolveCylinderCollisions(pos) {
    for (const c of colliders) {
      if (c.type !== "cylinder") continue;

      const dx = pos.x - c.x;
      const dz = pos.z - c.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      const minDist = c.r + playerR;

      if (dist < minDist && dist > 0.00001) {
        const push = (minDist - dist);
        pos.x += (dx / dist) * push;
        pos.z += (dz / dist) * push;
      } else if (dist < 0.00001) {
        // exactly on center (rare): push out
        pos.x += minDist;
      }
    }
  }

  function update(dt) {
    if (!state.enabled) return;

    // damp
    velocity.x -= velocity.x * damping * dt;
    velocity.z -= velocity.z * damping * dt;

    direction.set(0, 0, 0);
    if (state.forward) direction.z += 1;
    if (state.backward) direction.z -= 1;
    if (state.left) direction.x -= 1;
    if (state.right) direction.x += 1;
    if (direction.lengthSq() > 0) direction.normalize();

    const speed = walkSpeed * (state.sprint ? sprintMult : 1);
    velocity.x += direction.x * speed * dt;
    velocity.z += direction.z * speed * dt;

    // Move
    controls.moveRight(velocity.x);
    controls.moveForward(velocity.z);

    // Room bounds clamp
    clampToZones(controls.object.position);

    // Obstacle collisions
    resolveCylinderCollisions(controls.object.position);

    // Clamp again (in case collision pushed out)
    clampToZones(controls.object.position);
  }

  function setEnabled(v) {
    state.enabled = v;
  }

  function dispose() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  }

  return { update, setEnabled, dispose };
}