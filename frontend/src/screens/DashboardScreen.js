import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, COMMON_STYLES } from '../styles/theme';
import UsageStatsService from '../services/UsageStatsService';
import FloatingText from '../components/FloatingText';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withRepeat
} from 'react-native-reanimated';

const DashboardScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const [currentUserId, setCurrentUserId] = useState(route.params?.userId || 'default-user-id');
    const [profile, setProfile] = useState(null);
    const [hasPermission, setHasPermission] = useState(false);
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
                try {
                    const randomSuffix = Math.floor(Math.random() * 10000);
                    const newUser = {
                        username: `Hero_${randomSuffix}`,
                        email: `hero${randomSuffix}@idle.com`
                    };
                    const onboardRes = await api.post('/user/onboard', newUser);
                    setCurrentUserId(onboardRes.data.id);
                    setProfile(onboardRes.data);
                } catch (onboardErr) {
                    console.error("Onboard failed:", onboardErr);
                    alert("Failed to create new user. Please check backend.");
                }
            }
        }
    };

    const checkPermission = async () => {
        const status = await UsageStatsService.hasPermission();
        setHasPermission(status);
    };

    useEffect(() => {
        fetchProfile();
        checkPermission();
    }, []);

    const handleSync = async () => {
        try {
            // Get Usage Logs
            const logs = await UsageStatsService.getTodayUsage();
            console.log("Syncing Logs:", logs);

            // Optimistic feedback
            addFloatingText("Syncing...", 100, 400);

            const res = await api.post(`/sync/usage/${currentUserId}`, logs);

            // Logic for feedback
            if (res.data.xp_gained > 0) {
                addFloatingText(`+${res.data.xp_gained} XP`, 180, 150);
                triggerShake();
            }

            alert(res.data.insight);
            fetchProfile();
        } catch (err) {
            console.error("Sync error:", err);
            // alert("Failed to sync usage data.");
            // Mock success for UI testing if backend fails
            triggerShake();
        }
    };

    const StatCard = ({ label, value, icon }) => (
        <View style={localStyles.statCard}>
            <Text style={localStyles.statIcon}>{icon}</Text>
            <View>
                <Text style={localStyles.statLabel}>{label}</Text>
                <Text style={localStyles.statValue}>{value}</Text>
            </View>
        </View>
    );

    if (!profile) return (
        <View style={[COMMON_STYLES.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={COMMON_STYLES.text}>Loading Hero Profile...</Text>
        </View>
    );

    const { stats } = profile;

    return (
        <View style={[COMMON_STYLES.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={localStyles.headerContainer}>
                <Text style={COMMON_STYLES.header}>Idle Hero</Text>
                <Text style={COMMON_STYLES.textSecondary}>Level {stats?.level} • {stats?.xp} XP</Text>
            </View>

            <ScrollView contentContainerStyle={localStyles.scrollContent}>
                {/* Stats */}
                <Text style={COMMON_STYLES.subHeader}>Stats</Text>
                <Animated.View style={[localStyles.statsGrid, animatedCardStyle]}>
                    <StatCard label="Discipline" value={stats?.discipline} icon="🛡️" />
                    <StatCard label="Focus" value={stats?.focus} icon="🎯" />
                </Animated.View>

                {/* Resources */}
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

                {/* Recent Activity / Status */}
                <View style={COMMON_STYLES.card}>
                    <Text style={[COMMON_STYLES.subHeader, { fontSize: 18 }]}>Status</Text>
                    <Text style={COMMON_STYLES.textSecondary}>{stats?.hero_class ? stats.hero_class.name : "No Class"}</Text>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={localStyles.actionContainer}>

                {/* Row 1: Sync & Rules */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <TouchableOpacity style={[COMMON_STYLES.buttonPrimary, { flex: 1, marginRight: 5 }]} onPress={handleSync}>
                        <Text style={COMMON_STYLES.buttonText}>{hasPermission ? '⚡ Sync' : 'Grant Perm'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[COMMON_STYLES.buttonPrimary, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primary, flex: 1, marginLeft: 5 }]}
                        onPress={() => navigation.navigate('Rules', { userId: currentUserId })}
                    >
                        <Text style={[COMMON_STYLES.buttonText, { color: COLORS.primary }]}>Rules</Text>
                    </TouchableOpacity>
                </View>

                {/* Row 2: City & Boss */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <TouchableOpacity
                        style={[COMMON_STYLES.buttonPrimary, { backgroundColor: '#2196F3', flex: 1, marginRight: 5 }]}
                        onPress={() => navigation.navigate('CityMap', { userId: currentUserId })}
                    >
                        <Text style={[COMMON_STYLES.buttonText, { color: '#FFFFFF' }]}>🏙️ City</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[COMMON_STYLES.buttonPrimary, { backgroundColor: '#E53935', flex: 1, marginLeft: 5 }]}
                        onPress={() => navigation.navigate('BossBattle', { userId: currentUserId })}
                    >
                        <Text style={[COMMON_STYLES.buttonText, { color: '#FFFFFF' }]}>👹 Boss</Text>
                    </TouchableOpacity>
                </View>

                {/* Row 3: Quests & Profile */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                        style={[COMMON_STYLES.buttonPrimary, { backgroundColor: '#FF9800', flex: 1, marginRight: 5 }]}
                        onPress={() => navigation.navigate('Quests', { userId: currentUserId })}
                    >
                        <Text style={[COMMON_STYLES.buttonText, { color: '#FFFFFF' }]}>📜 Quests</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[COMMON_STYLES.buttonPrimary, { backgroundColor: '#9C27B0', flex: 1, marginLeft: 5 }]}
                        onPress={() => navigation.navigate('Profile', { userId: currentUserId })}
                    >
                        <Text style={[COMMON_STYLES.buttonText, { color: '#FFFFFF' }]}>👤 Hero</Text>
                    </TouchableOpacity>
                </View>
            </View>

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
        </View>
    );
};

const localStyles = StyleSheet.create({
    headerContainer: {
        marginBottom: 10,
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 220, // Space for action container
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
