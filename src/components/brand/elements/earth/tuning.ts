/**
 * Earth's knobs: a zen garden of fine, dark volcanic sand seen from above,
 * in low raking light. Distances in CSS px, times in seconds; heights in
 * CSS px too (how far the sand rises or dips).
 */
export const TUNING = {
  /** The disturbance field's cell size (the raked pattern and letters are drawn at full resolution). */
  sim: { cell: 1.25 },

  /** The raked garden: straight lines, and rings around the stone. */
  garden: {
    /** Line spacing: a share of the screen's short side, within these limits. */
    periodShare: 0.0105,
    period: [6.5, 11] as const,
    /** Half the ridge-to-groove depth, freshly raked. */
    amp: 0.5,
    /** How much worn lines lose (0–1 of their depth). */
    wornLoss: 0.7,
    /** Rings around the stone: how many, and the gap before the first (× stone radius, + 2 px). */
    rings: 4,
    ringGap: 0.55,
  },

  /** The wordmark pressed into the sand (× font size where noted). */
  word: {
    depth: 0.026,
    depthRange: [1.4, 3.2] as const,
    /** Sand pushed up around the letters. */
    rim: 0.5,
    /** Edge softness of the letters and of the rim (blur widths, × font size). */
    bevel: 0.011,
    bevelMin: 0.55,
    rimSpread: 0.042,
    /** The accent becomes a smooth stone: its roundness (blur × font size) and height. */
    stoneBlur: 0.03,
    stoneHeight: 0.07,
  },

  /** Low sun from the top left. */
  light: {
    dir: [-0.62, -0.58, 0.31] as const,
    ambient: 0.2,
    sun: 2.55,
    /** How strongly slopes catch or lose the light. */
    relief: 1.1,
    /** Sand albedo relative to the page surface colour. */
    sand: 1.45,
    /** Cast shadows: how dark. */
    shadow: 0.78,
    vignette: 0.3,
  },

  /** Fine grains: size, bumpiness, and the share of glassy grains that glint. */
  grain: { size: 0.72, relief: 0.12, glint: 0.007 },

  /** Dragging rakes grooves: tines and their spacing (× line spacing), depth, and the sand heaped beside them. */
  rake: { tines: 5, spacing: 1.7, depth: 2.6, berm: 1.6, step: 2 },

  /** A tap: a crater, with grains flying out. */
  crater: { radius: 15, depth: 3, rim: 1.0, grains: 32, size: [1.5, 3] as const, speed: [60, 190] as const, lift: [120, 270] as const },

  /** A keystroke: a pebble drops in and leaves a dent. */
  pebble: {
    size: [8, 11] as const,
    drop: 46,
    dentRadius: 6.5,
    dentDepth: 1.3,
    /** Seconds resting on top, then sinking out of sight. */
    rest: 1.1,
    sink: 2.2,
  },

  /** Grains after landing: seconds resting, then fading into the sand. */
  grains: { rest: 1.2, fade: 2.6, gravity: 900, max: 320 },

  /** Disturbances settle back to the raked garden; wind speeds that up. */
  settle: {
    /** Seconds to fade to about a third, in still air and in wind. */
    calm: 45,
    windy: 18,
    /** Softening (blur), in cells² per second, in still air and in wind. */
    blurCalm: 0.015,
    blurWindy: 0.06,
    /** How fast the wind wears the raked lines (per second, at full wind), and the most it wears them. */
    wear: 1 / 160,
    maxWear: 0.9,
  },

  /** The wind never quite stops: a breeze while the visitor is busy, gusts once they're idle. */
  wind: {
    dir: [0.96, 0.28] as const,
    speed: 26,
    breeze: 0.4,
    rise: 3,
    fall: 1.5,
    /** Streamers of fine sand: lane spacing across the wind, how fast they travel, how high and bright. */
    lane: 125,
    streamerSpeed: 44,
    streamerHeight: 0.32,
    streamerGlow: 0.05,
    /** Skittering grains: one every this many seconds at full wind (random in range), how long each runs, how fast. */
    grainGap: [0.03, 0.09] as const,
    grainLife: [1.2, 2.6] as const,
    grainSpeed: [35, 75] as const,
  },

  /** The invisible rake: lines per pass, speed, the sand heaped ahead of its tines, grains flicked per second. */
  gardener: { lines: 7, speed: 70, heap: 0.75, flick: 5 },

  /** The sent message: pressed in, held, then erased by the wind. */
  message: {
    press: 0.7,
    hold: 1.8,
    erode: 7,
    depth: 0.9,
    rim: 0.28,
    bevel: 0.5,
    rimSpread: 1.6,
    /** Wind while it erases. */
    wind: 0.85,
  },

  render: {
    maxPixelRatio: 2,
    pixelBudget: 3.2e6,
  },

  frame: { slowFrameMs: 26, stepDown: 0.8 },
} as const;
