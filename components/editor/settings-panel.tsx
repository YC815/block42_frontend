/**
 * Block42 Frontend - Editor settings panel
 */

import type { LevelConfig } from "@/types/api";
import type { BoundsWithSize } from "@/lib/map-utils";
import { MAX_PADDING } from "@/lib/map-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsPanelProps {
  title: string;
  config: LevelConfig;
  padding: number;
  contentBounds: BoundsWithSize;
  renderBounds: BoundsWithSize;
  onPaddingChange: (value: number) => void;
  onTitleChange: (value: string) => void;
  onConfigChange: (config: LevelConfig) => void;
}

export function SettingsPanel({
  title,
  config,
  padding,
  contentBounds,
  renderBounds,
  onPaddingChange,
  onTitleChange,
  onConfigChange,
}: SettingsPanelProps) {
  const clampPadding = (value: number) => Math.max(0, Math.min(MAX_PADDING, value));

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
          地圖框架
        </div>
        <div className="mt-3">
          <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">
            預留空氣（Padding）
          </Label>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={MAX_PADDING}
              step={1}
              value={padding}
              onChange={(event) => onPaddingChange(clampPadding(Number(event.target.value)))}
              className="w-full accent-teal-500"
            />
            <Input
              type="number"
              min={0}
              max={MAX_PADDING}
              step={1}
              value={padding}
              onChange={(event) => onPaddingChange(clampPadding(Number(event.target.value)))}
              className="w-16 bg-white/80 text-sm font-semibold text-slate-700"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            渲染時會自動平移原點並在四周留下空白，方便動態載入。
          </p>
          <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span>編輯範圍</span>
              <span className="font-semibold">
                {contentBounds.width} x {contentBounds.height}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>座標</span>
              <span>
                x: {contentBounds.minX}~{contentBounds.maxX}, y: {contentBounds.minY}~{contentBounds.maxY}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span>渲染範圍（含空氣）</span>
              <span className="font-semibold">
                {renderBounds.width} x {renderBounds.height}
              </span>
            </div>
          </div>
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
