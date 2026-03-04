import * as THREE from "three";
import { createRenderer } from "./engine/renderer.js";
import { createScene } from "./engine/scene.js";
import { createCamera } from "./engine/camera.js";
import { addLighting } from "./engine/world/lighting.js";
import { buildMuseum } from "./engine/world/museumLayout.js";
import { createPointerLockControls } from "./engine/controls/pointerLock.js";
import { createMovementController } from "./engine/controls/movement.js";
import { createRaycastInteractor } from "./engine/interaction/raycaster.js";
import { loadProjects } from "./content/projectRegistry.js";
import { buildGalleryFromProjects } from "./content/buildGallery.js";
import { build3DExhibitsFromProjects } from "./content/build3DExhibit.js";
import { initModal, openModal, isModalOpen } from "./ui/modal.js";
import { updateHoverGlow, clearHoverGlow } from "./engine/utils/debug.js";

export function startApp() {
  const mount = document.getElementById("app");
  mount.innerHTML = "";

  // --- Renderer / Scene / Camera ---
  const renderer = createRenderer();
  mount.appendChild(renderer.domElement);

  const scene = createScene();
  const camera = createCamera();

  addLighting(scene);
  // --- Multi-room museum ---
  const { zones, rooms, colliders: worldColliders } = buildMuseum(scene);

  // --- Controls ---
  const { controls, lock } = createPointerLockControls(camera, renderer.domElement);
  scene.add(controls.object);

  const mover = createMovementController({ controls, zones, colliders: worldColliders });

  // --- Ambient soundscape (loop) ---
  const ambience = new Audio("/audio/museum_ambience_loop.mp3");
  ambience.loop = true;
  ambience.volume = 0.28;

  let ambienceStarted = false;
  function ensureAmbience() {
    if (ambienceStarted) return;
    ambienceStarted = true;
    ambience.play().catch(() => {
      ambienceStarted = false;
    });
  }

  // --- HUD ---
  const hud = document.createElement("div");
  hud.className = "museum-hud";
  hud.innerHTML = `
    <div class="crosshair" id="crosshair"></div>

    <div class="museum-hint" id="hint">
      Click to enter Museum Mode.<br/>
      WASD move · Shift sprint · Esc unlock · Click art to focus
    </div>

    <div class="interact-hint" id="interactHint">Click to view</div>
  `;
  mount.appendChild(hud);

  const interactHint = hud.querySelector("#interactHint");
  const crosshair = hud.querySelector("#crosshair");

  // --- Focus camera animation state ---
  const focus = {
    active: false,
    returning: false,
    fromPos: new THREE.Vector3(),
    fromQuat: new THREE.Quaternion(),
    toPos: new THREE.Vector3(),
    toLookAt: new THREE.Vector3(),
    t: 0,
    dur: 0.35,
    savedPos: new THREE.Vector3(),
    savedQuat: new THREE.Quaternion(),
  };

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  function beginFocusOn(targetGroup) {
    const camObj = controls.object;

    focus.savedPos.copy(camObj.position);
    focus.savedQuat.copy(camObj.quaternion);

    focus.active = true;
    focus.returning = false;
    focus.t = 0;

    focus.fromPos.copy(camObj.position);
    focus.fromQuat.copy(camObj.quaternion);

    const targetPos = new THREE.Vector3();
    targetGroup.getWorldPosition(targetPos);

    const q = new THREE.Quaternion();
    targetGroup.getWorldQuaternion(q);
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(q);

    focus.toLookAt.copy(targetPos);

    const dist = 2.0;
    focus.toPos.copy(targetPos).addScaledVector(forward, dist);
    focus.toPos.y = Math.max(1.6, targetPos.y);
  }

  function beginReturn() {
    const camObj = controls.object;

    focus.active = true;
    focus.returning = true;
    focus.t = 0;

    focus.fromPos.copy(camObj.position);
    focus.fromQuat.copy(camObj.quaternion);

    focus.toPos.copy(focus.savedPos);
  }

  function updateFocus(dt) {
    if (!focus.active) return;

    focus.t += dt;
    const k = Math.min(1, focus.t / focus.dur);
    const e = easeOutCubic(k);

    const camObj = controls.object;
    camObj.position.lerpVectors(focus.fromPos, focus.toPos, e);

    if (focus.returning) {
      camObj.quaternion.slerpQuaternions(focus.fromQuat, focus.savedQuat, e);
    } else {
      const m = new THREE.Matrix4().lookAt(
        camObj.position,
        focus.toLookAt,
        new THREE.Vector3(0, 1, 0)
      );
      const q = new THREE.Quaternion().setFromRotationMatrix(m);
      camObj.quaternion.slerpQuaternions(focus.fromQuat, q, e);
    }

    if (k >= 1) focus.active = false;
  }

  function enterProjectFocus(targetGroup, project) {
    mover.setEnabled(false);
    if (controls.isLocked) controls.unlock();

    beginFocusOn(targetGroup);
    openModal(project);
  }

  // --- Modal ---
  initModal({
    onClose: () => {
      beginReturn();
    },
  });

  // Enable/disable movement based on pointer lock
  controls.addEventListener("lock", () => mover.setEnabled(true));
  controls.addEventListener("unlock", () => mover.setEnabled(false));

  // Click anywhere to lock mouse (unless modal open) + start ambience
  renderer.domElement.addEventListener("click", () => {
    ensureAmbience();
    if (!isModalOpen()) lock();
  });

  // --- Raycast interaction ---
  const interactor = createRaycastInteractor({ camera, scene });

  // --- Rotation registry for 3D exhibits ---
  let rotatingExhibits = [];

  // --- Clicking to focus (only when locked) ---
  window.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    if (!controls.isLocked) return;
    if (isModalOpen()) return;

    const hit = interactor.cast();
    if (hit?.data?.project) {
      enterProjectFocus(hit.data.focusTarget, hit.data.project);
    }
  });

  // --- Load projects + build frames + build 3D exhibits ---
  loadProjects()
    .then(async (projects) => {
      await buildGalleryFromProjects({ scene, projects, rooms });
      const built = await build3DExhibitsFromProjects({ scene, projects });
rotatingExhibits = built.exhibits;

// append pedestal colliders to movement colliders
worldColliders.push(...built.colliders);
    })
    .catch((err) => console.error(err));

  // --- Resize ---
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onResize);

  // --- Render loop ---
  const clock = new THREE.Clock();

  function tick() {
    const dt = clock.getDelta();

    mover.update(dt);
    updateFocus(dt);

    // Rotate sculptures gently (pause while focused)
    if (!isModalOpen()) {
      for (const ex of rotatingExhibits) {
        ex.root.rotation.y += ex.speed * dt;
      }
    }

    // Duck ambience volume while focused
    const targetVol = isModalOpen() ? 0.14 : 0.28;
    ambience.volume += (targetVol - ambience.volume) * Math.min(1, dt * 6);

    // Crosshair visibility when modal open
    crosshair.style.opacity = isModalOpen() ? "0" : "1";

    // Interaction hint + hover glow
    if (controls.isLocked && !isModalOpen()) {
      const hit = interactor.cast();
      interactHint.classList.toggle("show", !!hit?.data?.project);

      if (hit?.object) {
        updateHoverGlow(hit.object, clock.elapsedTime);
      } else {
        clearHoverGlow();
      }
    } else {
      interactHint.classList.remove("show");
      clearHoverGlow();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  tick();
}