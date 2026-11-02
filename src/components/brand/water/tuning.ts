/**
 * Every adjustable number in the water tank, in one place.
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
    /** Strength of the pull between particles (surface tension), 0–1 of stiffness. Above ~0.3 it clumps into beads. */
    cohesion: 0.1,
    /** Viscosity, 0–1: how much neighbours move together. Higher is syrupy, lower is spray. */
    viscosity: 0.25,
    /** Gravity on disturbed water, px/s² @200px. */
    gravity: 1800,
    /** Velocity kept per step (1 = no air drag). */
    drag: 0.996,
    /** Velocity along the floor kept when sliding on it. */
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

  /** Drag and tap. */
  pointer: {
    /** Reach of a drag or tap, in multiples of the font size. */
    radius: 0.5,
    /** Smallest reach in CSS px (fingers). */
    minRadius: 28,
    /** How much of the pointer's velocity the water picks up, 0–1. */
    push: 0.6,
    /** Fastest a drag can move water, px/s @200px. */
    maxSpeed: 1100,
    /** How much a drag lets go of the word (and lets gravity in), 0–1. */
    disturb: 0.7,
    /** Outward splash speed from a tap, px/s @200px. */
    splash: 420,
    /** Lift (against gravity) added to a tap splash, px/s @200px. */
    splashLift: 360,
  },

  /** Hold and swipe. */
  gestures: {
    /** A pressed pointer slower than this (CSS px/s) for `holdDelay` seconds is holding. */
    holdSpeed: 80,
    holdDelay: 0.16,
    /** Reach of a hold, in multiples of the font size. */
    holdRadius: 1.6,
    /** Pull of a hold, px/s² @200px. */
    holdStrength: 5200,
    /** A swipe faster than this many screen short-sides per second (but at least `swipeMinSpeed` CSS px/s)… */
    swipeSpeed: 2.1,
    swipeMinSpeed: 1100,
    /** …and longer than this fraction of the screen's short side collapses the word. */
    swipeDistance: 0.22,
    /** Seconds the collapsed pool rests on the floor before it starts climbing back… */
    poolTime: 2.4,
    /** …and roughly how long the climb back into the word takes. */
    climbTime: 2.2,
    /** A tap moves less than this (CSS px) and lasts less than `tapTime` seconds. */
    tapMove: 10,
    tapTime: 0.3,
  },

  /** Phone tilt (only where the browser allows motion without a permission prompt). */
  tilt: {
    /** Degrees from upright before the word starts to slide. */
    start: 22,
    /** Degrees from upright where it lets go as far as it will. */
    full: 60,
    /** How far a full tilt lets go of the word, 0–1. */
    loosen: 0.85,
    /** Smoothing of the sensor, per second. Higher follows the hand more tightly. */
    follow: 6,
  },

  /** Sent text turning into water. */
  dissolve: {
    /** Most particles a message can become. */
    maxParticles: 900,
    /** Seconds the message's water lasts, plus up to `lifeJitter` more. */
    life: 2.6,
    lifeJitter: 0.8,
    /** Seconds it takes to fade at the end. */
    fade: 1.2,
    /** Little hop as the words let go, px/s @200px. */
    lift: 60,
  },

  /** The glass. */
  render: {
    /** Pixel ratio cap by tier; lower is cheaper. */
    maxPixelRatio: { high: 2, mid: 2, low: 1.5 },
    /** Each particle's reach on screen, in multiples of spacing. Higher joins water into
     *  larger smooth bodies; lower lets it break into droplets (below ~2 it reads as dots). */
    splatRadius: 3.4,
    /** Liquid edge, as a fraction of resting depth (0.5 sits on the letter outline). */
    threshold: 0.5,
    /** How far in from its edge the water's surface curves, in multiples of the font size. */
    roundness: 0.035,
    /** Steepness of that curve. Higher bends the back wall more and widens the highlights. */
    bump: 2.2,
    /** How far the water bends the back wall, in multiples of the font size. */
    refraction: 0.09,
    /** Brightness of the edge highlights, 0–1. */
    rim: 0.6,
    /** Brightness of the fine outline where water meets air, 0–1. */
    edge: 0.55,
    /** Sharp highlight from the light, 0–1. */
    specular: 0.35,
    /** How much brighter the wall looks through still water, 0–1. Keep low: no opaque fill. */
    lift: 0.06,
    /** Colour of the water body itself, 0–1. 0 is perfectly clear. */
    body: 0.025,
    /** How strongly the accent (the dot) tints the glass, 0–1. */
    accentBody: 0.45,
    /** Back-wall grid size, in multiples of the font size (at least 12px). */
    wallTile: 0.17,
    /** Back-wall grid line brightness, 0–1. */
    wallLine: 0.035,
    /** Back-wall grain, 0–1. */
    wallGrain: 0.03,
    /** Resting shimmer strength. 0 turns it off. */
    shimmer: 0.05,
    /** Shimmer drift speed. */
    shimmerSpeed: 0.12,
    /** Shimmer ripple size, in multiples of the font size. */
    shimmerScale: 0.3,
  },
} as const;

export type Tier = "high" | "mid" | "low";
