import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image, StatusBar } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, COMMON_STYLES } from '../styles/theme';
import AnimatedBar from '../components/AnimatedBar';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withRepeat
} from 'react-native-reanimated';

const BossBattleScreen = ({ route }) => {
    const insets = useSafeAreaInsets();
    const userId = route.params?.userId;
    const [boss, setBoss] = useState(null);
    const [loading, setLoading] = useState(false);

    // Shake Animation
    const shake = useSharedValue(0);
    const animatedBossStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: shake.value }],
        };
    });

    const triggerShake = () => {
        shake.value = withSequence(
            withTiming(15, { duration: 50 }),
            withRepeat(withTiming(-15, { duration: 50 }), 5, true),
            withTiming(0, { duration: 50 })
        );
    };

    const fetchBoss = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/game/boss/${userId}`);
            setBoss(res.data);
        } catch (err) {
            console.error("Fetch boss error:", err);
            Alert.alert("Error", "Failed to load boss data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchBoss();
    }, [userId]);

    // Trigger shake when player takes damage or boss is updated (mock logic for now)
    useEffect(() => {
        if (boss && boss.damage_dealt_to_user > 0) {
            // triggerShake(); // Optional: Shake on load if damaged
        }
    }, [boss]);

    if (!userId) return <Text style={[COMMON_STYLES.text, styles.center]}>No User ID</Text>;

    if (loading && !boss) return (
        <View style={[COMMON_STYLES.container, styles.center]}>
            <ActivityIndicator size="large" color={COLORS.error} />
            <Text style={[COMMON_STYLES.text, { marginTop: 20 }]}>Summoning Boss...</Text>
        </View>
    );

    if (!boss) return (
        <View style={[COMMON_STYLES.container, styles.center]}>
            <TouchableOpacity onPress={fetchBoss} style={COMMON_STYLES.buttonPrimary}>
                <Text style={COMMON_STYLES.buttonText}>Summon Boss</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <LinearGradient
            colors={[COLORS.background, '#2a0505', '#000000']}
            style={[COMMON_STYLES.container]}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 50, paddingHorizontal: 20 }}>
                <Text style={styles.header}>COMBAT ZONE</Text>

                {/* Boss Card */}
                <Animated.View style={[styles.bossCard, animatedBossStyle]}>
                    <View style={styles.bossAvatarContainer}>
                        <Text style={{ fontSize: 80 }}>👹</Text>
                    </View>
                    <Text style={styles.bossName}>{boss.name}</Text>

                    {boss.is_defeated ? (
                        <Text style={styles.victoryText}>☠️ DEFEATED ☠️</Text>
                    ) : (
                        <Text style={styles.statusText}>⚠️ ENGAGED ⚠️</Text>
                    )}

                    {/* HP Bar */}
                    <View style={styles.hpContainer}>
                        <AnimatedBar
                            label="Boss HP"
                            value={boss.current_hp}
                            max={boss.total_hp}
                            color={boss.current_hp > 50 ? COLORS.success : COLORS.error}
                            height={16}
                        />
                    </View>

                    {/* Battle Stats */}
                    <View style={styles.statBox}>
                        <Text style={styles.statText}>💀 Player Damage Taken: {boss.damage_dealt_to_user}</Text>
                    </View>
                </Animated.View>

                {/* Battle Log / Instructions */}
                <View style={[COMMON_STYLES.card, { borderColor: COLORS.primaryDark }]}>
                    <Text style={styles.logTitle}>BATTLE LOG RECENT</Text>
                    <View style={styles.logItem}>
                        <Text style={styles.logText}>ℹ️ Focus time deals damage to Boss.</Text>
                    </View>
                    <View style={styles.logItem}>
                        <Text style={styles.logText}>ℹ️ Distraction (Screen Time) hurts YOU.</Text>
                    </View>
                </View>

                {/* Manual Trigger for testing shake */}
                <TouchableOpacity
                    style={[COMMON_STYLES.buttonPrimary, { backgroundColor: COLORS.error }]}
                    onPress={() => {
                        fetchBoss();
                        triggerShake();
                    }}
                >
                    <Text style={COMMON_STYLES.buttonText}>⚔️ Refresh & Attack ⚔️</Text>
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.error,
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: 2,
        textShadowColor: 'red',
        textShadowRadius: 15
    },
    bossCard: {
        backgroundColor: 'rgba(50, 10, 10, 0.8)',
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.error,
        marginBottom: 30,
        shadowColor: COLORS.error,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10
    },
    bossAvatarContainer: {
        marginBottom: 16,
        backgroundColor: 'rgba(255,0,0,0.1)',
        borderRadius: 100,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.error
    },
    bossName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
        textTransform: 'uppercase'
    },
    victoryText: {
        color: COLORS.success,
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 12,
        letterSpacing: 1
    },
    statusText: {
        color: COLORS.gold,
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 12
    },
    hpContainer: { width: '100%', marginVertical: 20 },
    statBox: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 12,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,100,100,0.3)'
    },
    statText: { color: '#ff8a80', fontSize: 14, fontWeight: 'bold' },
    logTitle: { color: COLORS.secondary, fontSize: 12, marginBottom: 10, fontWeight: 'bold', letterSpacing: 1 },
    logItem: { flexDirection: 'row', marginBottom: 5 },
    logText: { color: COLORS.textSecondary, fontSize: 14, fontFamily: 'monospace' },
});

export default BossBattleScreen;
