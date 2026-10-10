"""遊戲規則（與前端 lib/game-engine/simulator.ts 行為一致）"""
from app.game.simulator import SimulationResult, parse_command, simulate

__all__ = ["SimulationResult", "parse_command", "simulate"]
