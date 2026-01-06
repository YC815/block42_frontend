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

function flattenFrames(frames: Array<{ commands: Command[]; index: number }>) {
  const queue: Command[] = [];
  for (let i = frames.length - 1; i >= 0; i -= 1) {
    const frame = frames[i];
    if (frame.index < frame.commands.length) {
      queue.push(...frame.commands.slice(frame.index));
    }
  }
  return queue;
}

export function buildExecutionQueueSnapshots(
  commands: CommandSet,
  config: LevelConfig,
  stepsLimit?: number
): Command[][] {
  const snapshots: Command[][] = [];
  const frames: Array<{ commands: Command[]; index: number }> = [
    { commands: commands.f0, index: 0 },
  ];

  snapshots.push(flattenFrames(frames));

  let executedSteps = 0;
  while (frames.length > 0 && (stepsLimit === undefined || executedSteps < stepsLimit)) {
    const frame = frames[frames.length - 1];
    if (!frame) break;

    if (frame.index >= frame.commands.length) {
      frames.pop();
      continue;
    }

    const command = frame.commands[frame.index];
    frame.index += 1;

    if (isFunctionCommand(command)) {
      const key = command.type;
      if (canCallFunction(key, config, commands)) {
        if (frames.length >= MAX_DEPTH + 1) {
          break;
        }
        frames.push({ commands: commands[key], index: 0 });
      }
      continue;
    }

    executedSteps += 1;
    snapshots.push(flattenFrames(frames));
  }

  return snapshots;
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
): GameState {
  const newState = cloneState(state);
  newState.steps++;

  // 檢查條件修飾
  if (command.condition) {
    const currentColor = getTileColor(
      newState.position.x,
      newState.position.y,
      mapData,
      newState.paintedTiles
    );

    // 條件不符合，跳過此命令
    if (currentColor !== command.condition) {
      return newState;
    }
  }

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

    case "f0":
    case "f1":
    case "f2":
      // 函數呼叫標記，由外層處理
      return newState;

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
  let currentState = createInitialState(mapData);

  // 記錄初始狀態
  states.push(cloneState(currentState));

  // 執行主函數 f0
  currentState = executeCommandList(
    currentState,
    commands.f0,
    commands,
    mapData,
    config,
    states
  );

  // 檢查是否成功
  const success =
    currentState.status !== "failure" &&
    currentState.collectedStars.size === mapData.stars.length;

  if (success) {
    currentState.status = "success";
  } else if (currentState.status === "idle") {
    currentState.status = "failure";
    currentState.error = currentState.error || "未收集所有星星";
  }

  // 記錄最終狀態
  states.push(cloneState(currentState));

  return {
    states,
    queueSnapshots: buildExecutionQueueSnapshots(commands, config, currentState.steps),
    finalState: currentState,
    success,
    totalSteps: currentState.steps,
  };
}

/**
 * 執行命令列表（處理遞迴函數呼叫）
 */
function executeCommandList(
  state: GameState,
  commandList: Command[],
  allCommands: CommandSet,
  mapData: MapData,
  config: LevelConfig,
  states: GameState[],
  depth: number = 0
): GameState {
  // 防止無限遞迴
  if (depth > MAX_DEPTH) {
    state.status = "failure";
    state.error = "函數呼叫層級過深！";
    return state;
  }

  if (state.steps > MAX_STEPS) {
    state.status = "failure";
    state.error = "步數超過上限！";
    return state;
  }

  for (const command of commandList) {
    // 如果已經失敗，停止執行
    if (state.status === "failure") {
      break;
    }

    // 處理函數呼叫
    if (command.type === "f0") {
      if (config.f0 > 0 && allCommands.f0.length > 0) {
        state = executeCommandList(
          state,
          allCommands.f0,
          allCommands,
          mapData,
          config,
          states,
          depth + 1
        );
      }
      continue;
    }

    if (command.type === "f1") {
      if (config.f1 > 0 && allCommands.f1.length > 0) {
        state = executeCommandList(
          state,
          allCommands.f1,
          allCommands,
          mapData,
          config,
          states,
          depth + 1
        );
      }
      continue;
    }

    if (command.type === "f2") {
      if (config.f2 > 0 && allCommands.f2.length > 0) {
        state = executeCommandList(
          state,
          allCommands.f2,
          allCommands,
          mapData,
          config,
          states,
          depth + 1
        );
      }
      continue;
    }

    // 執行普通命令
    state = executeCommand(state, command, mapData, config);
    states.push(cloneState(state));
  }

  return state;
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
