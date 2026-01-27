import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './MyUsageStats.types';

type MyUsageStatsModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class MyUsageStatsModule extends NativeModule<MyUsageStatsModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(MyUsageStatsModule, 'MyUsageStatsModule');
