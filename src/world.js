import THREE from "./three.js";
import { BALL, FIELD, GOAL, PLAYER_MODEL, WALL } from "./config.js";

function addBox(scene, width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addWall(scene, wallColliders, width, height, depth, x, y, z, material) {
  const mesh = addBox(scene, width, height, depth, x, y, z, material);
  const halfW = width / 2;
  const halfD = depth / 2;
  wallColliders.push({
    minX: x - halfW,
    maxX: x + halfW,
    minZ: z - halfD,
    maxZ: z + halfD,
  });
  return mesh;
}

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd9ff);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3b4b6a, 0.8);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(6, 10, 4);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  scene.add(dirLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(FIELD.width, FIELD.length),
    new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const boundary = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-FIELD.width / 2, 0.02, -FIELD.length / 2),
      new THREE.Vector3(FIELD.width / 2, 0.02, -FIELD.length / 2),
      new THREE.Vector3(FIELD.width / 2, 0.02, FIELD.length / 2),
      new THREE.Vector3(-FIELD.width / 2, 0.02, FIELD.length / 2),
    ])
  );
  scene.add(boundary);

  const centerLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-FIELD.width / 2, 0.02, 0),
      new THREE.Vector3(FIELD.width / 2, 0.02, 0),
    ]),
    lineMaterial
  );
  scene.add(centerLine);

  const circlePoints = [];
  for (let i = 0; i <= FIELD.circleSegments; i += 1) {
    const angle = (i / FIELD.circleSegments) * Math.PI * 2;
    circlePoints.push(
      new THREE.Vector3(Math.cos(angle) * FIELD.circleRadius, 0.02, Math.sin(angle) * FIELD.circleRadius)
    );
  }
  const centerCircle = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(circlePoints),
    lineMaterial
  );
  scene.add(centerCircle);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x455a64 });
  const goalFrameMaterial = new THREE.MeshStandardMaterial({ color: 0xf7f7f7 });
  const goalFloorMaterial = new THREE.MeshStandardMaterial({ color: 0x2b6a2e });
  const wallColliders = [];

  const wallY = WALL.height / 2;
  const wallOffsetX = FIELD.width / 2 + WALL.thickness / 2;
  const wallOffsetZ = FIELD.length / 2 + WALL.thickness / 2;
  const wallSegmentLength = (FIELD.width - GOAL.width) / 2;
  const wallSegmentX = GOAL.width / 2 + wallSegmentLength / 2;

  addWall(scene, wallColliders, WALL.thickness, WALL.height, FIELD.length, wallOffsetX, wallY, 0, wallMaterial);
  addWall(scene, wallColliders, WALL.thickness, WALL.height, FIELD.length, -wallOffsetX, wallY, 0, wallMaterial);

  for (const sign of [1, -1]) {
    const zPos = sign * wallOffsetZ;
    addWall(scene, wallColliders, wallSegmentLength, WALL.height, WALL.thickness, wallSegmentX, wallY, zPos, wallMaterial);
    addWall(
      scene,
      wallColliders,
      wallSegmentLength,
      WALL.height,
      WALL.thickness,
      -wallSegmentX,
      wallY,
      zPos,
      wallMaterial
    );

    const goalFloor = new THREE.Mesh(new THREE.PlaneGeometry(GOAL.width, GOAL.depth), goalFloorMaterial);
    goalFloor.rotation.x = -Math.PI / 2;
    goalFloor.position.set(0, 0.01, sign * (FIELD.length / 2 + GOAL.depth / 2));
    goalFloor.receiveShadow = true;
    scene.add(goalFloor);

    const goalWallY = GOAL.height / 2;
    const goalSideX = GOAL.width / 2 + WALL.thickness / 2;
    const goalSideZ = FIELD.length / 2 + GOAL.depth / 2;
    const goalBackZ = FIELD.length / 2 + GOAL.depth + WALL.thickness / 2;
    addWall(scene, wallColliders, WALL.thickness, GOAL.height, GOAL.depth, goalSideX, goalWallY, sign * goalSideZ, wallMaterial);
    addWall(scene, wallColliders, WALL.thickness, GOAL.height, GOAL.depth, -goalSideX, goalWallY, sign * goalSideZ, wallMaterial);
    addWall(
      scene,
      wallColliders,
      GOAL.width + WALL.thickness * 2,
      GOAL.height,
      WALL.thickness,
      0,
      goalWallY,
      sign * goalBackZ,
      wallMaterial
    );

    const frameThickness = 0.12;
    const frontZ = sign * (FIELD.length / 2 + 0.05);
    const backZ = sign * (FIELD.length / 2 + GOAL.depth);
    addBox(scene, frameThickness, GOAL.height, frameThickness, GOAL.width / 2, GOAL.height / 2, frontZ, goalFrameMaterial);
    addBox(scene, frameThickness, GOAL.height, frameThickness, -GOAL.width / 2, GOAL.height / 2, frontZ, goalFrameMaterial);
    addBox(scene, GOAL.width, frameThickness, frameThickness, 0, GOAL.height, frontZ, goalFrameMaterial);
    addBox(scene, frameThickness, GOAL.height, frameThickness, GOAL.width / 2, GOAL.height / 2, backZ, goalFrameMaterial);
    addBox(scene, frameThickness, GOAL.height, frameThickness, -GOAL.width / 2, GOAL.height / 2, backZ, goalFrameMaterial);
    addBox(scene, GOAL.width, frameThickness, frameThickness, 0, GOAL.height, backZ, goalFrameMaterial);
    addBox(
      scene,
      frameThickness,
      frameThickness,
      GOAL.depth,
      GOAL.width / 2,
      GOAL.height,
      sign * (FIELD.length / 2 + GOAL.depth / 2),
      goalFrameMaterial
    );
    addBox(
      scene,
      frameThickness,
      frameThickness,
      GOAL.depth,
      -GOAL.width / 2,
      GOAL.height,
      sign * (FIELD.length / 2 + GOAL.depth / 2),
      goalFrameMaterial
    );
  }

  const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xffd54f });
  const playerAccentMaterial = new THREE.MeshStandardMaterial({ color: 0x546e7a });
  const playerSkinMaterial = new THREE.MeshStandardMaterial({ color: 0xf2d7b6 });

  const shoulderOffset = PLAYER_MODEL.torsoWidth / 2 + PLAYER_MODEL.armRadius * 0.6;
  const hipOffset = PLAYER_MODEL.torsoWidth * 0.2;
  const playerHeight = PLAYER_MODEL.legLength + PLAYER_MODEL.torsoHeight + PLAYER_MODEL.headRadius * 2;
  const playerHalfHeight = playerHeight / 2;

  const player = new THREE.Group();

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(PLAYER_MODEL.torsoWidth, PLAYER_MODEL.torsoHeight, PLAYER_MODEL.torsoDepth),
    playerMaterial
  );
  torso.position.y = -playerHalfHeight + PLAYER_MODEL.legLength + PLAYER_MODEL.torsoHeight / 2;
  torso.castShadow = true;
  torso.receiveShadow = true;
  player.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(PLAYER_MODEL.headRadius, 16, 12), playerSkinMaterial);
  head.position.y = torso.position.y + PLAYER_MODEL.torsoHeight / 2 + PLAYER_MODEL.headRadius;
  head.castShadow = true;
  player.add(head);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(hipOffset, -playerHalfHeight + PLAYER_MODEL.legLength, 0);
  const leftLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(PLAYER_MODEL.legRadius, PLAYER_MODEL.legRadius, PLAYER_MODEL.legLength, 8),
    playerAccentMaterial
  );
  leftLeg.position.y = -PLAYER_MODEL.legLength / 2;
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);
  player.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(-hipOffset, -playerHalfHeight + PLAYER_MODEL.legLength, 0);
  const rightLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(PLAYER_MODEL.legRadius, PLAYER_MODEL.legRadius, PLAYER_MODEL.legLength, 8),
    playerAccentMaterial
  );
  rightLeg.position.y = -PLAYER_MODEL.legLength / 2;
  rightLeg.castShadow = true;
  rightLegPivot.add(rightLeg);
  player.add(rightLegPivot);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(shoulderOffset, torso.position.y + PLAYER_MODEL.torsoHeight / 2 - 0.05, 0);
  leftArmPivot.rotation.z = 0.15;
  const leftArm = new THREE.Mesh(
    new THREE.CylinderGeometry(PLAYER_MODEL.armRadius, PLAYER_MODEL.armRadius, PLAYER_MODEL.armLength, 8),
    playerSkinMaterial
  );
  leftArm.position.y = -PLAYER_MODEL.armLength / 2;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  player.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(-shoulderOffset, torso.position.y + PLAYER_MODEL.torsoHeight / 2 - 0.05, 0);
  rightArmPivot.rotation.z = -0.15;
  const rightArm = new THREE.Mesh(
    new THREE.CylinderGeometry(PLAYER_MODEL.armRadius, PLAYER_MODEL.armRadius, PLAYER_MODEL.armLength, 8),
    playerSkinMaterial
  );
  rightArm.position.y = -PLAYER_MODEL.armLength / 2;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  player.add(rightArmPivot);

  player.position.y = playerHalfHeight;
  scene.add(player);

  const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL.radius, 24, 16), new THREE.MeshStandardMaterial({ color: 0xff6f61 }));
  ball.castShadow = true;
  ball.receiveShadow = true;
  ball.position.set(0, BALL.radius, -5);
  scene.add(ball);

  const chargeArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, BALL.radius + 0.2, 0),
    1,
    0xffe082,
    0.5,
    0.3
  );
  chargeArrow.visible = false;
  scene.add(chargeArrow);

  return {
    scene,
    camera,
    renderer,
    wallColliders,
    field: FIELD,
    goal: GOAL,
    groundY: FIELD.groundY,
    player: {
      group: player,
      halfHeight: playerHalfHeight,
      pivots: {
        leftLeg: leftLegPivot,
        rightLeg: rightLegPivot,
        leftArm: leftArmPivot,
        rightArm: rightArmPivot,
      },
      materials: {
        base: playerMaterial,
        accent: playerAccentMaterial,
      },
    },
    ball: {
      mesh: ball,
      radius: BALL.radius,
    },
    chargeArrow,
  };
}
