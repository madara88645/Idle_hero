import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    runOnJS
} from 'react-native-reanimated';

const FloatingText = ({ x, y, text, onComplete }) => {
    const opacity = useSharedValue(1);
    const translateY = useSharedValue(0);

    useEffect(() => {
        opacity.value = withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0, { duration: 500 }, (finished) => {
                if (finished && onComplete) {
                    runOnJS(onComplete)();
                }
            })
        );
        translateY.value = withTiming(-50, { duration: 1000 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
        };
    });

    return (
        <Animated.Text style={[styles.text, { left: x, top: y }, animatedStyle]}>
            {text}
        </Animated.Text>
    );
};

const styles = StyleSheet.create({
    text: {
        position: 'absolute',
        color: '#FFD700', // Gold
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowRadius: 3,
        zIndex: 1000,
    },
});

export default FloatingText;
