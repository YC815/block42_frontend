"""Level program model."""
from datetime import datetime, UTC
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class LevelProgram(Base):
    """Stores per-user program commands for a level."""

    __tablename__ = "level_programs"
    __table_args__ = (
        UniqueConstraint("user_id", "level_id", name="uq_level_program_user_level"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # 官方關卡 ID（official-01）或社群關卡 ID（NanoID）。
    # 官方關卡不在資料庫裡，所以這裡不設 foreign key，刪除社群關卡時由 LevelService 一併清掉。
    level_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    commands: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="programs", passive_deletes=True)

    @property
    def commands_f0(self) -> list[str]:
        return list(self.commands.get("commands_f0", []))

    @property
    def commands_f1(self) -> list[str]:
        return list(self.commands.get("commands_f1", []))

    @property
    def commands_f2(self) -> list[str]:
        return list(self.commands.get("commands_f2", []))
