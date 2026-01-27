import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, TextInput, StyleSheet } from 'react-native';
import api from '../api';

const RulesScreen = ({ route }) => {
    const { userId } = route.params;
    const [rules, setRules] = useState([]);
    const [pkgName, setPkgName] = useState('');
    const [limit, setLimit] = useState('');

    const fetchRules = async () => {
        const res = await api.get(`/rules/${userId}`);
        setRules(res.data);
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const addRule = async () => {
        await api.post(`/rules/${userId}`, {
            app_package_name: pkgName,
            daily_limit_minutes: parseInt(limit),
            is_blocked: false
        });
        setPkgName('');
        setLimit('');
        fetchRules();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Detox Rules</Text>
            <FlatList
                data={rules}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text>{item.app_package_name} - {item.daily_limit_minutes}m</Text>
                    </View>
                )}
            />

            <View style={styles.inputContainer}>
                <TextInput placeholder="Package Name" value={pkgName} onChangeText={setPkgName} style={styles.input} />
                <TextInput placeholder="Limit (min)" value={limit} onChangeText={setLimit} style={styles.input} keyboardType="numeric" />
                <Button title="Add Rule" onPress={addRule} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { fontSize: 20, marginBottom: 10 },
    item: { padding: 10, borderBottomWidth: 1 },
    inputContainer: { marginTop: 20 },
    input: { borderWidth: 1, padding: 10, marginBottom: 10 }
});

export default RulesScreen;
