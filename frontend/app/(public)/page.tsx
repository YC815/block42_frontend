import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Braces,
  Gamepad2,
  Layers,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/landing/hero-visual";
import { LogoMarquee } from "@/components/landing/logo-marquee";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden bg-[#f6f7fb]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 landing-grid opacity-60" />
        <div className="absolute left-1/2 top-0 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.28),transparent_60%)] blur-3xl" />
        <div className="absolute right-[6%] top-[20%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(253,186,116,0.35),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 left-[10%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(74,222,128,0.25),transparent_65%)] blur-3xl" />
      </div>

      <section className="relative pb-16 pt-16 lg:pb-24 lg:pt-20">
        <div className="container mx-auto grid gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <Badge className="w-fit bg-slate-900 text-white">
              新世代程式邏輯學習平台
            </Badge>
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                把程式邏輯變成
                <span className="landing-shimmer block bg-gradient-to-r from-slate-900 via-sky-700 to-amber-500 bg-clip-text text-transparent">
                  一場可玩的冒險
                </span>
              </h1>
              <p className="max-w-xl text-lg text-slate-600">
                Block42 讓你用拖拉指令、函式與條件判斷，快速理解流程與
                演算法；同時提供完整的關卡工作室，從設計到發布一次完成。
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/levels">
                <Button size="lg" className="group h-12 rounded-full bg-slate-900 px-7 text-base text-white shadow-lg shadow-slate-900/20">
                  開始遊玩
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/studio">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-slate-300 bg-white/80 px-7 text-base text-slate-700 shadow-sm hover:bg-white"
                >
                  建立關卡
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "拖拉指令", desc: "視覺化組合流程" },
                { title: "函式軌道", desc: "f0 / f1 / f2" },
                { title: "條件判斷", desc: "顏色觸發邏輯" },
                { title: "創作工作室", desc: "設計關卡流程" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    {item.title}
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 -top-8 hidden h-20 w-20 rounded-full border border-white/80 bg-white/80 shadow-sm backdrop-blur lg:block landing-float" />
            <div className="absolute -bottom-8 right-10 hidden h-24 w-24 rounded-full border border-white/80 bg-white/80 shadow-sm backdrop-blur lg:block landing-float-slow" />
            <HeroVisual />
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto space-y-6 px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Social Proof
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                被教學與創作社群採用的實驗平台
              </h2>
            </div>
            <span className="text-sm text-slate-500">Logo 可替換</span>
          </div>
          <LogoMarquee />
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto grid gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="w-fit">
              Toolchain Mindset
            </Badge>
            <h2 className="text-3xl font-semibold text-slate-900">
              用工具思維打造可迭代的學習流程
            </h2>
            <p className="text-lg text-slate-600">
              從設計到發布，每一步都像操作專業工具鏈。讓學生、創作者與老師
              都能在同一條流程上快速迭代與驗證。
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                設計關卡
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                試玩驗證
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                發布審核
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
                進度追蹤
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "設計關卡",
                desc: "地圖繪製、工具限制與目標配置一次完成。",
                icon: <Wand2 className="h-5 w-5" />,
              },
              {
                title: "試玩驗證",
                desc: "即時模擬與回饋，確認邏輯流程正確性。",
                icon: <Target className="h-5 w-5" />,
              },
              {
                title: "發布與分享",
                desc: "提交審核或直接發布到社群挑戰區。",
                icon: <Sparkles className="h-5 w-5" />,
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="group rounded-3xl border border-white/70 bg-white/80 px-6 py-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Step 0{index + 1}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto space-y-10 px-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Core Experience
            </p>
            <h2 className="text-3xl font-semibold text-slate-900">
              讓程式概念變成可視化體驗的關鍵模組
            </h2>
          </div>

          <div className="grid auto-rows-[190px] gap-4 lg:grid-cols-6">
            <div className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg lg:col-span-4 lg:row-span-2">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-sky-300/30 blur-2xl" />
              <div className="relative space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    拖拉式指令工作區
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    像拼積木一樣組合程式流程，立刻看見角色移動、塗色與收集星星。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                  {[
                    "Move",
                    "Turn",
                    "Paint",
                    "Function Calls",
                    "Conditions",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur lg:col-span-2">
              <div className="absolute inset-0 opacity-60 landing-shimmer bg-[linear-gradient(135deg,rgba(56,189,248,0.35),rgba(251,191,36,0.25),rgba(74,222,128,0.25))]" />
              <div className="relative space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                  <Braces className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">函式軌道</h3>
                <p className="text-sm text-slate-600">
                  f0/f1/f2 分層設計，學會模組化思考。
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur lg:col-span-2">
              <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full bg-rose-300/40 blur-2xl" />
              <div className="relative space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">條件判斷</h3>
                <p className="text-sm text-slate-600">
                  用顏色觸發條件，理解 if/else 的核心概念。
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur lg:col-span-3">
              <div className="absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-amber-300/35 blur-2xl" />
              <div className="relative space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                  <Blocks className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  關卡創作與分享
                </h3>
                <p className="text-sm text-slate-600">
                  製作自己的關卡並發布到社群，讓學習成就可展示。
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur lg:col-span-3">
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-300/40 blur-2xl" />
              <div className="relative space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  即時回饋與進度追蹤
                </h3>
                <p className="text-sm text-slate-600">
                  每一步都能回看結果，讓錯誤變成可修正的學習素材。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto grid gap-10 px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-sm backdrop-blur">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                For Teams & Classrooms
              </p>
              <h2 className="text-3xl font-semibold text-slate-900">
                適合課堂、社團與個人自學的學習介面
              </h2>
              <p className="text-lg text-slate-600">
                無論是教學課程還是工作坊，Block42 都能提供一致的流程與可追蹤的成果。
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                {[
                  "課堂作業模板",
                  "社群挑戰發布",
                  "學習進度總覽",
                  "創作者評測流程",
                ].map((text) => (
                  <span
                    key={text}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2"
                  >
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Creator Ready
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                每一個關卡都能成為教學素材
              </p>
              <p className="mt-2 text-sm text-slate-600">
                從設計到審核的流程清晰可控，確保每個挑戰都能精準對應學習目標。
              </p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Player Flow
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                遊戲化讓學習更持久
              </p>
              <p className="mt-2 text-sm text-slate-600">
                進度、星星與挑戰感，讓使用者願意持續回到平台解鎖新能力。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-slate-900 px-8 py-12 text-white shadow-[0_30px_80px_-50px_rgba(15,23,42,0.9)]">
            <div className="absolute -left-10 top-0 h-44 w-44 rounded-full bg-sky-500/40 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-amber-400/30 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Get Started
                </p>
                <h2 className="text-3xl font-semibold">
                  今天就開始第一個關卡
                </h2>
                <p className="text-base text-white/70">
                  立即進入關卡大廳，或打開工作室建立你的第一個挑戰。
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="group h-12 rounded-full bg-white px-7 text-base font-semibold text-slate-900"
                  >
                    免費註冊
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/levels">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-12 rounded-full bg-white/15 px-7 text-base text-white hover:bg-white/25"
                  >
                    先逛關卡
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
