import * as THREE from 'three'

// ── Brand ────────────────────────────────────────────────────────────────────
export const VEEVA_ORANGE = '#FF5F00'
export const VEEVA_NAVY   = '#0B192C'
export const VEEVA_WHITE  = '#FFFFFF'
export const ASPHALT_COLOR = '#4A4B52'
export const GRASS_COLOR   = '#4A7C59'
export const CURB_RED      = '#CC2200'
export const CURB_WHITE    = '#EEEEEE'

// ── Track Layout ─────────────────────────────────────────────────────────────
// Smooth oval — chicane removed to clear infield buildings
// ~1 unit ≈ 2 metres
export const TRACK_POINTS = [
  new THREE.Vector3(  0,  0,  65),  // P00 – Start / Finish
  new THREE.Vector3( 55,  0,  60),  // P01 – South straight (east)
  new THREE.Vector3( 90,  0,  35),  // P02 – SE curve
  new THREE.Vector3( 98,  0,   0),  // P03 – East straight (Hacienda Dr)
  new THREE.Vector3( 90,  0, -35),  // P04 – NE curve entry
  new THREE.Vector3( 68,  0, -68),  // P05 – NE corner
  new THREE.Vector3( 30,  0, -76),  // P06 – North straight (east)
  new THREE.Vector3(  0,  0, -80),  // P07 – North apex
  new THREE.Vector3(-30,  0, -76),  // P08 – North straight (west)
  new THREE.Vector3(-68,  0, -68),  // P09 – NW corner
  new THREE.Vector3(-98,  0, -35),  // P10 – NW curve
  new THREE.Vector3(-98,  0,   0),  // P11 – West straight (Inglewood Dr)
  new THREE.Vector3(-90,  0,  35),  // P12 – SW curve
  new THREE.Vector3(-55,  0,  60),  // P13 – South straight (west)
]

export const ROAD_WIDTH = 20   // units

export const TRACK_SEGMENTS = 300  // mesh resolution

// Checkpoint t-values along the curve (0 = start, 1 = end of loop)
// Player must hit CP0→CP1→CP2→Finish in order
export const CHECKPOINT_T = [0.50, 0.75]
export const CHECKPOINT_RADIUS = 9   // detection radius (units)
export const FINISH_RADIUS     = 9

export const TOTAL_LAPS = 3


// ── Starting Grid (world positions) ──────────────────────────────────────────
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

// Initial kart Y rotation to face along the track (east, roughly -π/2 from -Z forward)
export const STARTING_ROTATION_Y = -Math.PI / 2

// ── Physics ───────────────────────────────────────────────────────────────────
export const PHYSICS_GRAVITY      = -30
export const ENGINE_FORCE         = 900
export const REVERSE_FORCE        = 400
export const BRAKE_FORCE          = 700
export const STEER_TORQUE         = 3.5
export const MAX_SPEED            = 32   // m/s (~115 km/h)
export const LINEAR_DAMPING       = 2.5
export const ANGULAR_DAMPING      = 8.0
export const DRIFT_LINEAR_DAMPING = 1.2
export const DRIFT_ANGULAR_DAMPING = 3.5
export const GRASS_DAMPING_MULT   = 3.0  // extra damping on grass
export const DOWNFORCE            = 40

// ── Multiplayer ───────────────────────────────────────────────────────────────
export const MAX_PLAYERS_PER_ROOM = 10
export const SYNC_INTERVAL_MS     = 50   // 20 Hz

// ── Car Colors ────────────────────────────────────────────────────────────────
export const CAR_COLORS = [
  '#FF5F00', // Veeva Orange (local player)
  '#2563EB', // Blue
  '#16A34A', // Green
  '#DC2626', // Red
  '#9333EA', // Purple
  '#F59E0B', // Amber
  '#0891B2', // Cyan
  '#BE185D', // Pink
  '#65A30D', // Lime
  '#7C3AED', // Violet
]
