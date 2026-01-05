/**
 * Block42 Frontend - Game HUD
 * Shows level title, steps, and star progress.
 */

import { Badge } from "@/components/ui/badge";

interface GameHUDProps {
  title: string;
  steps: number;
  bestSteps?: number | null;
  collectedStars: number;
  totalStars: number;
  status?: "idle" | "running" | "success" | "failure";
}

export function GameHUD({
  title,
  steps,
  bestSteps,
  collectedStars,
  totalStars,
  status,
}: GameHUDProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
          <span>星星</span>
          <span className="font-medium">
            {collectedStars}/{totalStars}
          </span>
          {status === "success" && (
            <Badge className="bg-green-600 text-white">通關</Badge>
          )}
          {status === "failure" && (
            <Badge className="bg-red-600 text-white">失敗</Badge>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-500">步數</div>
        <div className="text-lg font-semibold text-gray-900">
          {steps}
          <span className="text-sm text-gray-400"> / </span>
          <span className="text-sm text-gray-400">
            {bestSteps ?? "--"}
          </span>
        </div>
      </div>
    </div>
  );
}
