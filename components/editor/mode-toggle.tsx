/**
 * Block42 Frontend - Editor mode toggle
 */

import { Button } from "@/components/ui/button";

interface ModeToggleProps {
  mode: "edit" | "play";
  onChange: (mode: "edit" | "play") => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={mode === "edit" ? "default" : "secondary"}
        onClick={() => onChange("edit")}
      >
        ✏️ 編輯地圖
      </Button>
      <Button
        variant={mode === "play" ? "default" : "secondary"}
        onClick={() => onChange("play")}
      >
        🎮 試玩驗證
      </Button>
    </div>
  );
}
