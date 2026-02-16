import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Animated, TouchableOpacity, Modal, Alert, Image } from 'react-native';
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
                useNativeDriver: true,
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

const CityMapScreen = ({ navigation, route }) => {
    // Safety check for params
    const userId = route.params?.userId;

    const [cityState, setCityState] = useState(null);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [shopVisible, setShopVisible] = useState(false); // Add this state back if missing

    useEffect(() => {
        if (!userId) {
            console.error("No userId provided to CityMapScreen");
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
        } catch (err) {
            console.error("Fetch city error:", err);
            Alert.alert("Error", "Failed to load city data.");
        } finally {
            setLoading(false);
        }
    };

    if (!userId) return (
        <View style={[COMMON_STYLES.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={[COMMON_STYLES.text, { color: 'red' }]}>Error: No User ID provided.</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                <Text style={{ color: 'white', textDecorationLine: 'underline' }}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );

    const buyBuilding = async (type) => {
        try {
            const res = await api.post(`/city/buy/${userId}/${type}`);
            if (res.data.success) {
                Alert.alert("Success", `Bought ${BUILDING_TYPES[type].label}!`);
                setShopVisible(false);
                fetchData(); // Refresh data
            }
        } catch (err) {
            Alert.alert("Error", err.response?.data?.detail || "Purchase failed");
        }
    };

    const upgradeBuilding = async (building) => {
        try {
            const res = await api.post(`/city/upgrade/${userId}/${building.id}`);
            if (res.data.success) {
                Alert.alert("Success", res.data.message);
                setSelectedBuilding(null);
                fetchData();
            }
        } catch (err) {
            Alert.alert("Error", err.response?.data?.detail || "Upgrade failed");
        }
    };

    if (loading) return (
        <View style={[COMMON_STYLES.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={COMMON_STYLES.text}>Loading City Plan...</Text>
        </View>
    );

    if (!cityState) return (
        <View style={[COMMON_STYLES.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={COMMON_STYLES.text}>City not founded yet.</Text>
        </View>
    );

    const { level, unlocked_rings } = cityState;
    const coreRadius = 60;
    const ringStep = 50;

    const renderBuilding = (b, index, total, radius) => {
        const angle = (360 / total) * index;
        const imageSource = BUILDING_TYPES[b.building_type]?.image;

        const style = {
            position: 'absolute',
            width: 32, // Increased size for better visibility
            height: 32,
            transform: [
                { rotate: `${angle}deg` },
                { translateY: -radius }
            ],
            // Removed borderRadius as we are using transparent PNGs
        };

        const content = imageSource ? (
            <Image
                source={imageSource}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
            />
        ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: '#ccc' }} />
        );

        return (
            <TouchableOpacity key={b.id} style={style} onPress={() => setSelectedBuilding(b)}>
                {content}
                {/* Level Badge */}
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>{b.level || 1}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    // Distribute buildings: 0-4 inner, 5+ outer (Simple visualization logic)
    const innerBuildings = buildings.slice(0, 8);
    const outerBuildings = buildings.slice(8);

    return (
        <View style={COMMON_STYLES.container}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={COMMON_STYLES.header}>Cyber City</Text>
                <TouchableOpacity onPress={() => setShopVisible(true)} style={{ backgroundColor: COLORS.gold, padding: 8, borderRadius: 8 }}>
                    <Text style={{ color: COLORS.black, fontWeight: 'bold' }}>Construction 🏗️</Text>
                </TouchableOpacity>
            </View>

            <Text style={[COMMON_STYLES.textSecondary, { textAlign: 'center', marginBottom: 20 }]}>
                Level {level} • Population {cityState.population}
            </Text>

            <View style={styles.mapContainer}>
                {/* District 2 (Outer Ring) */}
                {unlocked_rings >= 2 && (
                    <View style={[styles.ring, { width: (coreRadius + ringStep * 2) * 2, height: (coreRadius + ringStep * 2) * 2, borderColor: '#444' }]}>
                        {outerBuildings.map((b, i) => renderBuilding(b, i, Math.max(8, outerBuildings.length), coreRadius + ringStep * 2))}
                    </View>
                )}

                {/* District 1 (Inner Ring) */}
                {unlocked_rings >= 1 && (
                    <View style={[styles.ring, { width: (coreRadius + ringStep) * 2, height: (coreRadius + ringStep) * 2, borderColor: '#555' }]}>
                        {innerBuildings.map((b, i) => renderBuilding(b, i, Math.max(8, innerBuildings.length), coreRadius + ringStep))}
                    </View>
                )}

                {/* Population Layer */}
                <PopulationLayer population={cityState.population} maxRadius={coreRadius + ringStep * unlocked_rings} minRadius={coreRadius} />

                {/* Core */}
                <View style={[styles.core, { width: coreRadius * 2, height: coreRadius * 2 }]}>
                    <View style={styles.coreInner} />
                </View>
            </View>

            <View style={{ padding: 20 }}>
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
