export const FIELD = {
  width: 24,
  length: 36,
  circleRadius: 3,
  circleSegments: 40,
  groundY: 0,
};

export const WALL = {
  thickness: 0.6,
  height: 2.2,
};

export const GOAL = {
  width: 8,
  height: 2.6,
  depth: 3,
};

export const PLAYER_MODEL = {
  torsoWidth: 0.6,
  torsoHeight: 0.75,
  torsoDepth: 0.36,
  headRadius: 0.2,
  legLength: 0.7,
  armLength: 0.6,
  legRadius: 0.12,
  armRadius: 0.1,
};

export const PLAYER = {
  collisionRadius: 0.6,
};

export const BALL = {
  radius: 0.45,
};

export const CAMERA = {
  minDistance: 3,
  maxDistance: 12,
  pitchMin: -1.2,
  pitchMax: 1.2,
  mouseSensitivity: 0.0022,
};

export const MOVEMENT = {
  moveSpeed: 7,
  moveAcceleration: 18,
  moveDeceleration: 14,
  turnRate: 3.1,
  backwardAccelFactor: 0.4,
  idleDrag: 0.92,
  sprintMultiplier: 1.45,
  maxEnergy: 100,
  energyDrain: 35,
  energyRegen: 22,
  jumpEnergyCost: 18,
  jumpSpeed: 7.5,
};

export const PHYSICS = {
  gravity: -18,
  ballRestitution: 0.55,
  wallRestitution: 0.65,
  ballFriction: 0.965,
};

export const SHOOTING = {
  minShotSpeed: 9,
  maxShotSpeed: 22,
  maxChargeTime: 1.2,
  carryCooldownDuration: 0.25,
};

export const MATCH = {
  duration: 120,
  countdown: 3,
  goalPause: 2,
};
