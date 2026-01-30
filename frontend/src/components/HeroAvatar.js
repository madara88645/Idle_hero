import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const CLASS_EMOJIS = {
    "NIGHT_OWL": "🥷",
    "MORNING_STAR": "🌅",
    "HARDCORE": "⚔️",
    "BALANCED": "🛡️",
    "DEFAULT": "😐"
};

const getBorderColor = (level) => {
    if (level >= 20) return '#FFD700'; // Gold/Glowing
    if (level >= 10) return '#C0C0C0'; // Silver
    return '#8D6E63'; // Wood
};

const getShadowStyle = (level) => {
    if (level >= 20) {
        return {
            shadowColor: "#FFD700",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 10,
            borderColor: '#FFD700',
            borderWidth: 3
        };
    }
    return {
        borderColor: getBorderColor(level),
        borderWidth: level >= 10 ? 3 : 2
    };
};

const HeroAvatar = ({ heroClass, level, size = 80 }) => {
    const bonusType = heroClass?.bonus_type || "DEFAULT";
    const emoji = CLASS_EMOJIS[bonusType] || CLASS_EMOJIS["DEFAULT"];

    // Safety check for level
    const safeLevel = level || 1;

    const containerStyle = [
        styles.avatarContainer,
        {
            width: size,
            height: size,
            borderRadius: size / 2
        },
        getShadowStyle(safeLevel)
    ];

    return (
        <View style={containerStyle}>
            <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    avatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2c3e50', // Dark background for avatar circle
        borderStyle: 'solid',
    }
});

export default HeroAvatar;
