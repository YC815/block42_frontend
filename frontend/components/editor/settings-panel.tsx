/**
 * Block42 Frontend - Editor settings panel
 */

import type { LevelConfig } from "@/types/api";
import type { BoundsWithSize } from "@/lib/map-utils";
import { MAX_PADDING } from "@/lib/map-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TILE_COLORS } from "@/components/game/game-icons";

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
    const min = key === "f0" ? 1 : 0;
    const safe = Number.isFinite(value) ? Math.round(value) : min;
    onConfigChange({ ...config, [key]: Math.max(min, Math.min(20, safe)) });
  };

  const handleToolToggle = (key: keyof LevelConfig["tools"], value: boolean) => {
    onConfigChange({ ...config, tools: { ...config.tools, [key]: value } });
  };

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-white p-4">
      <div className="space-y-1.5">
        <Label htmlFor="level-title" className="text-sm font-semibold text-ink">
          關卡名稱
        </Label>
        <Input
          id="level-title"
          value={title}
          maxLength={200}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="幫這關取個名字"
        />
      </div>

      <div>
        <div className="text-sm font-semibold text-ink">可用格數</div>
        <p className="mt-0.5 text-xs text-ink-faint">格數越少越難。設為 0 的函式不會出現。</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["f0", "f1", "f2"] as const).map((key) => (
            <label key={key} className="space-y-1">
              <span className="font-mono text-xs font-bold text-ink-soft">{key.toUpperCase()}</span>
              <Input
                type="number"
                min={key === "f0" ? 1 : 0}
                max={20}
                value={config[key]}
                onChange={(event) => handleSlotsChange(key, Number(event.target.value))}
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-ink">可用的油漆</div>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-ink-soft">
          {([
            ["paint_red", "R"],
            ["paint_green", "G"],
            ["paint_blue", "B"],
          ] as const).map(([key, color]) => (
            <label key={key} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--ink)]"
                checked={config.tools[key]}
                onChange={(event) => handleToolToggle(key, event.target.checked)}
              />
              <span className="h-3 w-3 rounded-sm" style={{ background: TILE_COLORS[color].fill }} />
              {TILE_COLORS[color].name}
            </label>
          ))}
        </div>
      </div>

      <details className="group text-sm">
        <summary className="cursor-pointer text-xs font-medium text-ink-soft hover:text-ink">進階：地圖大小</summary>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>地圖外圍留白</span>
            <span className="tabular-nums">{padding} 格</span>
          </div>
          <input
            type="range"
            min={0}
            max={MAX_PADDING}
            step={1}
            value={padding}
            onChange={(event) => onPaddingChange(clampPadding(Number(event.target.value)))}
            className="w-full accent-[var(--ink)]"
          />
          <div className="flex justify-between text-xs text-ink-faint">
            <span>內容 {contentBounds.width}×{contentBounds.height}</span>
            <span>含留白 {renderBounds.width}×{renderBounds.height}</span>
          </div>
        </div>
      </details>
    </div>
  );
}
