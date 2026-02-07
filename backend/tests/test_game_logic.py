import pytest
from game_logic import calculate_battle_outcome, check_quests
from models import QuestDefinition, UserQuest, QuestType, QuestStatus, BossEnemy, CharacterStats
from schemas import UsageLogCreate
from datetime import datetime, timedelta

@pytest.fixture
def mock_boss(test_user):
    return BossEnemy(
        user_id=test_user.id,
        name="Test Boss",
        total_hp=100,
        current_hp=100,
        damage_dealt_to_user=0,
        is_defeated=False
    )

def test_battle_outcome_perfect_focus(test_user, mock_boss):
    """Test perfect focus day (0 damage taken)."""
    # No logs = 0 screen time = Max Focus
    stats = test_user.stats
    logs = [] 
    rules = [] # No blocked apps

    result = calculate_battle_outcome(stats, logs, mock_boss, rules)

    assert result["boss_damage_dealt"] == 0
    assert result["player_damage_dealt"] > 0
    assert result["boss_hp_remaining"] < 100
    assert stats.health == 100 # No damage taken

def test_battle_outcome_distracted(test_user, mock_boss):
    """Test highly distracted day."""
    stats = test_user.stats
    # 8 hours of Instagram (Total Waking Time)
    logs = [UsageLogCreate(
        app_package_name="com.instagram.android",
        start_time=datetime.now(),
        end_time=datetime.now() + timedelta(hours=8),
        duration_seconds=8 * 3600
    )]
    # Rule blocking Instagram
    class MockRule:
        app_package_name = "com.instagram.android"
        is_blocked = True
    rules = [MockRule()]

    result = calculate_battle_outcome(stats, logs, mock_boss, rules)

    assert result["boss_damage_dealt"] > 0
    assert result["player_hp_remaining"] < 100

def test_quest_focus_master(test_user, db_session):
    """Test FOCUS_MASTER quest completion logic."""
    # Setup Quest
    q_def = QuestDefinition(code="FOCUS_MASTER", title="Focus", target_progress=1, quest_type=QuestType.DAILY)
    db_session.add(q_def)
    db_session.commit()
    
    u_quest = UserQuest(user_id=test_user.id, quest_def_id=q_def.id, current_progress=0, status=QuestStatus.IN_PROGRESS)
    test_user.quests.append(u_quest)
    db_session.commit()

    # Simulate Perfect Battle
    battle_summary = {"boss_damage_dealt": 0, "boss_defeated": False}
    
    # Run Logic
    check_quests(test_user, battle_summary)
    
    assert u_quest.status == QuestStatus.COMPLETED
    assert u_quest.current_progress >= 1

def test_quest_fail_focus(test_user, db_session):
    """Test FOCUS_MASTER quest failure logic (took damage)."""
    # Setup Quest
    q_def = QuestDefinition(code="FOCUS_MASTER", title="Focus", target_progress=1, quest_type=QuestType.DAILY)
    db_session.add(q_def)
    db_session.commit()
    
    u_quest = UserQuest(user_id=test_user.id, quest_def_id=q_def.id, current_progress=0, status=QuestStatus.IN_PROGRESS)
    test_user.quests.append(u_quest)
    db_session.commit()

    # Simulate Bad Battle
    battle_summary = {"boss_damage_dealt": 50, "boss_defeated": False}
    
    # Run Logic
    check_quests(test_user, battle_summary)
    
    assert u_quest.status == QuestStatus.IN_PROGRESS # Should NOT complete
    assert u_quest.current_progress == 0
