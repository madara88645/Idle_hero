import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { COLORS } from '../styles/theme';

const AnimatedBar = ({
    value,
    max,
    color = COLORS.primary,
    height = 8,
    label,
    showValue = true
}) => {
    const widthShared = useSharedValue(0);

    useEffect(() => {
        const percentage = Math.min(Math.max(value / max, 0), 1);
        widthShared.value = withSpring(percentage, { damping: 15, stiffness: 100 });
    }, [value, max]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${widthShared.value * 100}%`,
        };
    });

    return (
        <View style={styles.container}>
            {(label || showValue) && (
                <View style={styles.labelContainer}>
                    {label && <Text style={styles.label}>{label}</Text>}
                    {showValue && <Text style={styles.value}>{value}/{max}</Text>}
                </View>
            )}
            <View style={[styles.barBackground, { height }]}>
                <Animated.View
                    style={[
                        styles.barFill,
                        { backgroundColor: color, height },
                        animatedStyle
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        width: '100%',
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    value: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
    barBackground: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        borderRadius: 4,
    },
});

export default AnimatedBar;
