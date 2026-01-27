import { requireNativeView } from 'expo';
import * as React from 'react';

import { MyUsageStatsViewProps } from './MyUsageStats.types';

const NativeView: React.ComponentType<MyUsageStatsViewProps> =
  requireNativeView('MyUsageStats');

export default function MyUsageStatsView(props: MyUsageStatsViewProps) {
  return <NativeView {...props} />;
}
