import { NativeModule, requireNativeModule } from 'expo';

import { MyUsageStatsModuleEvents } from './MyUsageStats.types';

declare class MyUsageStatsModule extends NativeModule<MyUsageStatsModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
  hasPermission(): boolean;
  requestPermission(): void;
  getUsageStats(durationDays: number): Promise<{ [packageName: string]: number }>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<MyUsageStatsModule>('MyUsageStats');
