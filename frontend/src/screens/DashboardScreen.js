import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, COMMON_STYLES } from '../styles/theme';
import MyUsageStats from '../../modules/my-usage-stats';

const DashboardScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const [currentUserId, setCurrentUserId] = useState(route.params?.userId || 'default-user-id');
    const [profile, setProfile] = useState(null);
    const [hasPermission, setHasPermission] = useState(false);

    const fetchProfile = async () => {
        try {
            console.log("Fetching profile for:", currentUserId);
            const res = await api.get(`/user/profile/${currentUserId}`);
            setProfile(res.data);
        } catch (err) {
            console.error("Fetch profile error:", err);
            // Onboarding logic preserved...
            if (err.response && (err.response.status === 404 || err.response.status === 422)) {
                try {
                    const newUser = {
                        username: `User_${Math.floor(Math.random() * 1000)}`,
                        email: `user${Math.floor(Math.random() * 1000)}@example.com`
                    };
                    const onboardRes = await api.post('/user/onboard', newUser);
                    setCurrentUserId(onboardRes.data.id);
                    setProfile(onboardRes.data);
                } catch (onboardErr) {
                    console.error("Onboard error:", onboardErr);
                }
            }
        }
    };

    const checkPermission = async () => {
        const status = MyUsageStats.hasPermission();
        setHasPermission(status);
    };

    useEffect(() => {
        fetchProfile();
        checkPermission();
    }, []);

    const handleSync = async () => {
        try {
            if (!hasPermission) {
                MyUsageStats.requestPermission();
                // Check again after a delay or let user press button again
                return;
            }

            // Get stats for last 24 hours (1 day)
            const rawStats = await MyUsageStats.getUsageStats(1);

            // Transform to API format
            const logs = Object.keys(rawStats).map(pkg => ({
                app_package_name: pkg,
                duration_seconds: Math.floor(rawStats[pkg] / 1000), // Convert ms to seconds
                start_time: new Date(Date.now() - 86400000).toISOString(), // Approx start (24h ago)
                end_time: new Date().toISOString()
            })).filter(log => log.duration_seconds > 0);

            if (logs.length === 0) {
                alert("No usage data found for the last 24 hours.");
                return;
            }

            console.log(`Syncing ${logs.length} usage logs...`);
            const res = await api.post(`/sync/usage/${currentUserId}`, logs);
            alert(res.data.insight);
            fetchProfile();
        } catch (err) {
            console.error("Sync error:", err);
            alert("Failed to sync usage data.");
        }
    };

    if (!profile) return (
        <View style={[COMMON_STYLES.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={COMMON_STYLES.text}>Loading Hero Profile...</Text>
        </View>
    );

    const { stats } = profile;

    const StatCard = ({ label, value, icon }) => (
        <View style={localStyles.statCard}>
            <Text style={localStyles.statIcon}>{icon}</Text>
            <View>
                <Text style={localStyles.statLabel}>{label}</Text>
                <Text style={localStyles.statValue}>{value}</Text>
            </View>
        </View>
    );

    return (
        <View style={[COMMON_STYLES.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <View style={localStyles.headerContainer}>
                <Text style={COMMON_STYLES.header}>Idle Hero</Text>
                <Text style={COMMON_STYLES.textSecondary}>Level {stats?.level} • {stats?.xp} XP</Text>
            </View>

            <ScrollView contentContainerStyle={localStyles.scrollContent}>
                <Text style={COMMON_STYLES.subHeader}>Stats</Text>
                <View style={localStyles.statsGrid}>
                    <StatCard label="Discipline" value={stats?.discipline} icon="🛡️" />
                    <StatCard label="Focus" value={stats?.focus} icon="🎯" />
                </View>

                <Text style={COMMON_STYLES.subHeader}>Resources</Text>
                <View style={localStyles.resourceRow}>
                    <View style={[localStyles.resourceItem, { borderColor: COLORS.bronze }]}>
                        <Text style={[localStyles.resourceValue, { color: COLORS.bronze }]}>{stats?.bronze}</Text>
                        <Text style={localStyles.resourceLabel}>Bronze</Text>
                    </View>
                    <View style={[localStyles.resourceItem, { borderColor: COLORS.gold }]}>
                        <Text style={[localStyles.resourceValue, { color: COLORS.gold }]}>{stats?.gold}</Text>
                        <Text style={localStyles.resourceLabel}>Gold</Text>
                    </View>
                    <View style={[localStyles.resourceItem, { borderColor: COLORS.diamond }]}>
                        <Text style={[localStyles.resourceValue, { color: COLORS.diamond }]}>{stats?.diamond}</Text>
                        <Text style={localStyles.resourceLabel}>Diamond</Text>
                    </View>
                </View>

                {/* Placeholder for more complex stats or visualizer */}
                <View style={COMMON_STYLES.card}>
                    <Text style={[COMMON_STYLES.subHeader, { fontSize: 18 }]}>Recent Activity</Text>
                    <Text style={COMMON_STYLES.textSecondary}>Sync usage to gain XP and level up your hero.</Text>
                </View>
            </ScrollView>

            <View style={localStyles.actionContainer}>
                <TouchableOpacity style={COMMON_STYLES.buttonPrimary} onPress={handleSync}>
                    <Text style={COMMON_STYLES.buttonText}>{hasPermission ? 'Sync Usage' : 'Grant Usage Permission'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[COMMON_STYLES.buttonPrimary, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primary }]}
                    onPress={() => navigation.navigate('Rules', { userId: currentUserId })}
                >
                    <Text style={[COMMON_STYLES.buttonText, { color: COLORS.primary }]}>Manage Rules</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[COMMON_STYLES.buttonPrimary, { marginTop: 10, backgroundColor: '#2196F3' }]}
                    onPress={() => navigation.navigate('CityMap', { userId: currentUserId })}
                >
                    <Text style={[COMMON_STYLES.buttonText, { color: '#FFFFFF' }]}>View City Map</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const localStyles = StyleSheet.create({
    headerContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    statCard: {
        ...COMMON_STYLES.card,
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    statIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    statLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textTransform: 'uppercase',
    },
    statValue: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    resourceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    resourceItem: {
        ...COMMON_STYLES.card,
        width: '30%',
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: COLORS.surface,
        padding: 5,
    },
    resourceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    resourceLabel: {
        color: COLORS.textSecondary,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    actionContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
});

export default DashboardScreen;
