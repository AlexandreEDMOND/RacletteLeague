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
const playerAccentMaterial = new THREE.MeshStandardMaterial({ color: 0x546e7a });
const playerSkinMaterial = new THREE.MeshStandardMaterial({ color: 0xf2d7b6 });

const torsoWidth = 0.6;
const torsoHeight = 0.75;
const torsoDepth = 0.36;
const headRadius = 0.2;
const legLength = 0.7;
const armLength = 0.6;
const legRadius = 0.12;
const armRadius = 0.1;
const shoulderOffset = torsoWidth / 2 + armRadius * 0.6;
const hipOffset = torsoWidth * 0.2;
const playerHeight = legLength + torsoHeight + headRadius * 2;
const playerHalfHeight = playerHeight / 2;

const player = new THREE.Group();

const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoDepth), playerMaterial);
torso.position.y = -playerHalfHeight + legLength + torsoHeight / 2;
torso.castShadow = true;
torso.receiveShadow = true;
player.add(torso);

const head = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 16, 12), playerSkinMaterial);
head.position.y = torso.position.y + torsoHeight / 2 + headRadius;
head.castShadow = true;
player.add(head);

const leftLegPivot = new THREE.Group();
leftLegPivot.position.set(hipOffset, -playerHalfHeight + legLength, 0);
const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius, legLength, 8), playerAccentMaterial);
leftLeg.position.y = -legLength / 2;
leftLeg.castShadow = true;
leftLegPivot.add(leftLeg);
player.add(leftLegPivot);

const rightLegPivot = new THREE.Group();
rightLegPivot.position.set(-hipOffset, -playerHalfHeight + legLength, 0);
const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius, legLength, 8), playerAccentMaterial);
rightLeg.position.y = -legLength / 2;
rightLeg.castShadow = true;
rightLegPivot.add(rightLeg);
player.add(rightLegPivot);

const leftArmPivot = new THREE.Group();
leftArmPivot.position.set(shoulderOffset, torso.position.y + torsoHeight / 2 - 0.05, 0);
leftArmPivot.rotation.z = 0.15;
const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8), playerSkinMaterial);
leftArm.position.y = -armLength / 2;
leftArm.castShadow = true;
leftArmPivot.add(leftArm);
player.add(leftArmPivot);

const rightArmPivot = new THREE.Group();
rightArmPivot.position.set(-shoulderOffset, torso.position.y + torsoHeight / 2 - 0.05, 0);
rightArmPivot.rotation.z = -0.15;
const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8), playerSkinMaterial);
rightArm.position.y = -armLength / 2;
rightArm.castShadow = true;
rightArmPivot.add(rightArm);
player.add(rightArmPivot);

player.position.y = playerHalfHeight;
scene.add(player);

const ballRadius = 0.45;
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff6f61 });
const ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 24, 16), ballMaterial);
ball.castShadow = true;
ball.receiveShadow = true;
ball.position.set(0, ballRadius, -5);
scene.add(ball);

const chargeArrow = new THREE.ArrowHelper(
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, ballRadius + 0.2, 0),
  1,
  0xffe082,
  0.5,
  0.3
);
chargeArrow.visible = false;
scene.add(chargeArrow);

const playerVelocity = new THREE.Vector3();
const ballVelocity = new THREE.Vector3();
const moveSpeed = 7;
const moveAcceleration = 18;
const moveDeceleration = 14;
const turnRate = 3.1;
const backwardAccelFactor = 0.4;
const idleDrag = 0.92;
const sprintMultiplier = 1.45;
const maxEnergy = 100;
const energyDrain = 35;
const energyRegen = 22;
const jumpEnergyCost = 18;
const gravity = -18;
const jumpSpeed = 7.5;
const groundY = 0;
const matchDuration = 120;
const countdownDuration = 3;
const goalPauseDuration = 2;

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
let walkPhase = 0;
let currentPlanarSpeed = 0;

const minDistance = 3;
const maxDistance = 12;

const playerCollisionRadius = 0.6;
const carryDistance = playerCollisionRadius + ballRadius + 0.1;
const attachDistance = playerCollisionRadius + ballRadius + 0.05;
const ballRestitution = 0.55;
const wallRestitution = 0.65;
const ballFriction = 0.965;
const minShotSpeed = 9;
const maxShotSpeed = 22;
const maxChargeTime = 1.2;
const carryCooldownDuration = 0.25;

let energy = maxEnergy;
let carryingBall = false;
let carryCooldown = 0;
let charging = false;
let chargeTime = 0;
let timeLeft = matchDuration;
let countdownTime = 0;
let goalPauseTime = 0;
let gameState = "teamSelect";
let playerTeam = null;
const score = { blue: 0, red: 0 };

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
const blueScoreEl = document.getElementById("blueScore");
const redScoreEl = document.getElementById("redScore");
const timerEl = document.getElementById("timer");
const countdownEl = document.getElementById("countdown");
const goalBannerEl = document.getElementById("goalBanner");
const teamSelectEl = document.getElementById("teamSelect");
const matchEndEl = document.getElementById("matchEnd");
const finalBlueScoreEl = document.getElementById("finalBlueScore");
const finalRedScoreEl = document.getElementById("finalRedScore");
const restartMatchButton = document.getElementById("restartMatch");
const changeTeamButton = document.getElementById("changeTeam");
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

teamSelectEl.querySelectorAll("[data-team]").forEach((button) => {
  button.addEventListener("click", () => {
    const team = button.getAttribute("data-team");
    if (team !== "blue" && team !== "red") {
      return;
    }
    playerTeam = team;
    setPlayerColors(team);
    teamSelectEl.style.display = "none";
    matchEndEl.style.display = "none";
    startMatch();
  });
});

restartMatchButton.addEventListener("click", () => {
  if (!playerTeam) {
    return;
  }
  matchEndEl.style.display = "none";
  startMatch();
});

changeTeamButton.addEventListener("click", () => {
  matchEndEl.style.display = "none";
  teamSelectEl.style.display = "grid";
  gameState = "teamSelect";
  if (document.pointerLockElement) {
    document.exitPointerLock();
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

function setPlayerColors(team) {
  if (team === "blue") {
    playerMaterial.color.setHex(0x64b5f6);
    playerAccentMaterial.color.setHex(0x1e3a8a);
  } else {
    playerMaterial.color.setHex(0xef5350);
    playerAccentMaterial.color.setHex(0x7f1d1d);
  }
}

function resetPositions() {
  carryingBall = false;
  charging = false;
  chargeTime = 0;
  chargeArrow.visible = false;
  ballVelocity.set(0, 0, 0);
  ball.position.set(0, ballRadius, 0);

  const spawnZ = playerTeam === "blue" ? -fieldLength / 4 : fieldLength / 4;
  player.position.set(0, playerHalfHeight, spawnZ);
  playerVelocity.set(0, 0, 0);
  currentPlanarSpeed = 0;

  const facing = playerTeam === "blue" ? 0 : Math.PI;
  player.rotation.y = facing;
  yaw = facing;
  pitch = 0.35;

  energy = maxEnergy;
  if (energyFill) {
    energyFill.style.transform = "scaleX(1)";
  }
}

function updateScoreUI() {
  if (blueScoreEl) {
    blueScoreEl.textContent = `${score.blue}`;
  }
  if (redScoreEl) {
    redScoreEl.textContent = `${score.red}`;
  }
}

function updateTimerUI() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  if (timerEl) {
    timerEl.textContent = formatted;
    if (timeLeft <= 10) {
      timerEl.style.color = "#ff5a5a";
    } else if (timeLeft <= 30) {
      timerEl.style.color = "#f7d154";
    } else {
      timerEl.style.color = "#f8f4ee";
    }
  }
}

function startCountdown() {
  countdownTime = countdownDuration;
  gameState = "countdown";
  if (countdownEl) {
    countdownEl.style.display = "block";
    countdownEl.textContent = `${countdownDuration}`;
  }
}

function startMatch() {
  score.blue = 0;
  score.red = 0;
  timeLeft = matchDuration;
  updateScoreUI();
  updateTimerUI();
  resetPositions();
  if (goalBannerEl) {
    goalBannerEl.style.display = "none";
  }
  if (matchEndEl) {
    matchEndEl.style.display = "none";
  }
  startCountdown();
}

function startKickoffAfterGoal() {
  resetPositions();
  startCountdown();
}

function endMatch() {
  gameState = "matchEnd";
  if (finalBlueScoreEl) {
    finalBlueScoreEl.textContent = `${score.blue}`;
  }
  if (finalRedScoreEl) {
    finalRedScoreEl.textContent = `${score.red}`;
  }
  if (matchEndEl) {
    matchEndEl.style.display = "grid";
  }
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
}

function handleGoal(scoringTeam) {
  if (gameState !== "playing") {
    return;
  }
  score[scoringTeam] += 1;
  updateScoreUI();
  gameState = "goalPause";
  goalPauseTime = goalPauseDuration;
  carryingBall = false;
  charging = false;
  ballVelocity.set(0, 0, 0);
  if (goalBannerEl) {
    goalBannerEl.textContent = "BUT !";
    goalBannerEl.style.display = "block";
  }
}

function updateGameState(delta) {
  if (gameState === "countdown") {
    countdownTime -= delta;
    if (countdownEl) {
      countdownEl.textContent = `${Math.max(1, Math.ceil(countdownTime))}`;
    }
    if (countdownTime <= 0) {
      gameState = "playing";
      if (countdownEl) {
        countdownEl.style.display = "none";
      }
    }
  } else if (gameState === "goalPause") {
    goalPauseTime -= delta;
    if (goalPauseTime <= 0) {
      if (goalBannerEl) {
        goalBannerEl.style.display = "none";
      }
      startKickoffAfterGoal();
    }
  } else if (gameState === "playing") {
    timeLeft = Math.max(0, timeLeft - delta);
    updateTimerUI();
    if (timeLeft <= 0) {
      endMatch();
    }
  }
}

function checkGoal() {
  if (gameState !== "playing") {
    return;
  }
  const goalPlane = fieldLength / 2 + ballRadius * 0.5;
  const insideMouth = Math.abs(ball.position.x) <= goalWidth / 2 - ballRadius * 0.4;
  const lowEnough = ball.position.y <= goalHeight - ballRadius * 0.2;
  if (insideMouth && lowEnough) {
    if (ball.position.z > goalPlane) {
      handleGoal("blue");
    } else if (ball.position.z < -goalPlane) {
      handleGoal("red");
    }
  }
}

document.addEventListener("mousedown", (event) => {
  if (event.button !== 0 || !carryingBall || charging) {
    return;
  }
  startCharging();
  event.preventDefault();
});

document.addEventListener("mouseup", (event) => {
  if (event.button !== 0 || !charging) {
    return;
  }
  releaseShot();
  event.preventDefault();
});

function updateMovement(delta) {
  if (gameState !== "playing") {
    playerVelocity.set(0, 0, 0);
    currentPlanarSpeed = 0;
    player.position.y = playerHalfHeight;
    return;
  }

  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const inputDir = new THREE.Vector3();
  if (input.forward) {
    inputDir.add(forward);
  }
  if (input.backward) {
    inputDir.addScaledVector(forward, -1);
  }
  if (input.left) {
    inputDir.addScaledVector(right, -1);
  }
  if (input.right) {
    inputDir.add(right);
  }

  const moving = inputDir.lengthSq() > 0;
  const sprinting = input.sprint && energy > 0.1 && moving;
  const maxSpeed = moveSpeed * (sprinting ? sprintMultiplier : 1);
  if (moving) {
    inputDir.normalize();
  }

  const planarVelocity = new THREE.Vector3(playerVelocity.x, 0, playerVelocity.z);
  let planarSpeed = planarVelocity.length();
  const facingDir = new THREE.Vector3(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  const currentDir =
    planarSpeed > 0.05 ? planarVelocity.normalize() : facingDir.lengthSq() > 0.001 ? facingDir.normalize() : forward;

  let newDir = currentDir.clone();
  if (moving) {
    const targetDir = inputDir;
    const directionDot = THREE.MathUtils.clamp(newDir.dot(targetDir), -1, 1);
    const angle = Math.acos(directionDot);
    const turnBoost = 1 + (1 - directionDot) * 1.8;
    const maxTurn = turnRate * turnBoost * delta;
    if (angle > 0.0001) {
      const t = Math.min(1, maxTurn / angle);
      newDir.lerp(targetDir, t).normalize();
    }

    const facingDot = THREE.MathUtils.clamp(facingDir.dot(targetDir), -1, 1);
    const accelScale = THREE.MathUtils.lerp(backwardAccelFactor, 1, (facingDot + 1) / 2);
    const reverseFactor = Math.max(0, -directionDot);
    const accel = moveAcceleration * accelScale * (1 - reverseFactor * 0.4);

    if (reverseFactor > 0.01) {
      const brake = moveDeceleration * (1 + reverseFactor * 1.8);
      planarSpeed = Math.max(0, planarSpeed - brake * delta);
    }

    if (planarSpeed < maxSpeed) {
      planarSpeed = Math.min(maxSpeed, planarSpeed + accel * delta);
    } else if (planarSpeed > maxSpeed) {
      planarSpeed = Math.max(maxSpeed, planarSpeed - moveDeceleration * delta);
    }
  } else {
    planarSpeed *= Math.pow(idleDrag, delta * 60);
  }

  playerVelocity.x = newDir.x * planarSpeed;
  playerVelocity.z = newDir.z * planarSpeed;
  currentPlanarSpeed = planarSpeed;

  if (planarSpeed > 0.05) {
    player.rotation.y = Math.atan2(newDir.x, newDir.z);
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
    if (energy >= jumpEnergyCost) {
      playerVelocity.y = jumpSpeed;
      energy = Math.max(0, energy - jumpEnergyCost);
    }
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

function updateHumanoidAnimation(delta) {
  const maxSpeed = moveSpeed * sprintMultiplier;
  const speedRatio = THREE.MathUtils.clamp(currentPlanarSpeed / maxSpeed, 0, 1);
  if (speedRatio < 0.01) {
    leftLegPivot.rotation.x = 0;
    rightLegPivot.rotation.x = 0;
    leftArmPivot.rotation.x = 0;
    rightArmPivot.rotation.x = 0;
    return;
  }

  walkPhase += delta * (4 + speedRatio * 8);
  const legSwing = Math.sin(walkPhase) * 0.9 * speedRatio;
  const armSwing = Math.sin(walkPhase + Math.PI) * 0.7 * speedRatio;
  leftLegPivot.rotation.x = legSwing;
  rightLegPivot.rotation.x = -legSwing;
  leftArmPivot.rotation.x = armSwing;
  rightArmPivot.rotation.x = -armSwing;
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
    const facing = new THREE.Vector3(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
    forward = facing.lengthSq() < 0.0001 ? new THREE.Vector3(0, 0, 1) : facing.normalize();
  }
  const desired = player.position.clone().addScaledVector(forward, carryDistance);
  const playerGroundOffset = player.position.y - playerHalfHeight;
  desired.y = Math.max(ballRadius, playerGroundOffset + ballRadius);
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

function getAimDirection() {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  if (direction.lengthSq() < 0.0001) {
    direction.set(Math.sin(yaw), 0, Math.cos(yaw));
  }
  direction.normalize();
  return direction;
}

function startCharging() {
  charging = true;
  chargeTime = 0;
  updateChargeArrow();
}

function releaseShot() {
  if (!carryingBall) {
    cancelCharging();
    return;
  }
  const chargeRatio = Math.min(chargeTime / maxChargeTime, 1);
  const shotSpeed = minShotSpeed + (maxShotSpeed - minShotSpeed) * chargeRatio;
  shootBall(shotSpeed);
  cancelCharging();
}

function cancelCharging() {
  charging = false;
  chargeTime = 0;
  chargeArrow.visible = false;
}

function shootBall(speed) {
  if (!carryingBall) {
    return;
  }
  const direction = getAimDirection();
  ball.position.copy(player.position).addScaledVector(direction, carryDistance + 0.05);
  ball.position.y = ballRadius;
  ballVelocity.copy(direction.multiplyScalar(speed));
  ballVelocity.y = 0;
  carryingBall = false;
  carryCooldown = carryCooldownDuration;
}

function updateBall(delta) {
  if (gameState !== "playing") {
    ballVelocity.set(0, 0, 0);
    if (charging) {
      cancelCharging();
    }
    return;
  }
  if (carryCooldown > 0) {
    carryCooldown = Math.max(0, carryCooldown - delta);
  }
  if (carryingBall) {
    ballVelocity.set(0, 0, 0);
    updateCarriedBallPosition();
    return;
  }

  if (charging) {
    cancelCharging();
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

function updateChargeArrow() {
  if (!charging || !carryingBall) {
    chargeArrow.visible = false;
    return;
  }
  const ratio = Math.min(chargeTime / maxChargeTime, 1);
  const direction = getAimDirection();
  const length = 1 + ratio * 2.5;
  const origin = ball.position.clone();
  origin.y = ballRadius + 0.2;
  chargeArrow.position.copy(origin);
  chargeArrow.setDirection(direction);
  chargeArrow.setLength(length, 0.4 + ratio * 0.4, 0.25 + ratio * 0.3);
  chargeArrow.visible = true;
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
  updateGameState(delta);
  updateMovement(delta);
  updateBall(delta);
  updateHumanoidAnimation(delta);
  if (charging) {
    chargeTime = Math.min(maxChargeTime, chargeTime + delta);
    updateChargeArrow();
  } else if (chargeArrow.visible) {
    chargeArrow.visible = false;
  }
  checkGoal();
  updateCamera();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
