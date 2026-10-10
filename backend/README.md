# Block42 Backend

FastAPI + SQLAlchemy 2 + PostgreSQL。安裝、啟動與部署見根目錄的 README。

## 目錄

```
app/
├── main.py              應用入口（CORS、請求大小上限）
├── config.py            環境變數
├── api/v1/              auth、levels（社群關卡、進度、存檔）、designer、admin
├── game/simulator.py    遊戲規則，必須和 frontend/lib/game-engine/simulator.ts 一致
├── official_levels.py   讀取官方關卡（app/data/official_levels.json，由 levels/build.py 產生）
├── services/            發布、審核、遊玩驗證
├── core/                JWT、速率限制、依賴注入
├── models/ schemas/
alembic/                 資料庫遷移
scripts/promote_superuser.py
tests/
```

## 重要規則

- **進度由伺服器判定**：`POST /api/v1/levels/{id}/complete` 送出玩家程式，伺服器重跑通過才記錄完成。
- **發布前驗證**：作者送出關卡時附上解法，伺服器重跑確認可解；管理員核准時會再跑一次。
- **官方關卡不在資料庫**：進度與存檔的 `level_id` 可能是 `official-XX` 或社群關卡的 NanoID，因此沒有 foreign key，刪除社群關卡時由 `LevelService.delete_level` 一併清除。
- 修改遊戲規則時，前後端模擬器都要改，並跑 `pytest`（會用後端模擬器驗證 30 關參考解）。
