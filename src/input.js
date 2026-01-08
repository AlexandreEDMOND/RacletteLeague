import THREE from "./three.js";
import { CAMERA } from "./config.js";

export function createInput({ renderer, instructions }) {
  const input = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jumpRequested: false,
  };

  const cameraState = {
    yaw: 0,
    pitch: 0.35,
    distance: 7,
  };

  let onPrimaryDown = null;
  let onPrimaryUp = null;

  function setShootHandlers(down, up) {
    onPrimaryDown = down;
    onPrimaryUp = up;
  }

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
      input.jumpRequested = true;
    } else {
      return;
    }

    event.preventDefault();
  }

  function requestLock() {
    renderer.domElement.requestPointerLock();
  }

  renderer.domElement.addEventListener("click", requestLock);
  if (instructions) {
    instructions.addEventListener("click", requestLock);
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

  document.addEventListener("pointerlockchange", () => {
    if (!instructions) {
      return;
    }
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
    cameraState.yaw -= event.movementX * CAMERA.mouseSensitivity;
    cameraState.pitch -= event.movementY * CAMERA.mouseSensitivity;
  });

  document.addEventListener(
    "wheel",
    (event) => {
      cameraState.distance = THREE.MathUtils.clamp(
        cameraState.distance + event.deltaY * 0.01,
        CAMERA.minDistance,
        CAMERA.maxDistance
      );
      event.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener("mousedown", (event) => {
    if (event.button !== 0 || !onPrimaryDown) {
      return;
    }
    if (document.pointerLockElement !== renderer.domElement) {
      return;
    }
    onPrimaryDown();
    event.preventDefault();
  });

  document.addEventListener("mouseup", (event) => {
    if (event.button !== 0 || !onPrimaryUp) {
      return;
    }
    if (document.pointerLockElement !== renderer.domElement) {
      return;
    }
    onPrimaryUp();
    event.preventDefault();
  });

  function exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  return {
    input,
    cameraState,
    setShootHandlers,
    exitPointerLock,
  };
}
