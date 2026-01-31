import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, commonStyles } from '../theme';
import HeroAvatar from '../components/HeroAvatar';
import FloatingText from '../components/FloatingText';
import UsageStatsService from '../services/UsageStatsService';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withRepeat,
    runOnJS
} from 'react-native-reanimated';

const DashboardScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    // Use state for userId to handle auto-onboarding updates if needed
    const [currentUserId, setCurrentUserId] = useState(route.params?.userId || 'default-user-id');
    const [profile, setProfile] = useState(null);
    const [floatingTexts, setFloatingTexts] = useState([]);

    // Animation Shared Values
    const shake = useSharedValue(0);

    const animatedCardStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: shake.value }],
        };
    });

    const triggerShake = () => {
        shake.value = withSequence(
            withTiming(10, { duration: 50 }),
            withRepeat(withTiming(-10, { duration: 50 }), 3, true),
            withTiming(0, { duration: 50 })
        );
    };

    const addFloatingText = (text, x = 150, y = 200) => {
        const id = Date.now();
        setFloatingTexts(prev => [...prev, { id, text, x, y }]);
    };

    const removeFloatingText = (id) => {
        setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    };

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
            // Get Usage Logs (Mock or Real)
            const logs = await UsageStatsService.getTodayUsage();
            console.log("Syncing Logs:", logs);

            // Optimistic feedback before API call
            addFloatingText("Syncing...", 100, 400);

            const res = await api.post(`/sync/usage/${currentUserId}`, logs);

            // Calculate XP gain/Logic
            if (res.data.xp_gained > 0) {
                addFloatingText(`+${res.data.xp_gained} XP`, 180, 150);
                triggerShake(); // Shake card on XP gain/battle
            }

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

            {/* Hero Avatar & Main Stats (with Shake Animation) */}
            <Animated.View style={[commonStyles.card, animatedCardStyle]}>
                <View style={styles.heroRow}>
                    <HeroAvatar heroClass={stats?.hero_class} level={stats?.level} size={84} />
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
            </Animated.View>

            {/* Grid Stats */}
            <View style={styles.gridContainer}>
                <StatCard label="Discipline" value={stats?.discipline} color={theme.colors.primary} />
                <StatCard label="Focus" value={stats?.focus} color={theme.colors.success} />
            </View>

            {/* Actions & Hub World */}
            <Text style={styles.sectionTitle}>World Map</Text>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} onPress={handleSync}>
                <Text style={styles.buttonText}>⚡ Sync Usage (Energy)</Text>
            </TouchableOpacity>

            <View style={styles.hubContainer}>
                {/* Sky / Background Effect */}
                <View style={styles.hubSky}>
                    <Text style={{ color: '#555', position: 'absolute', top: 10, left: 20 }}>☁️</Text>
                    <Text style={{ color: '#666', position: 'absolute', top: 30, right: 40 }}>☁️</Text>
                </View>

                {/* Castle Zone (Kingdom) */}
                <TouchableOpacity
                    style={[styles.hubZone, { backgroundColor: theme.colors.hubCastle, flex: 2 }]}
                    onPress={() => navigation.navigate('Kingdom', { userId: currentUserId })}
                >
                    <Text style={styles.hubIcon}>🏰</Text>
                    <Text style={styles.hubLabel}>Kingdom</Text>
                </TouchableOpacity>

                {/* Middle Row: Boss & Town */}
                <View style={{ flexDirection: 'row', height: 120, marginTop: 10 }}>
                    <TouchableOpacity
                        style={[styles.hubZone, { backgroundColor: theme.colors.hubBoss, flex: 1, marginRight: 5 }]}
                        onPress={() => navigation.navigate('BossBattle', { userId: currentUserId })}
                    >
                        <Text style={styles.hubIcon}>👹</Text>
                        <Text style={styles.hubLabel}>Boss Lair</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.hubZone, { backgroundColor: theme.colors.hubTown, flex: 1, marginLeft: 5 }]}
                        onPress={() => navigation.navigate('Rules', { userId: currentUserId })}
                    >
                        <Text style={styles.hubIcon}>📜</Text>
                        <Text style={styles.hubLabel}>Town Hall</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Row: Profile (Barracks) */}
                <TouchableOpacity
                    style={[styles.hubZone, { backgroundColor: theme.colors.hubMarket, marginTop: 10, height: 60, flexDirection: 'row', justifyContent: 'center' }]}
                    onPress={() => navigation.navigate('Profile', { userId: currentUserId })}
                >
                    <Text style={{ fontSize: 24, marginRight: 10 }}>⛺</Text>
                    <Text style={[styles.hubLabel, { marginTop: 0 }]}>My Tent (Profile)</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />

            {/* Floating Floating Texts */}
            {floatingTexts.map(ft => (
                <FloatingText
                    key={ft.id}
                    x={ft.x}
                    y={ft.y}
                    text={ft.text}
                    onComplete={() => removeFloatingText(ft.id)}
                />
            ))}
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
    actionButton: { padding: 15, borderRadius: theme.borderRadius.m, alignItems: 'center', marginBottom: 15, elevation: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },

    // Hub World Styles
    hubContainer: { backgroundColor: theme.colors.sky, padding: 15, borderRadius: 20, borderWidth: 2, borderColor: '#333' },
    hubSky: { height: 40, width: '100%', alignItems: 'center', justifyContent: 'center' },
    hubZone: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 10, elevation: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    hubIcon: { fontSize: 32, marginBottom: 5, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
    hubLabel: { color: 'white', fontWeight: 'bold', fontSize: 14, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 2 }
});

export default DashboardScreen;
