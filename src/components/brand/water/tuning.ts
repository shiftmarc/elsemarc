/**
 * Every adjustable number in the water wordmark, in one place.
 *
 * Units: "spacing" is the distance between neighbouring particles at rest
 * (it shrinks as the particle count grows). "font" is the wordmark's CSS
 * font size. Physics values marked "@200px" are for a 200px wordmark and
 * scale with the font size, so phone and desktop feel alike.
 */
export const TUNING = {
  /** How the word arrives on load. */
  pour: {
    /** Seconds before the first water falls. */
    delay: 0.3,
    /** Seconds the pour takes to sweep from the first letter to the last. */
    sweep: 0.85,
    /** Random extra delay per particle, in seconds. Higher is a looser, rainier pour. */
    jitter: 0.01,
    /** How drawn-out the falling water is: 1 falls as the word's own shape, 2 as a column twice as tall. */
    stretch: 1.05,
    /** Sideways scatter of the falling water, in multiples of spacing. */
    scatter: 0.6,
  },

  /** How many particles, and when to use fewer. */
  particles: {
    /** Target counts by device tier. */
    budget: { high: 5200, mid: 3000, low: 1700 },
    /** Never pack particles closer than this many CSS px. */
    minSpacing: 1.6,
    /** Each downgrade multiplies the count by this. */
    downgradeFactor: 0.65,
    /** At most this many downgrades. */
    maxDowngrades: 2,
    /** Startup check: one physics step slower than this (ms) means use fewer particles. */
    stepBudgetMs: 5,
    /** While running: average frame interval above this (ms) for 2s means use fewer. */
    slowFrameMs: 24,
  },

  /** The liquid's motion. */
  fluid: {
    /** Neighbour radius, in multiples of spacing. */
    radius: 2.2,
    /** Pressure stiffness. Higher keeps the water from compressing. */
    stiffness: 0.035,
    /** Near-pressure stiffness. Keeps particles from clumping. */
    nearStiffness: 0.12,
    /** Strength of the pull between particles (surface tension), 0–1 of stiffness. */
    cohesion: 0.1,
    /** Viscosity, 0–1: how much neighbours move together. Higher is syrupy, lower is spray. */
    viscosity: 0.25,
    /** Gravity on disturbed water, px/s² @200px. */
    gravity: 1800,
    /** Velocity kept per step (1 = no air drag). */
    drag: 0.996,
    /** Sideways velocity kept when sliding on the floor. */
    floorFriction: 0.9,
  },

  /** How the water remembers the word. */
  recall: {
    /** Fraction of the way home calm water moves each step (60/s). Higher returns faster. */
    rate: 0.05,
    /** Fastest water flows home, px/s @200px. Keeps distant water flowing, not snapping. */
    maxSpeed: 650,
    /** Momentum calm water loses per step, 0–1. Lower sloshes past its place, higher creeps in. */
    damping: 0.06,
    /** Seconds for touched water to calm down and start drawing back. */
    calm: 1.6,
  },

  /** Mouse, drag and tap. */
  pointer: {
    /** Reach of the pointer, in multiples of the font size. */
    radius: 0.38,
    /** Smallest reach in CSS px (fingers). */
    minRadius: 30,
    /** How much of the pointer's velocity the water picks up, 0–1. */
    push: 0.5,
    /** Fastest the pointer can move water, px/s @200px. */
    maxSpeed: 900,
    /** How much a push lets go of the word (and lets gravity in), 0–1. Lower keeps pushed water near the letters. */
    disturb: 0.6,
    /** Outward splash speed from a tap, px/s @200px. */
    splash: 420,
    /** Upward lift added to a tap splash, px/s @200px. */
    splashLift: 360,
  },

  /** The surface. */
  render: {
    /** Pixel ratio cap by tier; lower is cheaper. */
    maxPixelRatio: { high: 2, mid: 2, low: 1.5 },
    /** Each particle's reach on screen, in multiples of spacing. Higher joins water into
     *  larger smooth bodies; lower lets it break into droplets (below ~2 it reads as dots). */
    splatRadius: 3.4,
    /** Liquid edge, as a fraction of resting depth (0.5 sits on the letter outline). */
    threshold: 0.5,
    /** How rounded the liquid looks at its edges. */
    bump: 1.6,
    /** Brightness range of the edge lighting, 0–1. */
    light: 0.22,
    /** Strength of the soft highlight, 0–1. Keep low: no glow. */
    specular: 0.06,
    /** Resting shimmer strength. 0 turns it off. */
    shimmer: 0.05,
    /** Shimmer drift speed. */
    shimmerSpeed: 0.12,
    /** Shimmer ripple size, in multiples of the font size. */
    shimmerScale: 0.3,
  },
} as const;

export type Tier = "high" | "mid" | "low";
