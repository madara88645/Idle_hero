import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    runOnJS
} from 'react-native-reanimated';
import { COLORS } from '../styles/theme';

const PARTICLE_COUNT = 20;

const Particle = ({ active, x, y, color, onComplete }) => {
    if (!active) return null;

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    useEffect(() => {
        const angle = Math.random() * 2 * Math.PI;
        const velocity = 50 + Math.random() * 100;
        const destX = Math.cos(angle) * velocity;
        const destY = Math.sin(angle) * velocity;

        translateX.value = withTiming(destX, { duration: 800, easing: Easing.out(Easing.quad) });
        translateY.value = withTiming(destY, { duration: 800, easing: Easing.out(Easing.quad) });
        opacity.value = withTiming(0, { duration: 800 });
        scale.value = withTiming(0, { duration: 800 }, (finished) => {
            if (finished && onComplete) {
                runOnJS(onComplete)();
            }
        });
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.particle, { left: x, top: y, backgroundColor: color }, style]} />
    );
};

const ParticleExplosion = forwardRef((props, ref) => {
    const [explosions, setExplosions] = useState([]);

    useImperativeHandle(ref, () => ({
        explode: (x, y) => {
            const id = Date.now();
            setExplosions(prev => [...prev, { id, x, y }]);
            // Auto cleanup from state is handled by individual completions to keep it simple, 
            // or we can remove whole batch after 1 sec.
            setTimeout(() => {
                setExplosions(prev => prev.filter(e => e.id !== id));
            }, 1000);
        }
    }));

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {explosions.map(explosion => (
                <View key={explosion.id}>
                    {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
                        <Particle
                            key={i}
                            active={true}
                            x={explosion.x}
                            y={explosion.y}
                            color={[COLORS.primary, COLORS.secondary, COLORS.gold, COLORS.success][Math.floor(Math.random() * 4)]}
                        />
                    ))}
                </View>
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    particle: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
    }
});

export default ParticleExplosion;
