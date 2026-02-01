const { withAndroidManifest } = require('@expo/config-plugins');

const withUsageStats = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        const permissions = androidManifest.manifest['uses-permission'] || [];

        if (!permissions.find((p) => p.$['android:name'] === 'android.permission.PACKAGE_USAGE_STATS')) {
            permissions.push({
                $: {
                    'android:name': 'android.permission.PACKAGE_USAGE_STATS',
                    'tools:ignore': 'ProtectedPermissions',
                },
            });
        }

        // Ensure tools namespace exists
        if (!androidManifest.manifest.$['xmlns:tools']) {
            androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
        }

        androidManifest.manifest['uses-permission'] = permissions;
        return config;
    });
};

module.exports = withUsageStats;
