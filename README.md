# Android Frida Hooks

A couple of Frida scripts for Android device spoofing, basic integrity bypass, and experimenting with how apps detect tampering. Nothing fancy, just stuff I use for learning and testing.

These scripts are for **educational and security research only**. Do not run them on apps you don't own or have explicit permission to test. You break the rules, you carry the blame.

[![Social Banner](frida-script-banner.jpg)](https://github.com/ridhoae303/android-frida-hooks)

## What's here

Two different approaches, one goal: tweak what the app sees without making it too obvious.

| | 4.1.0 (full stealth) | 5.0.0-lean |
|---|---|---|
| **Philosophy** | Hook everything, block native access, hide deep | Hook only what's needed, stay quiet |
| **Java hooks** | 30+ methods (signatures, Build, SSL, telephony, file I/O, process list, shell commands, etc.) | ~20 methods (identifiers, properties, integrity, file hiding, /proc filter) |
| **Native hooks** | Selective open, fopen, dlopen, property_get | None |
| **Proc filtering** | Yes — Java extended + native selective | Yes — Java-only extended (maps, status, tcp, tasks, fd) |
| **Mount/mem signals** | No mount blocking; memory signals reduced via /proc sanitization | No native interaction; memory signals low due to fewer hooks |
| **Detection surface** | Higher hook count, but deeper coverage and less OS noise | Lower hook count, fewer ArtMethod mods, cleaner logcat |
| **Best for** | Apps with heavy root/memory detection | Apps that mainly check device IDs and basic integrity |
| **Duck Detector result** | Cuts many signals; mount signal gone; TEE/memory remain | Even fewer signals, but still not zero |

### 4.1.0 — "full stealth"

Tries to cover as much as possible without triggering common OS-level anomalies. Hooks Java methods for signatures, installer, telephony, system properties, plus **selective** native libc functions to block Frida-related file access without touching `/proc/mountinfo` or `/proc/mounts`. Extended Java-level `/proc` filtering hides Frida from maps, smaps, status, tcp, task threads, and fd listings. Native property spoofing syncs with Java values to avoid coherence warnings.

Use this when the app is aggressive with root checks, scans its own memory, or tries to detect Frida through process lists, port connections, or thread names.

### 5.0.0-lean — "clean and minimal"

Strips away everything that isn't strictly necessary. No native hooks, no Build field modifications, no signature replacements by default. Keeps core device ID spoofing, system property overrides, root file hiding, lightweight anti-kill, Play Integrity redirect, plus extended Java-only `/proc` sanitization (maps, smaps, status, tcp, task threads, fd). Now also includes Xposed stub, MAC address spoof, file listing hiding, and signature check bypass — all still without touching native.

This version is cleaner. Fewer hooks, less noise, harder for scanners to spot based on ArtMethod enumeration alone. Duck Detector still catches deeper stuff (SELinux, TEE attestation), but the memory footprint is way smaller.

## Features across both

- IMEI, Android ID, phone number generation (Luhn-valid IMEI, random hex ID, Indonesian prefixes)
- All generated values can be changed via RPC while the script runs
- Play Integrity / DroidGuard token faking (experimental)
- SafetyNet attest hook (returns null)
- Process list filtering to hide Frida-related entries
- Debugger detection blocked (`isDebuggerConnected()` always false)
- Root binary file checks hidden
- Installer package spoofed to Google Play
- `ro.debuggable`, `ro.secure`, `ro.build.tags` set to release values

## What neither version can do

- **SELinux anomalies** — Duck Detector probes `/proc/self/attr/current` and checks context validity. Userspace hooks can't hide that.
- **TEE attestation** — If the app uses hardware-backed key attestation, no amount of Frida hooks will fake a clean certificate chain. You need a proper keybox and a compatible device.
- **Mount namespace detection** — If your Frida server runs in a different mount namespace, detectors will find it. Magisk/KSU with proper hide settings helps here.
- **Memory trampoline scanning** — Even 4.1.0 only blocks reading `/proc/self/maps`. A detector that scans memory directly for hook-like redirections (trampolines, GOT changes) will still find them.

## Use cases

- Testing how apps react to different device fingerprints
- Reverse engineering apps that check IMEI, Android ID, or SIM data
- Practicing Frida scripting with different trade-offs (coverage vs stealth)
- Learning what scanners like Duck Detector actually look for
- Experimenting with Play Integrity checks in a controlled lab

## Usage

```bash
# attach to running app
frida -U com.target.app -l script.js

# spawn fresh
frida -U -f com.target.app -l script.js
```

For gadget mode, bundle the script and configure libfrida-gadget.config.so.

## RPC quick reference

```javascript
rpc.exports.setImei("358901234567890");
rpc.exports.setAndroidId("a1b2c3d4e5f67890");
rpc.exports.setPhone("08123456789");
rpc.exports.setModel("SM-G998B");
rpc.exports.setManufacturer("samsung");
rpc.exports.setOperator("Telkomsel");
rpc.exports.version();  // "5.0.0-lean" or "4.1.0"
rpc.exports.reload();   // re-apply hooks
```

## Tips for better results

- Combine with Magisk DenyList + Shamiko + Hide My Applist to hide root and suspicious apps
- Don't run Frida server as root if you can avoid it — use a non-root process with proper permissions
- Keep debug logging off in production testing (var DEBUG = false)
- If the app crashes, try disabling anti-kill hooks first
- Experiment with both versions and see which one triggers fewer signals for your target

## License

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-ridhoae303%20-red.svg" alt="License">
  </a>
</p>

## Created by

<p align="center">
  <a href="https://github.com/ridhoae303">
    <img src="https://img.shields.io/badge/Built%20by-@ridhoae303-111111?style=for-the-badge&logo=github">
  </a>
</p>
