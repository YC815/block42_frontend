"use client";

import { useEffect, useRef } from "react";
import {
  ArrowBigUp,
  CornerUpLeft,
  CornerUpRight,
  Grid2X2,
  PaintBucket,
  Play,
} from "lucide-react";

const tiles = [
  "bg-slate-900",
  "bg-slate-100",
  "bg-emerald-400",
  "bg-slate-200",
  "bg-slate-100",
  "bg-slate-100",
  "bg-sky-400",
  "bg-slate-900",
  "bg-amber-300",
  "bg-slate-200",
  "bg-slate-100",
  "bg-rose-400",
  "bg-slate-100",
  "bg-slate-200",
  "bg-slate-100",
  "bg-slate-200",
  "bg-slate-100",
  "bg-slate-200",
  "bg-slate-100",
  "bg-slate-200",
  "bg-slate-100",
  "bg-slate-100",
  "bg-slate-200",
  "bg-slate-100",
  "bg-slate-200",
];

type CommandType =
  | "move"
  | "turn_left"
  | "turn_right"
  | "paint_red"
  | "paint_green"
  | "paint_blue"
  | "f0"
  | "f1"
  | "f2";

const commandBlocks: Array<{ type: CommandType; label: string }> = [
  { type: "turn_left", label: "左轉" },
  { type: "move", label: "前進" },
  { type: "turn_right", label: "右轉" },
  { type: "f0", label: "f0" },
  { type: "f1", label: "f1" },
  { type: "f2", label: "f2" },
];

const paintBlocks: Array<{ type: CommandType; label: string }> = [
  { type: "paint_red", label: "噴紅" },
  { type: "paint_green", label: "噴綠" },
  { type: "paint_blue", label: "噴藍" },
];

const f0Slots: Array<CommandType | null> = [
  "move",
  "turn_left",
  "paint_red",
  "move",
  "turn_right",
  "paint_blue",
  "f1",
  null,
];

const f1Slots: Array<CommandType | null> = ["move", "move", "paint_green", null];

function CommandIcon({ command }: { command: CommandType }) {
  if (command === "move") {
    return <ArrowBigUp className="h-4 w-4" strokeWidth={2} />;
  }
  if (command === "turn_left") {
    return <CornerUpLeft className="h-4 w-4" strokeWidth={2.5} />;
  }
  if (command === "turn_right") {
    return <CornerUpRight className="h-4 w-4" strokeWidth={2.5} />;
  }
  if (command === "paint_red" || command === "paint_green" || command === "paint_blue") {
    const bg =
      command === "paint_red"
        ? "bg-rose-500"
        : command === "paint_green"
          ? "bg-emerald-500"
          : "bg-sky-500";
    return (
      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${bg}`}>
        <PaintBucket className="h-3.5 w-3.5 text-white/95" strokeWidth={2.5} />
      </span>
    );
  }
  return <span className="text-[11px] font-semibold">{command}</span>;
}

export function HeroVisual() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const rect = container.getBoundingClientRect();
      const progress = Math.min(
        Math.max(
          (window.innerHeight - rect.top) /
            (window.innerHeight + rect.height),
          0
        ),
        1
      );
      const items = container.querySelectorAll<HTMLElement>("[data-parallax]");
      items.forEach((item) => {
        const depth = Number(item.dataset.depth || "0.2");
        const axis = item.dataset.axis === "x" ? "x" : "y";
        const offset = (progress - 0.5) * depth * 140;
        item.style.transform =
          axis === "x"
            ? `translate3d(${offset}px, 0, 0)`
            : `translate3d(0, ${offset}px, 0)`;
      });
    };

    const handle = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);

    return () => {
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-[560px]">
      <div
        className="pointer-events-none absolute -top-16 right-4 h-32 w-32 rounded-full bg-sky-300/40 blur-3xl"
        data-parallax
        data-depth="0.6"
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-6 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl"
        data-parallax
        data-depth="0.9"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-4 h-24 w-24 -translate-x-1/2 rounded-full bg-emerald-300/40 blur-2xl"
        data-parallax
        data-depth="0.4"
      />

      <div className="relative rounded-[32px] border border-white/70 bg-white/75 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.7)] backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-semibold text-white">
              B42
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Command Flow
              </p>
              <p className="text-base font-semibold text-slate-900">
                程式軌道視覺化
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
            <Play className="h-3.5 w-3.5" />
            Live
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Command Toolbox</span>
                <span className="text-slate-400">拖拉指令</span>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <div className="grid grid-cols-3 gap-2">
                  {commandBlocks.map((block) => (
                    <div
                      key={block.label}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-700 shadow-sm"
                      aria-label={block.label}
                    >
                      <CommandIcon command={block.type} />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {paintBlocks.map((block) => (
                    <div
                      key={block.label}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200/80 bg-white shadow-sm"
                      aria-label={block.label}
                    >
                      <CommandIcon command={block.type} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Functions Workspace</span>
                <span className="text-slate-400">f0 / f1</span>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 text-[10px] font-semibold text-slate-500">
                    f0
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {f0Slots.map((slot, index) => (
                      <div
                        key={`f0-${index}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs ${
                          slot
                            ? "border-slate-200/80 bg-white text-slate-700"
                            : "border-slate-100 bg-slate-50 text-slate-300"
                        }`}
                      >
                        {slot ? <CommandIcon command={slot} /> : null}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 text-[10px] font-semibold text-slate-500">
                    f1
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {f1Slots.map((slot, index) => (
                      <div
                        key={`f1-${index}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs ${
                          slot
                            ? "border-slate-200/80 bg-white text-slate-700"
                            : "border-slate-100 bg-slate-50 text-slate-300"
                        }`}
                      >
                        {slot ? <CommandIcon command={slot} /> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>地圖預覽</span>
              <Grid2X2 className="h-4 w-4" />
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1">
              {tiles.map((tone, index) => (
                <span
                  key={`tile-${index}`}
                  className={`h-4 w-4 rounded-[6px] ${tone}`}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>星星收集 2/3</span>
              <span className="text-slate-400">步數 12</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute -left-4 bottom-12 hidden rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-xs font-semibold text-slate-600 shadow-lg backdrop-blur md:block"
        data-parallax
        data-depth="1"
      >
        條件判斷已同步
      </div>
      <div
        className="absolute -right-6 top-12 hidden rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-xs font-semibold text-slate-600 shadow-lg backdrop-blur md:block"
        data-parallax
        data-depth="0.8"
        data-axis="x"
      >
        立即試玩驗證
      </div>
    </div>
  );
}
