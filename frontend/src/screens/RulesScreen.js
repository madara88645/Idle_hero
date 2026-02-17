import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import api from '../api';
import { COLORS, COMMON_STYLES } from '../styles/theme';

const RulesScreen = ({ navigation, route }) => {
    const { userId } = route.params;
    const [rules, setRules] = useState([]);
    const [pkgName, setPkgName] = useState('');
    const [limit, setLimit] = useState('');

    const fetchRules = async () => {
        try {
            const res = await api.get(`/rules/${userId}`);
            setRules(res.data);
        } catch (err) {
            console.error("Fetch rules error:", err);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const addRule = async () => {
        if (!pkgName || !limit) return;
        try {
            await api.post(`/rules/${userId}`, {
                app_package_name: pkgName,
                daily_limit_minutes: parseInt(limit),
                is_blocked: false
            });
            setPkgName('');
            setLimit('');
            fetchRules();
        } catch (err) {
            console.error("Add rule error:", err);
        }
    };

    const renderItem = ({ item }) => (
        <View style={localStyles.ruleCard}>
            <View style={{ flex: 1 }}>
                <Text style={localStyles.pkgName}>{item.app_package_name}</Text>
            </View>
            <View style={localStyles.limitBadge}>
                <Text style={localStyles.limitText}>{item.daily_limit_minutes}m</Text>
            </View>
        </View>
    );

    return (
        <View style={COMMON_STYLES.container}>
            <Text style={COMMON_STYLES.header}>Detox Rules</Text>
            <Text style={[COMMON_STYLES.textSecondary, { marginBottom: 20 }]}>
                Set daily limits for distracting apps.
            </Text>

            <FlatList
                data={rules}
                keyExtractor={item => item.id ? item.id.toString() : Math.random().toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={<Text style={COMMON_STYLES.textSecondary}>No rules set yet.</Text>}
            />

            <View style={localStyles.inputContainer}>
                <Text style={COMMON_STYLES.subHeader}>Add New Rule</Text>
                <TextInput
                    placeholder="Package Name (e.g. com.instagram.android)"
                    placeholderTextColor={COLORS.textSecondary}
                    value={pkgName}
                    onChangeText={setPkgName}
                    style={COMMON_STYLES.input}
                />
                <TextInput
                    placeholder="Daily Limit (minutes)"
                    placeholderTextColor={COLORS.textSecondary}
                    value={limit}
                    onChangeText={setLimit}
                    style={COMMON_STYLES.input}
                    keyboardType="numeric"
                />
                <TouchableOpacity style={COMMON_STYLES.buttonPrimary} onPress={addRule}>
                    <Text style={COMMON_STYLES.buttonText}>Add Rule</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[COMMON_STYLES.buttonPrimary, { marginTop: 20, backgroundColor: '#4CAF50' }]}
                onPress={() => navigation.goBack()}
            >
                <Text style={[COMMON_STYLES.buttonText, { color: '#FFFFFF' }]}>Return to Base</Text>
            </TouchableOpacity>
        </View>
    );
};

const localStyles = StyleSheet.create({
    ruleCard: {
        ...COMMON_STYLES.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pkgName: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    limitBadge: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 15,
    },
    limitText: {
        color: COLORS.black,
        fontWeight: 'bold',
        fontSize: 14,
    },
    inputContainer: {
        marginTop: 20,
        backgroundColor: COLORS.surface,
        padding: 15,
        borderRadius: 12,
    },
});

export default RulesScreen;
