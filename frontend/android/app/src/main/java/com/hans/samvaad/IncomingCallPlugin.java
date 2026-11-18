package com.hans.samvaad;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "IncomingCall")
public class IncomingCallPlugin extends Plugin {

    @PluginMethod
    public void enableBackgroundMode(PluginCall call) {
        try {
            Context context = getContext();
            String serverUrl = call.getString("serverUrl", "");
            String userId = call.getString("userId", "");
            String token = call.getString("token", "");

            Intent serviceIntent = new Intent(context, CallNotificationService.class);
            serviceIntent.setAction(CallNotificationService.ACTION_START_FOREGROUND);
            if (serverUrl != null && !serverUrl.isEmpty()) serviceIntent.putExtra("serverUrl", serverUrl);
            if (userId != null && !userId.isEmpty()) serviceIntent.putExtra("userId", userId);
            if (token != null && !token.isEmpty()) serviceIntent.putExtra("token", token);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            JSObject ret = new JSObject();
            ret.put("enabled", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to enable background mode: " + e.getMessage());
        }
    }

    @PluginMethod
    public void triggerIncomingCall(PluginCall call) {
        try {
            String callerName = call.getString("callerName", "Incoming Caller");
            String callType = call.getString("callType", "voice");
            Context context = getContext();

            Intent serviceIntent = new Intent(context, CallNotificationService.class);
            serviceIntent.setAction(CallNotificationService.ACTION_INCOMING_CALL);
            serviceIntent.putExtra("callerName", callerName);
            serviceIntent.putExtra("callType", callType);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error triggering incoming call: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopIncomingCall(PluginCall call) {
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, CallNotificationService.class);
            serviceIntent.setAction(CallNotificationService.ACTION_STOP_RINGING);
            context.startService(serviceIntent);

            JSObject ret = new JSObject();
            ret.put("stopped", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error stopping incoming call: " + e.getMessage());
        }
    }
}
