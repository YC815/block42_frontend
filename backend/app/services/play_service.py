"""遊玩相關：找出可遊玩的關卡、在伺服器重跑玩家程式"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.game import SimulationResult, simulate
from app.models.level import Level, LevelStatus
from app.models.user import User
from app.official_levels import get_official_level


def get_playable_level(db: Session, level_id: str, user: User) -> tuple[dict, dict]:
    """回傳 (map, config)。官方關卡讀程式內建資料，社群關卡須已發布（作者與管理員可玩草稿）。"""
    official = get_official_level(level_id)
    if official:
        return official["map"], official["config"]

    level = db.query(Level).filter(Level.id == level_id).first()
    can_see_draft = level is not None and (user.id == level.author_id or user.is_superuser)
    if not level or (level.status != LevelStatus.PUBLISHED and not can_see_draft):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="關卡不存在")
    return level.map_data, level.config


def run_solution(map_data: dict, config: dict, program: dict[str, list[str]]) -> SimulationResult:
    """重跑解法，沒過關就回 422"""
    try:
        result = simulate(map_data, config, program)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc))
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"解答沒有通過：{result.error}",
        )
    return result
