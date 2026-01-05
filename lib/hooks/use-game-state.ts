"use client";

/**
 * Block42 Frontend - Game state hook
 * Handles command sets, execution, and playback controls.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LevelConfig, MapData, TileColor, CommandType } from "@/types/api";
import type { Command, CommandSet, ExecutionResult, GameState } from "@/lib/game-engine/types";
import { createInitialState, executeCommands } from "@/lib/game-engine/simulator";
import { createEmptyCommandSet, serializeCommands } from "@/lib/game-engine/commands";

const DEFAULT_SPEED = 1;
const SPEED_UNIT_MS = 700;

export type TrackKey = "f0" | "f1" | "f2";

interface GameStateOptions {
  mapData?: MapData;
  config?: LevelConfig;
}

export function useGameState({ mapData, config }: GameStateOptions) {
  const [commandSet, setCommandSet] = useState<CommandSet>(createEmptyCommandSet());
  const [selectedTrack, setSelectedTrack] = useState<TrackKey>("f0");
  const [condition, setCondition] = useState<TileColor | null>(null);

  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [stepIndex, setStepIndex] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initialState = useMemo(() => {
    return mapData ? createInitialState(mapData) : null;
  }, [mapData]);

  const currentState: GameState | null = useMemo(() => {
    if (!execution) return initialState;
    return execution.states[Math.min(stepIndex, execution.states.length - 1)];
  }, [execution, stepIndex, initialState]);

  const resetPlayback = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setExecution(null);
    setStepIndex(0);
  }, []);

  const ensureExecution = useCallback(() => {
    if (!mapData || !config) return null;
    const result = executeCommands(mapData, config, commandSet);
    setExecution(result);
    setStepIndex(0);
    return result;
  }, [mapData, config, commandSet]);

  const run = useCallback(() => {
    if (!mapData || !config) return;
    const result = ensureExecution();
    if (!result) return;
    setIsRunning(true);
  }, [mapData, config, ensureExecution]);

  const step = useCallback(() => {
    if (!mapData || !config) return;
    const result = execution || ensureExecution();
    if (!result) return;
    setStepIndex((prev) => Math.min(prev + 1, result.states.length - 1));
  }, [mapData, config, execution, ensureExecution]);

  const reset = useCallback(() => {
    resetPlayback();
  }, [resetPlayback]);

  useEffect(() => {
    resetPlayback();
  }, [commandSet, mapData, config, resetPlayback]);

  useEffect(() => {
    if (!isRunning || !execution) return;

    const interval = Math.max(150, SPEED_UNIT_MS / speed);
    timerRef.current = setInterval(() => {
      setStepIndex((prev) => {
        if (!execution) return prev;
        if (prev >= execution.states.length - 1) {
          setIsRunning(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return prev;
        }
        return prev + 1;
      });
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, execution, speed]);

  const addCommand = useCallback(
    (track: TrackKey, type: CommandType) => {
      if (!config) return;
      const capacity = config[track];

      setCommandSet((prev) => {
        const list = prev[track];
        if (capacity <= list.length) return prev;

        const newCommand: Command = {
          type,
          condition: condition || undefined,
        };

        return {
          ...prev,
          [track]: [...list, newCommand],
        };
      });
    },
    [config, condition]
  );

  const removeCommand = useCallback((track: TrackKey, index: number) => {
    setCommandSet((prev) => {
      const list = prev[track];
      if (!list[index]) return prev;
      const next = list.slice();
      next.splice(index, 1);
      return {
        ...prev,
        [track]: next,
      };
    });
  }, []);

  const clearTrack = useCallback((track: TrackKey) => {
    setCommandSet((prev) => ({ ...prev, [track]: [] }));
  }, []);

  const clearAll = useCallback(() => {
    setCommandSet(createEmptyCommandSet());
  }, []);

  const serializeSolution = useCallback(() => {
    return {
      commands_f0: serializeCommands(commandSet.f0),
      commands_f1: serializeCommands(commandSet.f1),
      commands_f2: serializeCommands(commandSet.f2),
      steps_count: execution?.totalSteps || 0,
    };
  }, [commandSet, execution]);

  return {
    commandSet,
    selectedTrack,
    setSelectedTrack,
    condition,
    setCondition,
    currentState,
    execution,
    isRunning,
    speed,
    setSpeed,
    run,
    step,
    reset,
    addCommand,
    removeCommand,
    clearTrack,
    clearAll,
    serializeSolution,
  };
}
