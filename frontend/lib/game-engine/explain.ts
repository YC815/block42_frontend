/**
 * 把模擬器的失敗狀態翻成玩家看得懂的話
 */

import type { GameState } from "./types";

export function explainFailure(state: GameState, totalStars: number): { title: string; detail: string } {
  const remaining = totalStars - state.collectedStars.size;
  const error = state.error ?? "";

  if (state.outOfBoundsPosition || error.includes("越界")) {
    return {
      title: "機器人走出地板了",
      detail: "虛線框是它踩空的位置。檢查前一個轉彎的方向，或是前進的次數。",
    };
  }
  if (error.includes("步數超過")) {
    return {
      title: "執行超過 1000 步",
      detail: "程式可能一直在原地繞圈。檢查遞迴呼叫，或是顏色條件有沒有機會成立。",
    };
  }
  if (error.includes("顏色工具")) {
    return { title: "這關沒有這種顏色的油漆", detail: error };
  }
  if (remaining > 0) {
    return {
      title: `還有 ${remaining} 顆星星沒拿到`,
      detail: "程式已經跑完了，但機器人沒有走到所有星星。",
    };
  }
  return { title: "沒有過關", detail: error || "再檢查一次程式。" };
}
