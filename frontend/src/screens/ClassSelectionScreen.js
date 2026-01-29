import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ClassSelectionScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { userId } = route.params;
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to load hero classes");
            setLoading(false);
        }
    };

    const handleSelectClass = async (classId, className) => {
        try {
            await api.post(`/user/${userId}/class/${classId}`);
            Alert.alert("Success", `You have chosen the path of the ${className}!`, [
                { text: "Continue", onPress: () => navigation.replace("Dashboard", { userId }) }
            ]);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to select class");
        }
    };

    if (loading) return <View style={styles.center}><Text>Loading paths...</Text></View>;

    return (
        <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.title}>Choose Your Path</Text>
            <Text style={styles.subtitle}>Select a class that fits your productivity style.</Text>

            <View style={styles.list}>
                {classes.map(cls => (
                    <View key={cls.id} style={styles.card}>
                        <Text style={styles.cardTitle}>{cls.name}</Text>
                        <Text style={styles.cardDesc}>{cls.description}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{cls.bonus_type}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => handleSelectClass(cls.id, cls.name)}
                        >
                            <Text style={styles.buttonText}>Select Path</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center' },
    list: { paddingBottom: 40 },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#2c3e50' },
    cardDesc: { fontSize: 14, color: '#555', marginBottom: 15, lineHeight: 20 },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#e0f7fa',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginBottom: 15
    },
    badgeText: { color: '#006064', fontSize: 12, fontWeight: 'bold' },
    button: {
        backgroundColor: '#1976D2',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default ClassSelectionScreen;
