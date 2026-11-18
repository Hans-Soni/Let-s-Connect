import { Capacitor, registerPlugin } from "@capacitor/core";

const IncomingCall = registerPlugin("IncomingCall");

export const enableMobileBackgroundMode = async (credentials = {}) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await IncomingCall.enableBackgroundMode({
        serverUrl: credentials.serverUrl || "",
        userId: credentials.userId || "",
        token: credentials.token || "",
      });
      console.log("[NativeCall] Background mode enabled with wake lock and native call listener");
    } catch (err) {
      console.warn("[NativeCall] Failed to enable background mode:", err);
    }
  }
};

export const triggerNativeIncomingCall = async ({ callerName, callType }) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await IncomingCall.triggerIncomingCall({
        callerName: callerName || "Someone",
        callType: callType || "audio",
      });
      console.log("[NativeCall] Native incoming call triggered (screen on + ringtone + vibration)");
    } catch (err) {
      console.warn("[NativeCall] Failed to trigger native incoming call:", err);
    }
  }
};

export const stopNativeIncomingCall = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await IncomingCall.stopIncomingCall();
      console.log("[NativeCall] Native incoming call stopped");
    } catch (err) {
      console.warn("[NativeCall] Failed to stop native incoming call:", err);
    }
  }
};
