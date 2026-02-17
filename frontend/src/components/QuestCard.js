import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../styles/theme';

const QuestCard = ({ quest, onClaim }) => {
    const { definition, status, current_progress } = quest;
    const { title, description, target_progress, reward_xp, reward_gold } = definition;

    const progressPercent = Math.min(100, (current_progress / target_progress) * 100);
    const isCompleted = status === 'COMPLETED';
    const isClaimed = status === 'CLAIMED';

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {isClaimed && <Text style={styles.claimedBadge}>✓ DONE</Text>}
            </View>

            <Text style={styles.description}>{description}</Text>

            <View style={styles.rewards}>
                <Text style={styles.rewardText}>+{reward_xp} XP</Text>
                <Text style={styles.rewardText}>+{reward_gold} Gold</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>{current_progress} / {target_progress}</Text>

            {/* Action Button */}
            {isCompleted && (
                <TouchableOpacity style={styles.claimButton} onPress={() => onClaim(quest.id)}>
                    <Text style={styles.claimText}>CLAIM REWARD</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.cardBg,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    title: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    claimedBadge: {
        color: COLORS.success,
        fontSize: 12,
        fontWeight: 'bold',
    },
    description: {
        color: COLORS.subtext,
        fontSize: 14,
        marginBottom: 10,
    },
    rewards: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    rewardText: {
        color: COLORS.gold, // Assume gold/accent color
        fontSize: 12,
        fontWeight: 'bold',
    },
    progressContainer: {
        height: 6,
        backgroundColor: '#333',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 5,
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary,
    },
    progressText: {
        color: COLORS.subtext,
        fontSize: 12,
        textAlign: 'right',
    },
    claimButton: {
        marginTop: 10,
        backgroundColor: COLORS.success,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    claimText: {
        color: '#FFF',
        fontWeight: 'bold',
    }
});

export default QuestCard;
