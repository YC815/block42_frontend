"use client";

/* eslint-disable react-hooks/set-state-in-effect */

/**
 * Block42 Frontend - Game state hook
 * Handles command slots, execution, and playback controls.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LevelConfig, MapData, TileColor, CommandType } from "@/types/api";
import type { Command, CommandSet, ExecutionResult, GameState } from "@/lib/game-engine/types";
import {
  buildExecutionQueueSnapshots,
  createInitialState,
  executeCommands,
  parseCommands,
} from "@/lib/game-engine/simulator";
import { serializeCommands } from "@/lib/game-engine/commands";

const DEFAULT_SPEED = 1;
const SPEED_UNIT_MS = 100;
const MIN_STEP_MS = 20;
const MIN_RUN_DELAY_MS = 100;

export type TrackKey = "f0" | "f1" | "f2";

export interface CommandSlot {
  type: CommandType | null;
  condition: TileColor | null;
}

export type SlotSet = Record<TrackKey, CommandSlot[]>;
export type SelectedSlot = { track: TrackKey; index: number } | null;

interface GameStateOptions {
  mapData?: MapData;
  config?: LevelConfig;
  initialCommands?: {
    commands_f0: string[];
    commands_f1: string[];
    commands_f2: string[];
  } | null;
  initialCommandsKey?: string | null;
}

const EMPTY_SLOT: CommandSlot = { type: null, condition: null };

function createSlots(config?: LevelConfig): SlotSet {
  if (!config) {
    return { f0: [], f1: [], f2: [] };
  }
  return {
    f0: Array.from({ length: config.f0 }, () => ({ ...EMPTY_SLOT })),
    f1: Array.from({ length: config.f1 }, () => ({ ...EMPTY_SLOT })),
    f2: Array.from({ length: config.f2 }, () => ({ ...EMPTY_SLOT })),
  };
}

function resizeSlots(prev: SlotSet, config: LevelConfig): SlotSet {
  const resizeTrack = (track: TrackKey, size: number) => {
    const current = prev[track] ?? [];
    if (current.length === size) return current;
    if (current.length > size) return current.slice(0, size);
    const extra = Array.from({ length: size - current.length }, () => ({ ...EMPTY_SLOT }));
    return [...current, ...extra];
  };

  return {
    f0: resizeTrack("f0", config.f0),
    f1: resizeTrack("f1", config.f1),
    f2: resizeTrack("f2", config.f2),
  };
}

function createSlotsFromCommands(
  config: LevelConfig,
  initialCommands: {
    commands_f0: string[];
    commands_f1: string[];
    commands_f2: string[];
  }
): SlotSet {
  const fillTrack = (size: number, commands: Command[]): CommandSlot[] => {
    const slots = Array.from({ length: size }, () => ({ ...EMPTY_SLOT }));
    commands.slice(0, size).forEach((command, index) => {
      slots[index] = {
        type: command.type,
        condition: command.condition ?? null,
      };
    });
    return slots;
  };

  return {
    f0: fillTrack(config.f0, parseCommands(initialCommands.commands_f0)),
    f1: fillTrack(config.f1, parseCommands(initialCommands.commands_f1)),
    f2: fillTrack(config.f2, parseCommands(initialCommands.commands_f2)),
  };
}

function toCommandSet(slots: SlotSet): CommandSet {
  const toCommands = (trackSlots: CommandSlot[]) =>
    trackSlots
      .filter((slot) => slot.type)
      .map((slot) => ({
        type: slot.type!,
        condition: slot.condition ?? undefined,
      }));

  return {
    f0: toCommands(slots.f0),
    f1: toCommands(slots.f1),
    f2: toCommands(slots.f2),
  };
}

function getFirstAvailableSlot(config: LevelConfig): SelectedSlot {
  if (config.f0 > 0) return { track: "f0", index: 0 };
  if (config.f1 > 0) return { track: "f1", index: 0 };
  if (config.f2 > 0) return { track: "f2", index: 0 };
  return null;
}

export function useGameState({
  mapData,
  config,
  initialCommands,
  initialCommandsKey,
}: GameStateOptions) {
  const [slots, setSlots] = useState<SlotSet>(() => {
    if (config && initialCommands) {
      return createSlotsFromCommands(config, initialCommands);
    }
    return createSlots(config);
  });
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot>(null);

  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [stepIndex, setStepIndex] = useState(0);
  const [minDelayElapsed, setMinDelayElapsed] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const minDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const initialState = useMemo(() => {
    return mapData ? createInitialState(mapData) : null;
  }, [mapData]);

  const commandSet = useMemo(() => toCommandSet(slots), [slots]);

  const selectedSlotState = useMemo(() => {
    if (!selectedSlot) return null;
    return slots[selectedSlot.track]?.[selectedSlot.index] ?? null;
  }, [slots, selectedSlot]);

  const currentState: GameState | null = useMemo(() => {
    if (!execution) return initialState;
    return execution.states[Math.min(stepIndex, execution.states.length - 1)];
  }, [execution, stepIndex, initialState]);

  const isComplete = useMemo(() => {
    if (!execution) return false;
    return stepIndex >= execution.states.length - 1;
  }, [execution, stepIndex]);

  const didSucceed = useMemo(() => {
    if (!execution) return false;
    return execution.success && isComplete && minDelayElapsed;
  }, [execution, isComplete, minDelayElapsed]);

  const isEditingLocked = useMemo(() => {
    if (isRunning) return true;
    if (!execution) return false;
    return !isComplete;
  }, [execution, isRunning, isComplete]);

  const resetPlayback = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (minDelayTimerRef.current) {
      clearTimeout(minDelayTimerRef.current);
      minDelayTimerRef.current = null;
    }
    setIsRunning(false);
    setExecution(null);
    setStepIndex(0);
    setMinDelayElapsed(true);
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
    if (minDelayTimerRef.current) {
      clearTimeout(minDelayTimerRef.current);
    }
    setMinDelayElapsed(false);
    minDelayTimerRef.current = setTimeout(() => {
      setMinDelayElapsed(true);
    }, MIN_RUN_DELAY_MS);
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
    if (!config) return;
    setSlots((prev) => resizeSlots(prev, config));
    setSelectedSlot((prev) => {
      const fallback = getFirstAvailableSlot(config);
      if (!prev) return fallback;
      if (!fallback) return null;
      if (config[prev.track] === 0) return fallback;
      if (prev.index >= config[prev.track]) return fallback;
      return prev;
    });
  }, [config]);

  const hydratedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!config || !initialCommands) return;
    const key = initialCommandsKey ?? "default";
    if (hydratedKeyRef.current === key) return;
    hydratedKeyRef.current = key;
    setSlots(createSlotsFromCommands(config, initialCommands));
  }, [config, initialCommands, initialCommandsKey]);

  useEffect(() => {
    resetPlayback();
  }, [commandSet, mapData, config, resetPlayback]);

  useEffect(() => {
    if (!isRunning || !execution) return;

    const interval = Math.max(MIN_STEP_MS, SPEED_UNIT_MS / speed);
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

  const selectSlot = useCallback((track: TrackKey, index: number) => {
    if (isEditingLocked) return;
    setSelectedSlot({ track, index });
  }, [isEditingLocked]);

  const applyCommand = useCallback(
    (type: CommandType) => {
      if (isEditingLocked) return;
      if (!selectedSlot) return;
      setSlots((prev) => {
        const trackSlots = prev[selectedSlot.track] ?? [];
        const slot = trackSlots[selectedSlot.index];
        if (!slot) return prev;
        const nextSlot: CommandSlot =
          slot.type === type ? { ...slot, type: null } : { ...slot, type };
        const nextTrack = trackSlots.slice();
        nextTrack[selectedSlot.index] = nextSlot;
        return { ...prev, [selectedSlot.track]: nextTrack };
      });
    },
    [selectedSlot, isEditingLocked]
  );

  const applyCondition = useCallback(
    (color: TileColor | null) => {
      if (isEditingLocked) return;
      if (!selectedSlot) return;
      setSlots((prev) => {
        const trackSlots = prev[selectedSlot.track] ?? [];
        const slot = trackSlots[selectedSlot.index];
        if (!slot) return prev;
        const nextSlot: CommandSlot = !color
          ? { ...slot, condition: null }
          : slot.condition === color
            ? { ...slot, condition: null }
            : { ...slot, condition: color };
        const nextTrack = trackSlots.slice();
        nextTrack[selectedSlot.index] = nextSlot;
        return { ...prev, [selectedSlot.track]: nextTrack };
      });
    },
    [selectedSlot, isEditingLocked]
  );

  const clearTrack = useCallback((track: TrackKey) => {
    if (isEditingLocked) return;
    setSlots((prev) => ({
      ...prev,
      [track]: prev[track].map(() => ({ ...EMPTY_SLOT })),
    }));
  }, [isEditingLocked]);

  const clearAll = useCallback(() => {
    if (isEditingLocked) return;
    setSlots(createSlots(config));
  }, [config, isEditingLocked]);

  const dropCommand = useCallback(
    (track: TrackKey, index: number, type: CommandType) => {
      if (isEditingLocked) return;
      setSlots((prev) => {
        const trackSlots = prev[track] ?? [];
        const slot = trackSlots[index];
        if (!slot) return prev;
        const nextSlot: CommandSlot = { ...slot, type };
        const nextTrack = trackSlots.slice();
        nextTrack[index] = nextSlot;
        return { ...prev, [track]: nextTrack };
      });
      setSelectedSlot({ track, index });
    },
    [isEditingLocked]
  );

  const dropCondition = useCallback(
    (track: TrackKey, index: number, color: TileColor) => {
      if (isEditingLocked) return;
      setSlots((prev) => {
        const trackSlots = prev[track] ?? [];
        const slot = trackSlots[index];
        if (!slot) return prev;
        const nextSlot: CommandSlot = { ...slot, condition: color };
        const nextTrack = trackSlots.slice();
        nextTrack[index] = nextSlot;
        return { ...prev, [track]: nextTrack };
      });
      setSelectedSlot({ track, index });
    },
    [isEditingLocked]
  );

  const serializeSolution = useCallback(() => {
    return {
      commands_f0: serializeCommands(commandSet.f0),
      commands_f1: serializeCommands(commandSet.f1),
      commands_f2: serializeCommands(commandSet.f2),
      steps_count: execution?.totalSteps || 0,
    };
  }, [commandSet, execution]);

  const queueSnapshots = useMemo(() => {
    if (!config) return [];
    if (execution?.queueSnapshots?.length) {
      return execution.queueSnapshots;
    }
    return buildExecutionQueueSnapshots(commandSet, config, 0);
  }, [commandSet, config, execution]);

  return {
    commandSet,
    slots,
    selectedSlot,
    selectedSlotState,
    selectSlot,
    applyCommand,
    applyCondition,
    dropCommand,
    dropCondition,
    currentState,
    queueSnapshots,
    execution,
    timelineIndex: stepIndex,
    isComplete,
    didSucceed,
    isEditingLocked,
    isRunning,
    speed,
    setSpeed,
    run,
    step,
    reset,
    clearTrack,
    clearAll,
    serializeSolution,
  };
}
