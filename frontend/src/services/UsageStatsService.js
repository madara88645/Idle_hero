import Constants from 'expo-constants';
import { Platform } from 'react-native';
import MyUsageStats from '../../modules/my-usage-stats';

/**
 * Service to abstract Usage Stats logic.
 * Swaps between Mock Data (Expo Go / Web) and Real Data (Native Build).
 */

// Check if we're in a non-native environment (Expo Go or Web)
const isNonNativeEnvironment = () => {
    return Platform.OS === 'web' || Constants.appOwnership === 'expo';
};

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
     */
    hasPermission: async () => {
        if (isNonNativeEnvironment()) {
            console.log("[UsageStatsService] Running in Web/Expo Go. Permission simulated.");
            return true;
        }
        try {
            return await MyUsageStats.hasPermission();
        } catch (e) {
            console.error("Native Module Error:", e);
            return false;
        }
    },

    /**
     * Gets usage stats for today.
     */
    getTodayUsage: async () => {
        if (isNonNativeEnvironment()) {
            console.log("[UsageStatsService] Returning Mock Data for Web/Expo Go.");
            return MOCK_LOGS;
        }

        try {
            console.log("Fetching native usage stats...");
            // Get stats for last 1 day
            const statsMap = await MyUsageStats.getUsageStats(1);
            console.log("Native Stats Raw:", statsMap);

            // Transform map { "com.pkg": durationMillis } -> Array of UsageLog objects
            const logs = Object.entries(statsMap).map(([pkg, durationMillis]) => {
                const durationSeconds = Math.floor(durationMillis / 1000);
                if (durationSeconds <= 0) return null;

                const endTime = new Date();
                const startTime = new Date(endTime.getTime() - durationMillis);

                return {
                    app_package_name: pkg,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    duration_seconds: durationSeconds
                };
            }).filter(Boolean); // Remove nulls

            return logs;
        } catch (e) {
            console.error("[UsageStatsService] Error fetching stats:", e);
            return [];
        }
    },

    /**
     * Request permission.
     */
    requestPermission: async () => {
        if (isNonNativeEnvironment()) {
            console.log("[UsageStatsService] In Web/Expo Go, permissions are simulated!");
            return;
        }
        try {
            MyUsageStats.requestPermission();
        } catch (e) {
            console.error("[UsageStatsService] Error requesting permission:", e);
        }
    }
};

export default UsageStatsService;
