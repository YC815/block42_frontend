/**
 * Block42 Frontend - Editor settings panel
 */

import type { LevelConfig } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsPanelProps {
  title: string;
  config: LevelConfig;
  gridSize: number;
  onGridSizeChange: (value: number) => void;
  onTitleChange: (value: string) => void;
  onConfigChange: (config: LevelConfig) => void;
}

export function SettingsPanel({
  title,
  config,
  gridSize,
  onGridSizeChange,
  onTitleChange,
  onConfigChange,
}: SettingsPanelProps) {
  const minGridSize = 4;
  const maxGridSize = 16;

  const handleSlotsChange = (key: "f0" | "f1" | "f2", value: number) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handleToolToggle = (key: keyof LevelConfig["tools"], value: boolean) => {
    onConfigChange({
      ...config,
      tools: {
        ...config.tools,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-[0_18px_45px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          基本設定
        </div>
        <div className="mt-3">
          <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">
            關卡名稱
          </Label>
          <Input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="輸入關卡名稱"
            className="mt-2 bg-white/80"
          />
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          棋盤設定
        </div>
        <div className="mt-3">
          <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">
            格數
          </Label>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={minGridSize}
              max={maxGridSize}
              step={1}
              value={gridSize}
              onChange={(event) => onGridSizeChange(Number(event.target.value))}
              className="w-full accent-teal-500"
            />
            <Input
              type="number"
              min={minGridSize}
              max={maxGridSize}
              step={1}
              value={gridSize}
              onChange={(event) => onGridSizeChange(Number(event.target.value))}
              className="w-16 bg-white/80 text-sm font-semibold text-slate-700"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            調整棋盤大小會自動移除超出範圍的方塊。
          </p>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          函式格數
        </div>
        <div className="mt-3 grid gap-3">
          {["f0", "f1", "f2"].map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Label className="w-10 uppercase text-slate-600">{key}</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={config[key as "f0" | "f1" | "f2"]}
                onChange={(event) =>
                  handleSlotsChange(key as "f0" | "f1" | "f2", Number(event.target.value))
                }
                className="bg-white/80"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          工具開關
        </div>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          {([
            ["paint_red", "紅色噴漆"],
            ["paint_green", "綠色噴漆"],
            ["paint_blue", "藍色噴漆"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-2">
              <input
                type="checkbox"
                checked={config.tools[key]}
                onChange={(event) => handleToolToggle(key, event.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
