/**
 * Block42 Frontend - Editor settings panel
 */

import type { LevelConfig } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsPanelProps {
  title: string;
  config: LevelConfig;
  onTitleChange: (value: string) => void;
  onConfigChange: (config: LevelConfig) => void;
}

export function SettingsPanel({
  title,
  config,
  onTitleChange,
  onConfigChange,
}: SettingsPanelProps) {
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
    <div className="space-y-6 rounded-2xl border bg-white p-4 shadow-sm">
      <div>
        <Label>關卡名稱</Label>
        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="輸入關卡名稱"
        />
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-700">函式格數</div>
        <div className="mt-2 grid gap-3">
          {["f0", "f1", "f2"].map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Label className="w-10 uppercase">{key}</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={config[key as "f0" | "f1" | "f2"]}
                onChange={(event) =>
                  handleSlotsChange(key as "f0" | "f1" | "f2", Number(event.target.value))
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-700">工具開關</div>
        <div className="mt-2 space-y-2 text-sm">
          {([
            ["paint_red", "紅色噴漆"],
            ["paint_green", "綠色噴漆"],
            ["paint_blue", "藍色噴漆"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.tools[key]}
                onChange={(event) => handleToolToggle(key, event.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
