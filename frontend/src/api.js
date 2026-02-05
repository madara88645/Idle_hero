import axios from 'axios';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8001' : 'http://localhost:8001';

const api = axios.create({
    baseURL: BASE_URL,
});

// --- Quests ---
api.getQuests = async (userId) => {
    try {
        const response = await api.get(`/quests/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching quests:", error);
        return [];
    }
};

api.claimQuest = async (questId) => {
    const response = await api.post(`/quests/claim/${questId}`);
    return response.data;
};

export default api;
