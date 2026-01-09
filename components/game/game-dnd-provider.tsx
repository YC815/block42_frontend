"use client";

/**
 * Block42 Frontend - Drag-and-Drop Provider
 * Enables dragging commands and conditions from toolbox to workspace slots.
 */

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { ArrowBigUp, CornerUpLeft, CornerUpRight, PaintBucket } from "lucide-react";
import type { TrackKey } from "@/lib/hooks/use-game-state";
import type { CommandType, TileColor } from "@/types/api";

interface DragData {
  source: "toolbox";
  itemType: "command" | "condition";
  value: CommandType | TileColor;
}

interface DropData {
  track: TrackKey;
  index: number;
}

interface GameDndProviderProps {
  children: React.ReactNode;
  onDropCommand: (track: TrackKey, index: number, type: CommandType) => void;
  onDropCondition: (track: TrackKey, index: number, color: TileColor) => void;
  disabled?: boolean;
}

function DragPreview({ data }: { data: DragData }) {
  if (data.itemType === "command") {
    const cmd = data.value as CommandType;

    // Actions (move, turn_left, turn_right)
    if (cmd === "move") {
      return (
        <div className="flex h-11 w-11 cursor-grabbing items-center justify-center rounded-lg border-2 border-slate-900 bg-white text-slate-700 shadow-2xl">
          <ArrowBigUp className="h-6 w-6" strokeWidth={2} />
        </div>
      );
    }
    if (cmd === "turn_left") {
      return (
        <div className="flex h-11 w-11 cursor-grabbing items-center justify-center rounded-lg border-2 border-slate-900 bg-white text-slate-700 shadow-2xl">
          <CornerUpLeft className="h-5 w-5" strokeWidth={2.5} />
        </div>
      );
    }
    if (cmd === "turn_right") {
      return (
        <div className="flex h-11 w-11 cursor-grabbing items-center justify-center rounded-lg border-2 border-slate-900 bg-white text-slate-700 shadow-2xl">
          <CornerUpRight className="h-5 w-5" strokeWidth={2.5} />
        </div>
      );
    }

    // Paint commands
    if (cmd === "paint_red" || cmd === "paint_green" || cmd === "paint_blue") {
      const squareColor =
        cmd === "paint_red"
          ? "bg-[#E53E3E]"
          : cmd === "paint_green"
            ? "bg-[#38A169]"
            : "bg-[#3182CE]";
      return (
        <div className="flex h-11 w-11 cursor-grabbing items-center justify-center rounded-lg border-2 border-slate-900 bg-white shadow-2xl">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${squareColor}`}>
            <PaintBucket className="h-4 w-4 text-white/95" strokeWidth={2.5} />
          </div>
        </div>
      );
    }

    // Functions (f0, f1, f2)
    return (
      <div className="flex h-11 w-11 cursor-grabbing items-center justify-center rounded-lg border-2 border-slate-900 bg-white text-xs font-semibold text-slate-700 shadow-2xl">
        {cmd}
      </div>
    );
  }

  if (data.itemType === "condition") {
    const bg =
      data.value === "R"
        ? "bg-[#E53E3E]"
        : data.value === "G"
          ? "bg-[#38A169]"
          : "bg-[#3182CE]";
    return (
      <div
        className={`h-6 w-6 cursor-grabbing rounded-full ${bg} shadow-2xl ring-2 ring-white`}
      />
    );
  }

  return null;
}

export function GameDndProvider({
  children,
  onDropCommand,
  onDropCondition,
  disabled = false,
}: GameDndProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 移動後才觸發拖移，避免與點擊衝突
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveDragData(event.active.data.current as DragData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) {
      setActiveId(null);
      setActiveDragData(null);
      return;
    }

    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      setActiveDragData(null);
      return;
    }

    const dragData = active.data.current as DragData | undefined;
    const dropData = over.data.current as DropData | undefined;

    if (!dragData || !dropData) {
      setActiveId(null);
      setActiveDragData(null);
      return;
    }

    if (dragData.source !== "toolbox") {
      setActiveId(null);
      setActiveDragData(null);
      return;
    }

    if (dragData.itemType === "command") {
      onDropCommand(dropData.track, dropData.index, dragData.value as CommandType);
    } else if (dragData.itemType === "condition") {
      onDropCondition(dropData.track, dropData.index, dragData.value as TileColor);
    }

    setActiveId(null);
    setActiveDragData(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveDragData(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}

      <DragOverlay
        dropAnimation={{
          duration: 0,
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0',
              },
            },
          }),
        }}
      >
        {activeId && activeDragData ? <DragPreview data={activeDragData} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
