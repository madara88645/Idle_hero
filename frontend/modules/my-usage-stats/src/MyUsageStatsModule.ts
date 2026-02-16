import { NativeModule, requireNativeModule } from 'expo';

import { MyUsageStatsModuleEvents } from './MyUsageStats.types';

declare class MyUsageStatsModule extends NativeModule<MyUsageStatsModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;

  // Native methods
  hasPermission(): boolean; // Changed to synchronous boolean based on common Expo patterns, but let's check if it needs to be async or if we should keep it simple. Actually the Kotlin code was Function("hasPermission") which returns Boolean.
  requestPermission(): void;
  getUsageStats(durationDays: number): Promise<{ [packageName: string]: number }>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<MyUsageStatsModule>('MyUsageStats');
