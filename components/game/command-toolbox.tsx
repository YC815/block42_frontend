/**
 * Block42 Frontend - Command Toolbox
 * Provides command buttons and condition modifiers.
 */

import type { LevelConfig, TileColor, CommandType } from "@/types/api";
import { Button } from "@/components/ui/button";

interface CommandToolboxProps {
  config: LevelConfig;
  activeCondition: TileColor | null;
  onConditionChange: (color: TileColor | null) => void;
  onAddCommand: (type: CommandType) => void;
}

const COMMAND_LABELS: Record<CommandType, string> = {
  move: "前進",
  turn_left: "左轉",
  turn_right: "右轉",
  paint_red: "噴紅",
  paint_green: "噴綠",
  paint_blue: "噴藍",
  f1: "呼叫 f1",
  f2: "呼叫 f2",
};

export function CommandToolbox({
  config,
  activeCondition,
  onConditionChange,
  onAddCommand,
}: CommandToolboxProps) {
  const actions: CommandType[] = ["move", "turn_left", "turn_right"];
  const paints: CommandType[] = ["paint_red", "paint_green", "paint_blue"];
  const functions: CommandType[] = ["f1", "f2"];

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border bg-white/90 p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-gray-700">指令集</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {actions.map((cmd) => (
            <Button key={cmd} variant="secondary" onClick={() => onAddCommand(cmd)}>
              {COMMAND_LABELS[cmd]}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500">噴漆</h4>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {paints.map((cmd) => {
            const enabled =
              (cmd === "paint_red" && config.tools.paint_red) ||
              (cmd === "paint_green" && config.tools.paint_green) ||
              (cmd === "paint_blue" && config.tools.paint_blue);
            return (
              <Button
                key={cmd}
                variant={enabled ? "secondary" : "outline"}
                disabled={!enabled}
                onClick={() => onAddCommand(cmd)}
              >
                {COMMAND_LABELS[cmd]}
              </Button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500">函式</h4>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {functions.map((cmd) => {
            const enabled = cmd === "f1" ? config.f1 > 0 : config.f2 > 0;
            return (
              <Button
                key={cmd}
                variant={enabled ? "secondary" : "outline"}
                disabled={!enabled}
                onClick={() => onAddCommand(cmd)}
              >
                {enabled ? COMMAND_LABELS[cmd] : "未解鎖"}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto">
        <h4 className="text-xs font-semibold text-gray-500">條件修飾</h4>
        <div className="mt-2 flex items-center gap-2">
          {["R", "G", "B"].map((color) => {
            const tileColor = color as TileColor;
            const isActive = activeCondition === tileColor;
            const bg =
              color === "R"
                ? "bg-rose-500"
                : color === "G"
                  ? "bg-emerald-500"
                  : "bg-sky-500";
            return (
              <button
                key={color}
                type="button"
                className={`h-6 w-6 rounded-full ${bg} ${
                  isActive ? "ring-2 ring-offset-2 ring-gray-900" : "ring-0"
                }`}
                onClick={() => onConditionChange(isActive ? null : tileColor)}
              />
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onConditionChange(null)}
          >
            清除
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          目前條件：{activeCondition ?? "無"}
        </p>
      </div>
    </div>
  );
}
