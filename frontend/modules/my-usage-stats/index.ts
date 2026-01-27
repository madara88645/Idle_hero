// Reexport the native module. On web, it will be resolved to MyUsageStatsModule.web.ts
// and on native platforms to MyUsageStatsModule.ts
export { default } from './src/MyUsageStatsModule';
export { default as MyUsageStatsView } from './src/MyUsageStatsView';
export * from  './src/MyUsageStats.types';
