"""官方關卡資料

正本是 levels/official.txt，由 levels/build.py 產生 app/data/official_levels.json。
官方關卡不存資料庫，後端只用它來驗證進度與存檔。
"""
import json
from functools import lru_cache
from pathlib import Path

DATA_PATH = Path(__file__).parent / "data" / "official_levels.json"


@lru_cache
def _load() -> dict[str, dict]:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    return {level["id"]: level for level in data["levels"]}


def get_official_level(level_id: str) -> dict | None:
    return _load().get(level_id)


def official_level_ids() -> list[str]:
    return list(_load())
