# Project rules

- Never add Claude's co-author line (`Co-Authored-By: Claude...` / `Claude-Session: ...`) to commit messages.
- If a change is JS/TSX only (no new native dependencies, no changes to `app.json`/`Podfile`/`Podfile.properties.json`), there's no need to rebuild natively: just reload the app, Metro serves the bundle over the air. Only run `npx expo run:ios` when native dependencies or native config change.
- Run `npx tsc --noEmit` after every code change before considering the work done.
- Bluetooth (`react-native-ble-plx`) never works in Expo Go or in the iOS/Android simulator: there's no real Bluetooth radio or the native module. Any Bluetooth testing requires a physical iPhone with the development build installed.
- Debug `console.log` calls for the treadmill's Bluetooth protocol (FTMS) must use the `[FTMS]` prefix, so they're easy to grep in the Metro log.
