package expo.modules.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

class UsageStatsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("UsageStats")

    // Check if user has granted permission
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

    // Open Settings page
    Function("requestPermission") {
      val context = appContext.reactContext ?: return@Function
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
      context.startActivity(intent)
    }

    // Get Usage Stats for today
    Function("getTodayUsage") {
      val context = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      
      val calendar = Calendar.getInstance()
      val endTime = calendar.timeInMillis
      calendar.set(Calendar.HOUR_OF_DAY, 0)
      calendar.set(Calendar.MINUTE, 0)
      calendar.set(Calendar.SECOND, 0)
      val startTime = calendar.timeInMillis

      val stats = usageStatsManager.queryUsageStats(
        UsageStatsManager.INTERVAL_DAILY,
        startTime,
        endTime
      )

      val result = mutableListOf<Map<String, Any>>()
      
      if (stats != null) {
        for (usageStat in stats) {
          if (usageStat.totalTimeInForeground > 0) {
            result.add(mapOf(
              "packageName" to usageStat.packageName,
              "totalTimeInForeground" to usageStat.totalTimeInForeground,
              "lastTimeUsed" to usageStat.lastTimeUsed
            ))
          }
        }
      }
      return@Function result
    }
  }
}
