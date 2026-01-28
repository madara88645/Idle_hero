import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert, ActivityIndicator } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KingdomScreen = ({ route }) => {
    const insets = useSafeAreaInsets();
    const userId = route.params?.userId;
    const [kingdom, setKingdom] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchKingdom = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/kingdom/${userId}`);
            setKingdom(res.data);
        } catch (err) {
            console.error("Fetch kingdom error:", err);
            Alert.alert("Error", "Failed to load kingdom.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchKingdom();
    }, [userId]);

    const handleBuild = async (buildingType) => {
        if (!kingdom) return;
        setLoading(true);
        try {
            const res = await api.post(`/kingdom/build/${userId}`, { building_type: buildingType });
            setKingdom(res.data);
            Alert.alert("Success", `Built ${buildingType}!`);
        } catch (err) {
            console.error("Build error:", err);
            const msg = err.response?.data?.detail || "Failed to build.";
            Alert.alert("Build Failed", msg);
        } finally {
            setLoading(false);
        }
    };

    if (!userId) return <Text style={styles.center}>No User ID</Text>;
    if (loading && !kingdom) return <ActivityIndicator style={styles.center} />;
    if (!kingdom) return <Button title="Retry" onPress={fetchKingdom} />;

    return (
        <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.title}>{kingdom.name}</Text>

            <View style={styles.resourceRow}>
                <View style={styles.resourceItem}>
                    <Text style={styles.resourceLabel}>🪵 Wood</Text>
                    <Text style={styles.resourceValue}>{kingdom.wood}</Text>
                </View>
                <View style={styles.resourceItem}>
                    <Text style={styles.resourceLabel}>🪨 Stone</Text>
                    <Text style={styles.resourceValue}>{kingdom.stone}</Text>
                </View>
                <View style={styles.resourceItem}>
                    <Text style={styles.resourceLabel}>🪙 Gold</Text>
                    <Text style={styles.resourceValue}>{kingdom.gold}</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Buildings</Text>
            {kingdom.buildings && kingdom.buildings.length > 0 ? (
                kingdom.buildings.map((b) => (
                    <View key={b.id} style={styles.buildingCard}>
                        <Text style={styles.buildingName}>{b.type} (Lvl {b.level})</Text>
                        <Text>Health: {b.health}%</Text>
                    </View>
                ))
            ) : (
                <Text style={styles.emptyText}>No buildings yet.</Text>
            )}

            <Text style={styles.sectionTitle}>Construct</Text>
            <View style={styles.buildButtons}>
                <Button title="Build Library (50 Wood, 30 Stone)" onPress={() => handleBuild('Library')} />
                <View style={{ height: 10 }} />
                <Button title="Build Barracks (80 Wood, 50 Stone)" onPress={() => handleBuild('Barracks')} />
                <View style={{ height: 10 }} />
                <Button title="Build Mine (100 Wood, 80 Stone)" onPress={() => handleBuild('Mine')} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    resourceRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30, backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 2 },
    resourceItem: { alignItems: 'center' },
    resourceLabel: { fontSize: 16 },
    resourceValue: { fontSize: 20, fontWeight: 'bold' },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    buildingCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
    buildingName: { fontSize: 18, fontWeight: '600' },
    emptyText: { fontStyle: 'italic', color: '#666', marginBottom: 15 },
    buildButtons: { marginBottom: 40 }
});

export default KingdomScreen;
