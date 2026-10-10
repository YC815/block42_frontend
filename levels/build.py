"""官方關卡建置腳本

讀取 levels/official.txt（人寫的關卡原稿），用後端的模擬器驗證每一關的參考解，
再輸出：
  levels/official.json                         正本（含參考解）
  frontend/lib/levels/official-levels.json     前端用（不含參考解）
  backend/app/data/official_levels.json        後端用（不含參考解）

Railway 的每個服務只會下載自己的子目錄，所以前後端各放一份複本；
backend/tests/test_official_levels.py 會檢查複本和正本一致。

用法（在 repo 根目錄）：
  uv run --project backend python levels/build.py          # 重新產生
  uv run --project backend python levels/build.py --check  # 只檢查是否需要重新產生
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from app.game.simulator import simulate  # noqa: E402

SOURCE = ROOT / "levels" / "official.txt"
CANONICAL = ROOT / "levels" / "official.json"
FRONTEND_COPY = ROOT / "frontend" / "lib" / "levels" / "official-levels.json"
BACKEND_COPY = ROOT / "backend" / "app" / "data" / "official_levels.json"

PADDING = 1
DIRECTIONS = {"^": 0, ">": 1, "v": 2, "<": 3}
COMMAND_ALIASES = {
    "m": "move",
    "l": "turn_left",
    "r": "turn_right",
    "pr": "paint_red",
    "pg": "paint_green",
    "pb": "paint_blue",
    "f0": "f0",
    "f1": "f1",
    "f2": "f2",
}
TOOL_NAMES = {"red": "paint_red", "green": "paint_green", "blue": "paint_blue"}


def parse_command(token: str) -> str:
    name, _, condition = token.partition(":")
    if name not in COMMAND_ALIASES:
        raise ValueError(f"未知指令縮寫: {token}")
    full = COMMAND_ALIASES[name]
    return f"{full}:{condition}" if condition else full


def parse_map(rows: list[str]) -> dict:
    tiles, stars, start = [], [], None
    for y, row in enumerate(rows):
        for x, cell in enumerate(row.split()):
            if cell == ".":
                continue
            color, marker = cell[0], cell[1:]
            if color not in "RGB":
                raise ValueError(f"({x},{y}) 顏色錯誤: {cell}")
            tiles.append({"x": x + PADDING, "y": y + PADDING, "color": color})
            for mark in marker:
                if mark == "*":
                    stars.append({"x": x + PADDING, "y": y + PADDING})
                elif mark in DIRECTIONS:
                    if start:
                        raise ValueError("起點重複")
                    start = {"x": x + PADDING, "y": y + PADDING, "dir": DIRECTIONS[mark]}
                else:
                    raise ValueError(f"({x},{y}) 標記錯誤: {cell}")
    if not start:
        raise ValueError("缺少起點")
    if not stars:
        raise ValueError("缺少星星")
    width = max(len(r.split()) for r in rows) + PADDING * 2
    height = len(rows) + PADDING * 2
    return {
        "gridSize": max(width, height),
        "padding": PADDING,
        "bounds": {"minX": 0, "minY": 0, "maxX": width - 1, "maxY": height - 1},
        "start": start,
        "stars": stars,
        "tiles": tiles,
    }


def parse_source(text: str) -> list[dict]:
    blocks = [b for b in re.split(r"^## ", text, flags=re.M)[1:]]
    levels = []
    for block in blocks:
        lines = block.rstrip().splitlines()
        header = lines[0].strip()
        fields: dict[str, str] = {}
        map_rows: list[str] = []
        in_map = False
        for line in lines[1:]:
            if in_map:
                if line.strip():
                    map_rows.append(line.strip())
                continue
            if line.strip() == "map:":
                in_map = True
                continue
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            key, _, value = line.partition(":")
            fields[key.strip()] = value.strip()

        number, _, title = header.partition(" ")
        config = {
            "f0": int(fields.get("f0", 0)),
            "f1": int(fields.get("f1", 0)),
            "f2": int(fields.get("f2", 0)),
            "tools": {name: False for name in TOOL_NAMES.values()},
        }
        for tool in fields.get("tools", "").split():
            config["tools"][TOOL_NAMES[tool]] = True
        solution = {
            key: [parse_command(t) for t in fields.get(f"solution.{key}", "").split()]
            for key in ("f0", "f1", "f2")
        }
        levels.append({
            "number": number,
            "title": title.strip(),
            "chapter": fields["chapter"],
            "goal": fields["goal"],
            "hint": fields["hint"],
            "config": config,
            "map": parse_map(map_rows),
            "solution": solution,
        })
    return levels


def build() -> dict:
    levels = parse_source(SOURCE.read_text(encoding="utf-8"))
    chapters: list[dict] = []
    output_levels = []
    errors = []
    for order, level in enumerate(levels, start=1):
        result = simulate(level["map"], level["config"], level["solution"])
        if not result.success:
            errors.append(f"{level['number']} {level['title']}: {result.error}"
                          f"（星星 {result.stars_collected}/{result.total_stars}，{result.steps} 步）")
        if not chapters or chapters[-1]["title"] != level["chapter"]:
            chapters.append({"id": f"chapter-{len(chapters) + 1}", "title": level["chapter"]})
        output_levels.append({
            "id": f"official-{order:02d}",
            "order": order,
            "number": level["number"],
            "chapter_id": chapters[-1]["id"],
            "title": level["title"],
            "goal": level["goal"],
            "hint": level["hint"],
            "config": level["config"],
            "map": level["map"],
            "solution": level["solution"],
            "solution_steps": result.steps,
        })
    if errors:
        raise SystemExit("參考解驗證失敗：\n" + "\n".join(errors))
    return {"chapters": chapters, "levels": output_levels}


def public_copy(data: dict) -> dict:
    """部署用的複本：拿掉參考解，避免直接打包進前端"""
    return {
        "chapters": data["chapters"],
        "levels": [
            {k: v for k, v in level.items() if k not in ("solution", "solution_steps")}
            for level in data["levels"]
        ],
    }


def dump(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2) + "\n"


def main() -> None:
    data = build()
    outputs = {
        CANONICAL: dump(data),
        FRONTEND_COPY: dump(public_copy(data)),
        BACKEND_COPY: dump(public_copy(data)),
    }
    if "--check" in sys.argv:
        stale = [str(p.relative_to(ROOT)) for p, c in outputs.items()
                 if not p.exists() or p.read_text(encoding="utf-8") != c]
        if stale:
            raise SystemExit("以下檔案和 levels/official.txt 不同步，請重新執行 build.py：\n" + "\n".join(stale))
        print(f"OK：{len(data['levels'])} 關皆已同步")
        return
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
    for level in data["levels"]:
        print(f"{level['number']:>5} {level['title']:<10} 參考解 {level['solution_steps']:>4} 步")


if __name__ == "__main__":
    main()
