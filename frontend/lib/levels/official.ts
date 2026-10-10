/**
 * 官方關卡（寫死在程式裡，不經過資料庫）
 *
 * 資料由 levels/build.py 從 levels/official.txt 產生，請不要直接改 JSON。
 */

import data from "./official-levels.json";
import type { Level, LevelConfig, MapData } from "@/types/api";

export interface OfficialChapter {
  id: string;
  title: string;
}

export interface OfficialLevel {
  id: string;
  order: number;
  number: string;
  chapter_id: string;
  title: string;
  goal: string;
  hint: string;
  config: LevelConfig;
  map: MapData;
}

export const OFFICIAL_CHAPTERS: OfficialChapter[] = data.chapters;

/** 每一章要學的概念，顯示在關卡列表 */
export const CHAPTER_INTRO: Record<string, string> = {
  "chapter-1": "用前進和轉彎，排出一條路線。",
  "chapter-2": "把重複的動作包成 F1、F2，再呼叫它們。",
  "chapter-3": "讓函式呼叫自己，用很少的格子走很遠。",
  "chapter-4": "讓機器人看地板的顏色，決定要不要做某件事。",
  "chapter-5": "改變地板的顏色，替之後的自己留下記號。",
  "chapter-6": "讓遞迴替你數步數，把前面學的全部用上。",
};
export const OFFICIAL_LEVELS = data.levels as OfficialLevel[];

const byId = new Map(OFFICIAL_LEVELS.map((level) => [level.id, level]));

export function getOfficialLevel(id: string): OfficialLevel | undefined {
  return byId.get(id);
}

export function isOfficialLevelId(id: string) {
  return byId.has(id);
}

export function getNextOfficialLevel(id: string): OfficialLevel | undefined {
  const level = byId.get(id);
  return level ? OFFICIAL_LEVELS[level.order] : undefined;
}

export function getChapterLevels(chapterId: string) {
  return OFFICIAL_LEVELS.filter((level) => level.chapter_id === chapterId);
}

/** 給共用遊戲元件的 Level 形狀 */
export function toPlayableLevel(level: OfficialLevel): Pick<Level, "id" | "title" | "map" | "config"> {
  return { id: level.id, title: level.title, map: level.map, config: level.config };
}
