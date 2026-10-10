# Block42 Frontend

Next.js 16（App Router）+ React 19 + Tailwind 4。安裝與啟動見根目錄的 README。

## 目錄

```
app/(public)/      首頁、登入、註冊
app/(player)/      關卡列表、遊玩、教學（不需登入）
app/(studio)/      創作工作室、關卡編輯器（需登入）
app/(admin)/       管理後台（需管理員）
components/game/   遊戲畫面：GameWorkbench 是遊玩、試玩共用的版面
lib/game-engine/   遊戲規則（模擬器），必須和 backend/app/game/simulator.py 一致
lib/levels/        官方關卡（official-levels.json 由 levels/build.py 產生，不要手改）
```

## 設計

顏色定義在 `app/globals.css` 的 `:root`（`--paper`、`--ink`、`--tile-r/g/b`、`--star`），Tailwind 以 `bg-paper`、`text-ink`、`bg-tile-r` 等名稱使用。地板顏色、機器人、星星與指令圖示集中在 `components/game/game-icons.tsx`。
