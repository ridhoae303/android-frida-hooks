# Android Frida Hooks — 5.0.0-lean

Minimal-footprint Frida script for Android device spoofing, integrity bypass, and hiding common Frida traces — all from Java layer only, zero native hooks. Built to leave as few traces as possible while still being useful for testing.

This is **not** an all-in-one bypass tool. Duck Detector and similar scanners will still catch deeper signals (mount, SELinux, TEE). This script only handles Java-layer hooks that are actually needed — but now covers more ground than the previous lean build.

## Disclaimer

This project is for **educational and security research purposes only**.

Don't use this on apps you don't own or don't have permission to test. If you misuse it, that's on you.

## Why this exists

The lean edition focuses on the essentials, reducing the hook count significantly compared to full-fat versions. Fewer hooks mean fewer ArtMethod modifications and a smaller memory footprint — useful when you want to stay quiet. This update adds a few critical hooks that were missing before, but still keeps the overall hook count low and avoids native tampering entirely.

## Features

### Device Identity Spoofing
- IMEI — generated with valid Luhn checksum, overridable via RPC
- Android ID — random 16‑char hex, overridable via RPC
- Phone number — random Indonesian prefix, overridable via RPC
- MEID, subscriber ID, SIM serial — static safe defaults
- Network operator — overridable via RPC
- Device model, manufacturer — overridable via RPC

### System Property Overrides
- `ro.debuggable` → `0`
- `ro.secure` → `1`
- `ro.build.tags` → `release-keys`

> Build.* static fields are **not** modified — that's a huge red flag for scanners. System.getProperty is subtler.

### Installer Package Spoofing
- Returns `com.android.vending` when the app asks who installed it.

### Root Check Hiding
- File existence checks for `su`, `busybox`, `Superuser.apk`, and any path containing "frida" or "gadget" return `false`.

### Signature Bypass
- `checkSignatures()` forced to return `0` (signature match).

### Anti‑Kill (minimal)
- Blocks `Process.killProcess()`
- Suppresses SIGKILL / SIGTERM via `Process.sendSignal()`
- Blocks `System.exit()`

### Play Integrity / DroidGuard (experimental)
- Hooks `DroidGuardClient.attest()` → returns fake JSON token
- Hooks `IntegrityManager.requestIntegrityToken()` → returns fake token string
- Hooks `SafetyNetApi.attest()` → returns null

### Process List Filtering
- `getRunningAppProcesses()` filters out entries containing `frida` or `gum-js`.

### Debugger Detection
- `isDebuggerConnected()` always returns `false`.

### MAC Address Spoof
- `NetworkInterface.getHardwareAddress()` returns a dummy MAC (`02:00:00:00:00:00`).

### Xposed Bridge Stub
- `de.robv.android.xposed.XposedBridge.hookAllMethods()` returns null, neutralizing some Xposed detection methods.

### File Listing Hiding
- `File.listFiles()` and `File.list()` filter out entries whose names contain "frida" or "gadget".

### Extended /proc Sanitization (Java‑only, no native)
- Reading `/proc/self/maps` and `/proc/self/smaps` — lines containing "frida" are skipped.
- `/proc/self/status` — `TracerPid` forced to `0`.
- `/proc/self/task/*/status` and `…/comm` — thread names containing "frida", "gum-js", or "gadget" are replaced with generic names (`thread_main`, `main`).
- `/proc/net/tcp` and `/proc/net/tcp6` — lines containing the Frida port (`69B6`) are removed.
- `/proc/self/fd` — lines containing "frida" are skipped.

All of this happens inside `BufferedReader.readLine()`, so no native hooks are used and no mount/proc blanket blocking occurs.

## Configuration

Default values are set in the script body — no config file needed.

```javascript
var DEBUG = false;    // set to true if you need verbose logging
var DEVICE_MODEL = "Pixel 6 Pro";
var DEVICE_MANUFACTURER = "Google";
var INSTALLER = "com.android.vending";
var OPERATOR_NAME = "Telkomsel";
```

All spoofed device identifiers (IMEI, Android ID, phone) are generated automatically on load. Change them at runtime via RPC if needed.

## Usage

Attach to a running app or spawn a new one:

```bash
frida -U com.target.app -l script.js
# or spawn
frida -U -f com.target.app -l script.js
```

For gadget mode, bundle the script inside the APK and configure libfrida-gadget.config.so.

## RPC Commands

Available from the Frida REPL or an external client:

Command Description

```javascript
rpc.exports.setImei("...") Override IMEI
rpc.exports.setAndroidId("...") Override Android ID
rpc.exports.setPhone("...") Override phone number
rpc.exports.setModel("...") Override device model
rpc.exports.setManufacturer("...") Override device manufacturer
rpc.exports.setOperator("...") Override network operator name
rpc.exports.version() Print script version
rpc.exports.reload() Re‑apply hooks (placeholder)
```

### Example inside Frida REPL:

```javascript
rpc.exports.setImei("358901234567890");
```

## Version

5.0.0-lean — **stripped down for lower detection surface, but now with extended Java‑only /proc filtering and extra spoof hooks**.

## Notes

- Some Play Integrity hook class names may differ across GMS versions. Adjust if the app crashes.
- If the target app uses native attestation or TEE‑level checks, this script alone won't help.
- The extended /proc filtering relies solely on Java I/O hooks, so native code that reads /proc directly will bypass it. For that scenario, use the 4.1.0-stealth variant instead.
- Pair this with Magisk DenyList + Shamiko + Hide My Applist for better results.
- Debug logging is off by default — keeping logcat clean is part of the stealth strategy.

## Use Cases

- Testing how apps react to different device fingerprints
- Reverse engineering apps that check IMEI / Android ID / SIM data
- Practicing Frida scripting with a minimal‑surface approach
- Learning what scanners like Duck Detector actually look for
- Building a base script that can be extended without starting from scratch

## License

<p align="center">
  <a href="../LICENSE">
    <img src="https://img.shields.io/badge/License-ridhoae303%20-blue.svg" alt="License">
  </a>
</p>

## Created by

<p align="center">
  <a href="https://github.com/ridhoae303">
    <img src="https://img.shields.io/badge/Built%20by-@ridhoae303-111111?style=for-the-badge&logo=github">
  </a>
</p>
