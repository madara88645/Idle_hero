import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../constants/theme';
import api from '../api';
import QuestCard from '../components/QuestCard';

// Temporary manually setting User ID until Context is improved
const USER_ID = "7eb3fffc-d50b-4952-99b4-a9312aeca561";

const QuestScreen = () => {
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQuests = async () => {
        setLoading(true);
        const data = await api.getQuests(USER_ID);
        setQuests(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchQuests();
    }, []);

    const handleClaim = async (questId) => {
        try {
            await api.claimQuest(questId);
            Alert.alert("Reward Claimed!", "You gained XP and Gold!");
            fetchQuests(); // Refresh UI
        } catch (error) {
            Alert.alert("Error", "Could not claim reward.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Quest Log</Text>

            <FlatList
                data={quests}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <QuestCard quest={item} onClaim={handleClaim} />
                )}
                contentContainerStyle={styles.list}
                refreshing={loading}
                onRefresh={fetchQuests}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    list: {
        paddingBottom: 20,
    }
});

export default QuestScreen;
