"use client";

/**
 * Block42 Frontend - Drag-and-Drop Provider
 * Enables dragging commands and conditions from toolbox to workspace slots.
 */

import { useId, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { CommandChip, TILE_COLORS } from "@/components/game/game-icons";
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
    return (
      <div className="cursor-grabbing shadow-xl">
        <CommandChip type={data.value as CommandType} />
      </div>
    );
  }
  const color = data.value as TileColor;
  return (
    <div
      className="h-9 w-9 cursor-grabbing rounded-lg shadow-xl ring-2 ring-white"
      style={{ background: TILE_COLORS[color].fill }}
    />
  );
}

export function GameDndProvider({
  children,
  onDropCommand,
  onDropCondition,
  disabled = false,
}: GameDndProviderProps) {
  // 固定 id，避免伺服器與瀏覽器產生的 aria-describedby 不一致（hydration 錯誤）
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // 8px 移動後才觸發拖移，避免與點擊衝突
      },
    }),
    // 觸控螢幕長按才拖曳，避免捲動頁面時誤觸
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 6 },
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
      id={dndId}
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
