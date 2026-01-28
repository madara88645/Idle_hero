import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Button } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

    if (!userId) return <Text style={styles.center}>No User ID</Text>;
    if (loading && !boss) return <ActivityIndicator style={styles.center} />;
    if (!boss) return <Button title="Retry" onPress={fetchBoss} />;

    const hpPercentage = (boss.current_hp / boss.total_hp) * 100;
    const bossColor = hpPercentage > 50 ? '#4CAF50' : hpPercentage > 20 ? '#FFC107' : '#F44336';

    return (
        <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.header}>Daily Boss</Text>

            <View style={styles.bossCard}>
                <Text style={styles.bossName}>{boss.name}</Text>

                <View style={styles.hpContainer}>
                    <Text style={styles.hpText}>HP: {boss.current_hp} / {boss.total_hp}</Text>
                    <View style={styles.hpBarBackground}>
                        <View style={[styles.hpBarFill, { width: `${hpPercentage}%`, backgroundColor: bossColor }]} />
                    </View>
                </View>

                {boss.is_defeated ? (
                    <Text style={styles.defeatedText}>VICTORY!</Text>
                ) : (
                    <Text style={styles.activeText}>BATTLE IN PROGRESS</Text>
                )}

                <View style={styles.statsRow}>
                    <Text>Damage Dealt to You: {boss.damage_dealt_to_user}</Text>
                </View>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>How to Fight</Text>
                <Text style={styles.infoText}>
                    • Focus time (no phone usage) deals damage to the boss.
                </Text>
                <Text style={styles.infoText}>
                    • Screen time (using blocked apps) deals damage to YOU.
                </Text>
            </View>

            <Button title="Refresh Status" onPress={fetchBoss} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f0f0f0' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    bossCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3, marginBottom: 20, alignItems: 'center' },
    bossName: { fontSize: 24, fontWeight: '800', marginBottom: 15, color: '#D32F2F' },
    hpContainer: { width: '100%', marginBottom: 15 },
    hpText: { textAlign: 'right', marginBottom: 5, fontWeight: 'bold' },
    hpBarBackground: { height: 20, backgroundColor: '#e0e0e0', borderRadius: 10, overflow: 'hidden' },
    hpBarFill: { height: '100%' },
    defeatedText: { fontSize: 20, fontWeight: 'bold', color: 'green', marginTop: 10 },
    activeText: { fontSize: 16, fontWeight: 'bold', color: 'orange', marginTop: 10 },
    statsRow: { marginTop: 15, padding: 10, backgroundColor: '#ffebee', borderRadius: 8, width: '100%' },
    infoBox: { backgroundColor: '#e3f2fd', padding: 15, borderRadius: 8, marginBottom: 20 },
    infoTitle: { fontWeight: 'bold', marginBottom: 5, color: '#1565c0' },
    infoText: { marginBottom: 3, color: '#0d47a1' }
});

export default BossBattleScreen;
