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

    private static IncomingCallPlugin instance = null;
    private static String pendingCallerName = null;
    private static String pendingCallType = null;
    private static String pendingCallerId = null;
    private static boolean pendingAutoAccept = false;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static void sendIncomingCallEvent(String callerName, String callType, String callerId, boolean autoAccept) {
        pendingCallerName = callerName;
        pendingCallType = callType;
        pendingCallerId = callerId;
        pendingAutoAccept = autoAccept;

        if (instance != null) {
            JSObject data = new JSObject();
            data.put("callerName", callerName);
            data.put("callType", callType);
            data.put("callerId", callerId);
            data.put("autoAccept", autoAccept);
            instance.notifyListeners("onIncomingCallReceived", data);
        }
    }

    @PluginMethod
    public void getPendingCall(PluginCall call) {
        JSObject ret = new JSObject();
        if (pendingCallerName != null) {
            ret.put("hasCall", true);
            ret.put("callerName", pendingCallerName);
            ret.put("callType", pendingCallType);
            ret.put("callerId", pendingCallerId);
            ret.put("autoAccept", pendingAutoAccept);
            pendingCallerName = null;
            pendingCallType = null;
            pendingCallerId = null;
            pendingAutoAccept = false;
        } else {
            ret.put("hasCall", false);
        }
        call.resolve(ret);
    }

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
            String callerId = call.getString("callerId", "");
            Context context = getContext();

            Intent serviceIntent = new Intent(context, CallNotificationService.class);
            serviceIntent.setAction(CallNotificationService.ACTION_INCOMING_CALL);
            serviceIntent.putExtra("callerName", callerName);
            serviceIntent.putExtra("callType", callType);
            serviceIntent.putExtra("callerId", callerId);

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
