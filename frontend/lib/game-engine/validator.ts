/**
 * Block42 Frontend - Solution validator
 * Validates completion based on final game state and map data.
 */

import type { MapData } from "@/types/api";
import type { GameState, ValidationResult } from "./types";

export function validateSolution(
  mapData: MapData,
  finalState: GameState
): ValidationResult {
  const totalStars = mapData.stars.length;
  const collectedStars = finalState.collectedStars.size;

  if (finalState.status === "failure") {
    return {
      valid: false,
      message: finalState.error || "Execution failed",
      collectedStars,
      totalStars,
    };
  }

  if (collectedStars < totalStars) {
    return {
      valid: false,
      message: "Not all stars collected",
      collectedStars,
      totalStars,
    };
  }

  return {
    valid: true,
    collectedStars,
    totalStars,
  };
}
