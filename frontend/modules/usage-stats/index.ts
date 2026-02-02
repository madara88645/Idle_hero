import { requireNativeModule } from 'expo-modules-core';

// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
const UsageStats = requireNativeModule('UsageStats');

export function hasPermission() {
    return UsageStats.hasPermission();
}

export function requestPermission() {
    return UsageStats.requestPermission();
}

export async function getTodayUsage() {
    return await UsageStats.getTodayUsage();
}
