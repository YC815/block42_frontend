"""Program schemas."""
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

from app.game import parse_command

MAX_COMMANDS_PER_FUNCTION = 20  # 與 LevelConfig 的槽位上限一致


class ProgramCommands(BaseModel):
    """玩家程式（F0／F1／F2 三條指令列）"""

    commands_f0: list[str] = Field(default_factory=list, max_length=MAX_COMMANDS_PER_FUNCTION)
    commands_f1: list[str] = Field(default_factory=list, max_length=MAX_COMMANDS_PER_FUNCTION)
    commands_f2: list[str] = Field(default_factory=list, max_length=MAX_COMMANDS_PER_FUNCTION)

    @field_validator("commands_f0", "commands_f1", "commands_f2")
    @classmethod
    def validate_commands(cls, commands: list[str]) -> list[str]:
        for command in commands:
            parse_command(command)
        return commands

    def as_program(self) -> dict[str, list[str]]:
        return {"f0": self.commands_f0, "f1": self.commands_f1, "f2": self.commands_f2}


class LevelProgramOut(BaseModel):
    """Program response for a level."""

    level_id: str
    commands_f0: list[str]
    commands_f1: list[str]
    commands_f2: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
