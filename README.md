# Block42

程式解謎遊戲：把指令排進格子裡，帶機器人拿到所有星星。從順序、函式、遞迴、顏色條件到塗色，共 32 關官方關卡；玩家也能設計自己的關卡，審核通過後公開。

## 專案結構

```
block42/
├── frontend/   Next.js 16 + React 19（遊戲介面、關卡編輯器、管理後台）
├── backend/    FastAPI + PostgreSQL（帳號、社群關卡、進度與存檔）
└── levels/     官方關卡原稿與建置腳本（唯一的正本）
```

前後端原本是兩個 repo，合併後保留了兩邊的 git 歷史（`git log -- backend/` 可以看到後端的舊紀錄）。

## 官方關卡

官方關卡寫在 `levels/official.txt`，不存資料庫。格式說明在檔案開頭。改完之後執行：

```bash
uv run --project backend python levels/build.py
```

這個腳本會：

1. 用後端的模擬器（`backend/app/game/simulator.py`）重跑每一關的參考解，跑不過就停下來。
2. 產生 `levels/official.json`（含參考解）。
3. 產生前端與後端各自的複本（不含參考解）：
   - `frontend/lib/levels/official-levels.json`
   - `backend/app/data/official_levels.json`

之所以各放一份複本，是因為 Railway 設定 Root Directory 後只會下載該子目錄。`backend/tests/test_official_levels.py` 會檢查複本是否和原稿一致，CI 也會跑。

每關在原稿裡有一行 `id:`（例如 `official-07`），玩家進度用這個 ID 存，**上線後不要更改既有關卡的 id**。關卡順序和編號（1-1、1-2…）可以自由調整，新關卡給一個沒用過的 id 即可。

## 本機開發

需要 PostgreSQL 16、Python 3.13 + [uv](https://docs.astral.sh/uv/)、Node.js 22。

```bash
# 後端
cd backend
cat > .env <<'ENV'
DATABASE_URL=postgresql://block42:block42@localhost:5432/block42
SECRET_KEY=請換成至少 32 字元的隨機字串
DEBUG=true
ENV
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload          # http://localhost:8000

# 前端（另開一個終端機）
cd frontend
npm ci
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev   # http://localhost:3000
```

建立管理員：先在網站上註冊，再執行

```bash
cd backend && uv run python -m scripts.promote_superuser <帳號>
```

## 測試

```bash
cd backend && uv run pytest -q        # 需要 block42_test 資料庫，見 tests/conftest.py
cd frontend && npm run lint && npx tsc --noEmit
```

## 部署（Railway）

兩個服務都從這個 repo 部署，各自設定：

| 服務 | Root Directory | Watch Paths | 其他 |
|------|----------------|-------------|------|
| backend | `/backend` | `/backend/**` | Start：`uvicorn app.main:app --host 0.0.0.0 --port $PORT`，Pre-deploy：`alembic upgrade head` |
| frontend | `/frontend` | `/frontend/**` | 環境變數 `NEXT_PUBLIC_API_BASE_URL` 指向後端網址 |

後端必要環境變數：`DATABASE_URL`、`SECRET_KEY`（至少 32 字元隨機字串）、`CORS_ORIGINS`（例如 `["https://你的前端網址"]`）。正式環境請保持 `DEBUG=false`，否則會開放 `/docs` 並在錯誤時回傳 traceback。
