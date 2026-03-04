import * as THREE from "three";

/**
 * Single solid room shell + marble floor + textured columns with
 * base + capital trims for realism.
 *
 * Required files:
 * public/textures/floor/marble/
 *   marble_color.jpg
 *   marble_normal.jpg
 *   marble_roughness.jpg
 *
 * public/textures/columns/
 *   column_color.jpg
 *   column_normal.jpg
 *   column_roughness.jpg
 */
export function buildMuseum(scene) {
  const museum = new THREE.Group();

  // Room dimensions
  const roomW = 18;
  const roomD = 22;
  const roomH = 5;

  // Shared loader
  const texLoader = new THREE.TextureLoader();

  // --- Solid room shell (seamless interior walls + ceiling) ---
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xf3efe6, // warm white walls
    roughness: 0.92,
    side: THREE.BackSide
  });

  const shell = new THREE.Mesh(new THREE.BoxGeometry(roomW, roomH, roomD), shellMat);
  shell.position.set(0, roomH / 2, 0);
  shell.name = "RoomShell";
  museum.add(shell);

  // --- Marble floor (PBR) ---
  const marbleColor = texLoader.load("/textures/floor/marble/marble_color.jpg");
  marbleColor.colorSpace = THREE.SRGBColorSpace;
  marbleColor.wrapS = THREE.RepeatWrapping;
  marbleColor.wrapT = THREE.RepeatWrapping;
  marbleColor.repeat.set(4, 4);

  const marbleNormal = texLoader.load("/textures/floor/marble/marble_normal.jpg");
  marbleNormal.wrapS = THREE.RepeatWrapping;
  marbleNormal.wrapT = THREE.RepeatWrapping;
  marbleNormal.repeat.copy(marbleColor.repeat);

  const marbleRoughness = texLoader.load("/textures/floor/marble/marble_roughness.jpg");
  marbleRoughness.wrapS = THREE.RepeatWrapping;
  marbleRoughness.wrapT = THREE.RepeatWrapping;
  marbleRoughness.repeat.copy(marbleColor.repeat);

  const floorMat = new THREE.MeshStandardMaterial({
    map: marbleColor,
    normalMap: marbleNormal,
    roughnessMap: marbleRoughness,
    roughness: 0.55, // lower = shinier
    metalness: 0.0
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.001, 0);
  floor.name = "Floor";
  museum.add(floor);

  // --- Column textures (PBR) ---
  const columnColor = texLoader.load("/textures/columns/column_color.jpg");
  columnColor.colorSpace = THREE.SRGBColorSpace;
  columnColor.wrapS = THREE.RepeatWrapping;
  columnColor.wrapT = THREE.RepeatWrapping;
  columnColor.repeat.set(1, 2); // vertical tiling

  const columnNormal = texLoader.load("/textures/columns/column_normal.jpg");
  columnNormal.wrapS = THREE.RepeatWrapping;
  columnNormal.wrapT = THREE.RepeatWrapping;
  columnNormal.repeat.copy(columnColor.repeat);

  const columnRough = texLoader.load("/textures/columns/column_roughness.jpg");
  columnRough.wrapS = THREE.RepeatWrapping;
  columnRough.wrapT = THREE.RepeatWrapping;
  columnRough.repeat.copy(columnColor.repeat);

  const beamMat = new THREE.MeshStandardMaterial({
    map: columnColor,
    normalMap: columnNormal,
    roughnessMap: columnRough,
    roughness: 1.0,
    metalness: 0
  });

  // --- Column builder with base + capital trims ---
  function makeColumn({ x, z, radius = 0.35, height = roomH }) {
    const g = new THREE.Group();

    // Core shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 40),
      beamMat
    );
    shaft.position.y = height / 2;
    shaft.geometry.computeVertexNormals();
    g.add(shaft);

    // Base + capital sizes
    const baseH1 = 0.10;
    const baseH2 = 0.12;
    const baseH3 = 0.10;

    const capH1 = 0.10;
    const capH2 = 0.12;
    const capH3 = 0.10;

    const baseY = 0;          // floor at y=0
    const capY = height;      // top of shaft

    // Square plinth base (lowest)
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 3.0, 0.14, radius * 3.0),
      beamMat
    );
    plinth.position.y = baseY + 0.07;
    g.add(plinth);

    // Base rings (stacked cylinders) — wider at bottom
    const base1 = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.55, radius * 1.65, baseH1, 40),
      beamMat
    );
    base1.position.y = baseY + 0.14 + baseH1 / 2;
    g.add(base1);

    const base2 = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.35, radius * 1.45, baseH2, 40),
      beamMat
    );
    base2.position.y = base1.position.y + baseH1 / 2 + baseH2 / 2;
    g.add(base2);

    const base3 = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.20, radius * 1.25, baseH3, 40),
      beamMat
    );
    base3.position.y = base2.position.y + baseH2 / 2 + baseH3 / 2;
    g.add(base3);

    // Capital rings (stacked cylinders) — wider near the top
    const cap3 = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.20, radius * 1.25, capH3, 40),
      beamMat
    );
    cap3.position.y = capY - capH3 / 2;
    g.add(cap3);

    const cap2 = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.35, radius * 1.45, capH2, 40),
      beamMat
    );
    cap2.position.y = cap3.position.y - capH3 / 2 - capH2 / 2;
    g.add(cap2);

    const cap1 = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.55, radius * 1.65, capH1, 40),
      beamMat
    );
    cap1.position.y = cap2.position.y - capH2 / 2 - capH1 / 2;
    g.add(cap1);

    // Square abacus/cap (topmost)
    const abacus = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 3.0, 0.14, radius * 3.0),
      beamMat
    );
    abacus.position.y = capY - 0.07;
    g.add(abacus);

    // Place the whole column group
    g.position.set(x, 0, z);
    g.name = "Column";

    return g;
  }

  // --- Two structural columns ---
  const colRadius = 0.35;

  const leftColumn = makeColumn({ x: -5.2, z: 0, radius: colRadius, height: roomH });
  leftColumn.name = "BeamLeft";
  museum.add(leftColumn);

  const rightColumn = makeColumn({ x: 5.2, z: 0, radius: colRadius, height: roomH });
  rightColumn.name = "BeamRight";
  museum.add(rightColumn);

  // Optional top beam connecting columns (also textured)
  const topBeam = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 0.28, 0.35),
    beamMat
  );
  topBeam.position.set(0, roomH - 0.30, 0);
  topBeam.name = "BeamTop";
  museum.add(topBeam);

  scene.add(museum);

  // Movement bounds
  const zones = [
    {
      id: "MAIN",
      minX: -roomW / 2,
      maxX: roomW / 2,
      minZ: -roomD / 2,
      maxZ: roomD / 2
    }
  ];

  // For snapping frames to perimeter walls
  const rooms = {
    A: { id: "A", cx: 0, cz: 0, width: roomW, depth: roomD, height: roomH, wallT: 0.25 }
  };

  // Collision cylinders (XZ) — expand radius a bit so you don't clip trims
  const colliders = [
    { type: "cylinder", x: -5.2, z: 0, r: colRadius + 0.55 },
    { type: "cylinder", x: 5.2, z: 0, r: colRadius + 0.55 }
  ];

  return { museum, zones, rooms, colliders };
}