import json

import pytest

from maplelens.guide.training import Spot, SpotsError, load_spots, parse_spots, recommend
from maplelens.overlay.rank_card import render_rank_card
from maplelens.ranking.models import Rank
from maplelens.ranking.service import RankResult, Status

SPOTS = (
    Spot("Low", "A", 1, 10),
    Spot("Mid", "A", 8, 20),
    Spot("Mid wide", "A", 5, 20),
    Spot("High", "B", 30, 40),
)


def test_bundled_table_loads_and_has_sane_bands():
    spots = load_spots()
    assert spots and all(1 <= s.min_level <= s.max_level <= 200 for s in spots)


def test_recommend_prefers_the_hardest_map_that_still_fits():
    assert [s.map for s in recommend(SPOTS, 9)] == ["Mid", "Mid wide"]
    assert [s.map for s in recommend(SPOTS, 9, limit=3)] == ["Mid", "Mid wide", "Low"]


def test_level_in_a_gap_gets_outgrown_maps_not_ones_too_strong():
    assert [s.map for s in recommend(SPOTS, 25)] == ["Mid", "Mid wide"]


def test_nothing_below_the_first_band_means_no_pick():
    assert recommend((Spot("High", "B", 30, 40),), 5) == []


def test_malformed_table_is_reported(tmp_path):
    with pytest.raises(SpotsError):
        parse_spots({"spots": [{"map": "x"}]})
    bad = tmp_path / "bad.json"
    bad.write_text(json.dumps({"nope": []}))
    with pytest.raises(SpotsError):
        load_spots(bad)


def test_rank_card_grows_a_training_section_when_the_level_is_known():
    rank = Rank("masterball", 27, "Thief", 3, 29516, 824, 21312, False, "2026-10-22T10:16:24Z", None)
    plain = render_rank_card(RankResult(Status.FOUND, rank), spots=())
    guided = render_rank_card(RankResult(Status.FOUND, rank), spots=SPOTS)
    assert guided.height > plain.height
    no_level = Rank("x", None, None, None, 1, 1, 1, False, None, None)
    assert render_rank_card(RankResult(Status.FOUND, no_level), spots=SPOTS).height < guided.height
