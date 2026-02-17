import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Animated, TouchableOpacity, Modal, Alert, Image, Easing } from 'react-native';
import api from '../api';
import { COLORS, COMMON_STYLES } from '../styles/theme';

const { width } = Dimensions.get('window');


const BUILDING_TYPES = {
    mine: { label: 'Maden Ocağı', image: require('../../assets/buildings/mine_v5.png') },
    town_hall: { label: 'Belediye', image: require('../../assets/buildings/town_hall_v2.png') },
    fire_station: { label: 'İtfaiye', image: require('../../assets/buildings/fire_station_v2.png') },
    hospital: { label: 'Hastane', image: require('../../assets/buildings/hospital_v2.png') },
    school: { label: 'Okul', image: require('../../assets/buildings/school_v2.png') },
    park: { label: 'Park', image: require('../../assets/buildings/park_v2.png') }
};

const BUILDING_COSTS = {
    "mine": { "bronze": 500, "gold": 50, "diamond": 0 },
    "park": { "bronze": 200, "gold": 100, "diamond": 0 },
    "school": { "bronze": 1000, "gold": 200, "diamond": 5 },
    "fire_station": { "bronze": 1500, "gold": 300, "diamond": 10 },
    "hospital": { "bronze": 2000, "gold": 500, "diamond": 20 },
    "town_hall": { "bronze": 5000, "gold": 1000, "diamond": 50 },
};

// Animated Dot Component
const PopulationDot = ({ delay, duration, radius, initialAngle }) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: duration,
                easing: Easing.linear,
                useNativeDriver: false, // Changed to false for Web compatibility
                delay: delay
            })
        ).start();
    }, []);

    const rotate = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [`${initialAngle}deg`, `${initialAngle + 360}deg`]
    });

    return (
        <Animated.View style={[
            styles.dot,
            {
                transform: [
                    { rotate: rotate },
                    { translateY: -radius } // Push out to radius
                ]
            }
        ]} />
    );
};

const PopulationLayer = ({ population, maxRadius, minRadius }) => {
    // 1 dot per 100 population, max 50
    const dotCount = Math.min(50, Math.floor(population / 50));
    const dots = Array.from({ length: dotCount }).map((_, i) => ({
        id: i,
        radius: minRadius + Math.random() * (maxRadius - minRadius),
        duration: 5000 + Math.random() * 10000, // 5s to 15s orbit
        delay: Math.random() * 2000,
        initialAngle: Math.random() * 360
    }));

    return (
        <View style={styles.populationContainer}>
            {dots.map(d => (
                <PopulationDot
                    key={d.id}
                    radius={d.radius}
                    duration={d.duration}
                    delay={d.delay}
                    initialAngle={d.initialAngle}
                />
            ))}
        </View>
    );
};

const Billboard = ({ angle, radius }) => {
    return (
        <View style={{
            position: 'absolute',
            transform: [
                { rotate: `${angle}deg` },
                { translateY: -radius },
                { rotate: `0deg` } // Keep text aligned with ring for now, or -90 to be upright relative to screen center if at top/bottom
            ],
            backgroundColor: 'rgba(0, 20, 40, 0.9)',
            borderWidth: 1,
            borderColor: '#0ff', // Cyan neon
            borderRadius: 4,
            padding: 4,
            width: 80,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#0ff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 5,
            elevation: 5,
            zIndex: 20
        }}>
            <Text style={{
                color: '#0ff',
                fontSize: 8,
                fontWeight: 'bold',
                textAlign: 'center',
                fontFamily: 'monospace',
                textShadowColor: '#0ff',
                textShadowRadius: 3
            }}>{"OFFLINE IS\nTHE NEW TREND"}</Text>
        </View>
    );
};

const CityMapScreen = ({ navigation, route }) => {
    // Safety check for params
    const userId = route.params?.userId;

    const [cityState, setCityState] = useState(null);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Add error state
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [shopVisible, setShopVisible] = useState(false);

    // Animation for Outer Wall
    const wallAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(wallAnim, {
                    toValue: 1,
                    duration: 2000, // 2 seconds to fade color
                    useNativeDriver: false // Color interpolation doesn't support native driver
                }),
                Animated.timing(wallAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: false
                })
            ])
        ).start();
    }, []);

    const wallBorderColor = wallAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.gold, '#00FFFF'] // Gold to Cyan
    });

    const wallShadowColor = wallAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.gold, '#00FFFF']
    });

    useEffect(() => {
        if (!userId) {
            console.error("No userId provided to CityMapScreen");
            setError("No User ID provided.");
            setLoading(false);
            return;
        }
        console.log("CityMapScreen Mounted for", userId);
        fetchData();
    }, [userId]);

    const fetchData = async () => {
        try {
            const [profileRes, buildingsRes] = await Promise.all([
                api.get(`/user/profile/${userId}`),
                api.get(`/city/buildings/${userId}`)
            ]);
            setCityState(profileRes.data.city_state);
            setBuildings(buildingsRes.data);
            setError(null);
        } catch (err) {
            console.error("Fetch city error:", err);
            setError("Failed to load city data. Please try again.");
            // Alert.alert("Error", "Failed to load city data."); // Alert might be annoying if it loops
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <View style={[COMMON_STYLES.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={COMMON_STYLES.text}>Loading City Plan...</Text>
        </View>
    );

    if (error) return (
        <View style={[COMMON_STYLES.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={[COMMON_STYLES.text, { color: COLORS.error, marginBottom: 20 }]}>{error}</Text>
            <TouchableOpacity onPress={fetchData} style={COMMON_STYLES.buttonPrimary}>
                <Text style={COMMON_STYLES.buttonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                <Text style={{ color: 'white', textDecorationLine: 'underline' }}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );

    if (!userId) return (
        <View style={[COMMON_STYLES.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={[COMMON_STYLES.text, { color: 'red' }]}>Error: No User ID provided.</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                <Text style={{ color: 'white', textDecorationLine: 'underline' }}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );

    if (!cityState) return (
        <View style={[COMMON_STYLES.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={COMMON_STYLES.text}>City not founded yet.</Text>
        </View>
    );

    const { level = 1, unlocked_rings = 1 } = cityState || {};

    const renderBuilding = (building, index, capacity, radius) => {
        // Calculate angle: 360 / capacity * index
        // Start from -90 deg (top) or 0 deg (right)
        const angle = (360 / capacity) * index;
        const typeConfig = BUILDING_TYPES[building.building_type];

        return (
            <View key={building.id} style={{
                position: 'absolute',
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                transform: [
                    { rotate: `${angle}deg` },
                    { translateY: -radius }, // Push out to ring radius
                    { rotate: `-${angle}deg` } // Rotate back to be upright
                ],
            }}>
                <TouchableOpacity onPress={() => setSelectedBuilding(building)}>
                    <Image
                        source={typeConfig?.image}
                        style={{ width: 30, height: 30, resizeMode: 'contain' }}
                    />
                    {/* Optional: Level Badge */}
                    <View style={{
                        position: 'absolute',
                        bottom: -5,
                        right: -5,
                        backgroundColor: COLORS.primary,
                        borderRadius: 10,
                        width: 16,
                        height: 16,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{building.level}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    // Dynamic Ring Generation
    const rings = [];
    const ringStep = 42; // Reduced by 30% (was 60)
    const coreRadius = 75;

    // Distribute buildings into rings
    // Ensure buildings is an array
    const safeBuildings = Array.isArray(buildings) ? buildings : [];
    let remainingBuildings = [...safeBuildings];

    // Safety clamp for unlocked_rings to prevent infinite loops or huge memory usage
    const safeUnlockedRings = Math.max(1, Math.min(unlocked_rings || 1, 50));

    for (let i = 1; i <= safeUnlockedRings; i++) {
        const capacity = 8 + (i - 1) * 4; // 8, 12, 16...
        const ringBuildings = remainingBuildings.splice(0, capacity);
        rings.push({
            id: i,
            radius: coreRadius + ringStep * i,
            buildings: ringBuildings,
            capacity: capacity
        });
    }

    // If there are still remaining buildings, put them in the last ring
    if (remainingBuildings.length > 0 && rings.length > 0) {
        rings[rings.length - 1].buildings.push(...remainingBuildings);
    }


    const maxRingRadius = coreRadius + ringStep * safeUnlockedRings;

    return (
        <View style={COMMON_STYLES.container}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, zIndex: 100 }}>
                <Text style={COMMON_STYLES.header}>Cyber City</Text>
                <TouchableOpacity onPress={() => setShopVisible(true)} style={{ backgroundColor: COLORS.gold, padding: 8, borderRadius: 8 }}>
                    <Text style={{ color: COLORS.black, fontWeight: 'bold' }}>Construction 🏗️</Text>
                </TouchableOpacity>
            </View>

            <Text style={[COMMON_STYLES.textSecondary, { textAlign: 'center', marginBottom: 20 }]}>
                Level {level} • Population {cityState.population}
            </Text>

            <View style={[styles.mapContainer, { paddingBottom: 60 }]}>

                {/* Dynamically Render Rings (Outer to Inner for stacking context if needed, but absolute positioning handles it) */}
                {/* Actually reverse map might be better for z-index if they overlap, but rings are concentric. */}
                {rings.map(ring => (
                    <View key={ring.id} style={[styles.ring, { width: ring.radius * 2, height: ring.radius * 2, borderColor: '#444' }]}>
                        {ring.buildings.map((b, i) => renderBuilding(b, i, Math.max(ring.capacity, ring.buildings.length), ring.radius))}
                    </View>
                ))}


                {/* Outer Wall */}
                {/* Wall scaled relative to max unlocked ring */}
                <Animated.View style={[
                    styles.ring,
                    {
                        width: (maxRingRadius + 10) * 2,
                        height: (maxRingRadius + 10) * 2,
                        borderColor: wallBorderColor, // Animated Color
                        borderWidth: 4,
                        borderStyle: 'dashed', // Cyber look
                        opacity: 0.8,
                        shadowColor: wallShadowColor, // Animated Shadow
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                        elevation: 5
                    }
                ]} />

                {/* Population Layer */}
                <PopulationLayer population={cityState.population} maxRadius={maxRingRadius - 15} minRadius={coreRadius + 10} />

                {/* Core */}
                <View style={[styles.core, { width: coreRadius * 2, height: coreRadius * 2 }]}>
                    <View style={styles.coreInner} />
                </View>

                {/* Billboards */}
                {cityState.population > 100 && (
                    <Billboard angle={45} radius={110} />
                )}
            </View>

            <View style={{ padding: 20, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)' }}>
                <TouchableOpacity
                    style={[COMMON_STYLES.buttonPrimary, { backgroundColor: '#4CAF50', borderWidth: 0 }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[COMMON_STYLES.buttonText, { color: '#FFFFFF' }]}>Return to Base</Text>
                </TouchableOpacity>
            </View>

            {/* Shop Modal */}
            <Modal visible={shopVisible} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={[COMMON_STYLES.subHeader, { color: COLORS.black, textAlign: 'center' }]}>Construction Menu</Text>
                        <ScrollView>
                            {Object.entries(BUILDING_COSTS).map(([key, cost]) => (
                                <View key={key} style={styles.shopItem}>
                                    <View>
                                        <Text style={styles.shopLabel}>{BUILDING_TYPES[key]?.label}</Text>
                                        <Text style={styles.shopCost}>
                                            {cost.bronze > 0 && `🟫 ${cost.bronze} `}
                                            {cost.gold > 0 && `🟨 ${cost.gold} `}
                                            {cost.diamond > 0 && `💎 ${cost.diamond}`}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => buyBuilding(key)} style={styles.buyButton}>
                                        <Text style={styles.buyButtonText}>Buy</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setShopVisible(false)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Upgrade Modal */}
            <Modal visible={!!selectedBuilding} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity onPress={() => setSelectedBuilding(null)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    mapContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    ring: {
        position: 'absolute',
        borderRadius: 1000,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    core: {
        backgroundColor: COLORS.surface,
        borderRadius: 1000,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: COLORS.primary,
        zIndex: 10,
        // Glowing effect using shadow
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
    },
    coreInner: {
        width: '60%',
        height: '60%',
        backgroundColor: COLORS.primaryDark,
        borderRadius: 100,
    },
    // Population Dots
    populationContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5, // Below core, above rings?
    },
    dot: {
        position: 'absolute',
        width: 3,
        height: 3,
        backgroundColor: '#00FA9A', // Medium Spring Green
        borderRadius: 2,
    },
    legend: {
        paddingTop: 20,
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '60%',
    },
    shopItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    shopLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    shopCost: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    buyButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    buyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    closeButton: {
        marginTop: 20,
        alignItems: 'center',
        padding: 15,
    },
    closeButtonText: {
        color: '#f00',
        fontWeight: 'bold',
    }
});

export default CityMapScreen;
