import { EventEmitter } from 'expo-modules-core';

const emitter = new EventEmitter({} as any);

export default {
  PI: Math.PI,
  async setValueAsync(value: string): Promise<void> {
    console.warn('MyUsageStats.setValueAsync is not supported on web');
  },
  hello(): string {
    return 'Hello from Web!';
  },
  hasPermission(): boolean {
    return true; // Mock permission as true on web
  },
  requestPermission(): void {
    console.log('Requesting permission on web (mock)');
  },
  async getUsageStats(durationDays: number): Promise<{ [packageName: string]: number }> {
    console.warn('MyUsageStats.getUsageStats is mocked on web');
    return {
      'com.example.app': 3600000, // 1 hour mock usage
      'com.social.media': 1800000 // 30 min mock usage
    };
  },
  addListener: (eventName: string, listener: (event: any) => void) => emitter.addListener(eventName, listener),
  removeListeners: (count: number) => emitter.removeListeners(count),
};
