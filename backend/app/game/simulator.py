"""遊戲模擬器 - 前端 simulator.ts 的 Python 版

規則必須和前端完全一致，否則伺服器判定和玩家畫面會對不上：
- 每個指令（含條件不符被略過、函式展開）都消耗一步
- 移動到沒有地板的格子即失敗
- 星星在「走進該格」時收集，收齊立即成功
- 超過 MAX_STEPS 步即失敗
"""
from dataclasses import dataclass

MAX_STEPS = 1000

DIRECTION_VECTORS = {0: (0, -1), 1: (1, 0), 2: (0, 1), 3: (-1, 0)}
PAINT_COMMANDS = {"paint_red": "R", "paint_green": "G", "paint_blue": "B"}
FUNCTION_COMMANDS = ("f0", "f1", "f2")
VALID_COMMANDS = {"move", "turn_left", "turn_right", *PAINT_COMMANDS, *FUNCTION_COMMANDS}
VALID_CONDITIONS = {"R", "G", "B"}


@dataclass
class SimulationResult:
    success: bool
    steps: int
    stars_collected: int
    total_stars: int
    error: str | None = None


def parse_command(raw: str) -> tuple[str, str | None]:
    """解析 "move" 或 "move:R" 格式的指令"""
    command, _, condition = raw.partition(":")
    if command not in VALID_COMMANDS:
        raise ValueError(f"未知指令: {command}")
    if condition and condition not in VALID_CONDITIONS:
        raise ValueError(f"未知條件: {condition}")
    return command, condition or None


def simulate(map_data: dict, config: dict, program: dict[str, list[str]]) -> SimulationResult:
    """執行玩家程式

    Args:
        map_data: {start:{x,y,dir}, stars:[{x,y}], tiles:[{x,y,color}]}
        config: {f0,f1,f2, tools:{paint_red,paint_green,paint_blue}}
        program: {"f0": [...], "f1": [...], "f2": [...]}，指令為字串
    """
    functions = {
        key: [parse_command(c) for c in program.get(key, [])]
        for key in FUNCTION_COMMANDS
    }
    for key, commands in functions.items():
        if len(commands) > config.get(key, 0):
            raise ValueError(f"{key} 指令數超過上限 {config.get(key, 0)}")

    tiles = {(t["x"], t["y"]): t["color"] for t in map_data["tiles"]}
    stars = {(s["x"], s["y"]) for s in map_data["stars"]}
    tools = config.get("tools", {})

    x, y = map_data["start"]["x"], map_data["start"]["y"]
    direction = map_data["start"]["dir"]
    painted: dict[tuple[int, int], str] = {}
    collected: set[tuple[int, int]] = set()
    steps = 0

    def result(success: bool, error: str | None = None) -> SimulationResult:
        return SimulationResult(success, steps, len(collected), len(stars), error)

    queue = list(functions["f0"])
    while queue:
        command, condition = queue.pop(0)
        steps += 1

        current_color = painted.get((x, y), tiles.get((x, y)))
        if condition is None or current_color == condition:
            if command in FUNCTION_COMMANDS:
                if config.get(command, 0) > 0 and functions[command]:
                    queue = functions[command] + queue
            elif command == "move":
                dx, dy = DIRECTION_VECTORS[direction]
                x, y = x + dx, y + dy
                if (x, y) not in tiles:
                    return result(False, f"移動至無效位置 ({x}, {y})")
                if (x, y) in stars:
                    collected.add((x, y))
            elif command == "turn_left":
                direction = (direction + 3) % 4
            elif command == "turn_right":
                direction = (direction + 1) % 4
            else:
                if not tools.get(command):
                    return result(False, f"沒有 {PAINT_COMMANDS[command]} 顏色工具")
                painted[(x, y)] = PAINT_COMMANDS[command]

        if steps > MAX_STEPS:
            return result(False, "步數超過上限")
        if stars and len(collected) == len(stars):
            return result(True)

    if not stars:
        return result(True)
    return result(False, "未收集所有星星")
