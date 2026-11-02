import type { ElementModule } from "../types";
import { WaterScene } from "./engine";

/** Water: a WebGL2 ripple pool with the wordmark lying on its floor. */
export const water: ElementModule = {
  name: "water",
  start: (canvas, word, hooks) => WaterScene.start(canvas, word, hooks),
  // Water's still version is the plain h1, which the stage's data-stage="off" already shows.
  still: () => () => {},
};
