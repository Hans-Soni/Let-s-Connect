package com.hans.samvaad;

import android.app.KeyguardManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.WindowManager;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "IncomingCall")
public class IncomingCallPlugin extends Plugin {

    private static final String CHANNEL_ID = "samvaad_calls_channel_v2";
    private static final int CALL_NOTIFICATION_ID = 90210;

    private PowerManager.WakeLock partialWakeLock = null;
    private PowerManager.WakeLock screenWakeLock = null;
    private Ringtone ringtone = null;

    @PluginMethod
    public void enableBackgroundMode(PluginCall call) {
        try {
            Context context = getContext();
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null && (partialWakeLock == null || !partialWakeLock.isHeld())) {
                partialWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Samvaad::BackgroundWakeLock");
                partialWakeLock.setReferenceCounted(false);
                partialWakeLock.acquire(12 * 60 * 60 * 1000L); // 12 hours
            }

            createCallNotificationChannel();

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

            createCallNotificationChannel();

            // 1. Turn screen ON and wake up device immediately
            wakeUpScreen();

            // 2. Play native device ringtone
            startRingtone();

            // 3. Trigger hardware vibration
            startVibration();

            // 4. Show FullScreen High-Priority Incoming Call Notification
            Intent fullScreenIntent = new Intent(context, MainActivity.class);
            fullScreenIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_SINGLE_TOP |
                Intent.FLAG_ACTIVITY_CLEAR_TOP
            );
            fullScreenIntent.putExtra("isIncomingCall", true);
            fullScreenIntent.putExtra("callerName", callerName);
            fullScreenIntent.putExtra("callType", callType);

            int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getActivity(context, 101, fullScreenIntent, pendingFlags);

            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            if (ringtoneUri == null) {
                ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("Incoming " + (callType.equalsIgnoreCase("video") ? "Video" : "Voice") + " Call")
                .setContentText(callerName + " is calling you on Samवाद")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setSound(ringtoneUri)
                .setFullScreenIntent(pendingIntent, true)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setOngoing(true);

            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(CALL_NOTIFICATION_ID, builder.build());
            }

            // 5. Bring MainActivity to foreground over the lock screen
            try {
                context.startActivity(fullScreenIntent);
            } catch (Exception actErr) {
                // Ignore if background activity launch restriction applies; notification with FullScreenIntent will handle it
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
            stopRingtone();
            stopVibration();

            Context context = getContext();
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.cancel(CALL_NOTIFICATION_ID);
            }

            if (screenWakeLock != null && screenWakeLock.isHeld()) {
                screenWakeLock.release();
                screenWakeLock = null;
            }

            JSObject ret = new JSObject();
            ret.put("stopped", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error stopping incoming call: " + e.getMessage());
        }
    }

    private void createCallNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                NotificationChannel channel = manager.getNotificationChannel(CHANNEL_ID);
                if (channel == null) {
                    channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Samवाद Incoming Calls",
                        NotificationManager.IMPORTANCE_HIGH
                    );
                    channel.setDescription("High-priority incoming audio and video call ring notifications");
                    channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                    channel.enableVibration(true);
                    channel.setVibrationPattern(new long[]{0, 1000, 800, 1000, 800});

                    Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                    if (soundUri != null) {
                        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                            .build();
                        channel.setSound(soundUri, audioAttributes);
                    }
                    manager.createNotificationChannel(channel);
                }
            }
        }
    }

    private void wakeUpScreen() {
        try {
            Context context = getContext();
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                if (screenWakeLock != null && screenWakeLock.isHeld()) {
                    screenWakeLock.release();
                }
                screenWakeLock = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                    PowerManager.ACQUIRE_CAUSES_WAKEUP |
                    PowerManager.ON_AFTER_RELEASE,
                    "Samvaad::CallScreenWakeLock"
                );
                screenWakeLock.setReferenceCounted(false);
                screenWakeLock.acquire(45000L); // 45s ringing timeout
            }

            if (getActivity() != null) {
                getActivity().runOnUiThread(() -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                        getActivity().setShowWhenLocked(true);
                        getActivity().setTurnScreenOn(true);
                    }
                    getActivity().getWindow().addFlags(
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    );

                    KeyguardManager km = (KeyguardManager) context.getSystemService(Context.KEYGUARD_SERVICE);
                    if (km != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        km.requestDismissKeyguard(getActivity(), null);
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private synchronized void startRingtone() {
        try {
            stopRingtone();
            Context context = getContext();
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            if (ringtoneUri == null) {
                ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            ringtone = RingtoneManager.getRingtone(context, ringtoneUri);
            if (ringtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    ringtone.setLooping(true);
                }
                ringtone.play();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private synchronized void stopRingtone() {
        try {
            if (ringtone != null && ringtone.isPlaying()) {
                ringtone.stop();
            }
            ringtone = null;
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void startVibration() {
        try {
            Vibrator vibrator = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = new long[]{0, 1000, 800, 1000, 800};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 1));
                } else {
                    vibrator.vibrate(pattern, 1);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void stopVibration() {
        try {
            Vibrator vibrator = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null) {
                vibrator.cancel();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
