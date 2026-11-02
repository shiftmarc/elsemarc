import type { ElementModule } from "../types";
import { EarthScene } from "./engine";

/** Earth: a zen garden of dark volcanic sand, the wordmark pressed into it. */
export const earth: ElementModule = {
  name: "earth",
  start: (canvas, word, hooks) => EarthScene.start(canvas, word, hooks),
  // Earth's still version is the plain h1, which the stage's data-stage="off" already shows.
  still: () => () => {},
};
