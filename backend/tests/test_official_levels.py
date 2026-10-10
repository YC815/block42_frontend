"""官方關卡：參考解要能過關，部署用的複本要和正本一致"""
import json
import subprocess
import sys
from pathlib import Path

import pytest

from app.game import simulate

ROOT = Path(__file__).resolve().parents[2]
CANONICAL = ROOT / "levels" / "official.json"

pytestmark = pytest.mark.skipif(not CANONICAL.exists(), reason="需要完整 monorepo")


def load_levels():
    return json.loads(CANONICAL.read_text(encoding="utf-8"))["levels"]


def test_thirty_levels_with_unique_ids():
    levels = load_levels()
    assert len(levels) == 30
    assert len({level["id"] for level in levels}) == 30


@pytest.mark.parametrize("level", load_levels() if CANONICAL.exists() else [], ids=lambda lv: lv["number"])
def test_reference_solution_solves_level(level):
    assert simulate(level["map"], level["config"], level["solution"]).success


def test_deployed_copies_in_sync():
    result = subprocess.run(
        [sys.executable, str(ROOT / "levels" / "build.py"), "--check"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
