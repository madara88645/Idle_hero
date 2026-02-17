import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, COMMON_STYLES } from '../styles/theme';
import UsageStatsService from '../services/UsageStatsService';
import FloatingText from '../components/FloatingText';
import AnimatedBar from '../components/AnimatedBar';
import ParticleExplosion from '../components/ParticleExplosion';
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

    const explosionRef = useRef(null);

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
            const res = await api.get(`/user/profile/${currentUserId}`);
            setProfile(res.data);
        } catch (err) {
            console.error("Fetch profile error:", err);
            // Auto-onboard logic provided in previous steps...
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
        // Visual Feedback immediately
        triggerShake();
        if (explosionRef.current) {
            explosionRef.current.explode(Dimensions.get('window').width / 2, Dimensions.get('window').height - 100);
        }
        addFloatingText("Syncing...", 100, 400);

        try {
            const logs = await UsageStatsService.getTodayUsage();
            const res = await api.post(`/sync/usage/${currentUserId}`, logs);

            if (res.data.xp_gained > 0) {
                setTimeout(() => {
                    addFloatingText(`+${res.data.xp_gained} XP`, 180, 150);
                    // More particles on success
                    if (explosionRef.current) {
                        explosionRef.current.explode(Dimensions.get('window').width / 2, 200);
                    }
                }, 500);
            }

            alert(res.data.insight);
            fetchProfile();
        } catch (err) {
            console.error("Sync error:", err);
            // Mock success for UI testing
            triggerShake();
        }
    };

    const StatCard = ({ label, value, icon, color }) => (
        <View style={localStyles.statCard}>
            <View style={[localStyles.iconContainer, { backgroundColor: color + '20' }]}>
                <Text style={localStyles.statIcon}>{icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={localStyles.statLabel}>{label}</Text>
                <Text style={localStyles.statValue}>{value}</Text>
            </View>
        </View>
    );

    if (!profile) return (
        <LinearGradient
            colors={[COLORS.background, '#2D1B4E']}
            style={[COMMON_STYLES.container, { justifyContent: 'center', alignItems: 'center' }]}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <Text style={COMMON_STYLES.header}>Loading Hero...</Text>
        </LinearGradient>
    );

    const { stats } = profile;
    const nextLevelXp = stats.level * 100;

    return (
        <LinearGradient
            colors={[COLORS.background, '#1A1025']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[COMMON_STYLES.container]}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <ScrollView contentContainerStyle={[localStyles.scrollContent, { paddingTop: insets.top + 20 }]}>
                {/* Header Section */}
                <View style={localStyles.headerContainer}>
                    <Text style={COMMON_STYLES.header}>IDLE HERO</Text>
                    <View style={localStyles.levelBadge}>
                        <Text style={localStyles.levelText}>LVL {stats?.level}</Text>
                    </View>
                </View>

                {/* Main Hero Card */}
                <Animated.View style={[COMMON_STYLES.card, animatedCardStyle, localStyles.heroCard]}>
                    <View style={localStyles.heroHeader}>
                        <Text style={localStyles.className}>{stats?.hero_class ? stats.hero_class.name : "Novice"}</Text>
                        <Text style={localStyles.hpText}>{stats?.health}/{stats?.max_health} HP</Text>
                    </View>

                    {/* XP Bar */}
                    <AnimatedBar
                        label="Experience"
                        value={stats?.xp}
                        max={nextLevelXp}
                        color={COLORS.primary}
                        height={12}
                    />

                    {/* Health Bar */}
                    <AnimatedBar
                        label="Health"
                        value={stats?.health}
                        max={stats?.max_health}
                        color={COLORS.error}
                        height={6}
                        showValue={false}
                    />
                </Animated.View>

                {/* Attributes Grid */}
                <Text style={COMMON_STYLES.subHeader}>Attributes</Text>
                <View style={localStyles.statsGrid}>
                    <StatCard label="Discipline" value={stats?.discipline} icon="🛡️" color={COLORS.secondary} />
                    <StatCard label="Focus" value={stats?.focus} icon="🎯" color={COLORS.success} />
                </View>

                {/* Resources */}
                <Text style={COMMON_STYLES.subHeader}>Kingdom Stash</Text>
                <View style={localStyles.resourceRow}>
                    <View style={[localStyles.resourceItem, { borderColor: COLORS.bronze }]}>
                        <Text style={[localStyles.resourceValue, { color: COLORS.bronze }]}>{stats?.bronze || 0}</Text>
                        <Text style={localStyles.resourceLabel}>Bronze</Text>
                    </View>
                    <View style={[localStyles.resourceItem, { borderColor: COLORS.gold }]}>
                        <Text style={[localStyles.resourceValue, { color: COLORS.gold }]}>{stats?.gold || 0}</Text>
                        <Text style={localStyles.resourceLabel}>Gold</Text>
                    </View>
                    <View style={[localStyles.resourceItem, { borderColor: COLORS.diamond }]}>
                        <Text style={[localStyles.resourceValue, { color: COLORS.diamond }]}>{stats?.diamond || 0}</Text>
                        <Text style={localStyles.resourceLabel}>Diamond</Text>
                    </View>
                </View>

            </ScrollView>

            {/* Action Bar (Glassmorphism) */}
            <View style={localStyles.actionBar}>
                <TouchableOpacity style={localStyles.mainActionButton} onPress={handleSync}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        style={localStyles.gradientButton}
                    >
                        <Text style={localStyles.mainButtonText}>{hasPermission ? '⚡ SYNC' : 'GRANT PERM'}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={localStyles.subActions}>
                    <TouchableOpacity style={localStyles.iconButton} onPress={() => navigation.navigate('BossBattle', { userId: currentUserId })}>
                        <Text style={{ fontSize: 24 }}>👹</Text>
                        <Text style={localStyles.iconButtonText}>BOSS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={localStyles.iconButton} onPress={() => navigation.navigate('CityMap', { userId: currentUserId })}>
                        <Text style={{ fontSize: 24 }}>🏙️</Text>
                        <Text style={localStyles.iconButtonText}>CITY</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={localStyles.iconButton} onPress={() => navigation.navigate('Profile', { userId: currentUserId })}>
                        <Text style={{ fontSize: 24 }}>👤</Text>
                        <Text style={localStyles.iconButtonText}>HERO</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Effects Layer */}
            <ParticleExplosion ref={explosionRef} />
            {floatingTexts.map(ft => (
                <FloatingText
                    key={ft.id}
                    x={ft.x}
                    y={ft.y}
                    text={ft.text}
                    onComplete={() => removeFloatingText(ft.id)}
                />
            ))}
        </LinearGradient>
    );
};

const localStyles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    levelBadge: {
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    levelText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    scrollContent: {
        paddingBottom: 150, // Space for dock
        paddingHorizontal: 20,
    },
    heroCard: {
        marginBottom: 24,
        padding: 20,
        backgroundColor: COLORS.surface,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        alignItems: 'center'
    },
    className: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    hpText: {
        color: COLORS.error,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        ...COMMON_STYLES.card,
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 0,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    statIcon: { fontSize: 20 },
    statLabel: { color: COLORS.textSecondary, fontSize: 10, textTransform: 'uppercase' },
    statValue: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },

    resourceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    resourceItem: {
        backgroundColor: COLORS.surfaceLight,
        width: '30%',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    resourceValue: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    resourceLabel: { color: COLORS.textSecondary, fontSize: 10, textTransform: 'uppercase' },

    // Action Bar
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(30, 27, 36, 0.95)',
        borderTopWidth: 1,
        borderTopColor: COLORS.glassBorder,
        padding: 20,
        paddingBottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
    },
    mainActionButton: {
        flex: 1,
        marginRight: 15,
    },
    gradientButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    mainButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    subActions: {
        flexDirection: 'row',
    },
    iconButton: {
        alignItems: 'center',
        marginLeft: 15,
    },
    iconButtonText: {
        color: COLORS.textSecondary,
        fontSize: 9,
        fontWeight: 'bold',
        marginTop: 4,
    },
});

export default DashboardScreen;
