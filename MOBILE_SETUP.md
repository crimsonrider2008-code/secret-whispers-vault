# ShadowSelf - Native Mobile Setup

This guide will help you set up ShadowSelf as a native mobile app with Face ID/Touch ID support.

## Prerequisites

- **For iOS**: macOS with Xcode installed
- **For Android**: Android Studio installed
- Node.js and npm installed
- Git

## Setup Steps

### 1. Export and Clone Your Project

1. In Lovable, click the GitHub button to export your project to GitHub
2. Clone the repository to your local machine:
   ```bash
   git clone <your-github-url>
   cd <your-project-name>
   ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Capacitor (First Time Only)

Capacitor is already configured in your project, but you need to add the native platforms:

```bash
# Add iOS platform (macOS only)
npx cap add ios

# Add Android platform
npx cap add android
```

### 4. Build Your Web App

```bash
npm run build
```

### 5. Sync Capacitor

This copies your web app to the native projects:

```bash
npx cap sync
```

### 6. Open Native IDE

**For iOS:**
```bash
npx cap open ios
```
This opens Xcode. You can then:
- Select a simulator or connect your iPhone
- Click the Play button to run the app
- Face ID/Touch ID will work on real devices

**For Android:**
```bash
npx cap open android
```
This opens Android Studio. You can then:
- Select an emulator or connect your Android device
- Click Run to launch the app
- Fingerprint authentication will work on real devices

## Testing Biometric Authentication

### On iOS Simulator:
1. Go to **Features** → **Face ID** → **Enrolled**
2. When the app prompts for Face ID, go to **Features** → **Face ID** → **Matching Face**

### On Android Emulator:
1. Go to **Settings** → **Security** → **Fingerprint**
2. Add a fingerprint (use mouse clicks to simulate fingerprint)
3. When the app prompts, use the fingerprint icon in the emulator

### On Real Devices:
- Face ID/Touch ID on iPhone will work automatically
- Fingerprint/Face unlock on Android will work automatically

## Development Workflow

After making changes in Lovable:

1. **Pull latest changes:**
   ```bash
   git pull
   ```

2. **Install any new dependencies:**
   ```bash
   npm install
   ```

3. **Rebuild and sync:**
   ```bash
   npm run build
   npx cap sync
   ```

4. **Run the app:**
   - iOS: Already open in Xcode, just click Run again
   - Android: Already open in Android Studio, just click Run again

## Hot Reload During Development

The app is configured to load from the Lovable sandbox URL for easy development. This means:
- You can see changes instantly without rebuilding
- Just refresh the app or reopen it
- When ready for production, remove the `server.url` from `capacitor.config.ts` and rebuild

## Features Enabled

✅ Face ID / Touch ID / Fingerprint authentication  
✅ Haptic feedback on button presses  
✅ Native app feel with smooth animations  
✅ Offline audio recording and storage  
✅ PIN recovery with security questions  
✅ Auto-burn confessions with native notifications (coming soon)  

## Troubleshooting

### iOS Build Errors
- Make sure you have Xcode Command Line Tools: `xcode-select --install`
- Update CocoaPods: `sudo gem install cocoapods`
- Run `npx cap sync ios` again

### Android Build Errors
- Make sure Android SDK is installed via Android Studio
- Set ANDROID_HOME environment variable
- Run `npx cap sync android` again

### Biometric Not Working
- On real devices, make sure biometric is set up in device settings
- Check that the user granted biometric permission when first prompted
- Biometric falls back to PIN if it fails

## Publishing Your App

### iOS App Store:
1. In Xcode, update your Bundle ID and signing certificates
2. Follow Apple's [App Store submission guidelines](https://developer.apple.com/app-store/submissions/)
3. Add privacy descriptions for microphone access in Info.plist

### Google Play Store:
1. In Android Studio, generate a signed APK/Bundle
2. Follow Google's [Play Store launch checklist](https://developer.android.com/distribute/best-practices/launch/)
3. Add privacy policy link in the Play Console

## Need Help?

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Biometric Auth](https://github.com/epicshaggy/capacitor-native-biometric)
- [Lovable Blog: Mobile App Development](https://lovable.dev/blog)
