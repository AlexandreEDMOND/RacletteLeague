import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

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

const fieldWidth = 24;
const fieldLength = 36;
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(fieldWidth, fieldLength),
  new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const boundary = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-fieldWidth / 2, 0.02, -fieldLength / 2),
    new THREE.Vector3(fieldWidth / 2, 0.02, -fieldLength / 2),
    new THREE.Vector3(fieldWidth / 2, 0.02, fieldLength / 2),
    new THREE.Vector3(-fieldWidth / 2, 0.02, fieldLength / 2),
  ])
);
scene.add(boundary);

const centerLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-fieldWidth / 2, 0.02, 0),
    new THREE.Vector3(fieldWidth / 2, 0.02, 0),
  ]),
  lineMaterial
);
scene.add(centerLine);

const circlePoints = [];
const circleRadius = 3;
const circleSegments = 40;
for (let i = 0; i <= circleSegments; i += 1) {
  const angle = (i / circleSegments) * Math.PI * 2;
  circlePoints.push(
    new THREE.Vector3(Math.cos(angle) * circleRadius, 0.02, Math.sin(angle) * circleRadius)
  );
}
const centerCircle = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints(circlePoints),
  lineMaterial
);
scene.add(centerCircle);

const wallThickness = 0.6;
const wallHeight = 2.2;
const goalWidth = 8;
const goalHeight = 2.6;
const goalDepth = 3;

const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x455a64 });
const goalFrameMaterial = new THREE.MeshStandardMaterial({ color: 0xf7f7f7 });
const goalFloorMaterial = new THREE.MeshStandardMaterial({ color: 0x2b6a2e });
const wallColliders = [];

function addBox(width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addWall(width, height, depth, x, y, z, material) {
  const mesh = addBox(width, height, depth, x, y, z, material);
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

const wallY = wallHeight / 2;
const wallOffsetX = fieldWidth / 2 + wallThickness / 2;
const wallOffsetZ = fieldLength / 2 + wallThickness / 2;
const wallSegmentLength = (fieldWidth - goalWidth) / 2;
const wallSegmentX = goalWidth / 2 + wallSegmentLength / 2;

addWall(wallThickness, wallHeight, fieldLength, wallOffsetX, wallY, 0, wallMaterial);
addWall(wallThickness, wallHeight, fieldLength, -wallOffsetX, wallY, 0, wallMaterial);

for (const sign of [1, -1]) {
  const zPos = sign * wallOffsetZ;
  addWall(wallSegmentLength, wallHeight, wallThickness, wallSegmentX, wallY, zPos, wallMaterial);
  addWall(wallSegmentLength, wallHeight, wallThickness, -wallSegmentX, wallY, zPos, wallMaterial);

  const goalFloor = new THREE.Mesh(new THREE.PlaneGeometry(goalWidth, goalDepth), goalFloorMaterial);
  goalFloor.rotation.x = -Math.PI / 2;
  goalFloor.position.set(0, 0.01, sign * (fieldLength / 2 + goalDepth / 2));
  goalFloor.receiveShadow = true;
  scene.add(goalFloor);

  const goalWallY = goalHeight / 2;
  const goalSideX = goalWidth / 2 + wallThickness / 2;
  const goalSideZ = fieldLength / 2 + goalDepth / 2;
  const goalBackZ = fieldLength / 2 + goalDepth + wallThickness / 2;
  addWall(wallThickness, goalHeight, goalDepth, goalSideX, goalWallY, sign * goalSideZ, wallMaterial);
  addWall(wallThickness, goalHeight, goalDepth, -goalSideX, goalWallY, sign * goalSideZ, wallMaterial);
  addWall(goalWidth + wallThickness * 2, goalHeight, wallThickness, 0, goalWallY, sign * goalBackZ, wallMaterial);

  const frameThickness = 0.12;
  const frontZ = sign * (fieldLength / 2 + 0.05);
  const backZ = sign * (fieldLength / 2 + goalDepth);
  addBox(frameThickness, goalHeight, frameThickness, goalWidth / 2, goalHeight / 2, frontZ, goalFrameMaterial);
  addBox(frameThickness, goalHeight, frameThickness, -goalWidth / 2, goalHeight / 2, frontZ, goalFrameMaterial);
  addBox(goalWidth, frameThickness, frameThickness, 0, goalHeight, frontZ, goalFrameMaterial);
  addBox(frameThickness, goalHeight, frameThickness, goalWidth / 2, goalHeight / 2, backZ, goalFrameMaterial);
  addBox(frameThickness, goalHeight, frameThickness, -goalWidth / 2, goalHeight / 2, backZ, goalFrameMaterial);
  addBox(goalWidth, frameThickness, frameThickness, 0, goalHeight, backZ, goalFrameMaterial);
  addBox(
    frameThickness,
    frameThickness,
    goalDepth,
    goalWidth / 2,
    goalHeight,
    sign * (fieldLength / 2 + goalDepth / 2),
    goalFrameMaterial
  );
  addBox(
    frameThickness,
    frameThickness,
    goalDepth,
    -goalWidth / 2,
    goalHeight,
    sign * (fieldLength / 2 + goalDepth / 2),
    goalFrameMaterial
  );
}

const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xffd54f });
const playerRadius = 0.35;
const playerBodyLength = 0.9;
const playerHalfHeight = playerRadius + playerBodyLength / 2;
const playerBody = new THREE.Mesh(
  new THREE.CapsuleGeometry(playerRadius, playerBodyLength, 4, 8),
  playerMaterial
);
playerBody.castShadow = true;
const player = new THREE.Group();
player.add(playerBody);
player.position.y = playerHalfHeight;
scene.add(player);

const ballRadius = 0.45;
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff6f61 });
const ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 24, 16), ballMaterial);
ball.castShadow = true;
ball.receiveShadow = true;
ball.position.set(0, ballRadius, -5);
scene.add(ball);

const playerVelocity = new THREE.Vector3();
const ballVelocity = new THREE.Vector3();
const moveSpeed = 7;
const moveAcceleration = 18;
const moveDeceleration = 14;
const sprintMultiplier = 1.45;
const maxEnergy = 100;
const energyDrain = 35;
const energyRegen = 22;
const gravity = -18;
const jumpSpeed = 7.5;
const groundY = 0;

const input = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
};

let jumpRequested = false;
let yaw = 0;
let pitch = 0.35;
let distance = 7;

const minDistance = 3;
const maxDistance = 12;

const playerCollisionRadius = 0.6;
const carryDistance = playerCollisionRadius + ballRadius + 0.1;
const attachDistance = playerCollisionRadius + ballRadius + 0.05;
const ballRestitution = 0.55;
const wallRestitution = 0.65;
const ballFriction = 0.965;
const shotSpeed = 16;
const carryCooldownDuration = 0.25;

let energy = maxEnergy;
let carryingBall = false;
let carryCooldown = 0;

function setInputState(event, isDown) {
  const key = event.key.toLowerCase();
  if (key === "z") {
    input.forward = isDown;
  } else if (key === "s") {
    input.backward = isDown;
  } else if (key === "q") {
    input.right = isDown;
  } else if (key === "d") {
    input.left = isDown;
  } else if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
    input.sprint = isDown;
  } else if (event.code === "Space" && isDown) {
    jumpRequested = true;
  } else {
    return;
  }

  event.preventDefault();
}

document.addEventListener("keydown", (event) => setInputState(event, true));
document.addEventListener("keyup", (event) => setInputState(event, false));
window.addEventListener("blur", () => {
  input.forward = false;
  input.backward = false;
  input.left = false;
  input.right = false;
  input.sprint = false;
});

const instructions = document.getElementById("instructions");
const energyFill = document.getElementById("energyFill");
function requestLock() {
  renderer.domElement.requestPointerLock();
}

renderer.domElement.addEventListener("click", requestLock);
instructions.addEventListener("click", requestLock);

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === renderer.domElement) {
    instructions.style.display = "none";
  } else {
    instructions.style.display = "grid";
  }
});

document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== renderer.domElement) {
    return;
  }
  const sensitivity = 0.0022;
  yaw -= event.movementX * sensitivity;
  pitch -= event.movementY * sensitivity;
});

document.addEventListener(
  "wheel",
  (event) => {
    distance = THREE.MathUtils.clamp(distance + event.deltaY * 0.01, minDistance, maxDistance);
    event.preventDefault();
  },
  { passive: false }
);

document.addEventListener("mousedown", (event) => {
  if (event.button !== 0 || !carryingBall) {
    return;
  }
  shootBall();
  event.preventDefault();
});

function updateMovement(delta) {
  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const moveDir = new THREE.Vector3();
  if (input.forward) {
    moveDir.add(forward);
  }
  if (input.backward) {
    moveDir.addScaledVector(forward, -1);
  }
  if (input.left) {
    moveDir.addScaledVector(right, -1);
  }
  if (input.right) {
    moveDir.add(right);
  }

  const moving = moveDir.lengthSq() > 0;
  const sprinting = input.sprint && energy > 0.1 && moving;
  const speed = moveSpeed * (sprinting ? sprintMultiplier : 1);

  if (moving) {
    moveDir.normalize();
  }

  const desiredX = moving ? moveDir.x * speed : 0;
  const desiredZ = moving ? moveDir.z * speed : 0;
  const accel = moving ? moveAcceleration : moveDeceleration;
  let deltaX = desiredX - playerVelocity.x;
  let deltaZ = desiredZ - playerVelocity.z;
  const deltaLen = Math.hypot(deltaX, deltaZ);
  const maxDelta = accel * delta;
  if (deltaLen > maxDelta) {
    const scale = maxDelta / deltaLen;
    deltaX *= scale;
    deltaZ *= scale;
  }
  playerVelocity.x += deltaX;
  playerVelocity.z += deltaZ;

  const planarSpeed = Math.hypot(playerVelocity.x, playerVelocity.z);
  if (planarSpeed > 0.05) {
    player.rotation.y = Math.atan2(playerVelocity.x, playerVelocity.z);
  }
  if (!moving && planarSpeed < 0.02) {
    playerVelocity.x = 0;
    playerVelocity.z = 0;
  }

  if (sprinting) {
    energy = Math.max(0, energy - energyDrain * delta);
  } else {
    energy = Math.min(maxEnergy, energy + energyRegen * delta);
  }
  if (energyFill) {
    energyFill.style.transform = `scaleX(${energy / maxEnergy})`;
  }

  const grounded = player.position.y <= groundY + playerHalfHeight + 0.001;
  if (grounded) {
    player.position.y = groundY + playerHalfHeight;
    if (playerVelocity.y < 0) {
      playerVelocity.y = 0;
    }
  }
  if (jumpRequested && grounded) {
    playerVelocity.y = jumpSpeed;
  }
  jumpRequested = false;

  playerVelocity.y += gravity * delta;
  player.position.x += playerVelocity.x * delta;
  player.position.y += playerVelocity.y * delta;
  player.position.z += playerVelocity.z * delta;

  if (player.position.y < groundY + playerHalfHeight) {
    player.position.y = groundY + playerHalfHeight;
    playerVelocity.y = 0;
  }

  resolveWallCollision(player.position, playerCollisionRadius, playerVelocity, 0);
}

function resolveWallCollision(position, radius, velocity, restitution) {
  for (const box of wallColliders) {
    const closestX = THREE.MathUtils.clamp(position.x, box.minX, box.maxX);
    const closestZ = THREE.MathUtils.clamp(position.z, box.minZ, box.maxZ);
    let dx = position.x - closestX;
    let dz = position.z - closestZ;
    let distSq = dx * dx + dz * dz;
    const radiusSq = radius * radius;
    if (distSq >= radiusSq) {
      continue;
    }

    if (distSq < 0.000001) {
      const left = position.x - box.minX;
      const right = box.maxX - position.x;
      const back = position.z - box.minZ;
      const front = box.maxZ - position.z;
      const minPen = Math.min(left, right, back, front);
      if (minPen === left) {
        dx = -1;
        dz = 0;
        position.x = box.minX - radius;
      } else if (minPen === right) {
        dx = 1;
        dz = 0;
        position.x = box.maxX + radius;
      } else if (minPen === back) {
        dx = 0;
        dz = -1;
        position.z = box.minZ - radius;
      } else {
        dx = 0;
        dz = 1;
        position.z = box.maxZ + radius;
      }
    } else {
      const dist = Math.sqrt(distSq);
      const push = radius - dist;
      const nx = dx / dist;
      const nz = dz / dist;
      position.x += nx * push;
      position.z += nz * push;
      dx = nx;
      dz = nz;
    }

    const normalSpeed = velocity.x * dx + velocity.z * dz;
    if (normalSpeed < 0) {
      const bounce = (1 + restitution) * normalSpeed;
      velocity.x -= bounce * dx;
      velocity.z -= bounce * dz;
    }
  }
}

function updateCarriedBallPosition() {
  const moveDir = new THREE.Vector3(playerVelocity.x, 0, playerVelocity.z);
  let forward = null;
  if (moveDir.lengthSq() > 0.001) {
    forward = moveDir.normalize();
  } else {
    const cameraDir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    forward = cameraDir.lengthSq() < 0.0001 ? new THREE.Vector3(0, 0, 1) : cameraDir.normalize();
  }
  const desired = player.position.clone().addScaledVector(forward, carryDistance);
  desired.y = ballRadius;
  ball.position.copy(desired);
  resolveWallCollision(ball.position, ballRadius, ballVelocity, wallRestitution);
}

function tryAttachBall() {
  if (carryingBall || carryCooldown > 0) {
    return;
  }
  const dx = ball.position.x - player.position.x;
  const dz = ball.position.z - player.position.z;
  const distance = Math.hypot(dx, dz);
  if (distance <= attachDistance) {
    carryingBall = true;
    ballVelocity.set(0, 0, 0);
    updateCarriedBallPosition();
  }
}

function shootBall() {
  if (!carryingBall) {
    return;
  }
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  if (direction.lengthSq() < 0.0001) {
    direction.set(Math.sin(yaw), 0, Math.cos(yaw));
  }
  direction.normalize();
  ball.position.copy(player.position).addScaledVector(direction, carryDistance + 0.05);
  ball.position.y = ballRadius;
  ballVelocity.copy(direction.multiplyScalar(shotSpeed));
  ballVelocity.y = 0;
  carryingBall = false;
  carryCooldown = carryCooldownDuration;
}

function updateBall(delta) {
  if (carryCooldown > 0) {
    carryCooldown = Math.max(0, carryCooldown - delta);
  }
  if (carryingBall) {
    ballVelocity.set(0, 0, 0);
    updateCarriedBallPosition();
    return;
  }

  const drag = Math.pow(0.992, delta * 60);
  ballVelocity.x *= drag;
  ballVelocity.z *= drag;
  ballVelocity.y += gravity * delta;
  ball.position.addScaledVector(ballVelocity, delta);

  if (ball.position.y < ballRadius) {
    ball.position.y = ballRadius;
    if (ballVelocity.y < 0) {
      ballVelocity.y *= -ballRestitution;
    }
    const groundFriction = Math.pow(ballFriction, delta * 60);
    ballVelocity.x *= groundFriction;
    ballVelocity.z *= groundFriction;
  }

  resolveWallCollision(ball.position, ballRadius, ballVelocity, wallRestitution);
  tryAttachBall();
}

function updateCamera() {
  const targetHeight = 0.8;
  const target = new THREE.Vector3(player.position.x, player.position.y + targetHeight, player.position.z);
  const minCameraHeight = groundY + 0.2;
  const pitchLimit = THREE.MathUtils.clamp((target.y - minCameraHeight) / distance, -1, 1);
  const maxPitchFromGround = Math.asin(pitchLimit);
  const minPitch = -1.2;
  const maxPitch = Math.max(minPitch, maxPitchFromGround);
  pitch = THREE.MathUtils.clamp(pitch, minPitch, maxPitch);

  const direction = new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch)
  );
  const desired = target.clone().addScaledVector(direction, -distance);
  camera.position.copy(desired);
  camera.lookAt(target);
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  updateMovement(delta);
  updateBall(delta);
  updateCamera();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
