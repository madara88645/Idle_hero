import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ProfileScreen = ({ route }) => {
    const insets = useSafeAreaInsets();
    const userId = route.params?.userId;
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/user/profile/${userId}`);
                setProfile(res.data);
            } catch (err) {
                console.error(err);
                Alert.alert("Error", "Could not load profile");
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchProfile();
    }, [userId]);

    if (!userId) return <Text style={styles.center}>No User ID</Text>;
    if (loading) return <ActivityIndicator style={styles.center} />;
    if (!profile) return <Text style={styles.center}>Profile not found</Text>;

    const { stats, hero_class, unlocked_skills, username } = profile;

    return (
        <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={styles.avatarPlaceholder} />
                <Text style={styles.username}>{username}</Text>
                <Text style={styles.heroClass}>{hero_class ? hero_class.name : "Novice Adventurer"}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Stats</Text>
                <View style={styles.statGrid}>
                    <StatItem label="Level" value={stats?.level} />
                    <StatItem label="XP" value={stats?.xp} />
                    <StatItem label="HP" value={`${stats?.health} / ${stats?.max_health}`} />
                    <StatItem label="Attack" value={stats?.attack_power} />
                    <StatItem label="Defense" value={stats?.defense} />
                    <StatItem label="Focus" value={stats?.focus} />
                    <StatItem label="Discipline" value={stats?.discipline} />
                    <StatItem label="Willpower" value={stats?.willpower} />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills & Abilities</Text>
                {unlocked_skills && unlocked_skills.length > 0 ? (
                    unlocked_skills.map((skill) => (
                        <View key={skill.id} style={styles.skillCard}>
                            <Text style={styles.skillName}>{skill.skill_code}</Text>
                            <Text style={styles.skillDate}>Unlocked: {new Date(skill.unlocked_at).toLocaleDateString()}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No skills unlocked yet.</Text>
                )}
            </View>

            <TouchableOpacity
                style={styles.changeClassButton}
                onPress={() => navigation.navigate('ClassSelection', { userId })}
            >
                <Text style={styles.changeClassText}>⚡ Change Hero Class</Text>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
};

const StatItem = ({ label, value }) => (
    <View style={styles.statItem}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value || 0}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { alignItems: 'center', marginBottom: 30 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ddd', marginBottom: 10 },
    username: { fontSize: 24, fontWeight: 'bold' },
    heroClass: { fontSize: 16, color: '#666', fontStyle: 'italic' },
    section: { marginBottom: 25, backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 1 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statItem: { width: '48%', marginBottom: 15, backgroundColor: '#f5f5f5', padding: 10, borderRadius: 5 },
    statLabel: { fontSize: 14, color: '#555' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    skillCard: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 5 },
    skillName: { fontSize: 16, fontWeight: '600' },
    skillDate: { fontSize: 12, color: '#888' },
    emptyText: { color: '#999', fontStyle: 'italic' },
    changeClassButton: { backgroundColor: '#1976D2', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20, marginHorizontal: 20 },
    changeClassText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default ProfileScreen;
