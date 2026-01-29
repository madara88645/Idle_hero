import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, commonStyles } from '../theme';

const DashboardScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    // Use state for userId to handle auto-onboarding updates if needed
    const [currentUserId, setCurrentUserId] = useState(route.params?.userId || 'default-user-id');
    const [profile, setProfile] = useState(null);

    const fetchProfile = async () => {
        try {
            console.log("Fetching profile for:", currentUserId);
            const res = await api.get(`/user/profile/${currentUserId}`);
            setProfile(res.data);
        } catch (err) {
            console.error("Fetch profile error:", err);
            if (err.response && (err.response.status === 404 || err.response.status === 422)) {
                console.log("User not found, onboarding...");
                try {
                    const randomSuffix = Math.floor(Math.random() * 10000);
                    const newUser = {
                        username: `Hero_${randomSuffix}`,
                        email: `hero${randomSuffix}@idle.com`
                    };
                    const onboardRes = await api.post('/user/onboard', newUser);
                    console.log("Onboarded new user:", onboardRes.data);

                    // Update state with new user ID and profile
                    setCurrentUserId(onboardRes.data.id);
                    setProfile({ ...onboardRes.data, stats: { level: 1, xp: 0, discipline: 0, focus: 0 } });

                    // Trigger a re-fetch to ensure everything is synced (optional)
                    // fetchProfile(); 
                } catch (onboardErr) {
                    console.error("Onboard failed:", onboardErr);
                    alert("Failed to create new user. Please check backend.");
                }
            }
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Redirect to class selection if needed
    useEffect(() => {
        if (profile && profile.stats && !profile.stats.class_id) {
            console.log("No class selected, redirecting...");
            navigation.navigate('ClassSelection', { userId: currentUserId });
        }
    }, [profile, navigation, currentUserId]);

    const handleSync = async () => {
        try {
            const logs = [
                { app_package_name: 'com.instagram.android', start_time: new Date().toISOString(), end_time: new Date().toISOString(), duration_seconds: 600 }
            ];
            const res = await api.post(`/sync/usage/${currentUserId}`, logs);
            alert(res.data.insight);
            fetchProfile();
        } catch (err) {
            console.error(err);
        }
    };

    if (!profile) return (
        <View style={[commonStyles.container, styles.center]}>
            <Text style={{ color: theme.colors.text }}>Loading Hero...</Text>
        </View>
    );

    const { stats } = profile;

    // Helper to render a stat card
    const StatCard = ({ label, value, color }) => (
        <View style={[styles.statCard, { borderColor: color }]}>
            <Text style={[styles.statValue, { color: color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    return (
        <ScrollView style={[commonStyles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}> Idle Hero </Text>
                <Text style={styles.subHeader}>Welcome, {profile.username}</Text>
            </View>

            {/* Hero Avatar & Main Stats */}
            <View style={commonStyles.card}>
                <View style={styles.heroRow}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={{ fontSize: 40 }}>🛡️</Text>
                    </View>
                    <View style={styles.mainStats}>
                        <Text style={styles.levelText}>Level {stats?.level}</Text>

                        {/* XP Bar */}
                        <Text style={styles.barLabel}>XP: {stats?.xp} / {stats?.level * 100}</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${(stats?.xp / (stats?.level * 100)) * 100}%`, backgroundColor: theme.colors.gold }]} />
                        </View>

                        {/* Health Bar (Stubbed max health 100 for now if not in model) */}
                        <Text style={styles.barLabel}>HP: {stats?.health || 100} / {stats?.max_health || 100}</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${((stats?.health || 100) / (stats?.max_health || 100)) * 100}%`, backgroundColor: theme.colors.danger }]} />
                        </View>
                    </View>
                </View>
            </View>

            {/* Grid Stats */}
            <View style={styles.gridContainer}>
                <StatCard label="Discipline" value={stats?.discipline} color={theme.colors.primary} />
                <StatCard label="Focus" value={stats?.focus} color={theme.colors.success} />
            </View>

            {/* Actions */}
            <Text style={styles.sectionTitle}>Actions</Text>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} onPress={handleSync}>
                <Text style={styles.buttonText}>🔄 Sync Usage</Text>
            </TouchableOpacity>

            <View style={styles.gridContainer}>
                <TouchableOpacity style={[styles.navButton, { backgroundColor: theme.colors.secondary }]} onPress={() => navigation.navigate('Kingdom', { userId: currentUserId })}>
                    <Text style={styles.navButtonIcon}>🏰</Text>
                    <Text style={styles.buttonText}>Kingdom</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.navButton, { backgroundColor: '#8B0000' }]} onPress={() => navigation.navigate('BossBattle', { userId: currentUserId })}>
                    <Text style={styles.navButtonIcon}>👹</Text>
                    <Text style={styles.buttonText}>Boss</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.gridContainer}>
                <TouchableOpacity style={[styles.navButton, { backgroundColor: theme.colors.surface }]} onPress={() => navigation.navigate('Rules', { userId: currentUserId })}>
                    <Text style={styles.navButtonIcon}>📜</Text>
                    <Text style={styles.buttonText}>Rules</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navButton, { backgroundColor: theme.colors.surface }]} onPress={() => navigation.navigate('Profile', { userId: currentUserId })}>
                    <Text style={styles.navButtonIcon}>👤</Text>
                    <Text style={styles.buttonText}>Profile</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center' },
    headerContainer: { alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: theme.colors.gold, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 },
    subHeader: { color: theme.colors.subtext, fontSize: 16 },
    heroRow: { flexDirection: 'row', alignItems: 'center' },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    mainStats: { flex: 1 },
    levelText: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
    barLabel: { color: theme.colors.subtext, fontSize: 12, marginTop: 4 },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginTop: 2, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    statCard: { flex: 0.48, backgroundColor: theme.colors.surface, padding: 15, borderRadius: theme.borderRadius.m, alignItems: 'center', borderWidth: 1 },
    statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    statLabel: { color: theme.colors.subtext, fontSize: 12, textTransform: 'uppercase' },
    sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
    actionButton: { padding: 15, borderRadius: theme.borderRadius.m, alignItems: 'center', marginBottom: 15, elevation: 3 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    navButton: { flex: 0.48, padding: 20, borderRadius: theme.borderRadius.m, alignItems: 'center', elevation: 3, justifyContent: 'center', minHeight: 120 },
    navButtonIcon: { fontSize: 32, marginBottom: 10 }
});

export default DashboardScreen;
