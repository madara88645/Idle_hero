import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, AppState } from 'react-native';
import { theme, commonStyles } from '../theme';
import UsageStatsService from '../services/UsageStatsService';

const GatewayScreen = ({ onPermissionGranted }) => {
    const [isChecking, setIsChecking] = useState(false);

    const handleGrantPermission = async () => {
        await UsageStatsService.requestPermission();
        // The user goes to settings. We'll wait for them to come back (AppState change in App.js)
        // But for good UX, let's also have a "I did it" button or similar if needed.
        // Actually, App.js handles the re-check on focus.
    };

    const handleCheckAgain = async () => {
        setIsChecking(true);
        const hasPerm = await UsageStatsService.hasPermission();
        setIsChecking(false);
        if (hasPerm) {
            onPermissionGranted();
        } else {
            alert("Permission is still missing. Please enable 'Idle Hero' in the list.");
        }
    };

    return (
        <View style={[commonStyles.container, styles.center]}>
            <View style={styles.card}>
                <Text style={styles.icon}>🛡️</Text>
                <Text style={styles.title}>Hero Needs Access!</Text>
                <Text style={styles.description}>
                    To fight the digital monsters (distractions), your Hero needs to see which apps you are using.
                </Text>

                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        We ONLY track time spent on apps to calculate your HP and XP. Your data never leaves your device's secure storage.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleGrantPermission}
                >
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={handleCheckAgain}
                >
                    <Text style={styles.buttonText}>{isChecking ? "Checking..." : "I Enabled It"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        elevation: 5,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
    },
    icon: { fontSize: 60, marginBottom: 20 },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 15,
        textAlign: 'center'
    },
    description: {
        fontSize: 16,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24
    },
    infoBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 15,
        borderRadius: 10,
        marginBottom: 30
    },
    infoText: {
        fontSize: 14,
        color: theme.colors.subtext,
        textAlign: 'center',
        fontStyle: 'italic'
    },
    button: {
        width: '100%',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15
    },
    primaryButton: { backgroundColor: theme.colors.primary },
    secondaryButton: { backgroundColor: theme.colors.secondary },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    }
});

export default GatewayScreen;
