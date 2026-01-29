import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image, StatusBar } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, commonStyles } from '../theme';

const BossBattleScreen = ({ route }) => {
    const insets = useSafeAreaInsets();
    const userId = route.params?.userId;
    const [boss, setBoss] = useState(null);
    const [loading, setLoading] = useState(false);

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

    if (!userId) return <Text style={[commonStyles.text, styles.center]}>No User ID</Text>;
    if (loading && !boss) return <ActivityIndicator size="large" color={theme.colors.danger} style={styles.center} />;

    if (!boss) return (
        <View style={[commonStyles.container, styles.center]}>
            <TouchableOpacity onPress={fetchBoss} style={{ padding: 20, backgroundColor: theme.colors.primary, borderRadius: 10 }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Summon Boss</Text>
            </TouchableOpacity>
        </View>
    );

    const hpPercentage = (boss.current_hp / boss.total_hp) * 100;
    const hpColor = hpPercentage > 50 ? theme.colors.success : hpPercentage > 20 ? theme.colors.gold : theme.colors.danger;

    return (
        <ScrollView style={[commonStyles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
            <Text style={[styles.header, { marginTop: 20 }]}>COMBAT ZONE</Text>

            {/* Boss Card */}
            <View style={styles.bossCard}>
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
                    <View style={styles.hpHeader}>
                        <Text style={styles.hpLabel}>BOSS HP</Text>
                        <Text style={styles.hpValue}>{boss.current_hp} / {boss.total_hp}</Text>
                    </View>
                    <View style={styles.hpBarBg}>
                        <View style={[styles.hpBarFill, { width: `${hpPercentage}%`, backgroundColor: hpColor }]} />
                    </View>
                </View>

                {/* Battle Stats */}
                <View style={styles.statBox}>
                    <Text style={styles.statText}>💀 Player Damage Taken: {boss.damage_dealt_to_user}</Text>
                </View>
            </View>

            {/* Battle Log / Instructions */}
            <View style={styles.logContainer}>
                <Text style={styles.logTitle}>BATTLE LOG</Text>
                <View style={styles.logItem}>
                    <Text style={styles.logText}>ℹ️ Focus time deals damage to Boss.</Text>
                </View>
                <View style={styles.logItem}>
                    <Text style={styles.logText}>ℹ️ Distraction (Screen Time) hurts YOU.</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.refreshButton} onPress={fetchBoss}>
                <Text style={styles.refreshButtonText}>⚔️ Refresh Battle Status ⚔️</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
    header: { fontSize: 32, fontWeight: '900', color: theme.colors.danger, textAlign: 'center', marginBottom: 20, letterSpacing: 2, textShadowColor: 'red', textShadowRadius: 10 },
    bossCard: { backgroundColor: '#200505', padding: 25, borderRadius: theme.borderRadius.l, alignItems: 'center', borderWidth: 2, borderColor: theme.colors.danger, marginBottom: 30, elevation: 10 },
    bossAvatarContainer: { marginBottom: 15, backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: 100, padding: 20, borderWidth: 1, borderColor: theme.colors.danger },
    bossName: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 5, textTransform: 'uppercase' },
    victoryText: { color: theme.colors.success, fontSize: 20, fontWeight: 'bold', marginVertical: 10, letterSpacing: 1 },
    statusText: { color: theme.colors.gold, fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
    hpContainer: { width: '100%', marginVertical: 20 },
    hpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    hpLabel: { color: theme.colors.subtext, fontWeight: 'bold' },
    hpValue: { color: theme.colors.text, fontWeight: 'bold' },
    hpBarBg: { height: 20, backgroundColor: '#3e1a1a', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#5c2b2b' },
    hpBarFill: { height: '100%', borderRadius: 10 },
    statBox: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8, width: '100%', alignItems: 'center' },
    statText: { color: '#ff8a80', fontSize: 14, fontWeight: 'bold' },
    logContainer: { backgroundColor: theme.colors.surface, padding: 15, borderRadius: theme.borderRadius.m, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.cardBorder },
    logTitle: { color: theme.colors.subtext, fontSize: 12, marginBottom: 10, fontWeight: 'bold', letterSpacing: 1 },
    logItem: { flexDirection: 'row', marginBottom: 5 },
    logText: { color: theme.colors.text, fontSize: 14, fontFamily: 'monospace' },
    refreshButton: { backgroundColor: theme.colors.danger, padding: 18, borderRadius: theme.borderRadius.m, alignItems: 'center', elevation: 5 },
    refreshButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' }
});

export default BossBattleScreen;
