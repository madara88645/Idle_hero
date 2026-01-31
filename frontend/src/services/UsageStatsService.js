import Constants from 'expo-constants';

/**
 * Service to abstract Usage Stats logic.
 * Swaps between Mock Data (Expo Go) and Real Data (Native Build).
 */

const MOCK_LOGS = [
    {
        app_package_name: 'com.instagram.android',
        start_time: new Date(new Date().getTime() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        end_time: new Date().toISOString(),
        duration_seconds: 1800 // 30 mins
    },
    {
        app_package_name: 'com.tiktok.android',
        start_time: new Date(new Date().getTime() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        end_time: new Date(new Date().getTime() - 1000 * 60 * 45).toISOString(),
        duration_seconds: 900 // 15 mins
    }
];

const UsageStatsService = {
    /**
     * Checks if the app has permission to access usage stats.
     * In Expo Go, always returns true (simulated).
     */
    hasPermission: async () => {
        if (Constants.appOwnership === 'expo') {
            console.log("[UsageStatsService] Running in Expo Go. Permission simulated.");
            return true;
        }
        // TODO: Implement Native Module check here
        return false;
    },

    /**
     * Gets usage stats for today.
     * In Expo Go, returns mock data.
     */
    getTodayUsage: async () => {
        if (Constants.appOwnership === 'expo') {
            console.log("[UsageStatsService] Returning Mock Data for Expo Go.");
            return MOCK_LOGS;
        }

        // TODO: Call Native Module here
        return [];
    },

    /**
     * Request permission.
     */
    requestPermission: async () => {
        if (Constants.appOwnership === 'expo') {
            alert("In Expo Go, we simulate permissions!");
            return;
        }
        // TODO: Open Native Settings
    }
};

export default UsageStatsService;
