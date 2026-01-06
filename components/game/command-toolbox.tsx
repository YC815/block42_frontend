/**
 * Block42 Frontend - Command Toolbox
 * Provides command buttons and condition modifiers.
 */

import type { LevelConfig, TileColor, CommandType } from "@/types/api";

interface CommandToolboxProps {
  config: LevelConfig;
  activeCommand: CommandType | null;
  activeCondition: TileColor | null;
  disabled?: boolean;
  onSelectCommand: (type: CommandType) => void;
  onSelectCondition: (color: TileColor | null) => void;
}

const COMMAND_ICONS: Record<CommandType, { label: string; bg?: string }> = {
  move: { label: "↑" },
  turn_left: { label: "↶" },
  turn_right: { label: "↷" },
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

function BrushIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.5 4.5l4 4-9 9h-4v-4l9-9z" />
      <path d="M4 20c3 0 4-1 4-3 0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2 0 2-1 3-4 3H4z" />
    </svg>
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
          {actions.map((cmd) => (
            <button
              key={cmd}
              type="button"
              disabled={disabled}
              className={`flex h-11 w-11 items-center justify-center rounded-lg border text-lg shadow-sm transition ${
                disabled
                  ? "border-slate-100 bg-slate-50 text-slate-300"
                  : activeCommand === cmd
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300"
              }`}
              aria-label={COMMAND_TITLES[cmd]}
              data-tour-id={`command-${cmd}`}
              onClick={() => onSelectCommand(cmd)}
            >
              {COMMAND_ICONS[cmd].label}
            </button>
          ))}
          {functions.map((cmd) => {
            if (cmd !== "f0" && config[cmd] === 0) return null;
            return (
              <button
                key={cmd}
                type="button"
                disabled={disabled}
                className={`flex h-11 w-11 items-center justify-center rounded-lg border text-xs font-semibold shadow-sm transition ${
                  disabled
                    ? "border-slate-100 bg-slate-50 text-slate-300"
                    : activeCommand === cmd
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300"
                }`}
                aria-label={COMMAND_TITLES[cmd]}
                data-tour-id={`command-${cmd}`}
                onClick={() => onSelectCommand(cmd)}
              >
                {COMMAND_ICONS[cmd].label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {paints.map((cmd) => {
            const enabled =
              (cmd === "paint_red" && config.tools.paint_red) ||
              (cmd === "paint_green" && config.tools.paint_green) ||
              (cmd === "paint_blue" && config.tools.paint_blue);
            if (!enabled) return null;
            const isActive = activeCommand === cmd;
            const squareColor =
              cmd === "paint_red"
                ? "bg-[#E53E3E]"
                : cmd === "paint_green"
                  ? "bg-[#38A169]"
                  : "bg-[#3182CE]";
            return (
              <button
                key={cmd}
                type="button"
                className={`flex h-11 w-11 items-center justify-center rounded-lg border shadow-sm transition ${
                  isActive
                    ? "border-slate-900 bg-slate-100"
                    : "border-slate-200/80 bg-white hover:border-slate-300"
                }`}
                disabled={disabled}
                aria-label={COMMAND_TITLES[cmd]}
                data-tour-id={`brush-${cmd.replace("paint_", "")}`}
                onClick={() => onSelectCommand(cmd)}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${squareColor}`}>
                  <BrushIcon className="h-4 w-4 text-white/95" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Condition
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
              <button
                key={color}
                type="button"
                disabled={disabled}
                  className={`h-6 w-6 rounded-full ${bg} ${
                    isActive ? "ring-2 ring-offset-2 ring-slate-900/70" : "ring-0"
                  } ${disabled ? "opacity-40" : ""}`}
                data-tour-id={`condition-${color === "R" ? "red" : color === "G" ? "green" : "blue"}`}
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
