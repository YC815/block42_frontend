/**
 * Block42 Frontend - 遊戲模擬器
 * 純函數實現，執行命令並返回狀態快照
 *
 * 核心原則：
 * 1. 純函數 - 無副作用
 * 2. 每步記錄狀態 - 用於動畫重播
 * 3. 錯誤處理 - 撞牆、超出邊界等
 */

import type { MapData, LevelConfig } from "@/types/api";
import type {
  GameState,
  Command,
  CommandSet,
  ExecutionResult,
} from "./types";
import {
  DIRECTION_VECTORS,
  coordToKey,
  isOnTile,
  getTileColor,
  hasStar,
} from "./types";

const MAX_DEPTH = 100;
const MAX_STEPS = 1000;

type FunctionKey = "f0" | "f1" | "f2";

function isFunctionCommand(command: Command): command is Command & { type: FunctionKey } {
  return command.type === "f0" || command.type === "f1" || command.type === "f2";
}

function canCallFunction(key: FunctionKey, config: LevelConfig, commands: CommandSet) {
  return config[key] > 0 && commands[key].length > 0;
}

export function buildExecutionQueueSnapshots(
  commands: CommandSet,
  _config: LevelConfig,
  _stepsLimit?: number
): Command[][] {
  // 在未執行前的顯示需求：只顯示 f0 剩餘命令（保留函式佔位符），不預先展開
  return [commands.f0.slice()];
}

/**
 * 建立初始遊戲狀態
 */
export function createInitialState(mapData: MapData): GameState {
  return {
    position: { x: mapData.start.x, y: mapData.start.y },
    direction: mapData.start.dir,
    collectedStars: new Set<string>(),
    paintedTiles: new Map<string, "R" | "G" | "B">(),
    steps: 0,
    status: "idle",
  };
}

/**
 * 複製遊戲狀態（深拷貝）
 */
function cloneState(state: GameState): GameState {
  return {
    position: { ...state.position },
    direction: state.direction,
    collectedStars: new Set(state.collectedStars),
    paintedTiles: new Map(state.paintedTiles),
    steps: state.steps,
    status: state.status,
    error: state.error,
  };
}

/**
 * 執行單一命令
 * @returns 新的遊戲狀態（不修改原狀態）
 */
function executeCommand(
  state: GameState,
  command: Command,
  mapData: MapData,
  config: LevelConfig
): { next: GameState; executed: boolean } {
  // 條件不符時直接略過，不消耗步數
  if (command.condition) {
    const currentColor = getTileColor(
      state.position.x,
      state.position.y,
      mapData,
      state.paintedTiles
    );
    if (currentColor !== command.condition) {
      return { next: state, executed: false };
    }
  }

  const newState = cloneState(state);
  newState.steps++;

  // 檢查條件修飾
  switch (command.type) {
    case "move":
      return { next: executeMove(newState, mapData), executed: true };

    case "turn_left":
      newState.direction = ((newState.direction + 3) % 4) as 0 | 1 | 2 | 3;
      return { next: newState, executed: true };

    case "turn_right":
      newState.direction = ((newState.direction + 1) % 4) as 0 | 1 | 2 | 3;
      return { next: newState, executed: true };

    case "paint_red":
      return { next: executePaint(newState, "R", config), executed: true };

    case "paint_green":
      return { next: executePaint(newState, "G", config), executed: true };

    case "paint_blue":
      return { next: executePaint(newState, "B", config), executed: true };

    case "f0":
    case "f1":
    case "f2":
      // 函數呼叫標記，由外層處理
      return { next: newState, executed: false };

    default:
      newState.status = "failure";
      newState.error = `未知命令: ${command.type}`;
      return { next: newState, executed: true };
  }
}

/**
 * 執行移動
 */
function executeMove(state: GameState, mapData: MapData): GameState {
  const vector = DIRECTION_VECTORS[state.direction];
  const newX = state.position.x + vector.dx;
  const newY = state.position.y + vector.dy;

  // 檢查是否在地板瓷磚上
  if (!isOnTile(newX, newY, mapData)) {
    state.status = "failure";
    state.error = "撞牆或掉落！";
    return state;
  }

  // 更新位置
  state.position.x = newX;
  state.position.y = newY;

  // 檢查是否收集星星
  if (hasStar(newX, newY, mapData)) {
    const starKey = coordToKey(newX, newY);
    state.collectedStars.add(starKey);
  }

  return state;
}

/**
 * 執行塗色
 */
function executePaint(
  state: GameState,
  color: "R" | "G" | "B",
  config: LevelConfig
): GameState {
  // 檢查是否有塗色工具
  const toolKey = `paint_${color.toLowerCase()}` as
    | "paint_red"
    | "paint_green"
    | "paint_blue";

  if (!config.tools[toolKey]) {
    state.status = "failure";
    state.error = `沒有 ${color} 顏色工具！`;
    return state;
  }

  // 塗色當前位置
  const key = coordToKey(state.position.x, state.position.y);
  state.paintedTiles.set(key, color);

  return state;
}

/**
 * 執行命令集（處理函數呼叫）
 */
export function executeCommands(
  mapData: MapData,
  config: LevelConfig,
  commands: CommandSet
): ExecutionResult {
  const states: GameState[] = [];
  const queueSnapshots: Command[][] = [];
  let currentState = createInitialState(mapData);
  const frames: Array<{ commands: Command[]; index: number }> = [
    { commands: commands.f0, index: 0 },
  ];

  const snapshotQueue = () => {
    const queue: Command[] = [];
    for (let i = frames.length - 1; i >= 0; i -= 1) {
      const frame = frames[i];
      if (frame.index < frame.commands.length) {
        queue.push(...frame.commands.slice(frame.index));
      }
    }
    queueSnapshots.push(queue);
  };

  const replaceQueueSnapshot = () => {
    const queue: Command[] = [];
    for (let i = frames.length - 1; i >= 0; i -= 1) {
      const frame = frames[i];
      if (frame.index < frame.commands.length) {
        queue.push(...frame.commands.slice(frame.index));
      }
    }
    if (queueSnapshots.length === 0) {
      queueSnapshots.push(queue);
      return;
    }
    queueSnapshots[queueSnapshots.length - 1] = queue;
  };

  const pushTimeline = () => {
    states.push(cloneState(currentState));
    snapshotQueue();
  };

  // 初始狀態與 queue
  if (mapData.stars.length === 0) {
    currentState.status = "success";
    frames.length = 0;
  }
  pushTimeline();

  let guard = 0;
  while (frames.length > 0 && guard < MAX_STEPS + MAX_DEPTH * 10) {
    guard += 1;
    if (currentState.status === "failure" || currentState.status === "success") break;

    const frame = frames[frames.length - 1];
    if (!frame) break;

    if (frame.index >= frame.commands.length) {
      frames.pop();
      continue;
    }

    const command = frame.commands[frame.index];
    frame.index += 1;

    if (isFunctionCommand(command)) {
      // 條件不符的函式呼叫應該被略過，不展開、不耗費時間
      if (command.condition) {
        const currentColor = getTileColor(
          currentState.position.x,
          currentState.position.y,
          mapData,
          currentState.paintedTiles
        );
        if (currentColor !== command.condition) {
          // 條件不符：消耗時間軸並移除佔位符，但狀態不變
          pushTimeline();
          continue;
        }
      }

      const key = command.type;
      if (canCallFunction(key, config, commands)) {
        if (frames.length >= MAX_DEPTH + 1) {
          currentState.status = "failure";
          currentState.error = "函數呼叫層級過深！";
          pushTimeline();
          break;
        }
        frames.push({ commands: commands[key], index: 0 });
        // 函式展開佔用一個時間點（狀態不變，queue 更新）
        pushTimeline();
      }
      // 函式呼叫本身消耗掉，若不可呼叫則僅更新隊列
      if (!canCallFunction(key, config, commands)) {
        pushTimeline();
      }
      continue;
    }

    const result = executeCommand(currentState, command, mapData, config);
    currentState = result.next;

    if (!result.executed) {
      // 條件不符，消耗一拍：狀態不變但隊列前進
      pushTimeline();
      continue;
    }

    if (currentState.steps > MAX_STEPS) {
      currentState.status = "failure";
      currentState.error = "步數超過上限！";
    }

    if (
      currentState.status !== "failure" &&
      currentState.collectedStars.size === mapData.stars.length
    ) {
      currentState.status = "success";
      frames.length = 0;
    }

    pushTimeline();

    if (currentState.status === "failure" || currentState.status === "success") {
      break;
    }
  }

  const success =
    currentState.status !== "failure" &&
    currentState.collectedStars.size === mapData.stars.length;

  if (success) {
    currentState.status = "success";
  } else if (currentState.status === "idle") {
    currentState.status = "failure";
    currentState.error = currentState.error || "未收集所有星星";
  }

  // 確保終點有對應的 queue snapshot
  if (queueSnapshots.length < states.length) {
    snapshotQueue();
  }

  return {
    states,
    queueSnapshots,
    finalState: currentState,
    success,
    totalSteps: currentState.steps,
  };
}

/**
 * 解析命令字串為 Command 物件
 */
export function parseCommand(commandStr: string): Command {
  // 檢查是否有條件修飾 (格式: "move:R" 或 "move")
  const parts = commandStr.split(":");
  const type = parts[0] as Command["type"];
  const condition = parts[1] as Command["condition"] | undefined;

  return { type, condition };
}

/**
 * 解析命令字串陣列
 */
export function parseCommands(commandStrings: string[]): Command[] {
  return commandStrings.map(parseCommand);
}
