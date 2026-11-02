/**
 * Every number that shapes the pool, in one place. Distances are CSS px,
 * times are seconds. Heights are in the ripple field's own units: a
 * height difference of 1 across 1 px is a slope of 1.
 */
export const TUNING = {
  /** The ripple height-field (simulated on the GPU). */
  sim: {
    /** CSS px per simulation cell. Smaller is finer and costlier. */
    cell: 3.5,
    /** Simulation steps per 1/60 s. Waves travel about √speed cells per step. */
    stepsPer60: 4,
    /** Wave speed² in cells per step (the Courant number squared). Must stay ≤ 0.5 − 2 × viscosity. */
    speed: 0.34,
    /** Height kept per step (1 = waves never die down). */
    damping: 0.997,
    /** Calms grid-sized wiggles (numerical noise) far more than real ripples. */
    viscosity: 0.04,
  },

  /** Always-on motion that needs no input. */
  swell: {
    /** Each long, slow wave: direction (degrees), wavelength (px), slope, speed (px/s). */
    waves: [
      { angle: 18, length: 820, slope: 0.018, speed: 34 },
      { angle: 113, length: 560, slope: 0.014, speed: 27 },
      { angle: 241, length: 390, slope: 0.011, speed: 22 },
      { angle: 302, length: 240, slope: 0.007, speed: 18 },
    ],
  },

  /** Ripples people make: clearly bigger and wider than the rain. Amplitude in height units, radius in px. */
  drops: {
    click: { amp: 7, radius: 38 },
    key: { amp: 2.2, radius: 26 },
    /** A drag leaves a drop about every `spacing` px, stronger the faster it moves. */
    wake: { amp: 1.1, maxAmp: 2.6, radius: 26, spacing: 11, fullSpeed: 1400 },
    /** A sent message lands with a line of drops along its text. */
    sink: { amp: 1.8, radius: 26, count: 7 },
  },

  /** Idle rain: small drops at random spots while nobody is interacting. */
  rain: {
    amp: 2.4,
    radius: 15,
    /** Seconds between drops (random in this range), and the chance a second drop falls with one. */
    minGap: 0.25,
    maxGap: 0.95,
    pairChance: 0.2,
    /** Seconds after the last interaction before the rain resumes. */
    resumeAfter: 3.5,
  },

  /** Phone tilt sends waves rolling from the raised edge (only where no permission prompt is needed). */
  tilt: {
    /** How quickly "level" catches up with how the phone is held (s). */
    settle: 2.5,
    /** Tilt change (in g) below which nothing happens, and at which waves are strongest. */
    start: 0.07,
    full: 0.45,
    /** Wave height and width (px) at full tilt. */
    amp: 2.4,
    width: 46,
    /** Seconds between waves at the start and at full tilt. */
    slowEvery: 1.3,
    fastEvery: 0.45,
  },

  /** How the floor is seen through the water. */
  render: {
    /** Highest device pixel ratio drawn, and most pixels per frame (drops towards 1x on big screens). */
    maxPixelRatio: 2,
    pixelBudget: 3_200_000,
    /** Water depth in px: how far a slope shifts what's seen on the floor. */
    depth: 95,
    /** Floor text: how much of the text colour shows through. */
    ink: 0.86,
    /** Drifting caustic light: size (px), drift speed, strength on the floor and on the letters. */
    causticSize: 150,
    causticSpeed: 0.22,
    caustic: 0.075,
    causticInk: 0.16,
    /** Extra light where ripples focus it (per unit of surface curvature). */
    focus: 1.7,
    /** Light and shade on slopes facing towards or away from the light (makes ripples visible). */
    shade: 2.4,
    /** Glints off the surface, and the fresnel sheen of slopes. */
    specular: 0.55,
    shininess: 48,
    sheen: 0.35,
    /** Darkening towards the corners. */
    vignette: 0.32,
  },

  /** A sent message sinks to the floor, wavers like the logo, then fades. */
  message: {
    sink: 0.9,
    rest: 2.2,
    fade: 1.4,
    /** How much smaller it ends up (further away), and how far it drifts down (px). */
    shrink: 0.06,
    drift: 16,
    /** Opacity and blur (mip levels) once it lies on the floor, and how much more it wavers than the logo. */
    opacity: 0.32,
    blur: 2.2,
    waver: 1.8,
  },

  /** Frame pacing: skip frames on 120 Hz screens, and draw fewer pixels if frames run slow. */
  frame: {
    minInterval: 1000 / 64,
    slowFrameMs: 26,
    stepDown: 0.8,
  },
} as const;
