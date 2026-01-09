/**
 * Block42 Frontend - Command Toolbox
 * Provides command buttons and condition modifiers.
 */

import { useDraggable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import type { LevelConfig, TileColor, CommandType } from "@/types/api";
import { ArrowBigUp, CornerUpLeft, CornerUpRight, PaintBucket } from "lucide-react";

interface CommandToolboxProps {
  config: LevelConfig;
  activeCommand: CommandType | null;
  activeCondition: TileColor | null;
  disabled?: boolean;
  onSelectCommand: (type: CommandType) => void;
  onSelectCondition: (color: TileColor | null) => void;
}

const COMMAND_ICONS: Record<CommandType, { label?: string; icon?: "move" | "turn_left" | "turn_right"; bg?: string }> = {
  move: { icon: "move" },
  turn_left: { icon: "turn_left" },
  turn_right: { icon: "turn_right" },
  paint_red: { label: "", bg: "bg-rose-500" },
  paint_green: { label: "", bg: "bg-emerald-500" },
  paint_blue: { label: "", bg: "bg-sky-500" },
  f0: { label: "f0" },
  f1: { label: "f1" },
  f2: { label: "f2" },
};

const COMMAND_TITLES: Record<CommandType, string> = {
  move: "前進",
  turn_left: "左轉",
  turn_right: "右轉",
  paint_red: "噴紅",
  paint_green: "噴綠",
  paint_blue: "噴藍",
  f0: "呼叫 f0",
  f1: "呼叫 f1",
  f2: "呼叫 f2",
};

interface DraggableButtonProps {
  id: string;
  data: Record<string, unknown>;
  disabled?: boolean;
  className: (isDragging: boolean) => string;
  onClick?: () => void;
  children: ReactNode;
  ariaLabel?: string;
  tourId?: string;
}

function DraggableButton({
  id,
  data,
  disabled,
  className,
  onClick,
  children,
  ariaLabel,
  tourId,
}: DraggableButtonProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data,
    disabled,
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      disabled={disabled}
      className={className(isDragging)}
      aria-label={ariaLabel}
      data-tour-id={tourId}
      onClick={onClick}
    >
      {children}
    </button>
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
  const actions: CommandType[] = ["turn_left", "move", "turn_right"];
  const paints: CommandType[] = ["paint_red", "paint_green", "paint_blue"];
  const functions: Array<"f0" | "f1" | "f2"> = ["f0", "f1", "f2"];

  return (
    <div
      className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/85 p-3 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.5)] backdrop-blur"
      data-tour-id="command-toolbox"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Commands
      </div>
      <div className="flex items-start gap-3">
        <div className="grid grid-cols-3 gap-2">
          {actions.map((cmd) => {
            const iconDef = COMMAND_ICONS[cmd];
            return (
              <DraggableButton
                key={cmd}
                disabled={disabled}
                id={`toolbox-command-${cmd}`}
                data={{
                  source: "toolbox",
                  itemType: "command",
                  value: cmd,
                }}
                className={(isDragging) =>
                  `flex h-11 w-11 items-center justify-center rounded-lg border text-lg shadow-sm transition ${
                    disabled
                      ? "border-slate-100 bg-slate-50 text-slate-300"
                      : activeCommand === cmd
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300"
                  } ${isDragging ? "opacity-50" : ""}`
                }
                ariaLabel={COMMAND_TITLES[cmd]}
                tourId={`command-${cmd}`}
                onClick={() => onSelectCommand(cmd)}
              >
                {iconDef.icon === "move" ? (
                  <ArrowBigUp className="h-6 w-6" strokeWidth={2} />
                ) : iconDef.icon === "turn_left" ? (
                  <CornerUpLeft className="h-5 w-5" strokeWidth={2.5} />
                ) : iconDef.icon === "turn_right" ? (
                  <CornerUpRight className="h-5 w-5" strokeWidth={2.5} />
                ) : (
                  <span>{iconDef.label}</span>
                )}
              </DraggableButton>
            );
          })}
          {functions.map((cmd) => {
            if (cmd !== "f0" && config[cmd] === 0) return null;
            return (
              <DraggableButton
                key={cmd}
                disabled={disabled}
                id={`toolbox-command-${cmd}`}
                data={{
                  source: "toolbox",
                  itemType: "command",
                  value: cmd,
                }}
                className={(isDragging) =>
                  `flex h-11 w-11 items-center justify-center rounded-lg border text-xs font-semibold shadow-sm transition ${
                    disabled
                      ? "border-slate-100 bg-slate-50 text-slate-300"
                      : activeCommand === cmd
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300"
                  } ${isDragging ? "opacity-50" : ""}`
                }
                ariaLabel={COMMAND_TITLES[cmd]}
                tourId={`command-${cmd}`}
                onClick={() => onSelectCommand(cmd)}
              >
                {cmd}
              </DraggableButton>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {paints.map((cmd) => {
            const enabled =
              (cmd === "paint_red" && config.tools.paint_red) ||
              (cmd === "paint_green" && config.tools.paint_green) ||
              (cmd === "paint_blue" && config.tools.paint_blue);
            const isActive = activeCommand === cmd;
            const squareColor =
              cmd === "paint_red"
                ? "bg-[#E53E3E]"
                : cmd === "paint_green"
                  ? "bg-[#38A169]"
                : "bg-[#3182CE]";
            const isDisabled = disabled || !enabled;
            return (
              <DraggableButton
                key={cmd}
                id={`toolbox-command-${cmd}`}
                data={{
                  source: "toolbox",
                  itemType: "command",
                  value: cmd,
                }}
                disabled={isDisabled}
                className={(isDragging) =>
                  `flex h-11 w-11 items-center justify-center rounded-lg border shadow-sm transition ${
                    isDisabled
                      ? "border-slate-100 bg-slate-50 opacity-40"
                      : isActive
                        ? "border-slate-900 bg-slate-100"
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                  } ${isDragging ? "opacity-50" : ""}`
                }
                ariaLabel={COMMAND_TITLES[cmd]}
                tourId={`brush-${cmd.replace("paint_", "")}`}
                onClick={() => onSelectCommand(cmd)}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${squareColor}`}>
                  <PaintBucket className="h-4 w-4 text-white/95" strokeWidth={2.5} />
                </div>
              </DraggableButton>
            );
          })}
        </div>
      </div>

      <div className="mt-auto">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Condition 條件過濾
        </div>
        <div className="mt-2 flex items-center gap-2">
          {["R", "G", "B"].map((color) => {
            const tileColor = color as TileColor;
            const isActive = activeCondition === tileColor;
            const bg =
              color === "R"
                ? "bg-[#E53E3E]"
                : color === "G"
                  ? "bg-[#38A169]"
                  : "bg-[#3182CE]";
            return (
              <DraggableButton
                key={color}
                id={`toolbox-condition-${color}`}
                data={{
                  source: "toolbox",
                  itemType: "condition",
                  value: tileColor,
                }}
                disabled={disabled}
                className={(isDragging) =>
                  `h-6 w-6 rounded-full ${bg} ${
                    isActive ? "ring-2 ring-offset-2 ring-slate-900/70" : "ring-0"
                  } ${disabled ? "opacity-40" : ""} ${isDragging ? "opacity-50" : ""}`
                }
                tourId={`condition-${color === "R" ? "red" : color === "G" ? "green" : "blue"}`}
                onClick={() => onSelectCondition(tileColor)}
              />
            );
          })}
          <button
            type="button"
            className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
              disabled ? "border-slate-100 text-slate-300" : "border-slate-200 text-slate-500"
            }`}
            disabled={disabled}
            onClick={() => onSelectCondition(null)}
          >
            清除
          </button>
        </div>
      </div>
    </div>
  );
}
