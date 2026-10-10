import Link from "next/link";
import { ArrowRight, PenTool, Route, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandChip } from "@/components/game/game-icons";
import { MapThumbnail } from "@/components/levels/map-thumbnail";
import {
  CHAPTER_INTRO,
  OFFICIAL_CHAPTERS,
  OFFICIAL_LEVELS,
  getChapterLevels,
  getOfficialLevel,
} from "@/lib/levels/official";

const DEMO_LEVEL = getOfficialLevel("official-12")!;

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            寫一段程式，
            <br />
            帶機器人拿到所有星星。
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            Block42 是一款程式解謎遊戲。不用打字，把「前進」「轉彎」「呼叫函式」排進格子裡，
            就能練習寫程式最核心的想法：拆解問題、重複、遞迴、條件判斷。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/play/official-01">
                開始第一關
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/tutorial">先看教學</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-ink-faint">
            不用註冊就能玩。官方關卡共 {OFFICIAL_LEVELS.length} 關，分成 {OFFICIAL_CHAPTERS.length} 章。
          </p>
        </div>

        <figure className="rounded-3xl border border-line bg-white p-5 sm:p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink">
              {DEMO_LEVEL.number} {DEMO_LEVEL.title}
            </span>
            <span className="text-xs text-ink-faint">遞迴</span>
          </div>
          <div className="mt-4 rounded-2xl bg-grid-paper p-6">
            <MapThumbnail map={DEMO_LEVEL.map} className="mx-auto h-56 w-56 sm:h-64 sm:w-64" />
          </div>
          <div className="mt-5 flex items-center gap-2">
            <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-xs font-bold text-white">F0</span>
            <div className="flex flex-wrap gap-1.5">
              <CommandChip type="move" size="sm" />
              <CommandChip type="turn_left" size="sm" />
              <CommandChip type="move" size="sm" />
              <CommandChip type="turn_right" size="sm" />
              <CommandChip type="f0" size="sm" />
            </div>
          </div>
          <figcaption className="mt-3 text-sm leading-relaxed text-ink-soft">
            F0 最後呼叫自己，五個指令就能爬完整座樓梯。這就是遞迴。
          </figcaption>
        </figure>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold text-ink">六個章節，一次學一個概念</h2>
          <p className="mt-2 text-ink-soft">每一章四到六關，後面的關卡會用到前面學過的東西。</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OFFICIAL_CHAPTERS.map((chapter, index) => {
              const levels = getChapterLevels(chapter.id);
              return (
                <li key={chapter.id}>
                  <Link
                    href={`/play/${levels[0].id}`}
                    className="group flex h-full gap-4 rounded-2xl border border-line p-5 transition hover:border-ink/30"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-lg font-bold text-ink">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block font-semibold text-ink">
                        {chapter.title}
                        <span className="ml-2 text-xs font-normal text-ink-faint">{levels.length} 關</span>
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                        {CHAPTER_INTRO[chapter.id]}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-ink">在課堂上使用</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Route,
              title: "記錄每個人的進度",
              body: "學生登入後，完成的關卡和寫到一半的程式都會保存，下次上課可以接著做。",
            },
            {
              icon: PenTool,
              title: "讓學生自己出題",
              body: "在創作工作室畫地圖、設定可用的指令格數。送出前必須先自己解開一次。",
            },
            {
              icon: ShieldCheck,
              title: "審核後才公開",
              body: "學生設計的關卡由管理員審核，通過後才會出現在社群關卡。",
            },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="h-6 w-6 text-ink" strokeWidth={2} />
              <h3 className="mt-3 font-semibold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-ink-faint sm:px-6">
          <span>Block42</span>
          <span>
            <Link href="/levels" className="hover:text-ink">關卡</Link>
            <span className="mx-2">·</span>
            <Link href="/tutorial" className="hover:text-ink">教學</Link>
            <span className="mx-2">·</span>
            <Link href="/studio" className="hover:text-ink">創作工作室</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
