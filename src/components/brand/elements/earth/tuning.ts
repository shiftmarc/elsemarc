/**
 * Earth's knobs: a zen garden of fine, dark volcanic sand seen from above,
 * in low raking light. Distances in CSS px, times in seconds; heights in
 * CSS px too (how far the sand rises or dips).
 */
export const TUNING = {
  /** The disturbance field's cell size (the raked pattern and letters are drawn at full resolution). */
  sim: { cell: 1.25 },

  /** The raked garden: long, gently waving lines, and rings around the wordmark. */
  garden: {
    /** Groove spacing: a share of the screen's short side, within these limits. */
    periodShare: 0.0105,
    period: [6.5, 11] as const,
    /** Half the ridge-to-groove depth. */
    amp: 0.4,
    /** The lines' slow wave: height (in groove spacings) and wavelength. */
    wave: 1.1,
    waveLength: 560,
    /** Rings around the word: how many, and how far out they start (× font size). */
    rings: 5,
    ringPad: 0.2,
    ringMargin: 0.12,
  },

  /** The wordmark pressed into the sand (× font size where noted). */
  word: {
    depth: 0.022,
    depthRange: [1.2, 2.8] as const,
    /** Sand pushed up around the letters. */
    rim: 0.42,
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
    dir: [-0.6, -0.56, 0.4] as const,
    ambient: 0.24,
    sun: 2.0,
    /** How strongly slopes catch or lose the light. */
    relief: 1.0,
    vignette: 0.3,
  },

  /** Fine grains: size, bumpiness, and the share of glassy grains that glint. */
  grain: { size: 0.72, relief: 0.09, glint: 0.006 },

  /** Dragging rakes grooves: tines, and the sand pushed up beside them. */
  rake: { tines: 5, depth: 0.55, berm: 0.32, step: 2 },

  /** A tap: a small crater, with grains thrown out. */
  crater: { radius: 9, depth: 1.7, rim: 0.55, grains: 14, speed: [45, 120] as const, lift: [70, 160] as const },

  /** A keystroke: a pebble drops in and leaves a dent. */
  pebble: {
    size: [8, 11] as const,
    drop: 46,
    dentRadius: 6.5,
    dentDepth: 1.1,
    /** Seconds resting on top, then sinking out of sight. */
    rest: 1.1,
    sink: 2.2,
  },

  /** Grains after landing: seconds resting, then fading into the sand. */
  grains: { rest: 1.2, fade: 2.6, gravity: 900, max: 260 },

  /** Disturbances settle back to the raked garden; wind speeds that up. */
  settle: {
    /** Seconds to fade to about a third, in still air and in wind. */
    calm: 45,
    windy: 18,
    /** Softening (blur), in cells² per second, in still air and in wind. */
    blurCalm: 0.015,
    blurWindy: 0.06,
  },

  /** Idle wind: direction (towards), how fast gusts travel, rising and falling, and drifting grains. */
  wind: {
    dir: [0.96, 0.28] as const,
    speed: 26,
    rise: 3,
    fall: 1.2,
    level: 1,
    streaks: 0.035,
    /** A drifting grain every this many seconds (random in range), and how long each travels. */
    grainGap: [0.12, 0.45] as const,
    grainLife: [1.4, 3] as const,
    grainSpeed: [12, 30] as const,
  },

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
