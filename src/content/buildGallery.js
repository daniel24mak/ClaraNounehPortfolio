import * as THREE from "three";
import { registerInteractable } from "../engine/interaction/interactables.js";

export async function buildGalleryFromProjects({ scene, projects, rooms }) {
  const loader = new THREE.TextureLoader();

  const WALL_THICKNESS = 0.25; // doesn’t need to match shell now, just used for snap math
  const SURFACE_EPS = 0.01;

  // Frame geometry sizes
  const artW = 2.2;
  const artH = 1.4;

  const woodBorder = 0.22;     // wood frame width around art
  const matBorder = 0.16;      // white mat around image
  const frameDepth = 0.10;

  for (const p of projects) {
    if (p.type !== "image") continue;

    // Load thumbnail safely
    let tex = null;
    try {
      tex = await new Promise((resolve, reject) => {
        loader.load(
          p.thumbnail,
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            resolve(t);
          },
          undefined,
          reject
        );
      });
    } catch {
      console.warn("Thumbnail failed to load for", p.id, p.thumbnail);
    }

    const frame = new THREE.Group();

    // --- Outer wood frame ---
    const wood = new THREE.Mesh(
      new THREE.BoxGeometry(artW + woodBorder, artH + woodBorder, frameDepth),
      new THREE.MeshStandardMaterial({ color: 0x2b1f12, roughness: 0.7 })
    );
    frame.add(wood);

    // --- Inner mat (slightly in front) ---
    const mat = new THREE.Mesh(
      new THREE.PlaneGeometry(artW + matBorder, artH + matBorder),
      new THREE.MeshStandardMaterial({ color: 0xf5f1e7, roughness: 0.95 })
    );
    mat.position.z = frameDepth / 2 + 0.002;
    frame.add(mat);

    // --- Artwork (on top of mat) ---
    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(artW, artH),
      new THREE.MeshStandardMaterial({
        map: tex ?? null,
        color: tex ? 0xffffff : 0x777777,
        roughness: 0.85
      })
    );
    art.position.z = frameDepth / 2 + 0.004;
    frame.add(art);

    // --- “Glass” layer (subtle shine) ---
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(artW + matBorder, artH + matBorder),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.08,
        transmission: 0.06, // tiny transparency for sheen
        thickness: 0.02,
        transparent: true,
        opacity: 0.22,
        clearcoat: 1.0,
        clearcoatRoughness: 0.12
      })
    );
    glass.position.z = frameDepth / 2 + 0.006;
    frame.add(glass);

    // Plaque
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(artW * 0.9, 0.18, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x121216, roughness: 0.95 })
    );
    plaque.position.set(0, -(artH / 2) - 0.24, frameDepth / 2 + 0.01);
    frame.add(plaque);

    // --- Snap to wall (single room A) ---
    const place = p.placement ?? {};
    const room = rooms?.[place.room ?? "A"] ?? rooms?.A;

    const cx = room?.cx ?? 0;
    const cz = room?.cz ?? 0;
    const width = room?.width ?? 18;
    const depth = room?.depth ?? 22;

    const wall = place.wall ?? "north";
    const x = place.x ?? 0;
    const y = place.y ?? 2.0;

    // Shell interior walls lie at +/- depth/2, +/- width/2
    const northInnerZ = cz - depth / 2;
    const southInnerZ = cz + depth / 2;
    const westInnerX = cx - width / 2;
    const eastInnerX = cx + width / 2;

    const halfDepth = frameDepth / 2;

    if (wall === "north") {
      frame.position.set(cx + x, y, northInnerZ + halfDepth + SURFACE_EPS);
      frame.rotation.y = 0;
    } else if (wall === "south") {
      frame.position.set(cx + x, y, southInnerZ - halfDepth - SURFACE_EPS);
      frame.rotation.y = Math.PI;
    } else if (wall === "east") {
      frame.position.set(eastInnerX - halfDepth - SURFACE_EPS, y, cz + x);
      frame.rotation.y = -Math.PI / 2;
    } else if (wall === "west") {
      frame.position.set(westInnerX + halfDepth + SURFACE_EPS, y, cz + x);
      frame.rotation.y = Math.PI / 2;
    }

    scene.add(frame);

    // --- Per-art spotlight (pool of light) ---
    const artWorld = new THREE.Vector3();
    art.getWorldPosition(artWorld);

    const spot = new THREE.SpotLight(0xfff1dd, 42, 14, Math.PI / 12, 0.40, 1);
    // Put light slightly away from wall so it “washes” the frame
    spot.position.set(artWorld.x, 4.6, artWorld.z + (wall === "north" ? 1.0 : -1.0));
    spot.target.position.copy(artWorld);
    scene.add(spot, spot.target);

    // Click target (only the artwork plane)
    registerInteractable(art, { project: p, focusTarget: frame });
  }
}