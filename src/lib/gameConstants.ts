import * as THREE from 'three'

// ── Track Layout ─────────────────────────────────────────────────────────────
export const TRACK_POINTS = [
  new THREE.Vector3(  0,  0,  65),
  new THREE.Vector3( 55,  0,  60),
  new THREE.Vector3( 90,  0,  35),
  new THREE.Vector3( 98,  0,   0),
  new THREE.Vector3( 90,  0, -35),
  new THREE.Vector3( 68,  0, -68),
  new THREE.Vector3( 30,  0, -76),
  new THREE.Vector3(  0,  0, -80),
  new THREE.Vector3(-30,  0, -76),
  new THREE.Vector3(-68,  0, -68),
  new THREE.Vector3(-98,  0, -35),
  new THREE.Vector3(-98,  0,   0),
  new THREE.Vector3(-90,  0,  35),
  new THREE.Vector3(-55,  0,  60),
]

export const ROAD_WIDTH = 20
export const TRACK_SEGMENTS = 300
export const CHECKPOINT_T = [0.50, 0.75]
export const CHECKPOINT_RADIUS = 9
export const FINISH_RADIUS     = 9
export const TOTAL_LAPS = 3

export const STARTING_POSITIONS: [number, number, number][] = [
  [  0, 1, 65],
  [  5, 1, 65],
  [ -5, 1, 65],
  [  0, 1, 72],
  [  5, 1, 72],
  [ -5, 1, 72],
  [  0, 1, 79],
  [  5, 1, 79],
  [ -5, 1, 79],
  [  0, 1, 86],
]

export const STARTING_ROTATION_Y = -Math.PI / 2

export const PHYSICS_GRAVITY      = -30
export const ENGINE_FORCE         = 900
export const REVERSE_FORCE        = 400
export const BRAKE_FORCE          = 700
export const STEER_TORQUE         = 3.5
export const MAX_SPEED            = 32
export const LINEAR_DAMPING       = 2.5
export const ANGULAR_DAMPING      = 8.0
export const DRIFT_LINEAR_DAMPING = 1.2
export const DRIFT_ANGULAR_DAMPING = 3.5
export const GRASS_DAMPING_MULT   = 3.0
export const DOWNFORCE            = 40

export const MAX_PLAYERS_PER_ROOM = 10
export const SYNC_INTERVAL_MS     = 50
