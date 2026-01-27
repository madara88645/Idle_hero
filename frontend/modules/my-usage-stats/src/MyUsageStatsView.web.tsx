import * as React from 'react';

import { MyUsageStatsViewProps } from './MyUsageStats.types';

export default function MyUsageStatsView(props: MyUsageStatsViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
