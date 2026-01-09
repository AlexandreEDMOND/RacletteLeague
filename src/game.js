import THREE from "./three.js";
import { BALL, CAMERA, FIELD, GOAL, MATCH, MOVEMENT, PHYSICS, PLAYER, SHOOTING } from "./config.js";

export function createGame({ world, input, ui }) {
  const { scene, camera, renderer, wallColliders, player, ball, groundY } = world;
  const inputState = input.input;
  const cameraState = input.cameraState;

  const playerGroup = player.group;
  const playerHalfHeight = player.halfHeight;
  const playerPivots = player.pivots;
  const ballMesh = ball.mesh;

  const carryDistance = PLAYER.collisionRadius + BALL.radius + 0.1;
  const attachDistance = PLAYER.collisionRadius + BALL.radius + 0.05;

  const playerVelocity = new THREE.Vector3();
  const ballVelocity = new THREE.Vector3();

  let energy = MOVEMENT.maxEnergy;
  let carryingBall = false;
  let carryCooldown = 0;
  let charging = false;
  let chargeTime = 0;
  let timeLeft = MATCH.duration;
  let countdownTime = 0;
  let goalPauseTime = 0;
  let gameState = "teamSelect";
  let playerTeam = null;
  let walkPhase = 0;
  let currentPlanarSpeed = 0;
  let trickTime = 0;
  let trickDirection = 0;
  let kickFlashTime = 0;

  const score = { blue: 0, red: 0 };

  function setPlayerColors(team) {
    if (team === "blue") {
      player.materials.base.color.setHex(0x64b5f6);
      player.materials.accent.color.setHex(0x1e3a8a);
    } else {
      player.materials.base.color.setHex(0xef5350);
      player.materials.accent.color.setHex(0x7f1d1d);
    }
  }

  function resetPositions() {
    carryingBall = false;
    charging = false;
    chargeTime = 0;
    ui.hideShotMeter();
    ballVelocity.set(0, 0, 0);
    ballMesh.position.set(0, BALL.radius, 0);

    const spawnZ = playerTeam === "blue" ? -FIELD.length / 4 : FIELD.length / 4;
    playerGroup.position.set(0, playerHalfHeight, spawnZ);
    playerVelocity.set(0, 0, 0);
    currentPlanarSpeed = 0;

    const facing = playerTeam === "blue" ? 0 : Math.PI;
    playerGroup.rotation.y = facing;
    cameraState.yaw = facing;
    cameraState.pitch = CAMERA.defaultPitch;

    energy = MOVEMENT.maxEnergy;
    ui.updateEnergy(1);
  }

  function startCountdown() {
    countdownTime = MATCH.countdown;
    gameState = "countdown";
    ui.showCountdown(MATCH.countdown);
  }

  function startMatch() {
    score.blue = 0;
    score.red = 0;
    timeLeft = MATCH.duration;
    ui.updateScore(score);
    ui.updateTimer(timeLeft);
    ui.hideGoal();
    ui.hideMatchEnd();
    resetPositions();
    startCountdown();
  }

  function startKickoffAfterGoal() {
    resetPositions();
    startCountdown();
  }

  function endMatch() {
    gameState = "matchEnd";
    ui.showMatchEnd(score);
    input.exitPointerLock();
  }

  function handleGoal(scoringTeam) {
    if (gameState !== "playing") {
      return;
    }
    score[scoringTeam] += 1;
    ui.updateScore(score);
    gameState = "goalPause";
    goalPauseTime = MATCH.goalPause;
    carryingBall = false;
    cancelCharging();
    ballVelocity.set(0, 0, 0);
    ui.showGoal();
  }

  function updateGameState(delta) {
    if (gameState === "countdown") {
      countdownTime -= delta;
      ui.showCountdown(Math.max(1, Math.ceil(countdownTime)));
      if (countdownTime <= 0) {
        gameState = "playing";
        ui.hideCountdown();
      }
    } else if (gameState === "goalPause") {
      goalPauseTime -= delta;
      if (goalPauseTime <= 0) {
        ui.hideGoal();
        startKickoffAfterGoal();
      }
    } else if (gameState === "playing") {
      timeLeft = Math.max(0, timeLeft - delta);
      ui.updateTimer(timeLeft);
      if (timeLeft <= 0) {
        endMatch();
      }
    }
  }

  function checkGoal() {
    if (gameState !== "playing") {
      return;
    }
    const goalPlane = FIELD.length / 2 + BALL.radius * 0.5;
    const insideMouth = Math.abs(ballMesh.position.x) <= GOAL.width / 2 - BALL.radius * 0.4;
    const lowEnough = ballMesh.position.y <= GOAL.height - BALL.radius * 0.2;
    if (insideMouth && lowEnough) {
      if (ballMesh.position.z > goalPlane) {
        handleGoal("blue");
      } else if (ballMesh.position.z < -goalPlane) {
        handleGoal("red");
      }
    }
  }

  function handleTeamSelect(team) {
    playerTeam = team;
    setPlayerColors(team);
    ui.hideTeamSelect();
    ui.hideMatchEnd();
    startMatch();
  }

  function handleRestart() {
    if (!playerTeam) {
      return;
    }
    ui.hideMatchEnd();
    startMatch();
  }

  function handleChangeTeam() {
    gameState = "teamSelect";
    ui.hideMatchEnd();
    ui.showTeamSelect();
    input.exitPointerLock();
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
      const facing = new THREE.Vector3(Math.sin(playerGroup.rotation.y), 0, Math.cos(playerGroup.rotation.y));
      forward = facing.lengthSq() < 0.0001 ? new THREE.Vector3(0, 0, 1) : facing.normalize();
    }
    const desired = playerGroup.position.clone().addScaledVector(forward, carryDistance);
    const playerGroundOffset = playerGroup.position.y - playerHalfHeight;
    desired.y = Math.max(BALL.radius, playerGroundOffset + BALL.radius);
    ballMesh.position.copy(desired);
    resolveWallCollision(ballMesh.position, BALL.radius, ballVelocity, PHYSICS.wallRestitution);
  }

  function tryAttachBall() {
    if (carryingBall || carryCooldown > 0) {
      return;
    }
    const dx = ballMesh.position.x - playerGroup.position.x;
    const dz = ballMesh.position.z - playerGroup.position.z;
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
      direction.set(Math.sin(cameraState.yaw), 0, Math.cos(cameraState.yaw));
    }
    direction.normalize();
    return direction;
  }

  function startCharging() {
    charging = true;
    chargeTime = 0;
    ui.updateShotMeter(0, 0, 0);
    updateChargeArrow(0);
  }

  function cancelCharging() {
    charging = false;
    chargeTime = 0;
    ui.hideShotMeter();
  }

  function shootBall(direction, speed, lift = 0) {
    if (!carryingBall) {
      return;
    }
    ballMesh.position.copy(playerGroup.position).addScaledVector(direction, carryDistance + 0.05);
    ballMesh.position.y = BALL.radius;
    ballVelocity.copy(direction.multiplyScalar(speed));
    ballVelocity.y = Math.max(0, lift);
    carryingBall = false;
    carryCooldown = SHOOTING.carryCooldownDuration;
  }

  function handlePrimaryDown() {
    if (!carryingBall || charging) {
      return;
    }
    const direction = getAimDirection();
    shootBall(direction, SHOOTING.tapShotSpeed, 0);
    kickFlashTime = SHOOTING.kickDuration;
  }

  function handlePrimaryUp() {}

  function handleSecondaryDown() {
    if (!carryingBall || charging) {
      return;
    }
    startCharging();
  }

  function handleSecondaryUp() {
    if (!charging) {
      return;
    }
    if (carryingBall) {
      const progress = Math.min(chargeTime / SHOOTING.meterDuration, 1);
      const speed = SHOOTING.minShotSpeed + (SHOOTING.maxShotSpeed - SHOOTING.minShotSpeed) * progress;
      const lift = SHOOTING.lobMinLift + (SHOOTING.lobMaxLift - SHOOTING.lobMinLift) * progress;
      const direction = getAimDirection();
      shootBall(direction, speed, lift);
      kickFlashTime = SHOOTING.kickDuration;
    }
    cancelCharging();
  }

  function updateMovement(delta) {
    if (gameState !== "playing") {
      playerVelocity.set(0, 0, 0);
      currentPlanarSpeed = 0;
      playerGroup.position.y = playerHalfHeight;
      inputState.jumpRequested = false;
      inputState.trickLeftRequested = false;
      inputState.trickRightRequested = false;
      playerGroup.rotation.z = 0;
      return;
    }

    if (trickTime > 0) {
      trickTime = Math.max(0, trickTime - delta);
      const facingDir = new THREE.Vector3(Math.sin(playerGroup.rotation.y), 0, Math.cos(playerGroup.rotation.y));
      const rightDir = new THREE.Vector3(facingDir.z, 0, -facingDir.x);
      playerVelocity.x = rightDir.x * MOVEMENT.trickSpeed * trickDirection;
      playerVelocity.z = rightDir.z * MOVEMENT.trickSpeed * trickDirection;
      currentPlanarSpeed = Math.hypot(playerVelocity.x, playerVelocity.z);
      const rollProgress = 1 - trickTime / MOVEMENT.trickDuration;
      playerGroup.rotation.z = trickDirection * rollProgress * Math.PI * 2;
    } else {
      playerGroup.rotation.z = 0;
    }

    const forward = new THREE.Vector3(Math.sin(cameraState.yaw), 0, Math.cos(cameraState.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const inputDir = new THREE.Vector3();
    if (inputState.forward && trickTime <= 0) {
      inputDir.add(forward);
    }
    if (inputState.backward && trickTime <= 0) {
      inputDir.addScaledVector(forward, -1);
    }
    if (inputState.left && trickTime <= 0) {
      inputDir.addScaledVector(right, -1);
    }
    if (inputState.right && trickTime <= 0) {
      inputDir.add(right);
    }

    const moving = trickTime <= 0 && inputDir.lengthSq() > 0;
    const sprinting = inputState.sprint && energy > 0.1 && moving;
    let maxSpeed = MOVEMENT.moveSpeed * (sprinting ? MOVEMENT.sprintMultiplier : 1);
    if (charging) {
      maxSpeed *= SHOOTING.chargeSpeedFactor;
    }
    if (moving) {
      inputDir.normalize();
    }

    const planarVelocity = new THREE.Vector3(playerVelocity.x, 0, playerVelocity.z);
    let planarSpeed = planarVelocity.length();
    const facingDir = new THREE.Vector3(Math.sin(playerGroup.rotation.y), 0, Math.cos(playerGroup.rotation.y));
    const currentDir =
      planarSpeed > 0.05 ? planarVelocity.normalize() : facingDir.lengthSq() > 0.001 ? facingDir.normalize() : forward;

    let newDir = currentDir.clone();
    if (moving) {
      const targetDir = inputDir;
      const directionDot = THREE.MathUtils.clamp(newDir.dot(targetDir), -1, 1);
      const angle = Math.acos(directionDot);
      const turnBoost = 1 + (1 - directionDot) * 1.8;
      const maxTurn = MOVEMENT.turnRate * turnBoost * delta;
      if (angle > 0.0001) {
        const t = Math.min(1, maxTurn / angle);
        newDir.lerp(targetDir, t).normalize();
      }

      const facingDot = THREE.MathUtils.clamp(facingDir.dot(targetDir), -1, 1);
      const accelScale = THREE.MathUtils.lerp(MOVEMENT.backwardAccelFactor, 1, (facingDot + 1) / 2);
      const reverseFactor = Math.max(0, -directionDot);
      const accel = MOVEMENT.moveAcceleration * accelScale * (1 - reverseFactor * 0.4);

      if (reverseFactor > 0.01) {
        const brake = MOVEMENT.moveDeceleration * (1 + reverseFactor * 1.8);
        planarSpeed = Math.max(0, planarSpeed - brake * delta);
      }

      if (planarSpeed < maxSpeed) {
        planarSpeed = Math.min(maxSpeed, planarSpeed + accel * delta);
      } else if (planarSpeed > maxSpeed) {
        planarSpeed = Math.max(maxSpeed, planarSpeed - MOVEMENT.moveDeceleration * delta);
      }
    } else if (trickTime <= 0) {
      planarSpeed *= Math.pow(MOVEMENT.idleDrag, delta * 60);
    }

    if (trickTime <= 0) {
      playerVelocity.x = newDir.x * planarSpeed;
      playerVelocity.z = newDir.z * planarSpeed;
      currentPlanarSpeed = planarSpeed;
    }

    if (planarSpeed > 0.05 && trickTime <= 0) {
      playerGroup.rotation.y = Math.atan2(newDir.x, newDir.z);
    }

    if (sprinting) {
      energy = Math.max(0, energy - MOVEMENT.energyDrain * delta);
    } else {
      energy = Math.min(MOVEMENT.maxEnergy, energy + MOVEMENT.energyRegen * delta);
    }
    ui.updateEnergy(energy / MOVEMENT.maxEnergy);

    const grounded = playerGroup.position.y <= groundY + playerHalfHeight + 0.001;
    if (grounded) {
      playerGroup.position.y = groundY + playerHalfHeight;
      if (playerVelocity.y < 0) {
        playerVelocity.y = 0;
      }
    }
    if (inputState.jumpRequested && grounded) {
      if (energy >= MOVEMENT.jumpEnergyCost) {
        playerVelocity.y = MOVEMENT.jumpSpeed;
        energy = Math.max(0, energy - MOVEMENT.jumpEnergyCost);
      }
    }
    inputState.jumpRequested = false;
    if (inputState.trickLeftRequested || inputState.trickRightRequested) {
      if (trickTime <= 0 && energy >= MOVEMENT.trickEnergyCost) {
        trickDirection = inputState.trickLeftRequested ? 1 : -1;
        trickTime = MOVEMENT.trickDuration;
        energy = Math.max(0, energy - MOVEMENT.trickEnergyCost);
        ui.updateEnergy(energy / MOVEMENT.maxEnergy);
      }
      inputState.trickLeftRequested = false;
      inputState.trickRightRequested = false;
    }

    playerVelocity.y += PHYSICS.gravity * delta;
    playerGroup.position.x += playerVelocity.x * delta;
    playerGroup.position.y += playerVelocity.y * delta;
    playerGroup.position.z += playerVelocity.z * delta;

    if (playerGroup.position.y < groundY + playerHalfHeight) {
      playerGroup.position.y = groundY + playerHalfHeight;
      playerVelocity.y = 0;
    }

    resolveWallCollision(playerGroup.position, PLAYER.collisionRadius, playerVelocity, 0);
  }

  function updateHumanoidAnimation(delta) {
    const maxSpeed = MOVEMENT.moveSpeed * MOVEMENT.sprintMultiplier;
    const speedRatio = THREE.MathUtils.clamp(currentPlanarSpeed / maxSpeed, 0, 1);
    const chargeRatio = charging ? Math.min(chargeTime / SHOOTING.meterDuration, 1) : 0;
    const chargeEase = chargeRatio * chargeRatio;
    const chargePose = charging ? -0.9 * chargeEase : 0;
    const kickPose =
      kickFlashTime > 0 ? 0.9 * (kickFlashTime / SHOOTING.kickDuration) : 0;

    if (speedRatio < 0.01) {
      playerPivots.rightLeg.rotation.x = 0;
      playerPivots.leftArm.rotation.x = 0;
      playerPivots.rightArm.rotation.x = 0;
      playerPivots.leftLeg.rotation.x = kickPose !== 0 ? kickPose : chargePose;
      return;
    }

    walkPhase += delta * (4 + speedRatio * 8);
    const legSwing = Math.sin(walkPhase) * 0.9 * speedRatio;
    const armSwing = Math.sin(walkPhase + Math.PI) * 0.7 * speedRatio;
    playerPivots.rightLeg.rotation.x = -legSwing;
    playerPivots.leftArm.rotation.x = armSwing;
    playerPivots.rightArm.rotation.x = -armSwing;
    if (kickPose !== 0) {
      playerPivots.leftLeg.rotation.x = kickPose;
    } else if (charging) {
      playerPivots.leftLeg.rotation.x = chargePose;
    } else {
      playerPivots.leftLeg.rotation.x = legSwing;
    }
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
    ballVelocity.y += PHYSICS.gravity * delta;
    ballMesh.position.addScaledVector(ballVelocity, delta);

    if (ballMesh.position.y < BALL.radius) {
      ballMesh.position.y = BALL.radius;
      if (ballVelocity.y < 0) {
        if (Math.abs(ballVelocity.y) < PHYSICS.groundStickSpeed) {
          ballVelocity.y = 0;
        } else {
          ballVelocity.y *= -PHYSICS.ballRestitution;
        }
      }
      const groundFriction = Math.pow(PHYSICS.ballFriction, delta * 60);
      ballVelocity.x *= groundFriction;
      ballVelocity.z *= groundFriction;
    }

    resolveWallCollision(ballMesh.position, BALL.radius, ballVelocity, PHYSICS.wallRestitution);
    tryAttachBall();
  }

  function updateCamera() {
    if (gameState === "countdown") {
      cameraState.pitch = CAMERA.defaultPitch;
      cameraState.yaw = playerGroup.rotation.y;
    }
    const targetHeight = 0.8;
    const target = new THREE.Vector3(playerGroup.position.x, playerGroup.position.y + targetHeight, playerGroup.position.z);
    const minCameraHeight = groundY + 0.2;
    const pitchLimit = THREE.MathUtils.clamp((target.y - minCameraHeight) / cameraState.distance, -1, 1);
    const maxPitchFromGround = Math.asin(pitchLimit);
    const maxPitch = Math.max(CAMERA.pitchMin, maxPitchFromGround);
    cameraState.pitch = THREE.MathUtils.clamp(cameraState.pitch, CAMERA.pitchMin, maxPitch);

    const direction = new THREE.Vector3(
      Math.sin(cameraState.yaw) * Math.cos(cameraState.pitch),
      Math.sin(cameraState.pitch),
      Math.cos(cameraState.yaw) * Math.cos(cameraState.pitch)
    );
    const desired = target.clone().addScaledVector(direction, -cameraState.distance);
    camera.position.copy(desired);
    camera.lookAt(target);
  }

  function update(delta) {
    updateGameState(delta);
    updateMovement(delta);
    updateBall(delta);
    if (kickFlashTime > 0) {
      kickFlashTime = Math.max(0, kickFlashTime - delta);
    }
    updateHumanoidAnimation(delta);
    if (charging) {
      chargeTime = Math.min(SHOOTING.meterDuration, chargeTime + delta);
      const progress = Math.min(chargeTime / SHOOTING.meterDuration, 1);
      ui.updateShotMeter(progress, 0, 0);
    }
    checkGoal();
    updateCamera();
    renderer.render(scene, camera);
  }

  return {
    update,
    handlePrimaryDown,
    handlePrimaryUp,
    handleSecondaryDown,
    handleSecondaryUp,
    handleTeamSelect,
    handleRestart,
    handleChangeTeam,
  };
}
