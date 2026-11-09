# Samvād Android Native Bridge (`frontend/android`)

The `frontend/android` directory contains the native Android wrapper project for **Samvād (Samवाद)**, generated and synchronized using [Capacitor](https://capacitorjs.com/). This allows Samvād to run as a high-performance native Android application with direct access to hardware capabilities (camera, microphone, audio router, hardware-accelerated WebRTC, and persistent storage), providing a seamless, one-click installation experience identical to native apps like WhatsApp or Instagram.

---

## Architecture Overview

```
frontend/android/
├── app/                                    # Main Android Application Module
│   ├── build.gradle                        # App-level Gradle build configuration
│   ├── capacitor.build.gradle              # Capacitor-injected dependencies & plugins
│   ├── proguard-rules.pro                  # Code obfuscation and optimization rules
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml         # App permissions, intent filters & activities
│       │   ├── java/com/hans/samvaad/
│       │   │   └── MainActivity.java       # Native entry point extending BridgeActivity
│       │   ├── assets/
│       │   │   ├── capacitor.config.json   # Native runtime configuration
│       │   │   └── public/                 # Bundled production web build (from dist/)
│       │   └── res/                        # App resources (drawables, mipmaps, strings, styles)
│       │       ├── mipmap-*/               # Adaptive launcher icons (ic_launcher.png)
│       │       ├── drawable-*/             # Native splash screens and background layers
│       │       ├── values/                 # XML string constants, color palettes & styles
│       │       └── xml/                    # FileProvider and Capacitor configuration XMLs
├── gradle/
│   └── wrapper/                            # Gradle wrapper JAR and wrapper properties
├── build.gradle                            # Top-level root Android build configuration
├── settings.gradle                         # Multi-project gradle inclusion settings
├── variables.gradle                        # Shared Android SDK versions & library variables
├── capacitor.settings.gradle               # Auto-generated Capacitor plugin inclusions
├── gradlew & gradlew.bat                   # Gradle build execution wrapper scripts
└── README.md                               # This native architecture documentation
```

---

## Detailed File-by-File Breakdown

### 1. Core Configuration & Manifests
* **`app/src/main/AndroidManifest.xml`**:
  * Registers package namespace `com.hans.samvaad`.
  * Configures `MainActivity` as the launcher activity with `singleTask` launch mode and orientation change handlers.
  * Declares required Android runtime permissions:
    * `android.permission.INTERNET`: Socket.io, REST APIs, and WebRTC peer streaming.
    * `android.permission.ACCESS_NETWORK_STATE`: Connectivity detection.
    * `android.permission.CAMERA`: Live WebRTC video calling and profile picture capture.
    * `android.permission.RECORD_AUDIO`: Voice notes and WebRTC audio calling.
    * `android.permission.MODIFY_AUDIO_SETTINGS`: Toggling speakerphone / earpiece audio routing during calls.
    * `android.permission.READ_EXTERNAL_STORAGE` & `READ_MEDIA_IMAGES`: Photo gallery access for media sharing.
  * Declares optional hardware features (`android.hardware.camera`, `android.hardware.camera.autofocus`) with `required="false"` so devices lacking specialized optics can still install the app.
  * Registers AndroidX `FileProvider` for secure sandbox file sharing.
* **`app/src/main/java/com/hans/samvaad/MainActivity.java`**:
  * Inherits from `com.getcapacitor.BridgeActivity`.
  * Automatically initializes the Capacitor Chromium WebView container, sets up JavaScript-to-Native bridges, and boots the bundled frontend application.
* **`frontend/capacitor.config.json`**:
  * Defines app ID (`com.hans.samvaad`), app name (`Samवाद`), and web directory (`dist`).
  * Enables cleartext HTTP traffic and custom androidScheme for development compatibility.
  * Configures keyboard resize behavior (`resize: "body"`, `style: "DARK"`) to ensure the chat input bar is never obscured by the software keyboard.

---

### 2. Gradle Build System
* **`build.gradle` (Root)**: Defines Gradle repositories (Google, MavenCentral) and the Android Gradle Plugin (AGP) version.
* **`variables.gradle`**: Centralizes Android build tools specifications:
  * `minSdkVersion = 22` (Android 5.1 Lollipop and above)
  * `compileSdkVersion = 34` (Android 14)
  * `targetSdkVersion = 34` (Android 14)
  * `androidxActivityVersion`, `androidxAppCompatVersion`, and support libraries.
* **`app/build.gradle`**:
  * Configures application signing, build types (`debug` and `release`), minification, and ProGuard optimization.
  * Injects Capacitor core dependencies and compiled native plugins.
* **`gradlew` / `gradlew.bat`**: Portable Gradle wrapper scripts allowing compilation on machines without a globally installed Gradle binary.

---

### 3. Application Assets & Visual Branding
* **`app/src/main/res/mipmap-*/`**: Multi-density launcher icons (MDPI, HDPI, XHDPI, XXHDPI, XXXHDPI) ensuring crisp, high-resolution icons on any Android screen.
* **`app/src/main/res/drawable-*/`**: Native splash screens and background vectors displayed during initial app cold starts.
* **`app/src/main/assets/public/`**: Synced production bundle of the React frontend (`dist/`), containing pre-compiled JavaScript, CSS, HTML, Service Worker, and audio assets.

---

## How to Build the Native Android APK

### Prerequisites
1. **Java Development Kit (JDK 17 or JDK 21)** installed and added to `JAVA_HOME`.
2. **Android SDK / Android Studio** installed with Build Tools 34.0.0.

### Step 1: Build & Synchronize Frontend
From the repository root or `frontend` directory:
```bash
# Build the production React web bundle
npm run build --prefix frontend

# Sync compiled web assets into native Android public directory
npm run cap:sync --prefix frontend
```

### Step 2: Compile Debug APK via Command Line
Run the Gradle wrapper directly from the `frontend/android` folder:

**On Windows (PowerShell):**
```powershell
cd frontend/android
.\gradlew.bat assembleDebug
```

**On Linux / macOS:**
```bash
cd frontend/android
./gradlew assembleDebug
```

The generated APK will be output to:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 3: Compile Signed Release APK
To produce an optimized, production-ready APK for distribution or sideloading:
```bash
cd frontend/android
./gradlew assembleRelease
```
The output APK will be generated at:
```
frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk
```
*(Sign with `apksigner` and your production keystore before distributing to users).*

### Step 4: Open in Android Studio (GUI)
To debug, inspect layouts, or run on an emulator/connected physical device:
```bash
npm run cap:open --prefix frontend
```
Or open the `frontend/android` directory directly in Android Studio.

---

## Troubleshooting & Best Practices

1. **Camera or Microphone Permission Prompts**:
   * If a user initiates a call without granting permissions, Capacitor will automatically trigger the native Android runtime permission dialog based on `AndroidManifest.xml`.
2. **Asset Synchronization**:
   * Always run `npm run cap:sync` after making frontend modifications so that changes in `src/` are compiled to `dist/` and copied to `app/src/main/assets/public/`.
3. **WebRTC Hardware Acceleration**:
   * The underlying Android Chromium WebView natively offloads WebRTC VP8/VP9/H.264 video decoding and Opus audio processing to hardware codecs for minimal battery consumption.

