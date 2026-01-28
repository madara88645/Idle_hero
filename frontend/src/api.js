import axios from 'axios';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8001' : 'http://localhost:8001';

const api = axios.create({
    baseURL: BASE_URL,
});

export default api;
