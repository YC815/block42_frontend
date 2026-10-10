"""官方關卡改由程式碼提供：進度與程式不再 FK 到 levels

Revision ID: b7d4e2a9c1f0
Revises: 9c2b7f1e3a4d
Create Date: 2026-10-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7d4e2a9c1f0"
down_revision: Union[str, Sequence[str], None] = "9c2b7f1e3a4d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = ("level_progress", "level_programs")


def upgrade() -> None:
    for table in TABLES:
        op.drop_constraint(f"{table}_level_id_fkey", table, type_="foreignkey")
        op.alter_column(
            table,
            "level_id",
            existing_type=sa.String(length=12),
            type_=sa.String(length=32),
            existing_nullable=False,
        )


def downgrade() -> None:
    for table in TABLES:
        # 官方關卡的紀錄在 levels 表裡沒有對應資料，無法還原 FK，只能刪除
        op.execute(f"DELETE FROM {table} WHERE level_id NOT IN (SELECT id FROM levels)")
        op.alter_column(
            table,
            "level_id",
            existing_type=sa.String(length=32),
            type_=sa.String(length=12),
            existing_nullable=False,
        )
        op.create_foreign_key(
            f"{table}_level_id_fkey", table, "levels", ["level_id"], ["id"], ondelete="CASCADE"
        )
