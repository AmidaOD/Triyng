"""Recommended training maps for a character level, from a hand-kept JSON table (pure)."""

import json
from dataclasses import dataclass
from functools import cache
from pathlib import Path

DEFAULT_SPOTS = Path(__file__).resolve().parent / "training_spots.json"


class SpotsError(Exception):
    """The training table is missing or malformed."""


@dataclass(frozen=True)
class Spot:
    map: str
    region: str
    min_level: int
    max_level: int
    monsters: tuple[str, ...] = ()
    verified: bool = False

    def fits(self, level: int) -> bool:
        return self.min_level <= level <= self.max_level


def parse_spots(raw: dict) -> tuple[Spot, ...]:
    try:
        return tuple(Spot(s["map"], s["region"], int(s["levels"][0]), int(s["levels"][1]),
                          tuple(s.get("monsters", ())), bool(s.get("verified", False))) for s in raw["spots"])
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise SpotsError(f"bad training table: {exc!r}") from exc


@cache
def load_spots(path: Path = DEFAULT_SPOTS) -> tuple[Spot, ...]:
    try:
        return parse_spots(json.loads(path.read_text(encoding="utf-8")))
    except (OSError, json.JSONDecodeError) as exc:
        raise SpotsError(f"cannot read {path}: {exc}") from exc


def recommend(spots: tuple[Spot, ...], level: int, limit: int = 2) -> list[Spot]:
    """Maps whose band holds `level`, hardest first (more EXP while still safe).

    Levels in a gap between bands get the hardest maps already outgrown, never ones still too strong.
    """
    fitting = [s for s in spots if s.fits(level)]
    if not fitting:
        below = [s for s in spots if s.max_level < level]
        top = max((s.max_level for s in below), default=None)
        fitting = [s for s in below if s.max_level == top]
    return sorted(fitting, key=lambda s: (-s.min_level, s.max_level))[:limit]
