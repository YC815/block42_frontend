/**
 * Block42 Frontend - 遊戲模擬器
 * 純函數實現，執行命令並返回狀態快照
 *
 * 核心原則：
 * 1. 純函數 - 無副作用
 * 2. 每步記錄狀態 - 用於動畫重播
 * 3. 錯誤處理 - 撞牆、超出邊界等
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

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
import { computeRenderBounds } from "@/lib/map-utils";

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
    outOfBoundsPosition: state.outOfBoundsPosition
      ? { ...state.outOfBoundsPosition }
      : undefined,
    failedCommand: state.failedCommand,
  };
}

/**
 * 執行單一命令
 * @returns 新的遊戲狀態（不修改原狀態）
 */
function meetsCondition(command: Command, state: GameState, mapData: MapData): boolean {
  if (!command.condition) return true;
  const currentColor = getTileColor(
    state.position.x,
    state.position.y,
    mapData,
    state.paintedTiles
  );
  return currentColor === command.condition;
}

function executeCommand(
  state: GameState,
  command: Command,
  mapData: MapData,
  config: LevelConfig
): GameState {
  const newState = cloneState(state);

  switch (command.type) {
    case "move":
      return executeMove(newState, mapData);

    case "turn_left":
      newState.direction = ((newState.direction + 3) % 4) as 0 | 1 | 2 | 3;
      return newState;

    case "turn_right":
      newState.direction = ((newState.direction + 1) % 4) as 0 | 1 | 2 | 3;
      return newState;

    case "paint_red":
      return executePaint(newState, "R", config);

    case "paint_green":
      return executePaint(newState, "G", config);

    case "paint_blue":
      return executePaint(newState, "B", config);

    default:
      newState.status = "failure";
      newState.error = `未知命令: ${command.type}`;
      return newState;
  }
}

/**
 * 執行移動
 */
function executeMove(state: GameState, mapData: MapData): GameState {
  const vector = DIRECTION_VECTORS[state.direction];
  const newX = state.position.x + vector.dx;
  const newY = state.position.y + vector.dy;

  // 第一層：檢查硬邊界（防止完全飛出渲染範圍）
  const bounds = computeRenderBounds(mapData);
  const exceedsHardBounds = (
    newX < bounds.minX - 1 || newX > bounds.maxX + 1 ||
    newY < bounds.minY - 1 || newY > bounds.maxY + 1
  );

  if (exceedsHardBounds) {
    // 完全超出範圍，連一步都不給
    state.status = "failure";
    state.error = `座標完全越界至 (${newX}, ${newY})`;
    return state;
  }

  // 第二層：先執行移動
  state.position.x = newX;
  state.position.y = newY;

  // 第三層：檢查軟邊界（瓷磚存在性）
  if (!isOnTile(newX, newY, mapData)) {
    // 關鍵：已經移動了，但標記為失敗
    state.status = "failure";
    state.error = `移動至無效位置 (${newX}, ${newY})，該位置沒有地板瓷磚`;
    state.outOfBoundsPosition = { x: newX, y: newY };
    return state;
  }

  // 成功移動，檢查收集物
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
  const toolKey =
    color === "R"
      ? "paint_red"
      : color === "G"
        ? "paint_green"
        : "paint_blue";

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
  const totalStars = mapData.stars.length;
  let queue = commands.f0.slice();

  const pushTimeline = () => {
    states.push(cloneState(currentState));
    queueSnapshots.push(queue.slice());
  };

  // 初始狀態與 queue
  pushTimeline();

  while (queue.length > 0) {
    if (currentState.status === "failure" || currentState.status === "success") {
      break;
    }

    const command = queue.shift();
    if (!command) break;

    currentState.steps += 1;
    const shouldExecute = meetsCondition(command, currentState, mapData);

    if (shouldExecute) {
      if (isFunctionCommand(command)) {
        const key = command.type;
        if (canCallFunction(key, config, commands)) {
          queue = [...commands[key], ...queue];
        }
      } else {
        currentState = executeCommand(currentState, command, mapData, config);
        // 如果執行後失敗，記錄導致失敗的指令
        if (currentState.status === "failure") {
          currentState.failedCommand = command;
        }
      }
    }

    if (currentState.steps > MAX_STEPS) {
      currentState.status = "failure";
      currentState.error = "步數超過上限！";
    }

    if (
      currentState.status !== "failure" &&
      totalStars > 0 &&
      currentState.collectedStars.size === totalStars
    ) {
      currentState.status = "success";
      queue = [];
    }

    // 條件不符或函式展開依然消耗一拍
    pushTimeline();

    if (currentState.status === "failure" || currentState.status === "success") break;
  }

  const success =
    currentState.status !== "failure" &&
    (totalStars === 0
      ? queue.length === 0
      : currentState.collectedStars.size === totalStars);

  if (success) {
    currentState.status = "success";
  } else if (currentState.status === "idle") {
    currentState.status = "failure";
    currentState.error = currentState.error || "未收集所有星星";
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
