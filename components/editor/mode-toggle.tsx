/**
 * Block42 Frontend - Editor mode toggle
 */

import { Button } from "@/components/ui/button";

interface ModeToggleProps {
  mode: "edit" | "play";
  onChange: (mode: "edit" | "play") => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const buttonClass = (active: boolean) =>
    active
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "bg-transparent text-slate-600 hover:bg-slate-100";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 p-1 shadow-sm backdrop-blur">
      <Button
        variant={mode === "edit" ? "default" : "secondary"}
        size="sm"
        className={buttonClass(mode === "edit")}
        onClick={() => onChange("edit")}
      >
        ✏️ 編輯地圖
      </Button>
      <Button
        variant={mode === "play" ? "default" : "secondary"}
        size="sm"
        className={buttonClass(mode === "play")}
        onClick={() => onChange("play")}
      >
        🎮 試玩驗證
      </Button>
    </div>
  );
}
