import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, commonStyles } from '../theme';

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

    if (!userId) return <Text style={[commonStyles.text, styles.center]}>No User ID</Text>;
    if (loading && !kingdom) return <ActivityIndicator size="large" color={theme.colors.primary} style={styles.center} />;

    // Helper for visual resource display
    const ResourceCard = ({ icon, label, value, color }) => (
        <View style={styles.resourceCard}>
            <Text style={{ fontSize: 24, marginBottom: 5 }}>{icon}</Text>
            <Text style={[styles.resourceValue, { color: color }]}>{value}</Text>
            <Text style={styles.resourceLabel}>{label}</Text>
        </View>
    );

    // Helper for build button
    const BuildOption = ({ type, wood, stone, emoji }) => (
        <TouchableOpacity style={styles.buildCard} onPress={() => handleBuild(type)}>
            <View style={styles.buildInfo}>
                <Text style={styles.buildEmoji}>{emoji}</Text>
                <View>
                    <Text style={styles.buildTitle}>{type}</Text>
                    <Text style={styles.buildCost}>🪵 {wood}   🪨 {stone}</Text>
                </View>
            </View>
            <Text style={styles.buildAction}>🔨 Build</Text>
        </TouchableOpacity>
    );

    if (!kingdom) return (
        <View style={[commonStyles.container, styles.center]}>
            <TouchableOpacity onPress={fetchKingdom} style={{ padding: 20, backgroundColor: theme.colors.primary, borderRadius: 10 }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Retry Loading Kingdom</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={[commonStyles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
            <Text style={commonStyles.header}>{kingdom.name || "My Kingdom"}</Text>

            {/* Resources Section */}
            <View style={styles.resourceRow}>
                <ResourceCard icon="🪵" label="Wood" value={kingdom.wood} color="#A1887F" />
                <ResourceCard icon="🪨" label="Stone" value={kingdom.stone} color="#90A4AE" />
                <ResourceCard icon="🪙" label="Gold" value={kingdom.gold} color="#FFD54F" />
            </View>

            {/* Current Buildings */}
            <Text style={styles.sectionTitle}>Your Buildings</Text>
            {kingdom.buildings && kingdom.buildings.length > 0 ? (
                kingdom.buildings.map((b) => (
                    <View key={b.id} style={styles.buildingItem}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 24, marginRight: 10 }}>🏠</Text>
                            <View>
                                <Text style={styles.buildingName}>{b.type} (Lvl {b.level})</Text>
                                <View style={styles.healthBarBg}>
                                    <View style={[styles.healthBarFill, { width: `${b.health}%`, backgroundColor: b.health > 50 ? theme.colors.success : theme.colors.danger }]} />
                                </View>
                            </View>
                        </View>
                        <Text style={{ color: theme.colors.subtext }}>{b.health}% HP</Text>
                    </View>
                ))
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Your kingdom is empty.</Text>
                    <Text style={styles.emptySubText}>Construct buildings to grow stronger!</Text>
                </View>
            )}

            {/* Construction Zone */}
            <Text style={styles.sectionTitle}>Construction Zone</Text>
            <View style={styles.buildList}>
                <BuildOption type="Library" wood={50} stone={30} emoji="📚" />
                <BuildOption type="Barracks" wood={80} stone={50} emoji="⚔️" />
                <BuildOption type="Mine" wood={100} stone={80} emoji="⛏️" />
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
    resourceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    resourceCard: { width: '30%', backgroundColor: theme.colors.surface, padding: 10, borderRadius: theme.borderRadius.m, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.cardBorder, elevation: 3 },
    resourceValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
    resourceLabel: { fontSize: 12, color: theme.colors.subtext, textTransform: 'uppercase' },
    sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 15, marginTop: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder, paddingBottom: 5 },
    buildingItem: { backgroundColor: theme.colors.surface, padding: 15, borderRadius: theme.borderRadius.m, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.cardBorder },
    buildingName: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
    healthBarBg: { width: 100, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 5 },
    healthBarFill: { height: '100%', borderRadius: 3 },
    emptyState: { padding: 30, alignItems: 'center', justifyContent: 'center', opacity: 0.7 },
    emptyText: { color: theme.colors.text, fontSize: 18, fontStyle: 'italic' },
    emptySubText: { color: theme.colors.subtext, marginTop: 5 },
    buildList: { marginBottom: 20 },
    buildCard: { backgroundColor: theme.colors.surface, padding: 15, borderRadius: theme.borderRadius.m, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.cardBorder },
    buildInfo: { flexDirection: 'row', alignItems: 'center' },
    buildEmoji: { fontSize: 32, marginRight: 15 },
    buildTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
    buildCost: { color: theme.colors.subtext, fontSize: 12, marginTop: 4 },
    buildAction: { color: theme.colors.primary, fontWeight: 'bold', textTransform: 'uppercase' }
});

export default KingdomScreen;
