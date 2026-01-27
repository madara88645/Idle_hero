package expo.modules.myusagestats

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

class MyUsageStatsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MyUsageStats")

    Function("hasPermission") {
      val context = appContext.reactContext ?: return@Function false
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
      return@Function mode == AppOpsManager.MODE_ALLOWED
    }

    Function("requestPermission") {
      val context = appContext.reactContext ?: return@Function
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    AsyncFunction("getUsageStats") { durationDays: Int ->
        val context = appContext.reactContext ?: return@AsyncFunction emptyMap<String, Long>()
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        
        val calendar = Calendar.getInstance()
        val endTime = calendar.timeInMillis
        calendar.add(Calendar.DAY_OF_YEAR, -durationDays)
        val startTime = calendar.timeInMillis

        // Query daily stats
        val stats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            startTime,
            endTime
        )

        val result = mutableMapOf<String, Long>()
        if (stats != null) {
            for (usageStat in stats) {
                if (usageStat.totalTimeInForeground > 0) {
                    val existing = result.getOrDefault(usageStat.packageName, 0L)
                    result[usageStat.packageName] = existing + usageStat.totalTimeInForeground
                }
            }
        }
        return@AsyncFunction result
    }
  }
}
