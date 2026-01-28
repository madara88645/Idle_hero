import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { getUsageStats } from '../../modules/my-usage-stats'; // Import usage stats

const DashboardScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    // Use state for userId so we can update it after onboarding
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
                    const newUser = {
                        username: `User_${Math.floor(Math.random() * 1000)}`,
                        email: `user${Math.floor(Math.random() * 1000)}@example.com`
                    };
                    const onboardRes = await api.post('/user/onboard', newUser);
                    console.log("Onboarded new user:", onboardRes.data);

                    // Update state with new user ID
                    const newId = onboardRes.data.id;
                    setCurrentUserId(newId);
                    setProfile(onboardRes.data);
                } catch (onboardErr) {
                    console.error("Onboard error:", onboardErr);
                }
            }
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSync = async () => {
        // In real app, call getUsageStats(1) here
        // const stats = await getUsageStats(1);
        // Transform stats to logs...
        // const logs = Object.entries(stats).map(([pkg, time]) => ({ ... }));

        // Stub sync for MVP Demo
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

    if (!profile) return <Text>Loading...</Text>;

    const { stats } = profile;

    return (
        <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.title}>Idle Hero</Text>

            <View style={styles.statsContainer}>
                <Text>Level: {stats?.level}</Text>
                <Text>XP: {stats?.xp}</Text>
                <Text>Discipline: {stats?.discipline}</Text>
                <Text>Focus: {stats?.focus}</Text>
            </View>

            <Button title="Sync Usage" onPress={handleSync} color="#8A2BE2" />
            <Button title="Manage Rules" onPress={() => navigation.navigate('Rules', { userId: currentUserId })} color="#8A2BE2" />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    statsContainer: { marginBottom: 20 },
});

export default DashboardScreen;
