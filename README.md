# Raclette League Prototype

Prototype Rocket League-style in Three.js with keyboard movement, third-person camera, and a simple match flow.

## Run locally

1. Double-click `run.bat`
2. Click inside the page to lock the mouse

## Controls

- Q Z D S: move
- Space: jump (costs energy)
- Shift: sprint (consumes energy)
- Mouse: look
- Left click: light shot
- Right click: charge shot (release to shoot)
- A / E: side trick (energy cost)

## Project structure

- `public/index.html` UI and layout
- `public/style.css` styling for overlays and HUD
- `src/` modular game code
  - `config.js` game constants
  - `three.js` Three.js import
  - `world.js` scene, field, walls, goals, player model
  - `input.js` keyboard/mouse input and pointer lock
  - `ui.js` HUD, overlays, and score/timer updates
  - `game.js` game state, physics, and update loop
  - `main.js` app bootstrap and animation loop
