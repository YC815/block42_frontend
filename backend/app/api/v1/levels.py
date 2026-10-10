"""Public API - 社群關卡列表、玩家進度與存檔"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.level import Level, LevelStatus
from app.models.progress import LevelProgress
from app.models.program import LevelProgram
from app.schemas.progress import LevelProgressOut
from app.schemas.program import LevelProgramOut, ProgramCommands
from app.schemas.level import LevelOut, LevelListItem
from app.core.deps import get_current_user, get_current_user_optional
from app.models.user import User
from app.services.play_service import get_playable_level, run_solution

router = APIRouter(prefix="/levels", tags=["public"])


@router.get("/community", response_model=list[LevelListItem])
def list_community_levels(db: Session = Depends(get_db)):
    """列出社群關卡（按建立時間倒序）

    官方關卡由前端內建，不經過這裡。
    """
    levels = (
        db.query(Level)
        .options(joinedload(Level.author))
        .filter(Level.is_official == False, Level.status == LevelStatus.PUBLISHED)  # noqa: E712
        .order_by(Level.created_at.desc())
        .all()
    )
    return levels


@router.get("/progress", response_model=list[LevelProgressOut])
def list_level_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """列出目前使用者的關卡進度"""
    progress = (
        db.query(LevelProgress)
        .filter(LevelProgress.user_id == current_user.id)
        .all()
    )
    return progress


@router.post("/{level_id}/complete", response_model=LevelProgressOut)
def complete_level(
    level_id: str,
    data: ProgramCommands,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """提交過關程式

    伺服器會重跑一次，真的收齊所有星星才記錄為完成。
    """
    map_data, config = get_playable_level(db, level_id, current_user)
    result = run_solution(map_data, config, data.as_program())

    progress = (
        db.query(LevelProgress)
        .filter(
            LevelProgress.user_id == current_user.id,
            LevelProgress.level_id == level_id,
        )
        .first()
    )
    if not progress:
        progress = LevelProgress(user_id=current_user.id, level_id=level_id)
        db.add(progress)

    progress.is_completed = True
    progress.best_steps = (
        result.steps if progress.best_steps is None else min(progress.best_steps, result.steps)
    )
    progress.stars_collected = result.total_stars

    db.commit()
    db.refresh(progress)
    return progress


@router.get("/{level_id}/program", response_model=LevelProgramOut)
def get_level_program(
    level_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """取得關卡程式碼"""
    program = (
        db.query(LevelProgram)
        .filter(
            LevelProgram.user_id == current_user.id,
            LevelProgram.level_id == level_id,
        )
        .first()
    )
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="程式尚未儲存",
        )
    return program


@router.put("/{level_id}/program", response_model=LevelProgramOut)
def upsert_level_program(
    level_id: str,
    data: ProgramCommands,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新或建立關卡程式碼"""
    _, config = get_playable_level(db, level_id, current_user)
    for key, commands in data.as_program().items():
        if len(commands) > config.get(key, 0):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"{key} 指令數超過上限",
            )

    program = (
        db.query(LevelProgram)
        .filter(
            LevelProgram.user_id == current_user.id,
            LevelProgram.level_id == level_id,
        )
        .first()
    )

    payload = {
        "commands_f0": data.commands_f0,
        "commands_f1": data.commands_f1,
        "commands_f2": data.commands_f2,
    }

    if not program:
        program = LevelProgram(
            user_id=current_user.id,
            level_id=level_id,
            commands=payload,
        )
        db.add(program)
    else:
        program.commands = payload

    db.commit()
    db.refresh(program)
    return program


@router.get("/{level_id}", response_model=LevelOut)
def get_level(
    level_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """獲取單個社群關卡詳情（不含 solution）

    已發布關卡公開；草稿只有作者或管理員能看。
    """
    level = (
        db.query(Level)
        .options(joinedload(Level.author))
        .filter(Level.id == level_id)
        .first()
    )
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="關卡不存在"
        )

    if level.status != LevelStatus.PUBLISHED:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="需要登入才能查看未發布的關卡"
            )
        if current_user.id != level.author_id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="無權查看此關卡"
            )

    return level
