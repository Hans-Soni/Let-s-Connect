package com.hans.samvaad;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class CallNotificationService extends Service {

    public static final String ACTION_START_FOREGROUND = "com.hans.samvaad.action.START_FOREGROUND";
    public static final String ACTION_INCOMING_CALL = "com.hans.samvaad.action.INCOMING_CALL";
    public static final String ACTION_STOP_RINGING = "com.hans.samvaad.action.STOP_RINGING";

    private static final String CHANNEL_ID_ACTIVE = "samvaad_service_channel";
    private static final String CHANNEL_ID_CALLS = "samvaad_calls_channel_v3";
    private static final int FOREGROUND_SERVICE_ID = 90209;
    private static final int INCOMING_CALL_ID = 90210;

    private PowerManager.WakeLock cpuWakeLock = null;
    private PowerManager.WakeLock screenWakeLock = null;
    private MediaPlayer mediaPlayer = null;
    private Vibrator vibrator = null;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();

        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            cpuWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Samvaad::CallServiceCpuWake");
            cpuWakeLock.setReferenceCounted(false);
            cpuWakeLock.acquire(24 * 60 * 60 * 1000L); // 24 hours keep-alive
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_STICKY;

        String action = intent.getAction();
        if (ACTION_START_FOREGROUND.equals(action)) {
            startForegroundNotification();
        } else if (ACTION_INCOMING_CALL.equals(action)) {
            String callerName = intent.getStringExtra("callerName");
            if (callerName == null || callerName.isEmpty()) callerName = "Incoming Caller";
            String callType = intent.getStringExtra("callType");
            if (callType == null || callType.isEmpty()) callType = "voice";

            handleIncomingCall(callerName, callType);
        } else if (ACTION_STOP_RINGING.equals(action)) {
            stopIncomingRinging();
        }

        return START_STICKY;
    }

    private void startForegroundNotification() {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID_ACTIVE)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Samवाद")
            .setContentText("Active to receive calls")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true);

        startForeground(FOREGROUND_SERVICE_ID, builder.build());
    }

    private void handleIncomingCall(String callerName, String callType) {
        // 1. Wake the physical screen immediately
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                if (screenWakeLock != null && screenWakeLock.isHeld()) {
                    screenWakeLock.release();
                }
                screenWakeLock = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                    PowerManager.ACQUIRE_CAUSES_WAKEUP |
                    PowerManager.ON_AFTER_RELEASE,
                    "Samvaad::IncomingCallScreenWake"
                );
                screenWakeLock.acquire(45000L); // 45s ringing timeout
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 2. Start hardware vibration
        try {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
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

        // 3. Play system incoming call ringtone with MediaPlayer
        try {
            stopRingtonePlayer();
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            if (ringtoneUri == null) {
                ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(this, ringtoneUri);
            mediaPlayer.setAudioAttributes(
                new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setLegacyStreamType(AudioManager.STREAM_RING)
                    .build()
            );
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 4. Build FullScreenIntent pointing to MainActivity
        Intent fullScreenIntent = new Intent(this, MainActivity.class);
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

        PendingIntent pendingIntent = PendingIntent.getActivity(this, 101, fullScreenIntent, pendingFlags);

        NotificationCompat.Builder callNotifBuilder = new NotificationCompat.Builder(this, CHANNEL_ID_CALLS)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Incoming " + (callType.equalsIgnoreCase("video") ? "Video" : "Voice") + " Call")
            .setContentText(callerName + " is calling you on Samवाद")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setFullScreenIntent(pendingIntent, true)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setAutoCancel(true);

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(INCOMING_CALL_ID, callNotifBuilder.build());
        }

        // 5. Attempt direct launch of MainActivity over lock screen
        try {
            startActivity(fullScreenIntent);
        } catch (Exception e) {
            // FullScreenIntent from notification handles display if background start is blocked by OS
        }
    }

    private void stopIncomingRinging() {
        stopRingtonePlayer();

        if (vibrator != null) {
            vibrator.cancel();
            vibrator = null;
        }

        if (screenWakeLock != null && screenWakeLock.isHeld()) {
            screenWakeLock.release();
            screenWakeLock = null;
        }

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(INCOMING_CALL_ID);
        }
    }

    private void stopRingtonePlayer() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.reset();
                mediaPlayer.release();
            } catch (Exception e) {
                e.printStackTrace();
            }
            mediaPlayer = null;
        }
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                // Background Service Channel
                NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID_ACTIVE,
                    "Samवाद Background Service",
                    NotificationManager.IMPORTANCE_LOW
                );
                serviceChannel.setDescription("Keeps Samवाद active to receive incoming calls");
                manager.createNotificationChannel(serviceChannel);

                // High Priority Calls Channel
                NotificationChannel callChannel = new NotificationChannel(
                    CHANNEL_ID_CALLS,
                    "Samवाद Incoming Calls",
                    NotificationManager.IMPORTANCE_HIGH
                );
                callChannel.setDescription("Urgent full-screen incoming call ringing notifications");
                callChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                callChannel.enableVibration(true);
                callChannel.setVibrationPattern(new long[]{0, 1000, 800, 1000, 800});

                Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                if (soundUri != null) {
                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .build();
                    callChannel.setSound(soundUri, audioAttributes);
                }
                manager.createNotificationChannel(callChannel);
            }
        }
    }

    @Override
    public void onDestroy() {
        stopIncomingRinging();
        if (cpuWakeLock != null && cpuWakeLock.isHeld()) {
            cpuWakeLock.release();
            cpuWakeLock = null;
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
