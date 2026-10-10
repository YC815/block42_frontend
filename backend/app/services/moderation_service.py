"""審核服務層 - 管理員審核操作"""
from datetime import datetime, UTC
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.level import Level, LevelStatus
from app.services.play_service import run_solution


class ModerationService:
    """審核業務邏輯服務"""

    @staticmethod
    def approve_level(db: Session, level: Level) -> Level:
        """審核通過（上架為社群關卡）

        Args:
            db: 資料庫 session
            level: 待審核的關卡

        Returns:
            Level: 審核通過的關卡（status=PUBLISHED）

        Raises:
            ValueError: 如果關卡狀態不是 PENDING
        """
        if level.status != LevelStatus.PENDING:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"只能審核 PENDING 狀態的關卡，當前: {level.status}",
            )

        # 舊版沒有在伺服器驗證解法，審核時再跑一次
        solution = level.solution or {}
        run_solution(level.map_data, level.config, {
            "f0": solution.get("commands_f0", []),
            "f1": solution.get("commands_f1", []),
            "f2": solution.get("commands_f2", []),
        })

        level.status = LevelStatus.PUBLISHED
        db.commit()
        db.refresh(level)
        return level

    @staticmethod
    def reject_level(db: Session, level: Level, reason: str) -> Level:
        """駁回關卡

        Args:
            db: 資料庫 session
            level: 待審核的關卡
            reason: 駁回理由

        Returns:
            Level: 駁回的關卡（status=REJECTED）

        Raises:
            ValueError: 如果關卡狀態不是 PENDING
        """
        if level.status != LevelStatus.PENDING:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"只能駁回 PENDING 狀態的關卡，當前: {level.status}",
            )

        level.status = LevelStatus.REJECTED
        level.metadata_ = {
            "rejection_reason": reason,
            "rejected_at": datetime.now(UTC).isoformat()
        }

        db.commit()
        db.refresh(level)
        return level
