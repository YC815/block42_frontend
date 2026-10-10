/**
 * Block42 Frontend - Command Toolbox
 * 指令面板：點一下放進目前選取的格子，或直接拖曳到格子上。
 */

import { useDraggable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { Ban } from "lucide-react";
import type { LevelConfig, TileColor, CommandType } from "@/types/api";
import {
  COMMAND_LABELS,
  CommandGlyph,
  TILE_COLORS,
  describeCommand,
} from "@/components/game/game-icons";

interface CommandToolboxProps {
  config: LevelConfig;
  activeCommand: CommandType | null;
  activeCondition: TileColor | null;
  disabled?: boolean;
  onSelectCommand: (type: CommandType) => void;
  onSelectCondition: (color: TileColor | null) => void;
}

interface DraggableButtonProps {
  id: string;
  data: Record<string, unknown>;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  ariaLabel: string;
  tourId?: string;
}

function DraggableButton({
  id,
  data,
  disabled,
  active,
  onClick,
  children,
  ariaLabel,
  tourId,
}: DraggableButtonProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data, disabled });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={active}
      title={ariaLabel}
      data-tour-id={tourId}
      onClick={onClick}
      className={`group flex min-w-0 flex-col items-center gap-1 rounded-xl border px-1 pb-1.5 pt-2 text-[11px] font-medium transition ${
        disabled
          ? "border-transparent text-ink-faint opacity-50"
          : active
            ? "border-ink bg-ink text-white"
            : "border-line bg-white text-ink-soft hover:-translate-y-px hover:border-ink/40 hover:text-ink"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-ink-soft">{title}</div>
      <div className="grid grid-cols-3 gap-1.5">{children}</div>
    </div>
  );
}

export function CommandToolbox({
  config,
  activeCommand,
  activeCondition,
  disabled,
  onSelectCommand,
  onSelectCondition,
}: CommandToolboxProps) {
  const actions: CommandType[] = ["move", "turn_left", "turn_right"];
  const paints = (["paint_red", "paint_green", "paint_blue"] as const).filter(
    (cmd) => config.tools[cmd]
  );
  const functions = (["f0", "f1", "f2"] as const).filter((key) => config[key] > 0);

  const commandButton = (cmd: CommandType, tourId?: string) => (
    <DraggableButton
      key={cmd}
      id={`toolbox-command-${cmd}`}
      data={{ source: "toolbox", itemType: "command", value: cmd }}
      disabled={disabled}
      active={activeCommand === cmd}
      ariaLabel={describeCommand(cmd)}
      tourId={tourId ?? `command-${cmd}`}
      onClick={() => onSelectCommand(cmd)}
    >
      <span className="flex h-7 items-center justify-center text-base">
        <CommandGlyph type={cmd} className="h-5 w-5" />
      </span>
      {cmd.startsWith("f") ? `呼叫 ${COMMAND_LABELS[cmd]}` : COMMAND_LABELS[cmd]}
    </DraggableButton>
  );

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-3"
      data-tour-id="command-toolbox"
    >
      <Group title="動作">{actions.map((cmd) => commandButton(cmd))}</Group>
      {paints.length > 0 && (
        <Group title="塗色">
          {paints.map((cmd) => commandButton(cmd, `brush-${cmd.replace("paint_", "")}`))}
        </Group>
      )}
      <Group title="呼叫函式">{functions.map((cmd) => commandButton(cmd))}</Group>

      <div>
        <div className="mb-1.5 text-xs font-semibold text-ink-soft">
          顏色條件 <span className="font-normal text-ink-faint">只在該色地板上才執行</span>
        </div>
        <div className="flex items-center gap-1.5">
          {(["R", "G", "B"] as const).map((color) => {
            const isActive = activeCondition === color;
            return (
              <DraggableButton
                key={color}
                id={`toolbox-condition-${color}`}
                data={{ source: "toolbox", itemType: "condition", value: color }}
                disabled={disabled}
                active={isActive}
                ariaLabel={`條件：只在${TILE_COLORS[color].name}色地板上執行`}
                tourId={`condition-${color === "R" ? "red" : color === "G" ? "green" : "blue"}`}
                onClick={() => onSelectCondition(color)}
              >
                <span
                  className="h-6 w-6 rounded-md"
                  style={{
                    background: TILE_COLORS[color].fill,
                    boxShadow: `inset 0 -3px 0 ${TILE_COLORS[color].deep}`,
                  }}
                />
                {TILE_COLORS[color].name}
              </DraggableButton>
            );
          })}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelectCondition(null)}
            aria-label="取消條件"
            title="取消條件"
            className="flex flex-col items-center gap-1 rounded-xl border border-line bg-white px-2 pb-1.5 pt-2 text-[11px] font-medium text-ink-soft transition hover:border-ink/40 hover:text-ink disabled:opacity-50"
          >
            <Ban className="h-6 w-6 p-0.5" strokeWidth={2} />
            無
          </button>
        </div>
      </div>
    </div>
  );
}
