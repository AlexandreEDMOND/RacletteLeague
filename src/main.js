import { createWorld } from "./world.js";
import { createInput } from "./input.js";
import { createUI } from "./ui.js";
import { createGame } from "./game.js";

const world = createWorld();
const ui = createUI();
const input = createInput({ renderer: world.renderer, instructions: ui.instructions });
const game = createGame({ world, input, ui });

ui.bindHandlers({
  onTeamSelect: game.handleTeamSelect,
  onRestart: game.handleRestart,
  onChangeTeam: game.handleChangeTeam,
});

input.setShootHandlers(game.handlePrimaryDown, game.handlePrimaryUp);
input.setSecondaryHandlers(game.handleSecondaryDown, game.handleSecondaryUp);

let lastTime = performance.now();
function animate(time) {
  const delta = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  game.update(delta);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

window.addEventListener("resize", () => {
  world.camera.aspect = window.innerWidth / window.innerHeight;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(window.innerWidth, window.innerHeight);
});
