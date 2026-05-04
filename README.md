# Noor Atlas

Prayer companion app built with React Native and Expo.

## Stack

- Expo SDK 54
- React Native 0.81
- expo-audio, expo-av, expo-font, expo-haptics, expo-linear-gradient, expo-location, expo-notifications
- AsyncStorage, react-native-svg

## Run locally

```bash
npm install
npx expo start --tunnel
```

Open the project in Expo Go on iPhone or Android and scan the QR code.

## Build unsigned iOS IPA with Bitrise (recommended)

This repository ships with `bitrise.yml` configured for an unsigned iOS build.

1. Sign in to <https://app.bitrise.io> with your GitHub account.
2. Click `Add new app`, pick this GitHub repository, accept `I need to do manual configuration` if Bitrise asks how to configure.
3. Bitrise detects the bundled `bitrise.yml` automatically.
4. On `Stack & Machine`, the config already pins `osx-xcode-16.4.x-sequoia`. Leave the default.
5. Open the `Workflows` tab, select `build-unsigned-ipa`, click `Start build`.
6. Wait for the macOS job to finish. The first run is ≈ 15 minutes, rebuilds are faster thanks to the npm and CocoaPods caches.
7. Open the finished build, scroll to `Apps & Artifacts`, download `NoorAtlas-unsigned.ipa`.

Notes:

- The workflow runs `expo prebuild`, installs CocoaPods, builds an unsigned `.app`, strips signature artefacts, zips it as `Payload/NoorAtlas.app` into `NoorAtlas-unsigned.ipa`, and uploads the IPA plus the full `xcodebuild.log`.
- The free Bitrise tier gives ≈ 200 build minutes per month, enough for several rebuilds.

## Build unsigned iOS IPA with GitHub Actions (alternative)

The repo also includes `.github/workflows/build-ios-unsigned-ipa.yml`.

1. Open the repository on GitHub, go to `Actions`.
2. Select `Build iOS Unsigned IPA`, click `Run workflow`.
3. After the macOS job finishes, download the artifact `NoorAtlas-unsigned-ipa` and extract `NoorAtlas-unsigned.ipa` from it.

## Install on iPhone with Sideloadly

1. Install Sideloadly: <https://sideloadly.io>
2. Install iTunes from Microsoft Store on Windows.
3. Connect the iPhone with USB.
4. Open Sideloadly.
5. Enter your Apple ID.
6. Drag `NoorAtlas-unsigned.ipa` into the Sideloadly window.
7. Click `Start`.
8. On iPhone, open `Settings -> General -> VPN & Device Management` and trust the Apple ID profile.

With a free Apple ID, the app will need to be reinstalled every 7 days.
