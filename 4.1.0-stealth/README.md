# Android Frida Hooks — 4.1.0-stealth

Multi-purpose Frida script for Android testing, spoofing, and bypass scenarios. Now with more selective native hardening so it won't scream "look at me" to Duck Detector and friends.

Started as a personal learning project while messing around with Android dynamic analysis. Most of what is here is experimental, but it works well enough for testing and research.

## Disclaimer (read this or get rekt)

This project is for **educational and security research only**. Do not use this on apps you do not own or do not have explicit permission to test. If you ignore this and get yourself banned, sued, or worse, that is on you. No cap.

If you plan to use this in the wild, make sure you have proper authorization. Otherwise, just stick to your own test devices and sandboxes.

## Why this exists

Made mainly to:

- Learn Android dynamic analysis and native hooking
- Understand how Android APIs and native libs behave at runtime
- Test apps in controlled environments
- Try out spoofing and bypass techniques
- Break things, see what happens, fix them, break again

## What is new in this version

The script still includes native hooks, but they are now **smarter and quieter**. Instead of blindly blocking `/proc/mountinfo` and `/proc/mounts` (which caused critical mount signals in Duck Detector), the native layer only intercepts actual Frida-related file paths (`frida-agent`, `gadget`, `frida-server`). The Java layer takes care of sanitizing `/proc` content — without touching the mount points that Duck Detector watches.

Also included:

- **Java-level `/proc` sanitization extended** — now covers `/proc/net/tcp`, `/proc/net/tcp6`, `/proc/self/task/*/status` (thread name), `/proc/self/task/*/comm`, and `/proc/self/fd`. This hides Frida's port, thread names, and file descriptors without native hooks.
- **Native property sync** — `__system_property_get` now also returns the same fake values for `ro.product.model`, `ro.product.manufacturer`, etc., so there are no coherence anomalies between Java and native property reads.
- **Lenient shell command filtering** — only obviously malicious commands (frida, magisk, su, etc.) are blocked; standard tools like `ps`, `getprop`, and `mount` are left alone so the target doesn't look weird.
- **No more native mount/proc blanket blocking** — the previous approach was too aggressive and created its own detection surface.

If you want to stay even more hidden, combine this with Hide My Applist (HMA) to hide your app list, and do not forget to configure it properly.

## Features

### Package and Signature Hooks

- Replace app signatures at runtime with a static fake one
- Signature verification always returns true
- Fake installer package name (defaults to Play Store)
- `checkSignatures()` forced to return 0 (match)

### Device Spoofing (auto-generated, no manual tweaks)

All values are generated when the script loads. No hardcoded data.

- IMEI with valid Luhn checksum
- Android ID (random 16-digit hex)
- Phone number (Indonesian-style prefixes, can be changed via RPC)
- Network operator, device model, manufacturer randomly picked
- All values can be overridden via RPC while the script runs

### Anti-Detection and Stealth

- Blocks root binary file checks (`su`, `busybox`, `Superuser.apk`, etc.)
- Blocks Frida-related files from `java.io.File` and native `open()`
- Hides Frida environment variables (`FRIDA_*`, `GUM_*`)
- Filters Frida processes from `getRunningAppProcesses`
- Spoofs MAC address
- Overrides system properties (`ro.debuggable`, `ro.secure`, `ro.build.tags`) both in Java and natively
- Fakes `hasSystemFeature()` results (telephony, wifi, bluetooth)
- Prevents loading of Frida agent/gadget via `dlopen` and `android_dlopen_ext`
- Blocks direct native access only to Frida-related file paths (not `/proc/mounts`, not `/proc/mountinfo`)
- Sanitizes Java-level reading of `/proc/self/maps`, `smaps`, `status`, `/proc/net/tcp*`, `/proc/self/task/*/status`, `/proc/self/task/*/comm`, `/proc/self/fd`
- Blocks suspicious shell commands (`frida`, `xposed`, `busybox`, `magisk`, `su`, `tcpdump`, `dalvikvm`, `app_process`) through `Runtime.exec` and `ProcessBuilder`

### Anti-Kill / Anti-Exit

Stops the app from killing itself. Hooks:

- `Activity.finish()`
- `finishAffinity()`
- `moveTaskToBack()`
- `System.exit()`
- `runFinalizersOnExit()`
- `Process.killProcess()`
- `sendSignal()` (SIGKILL and SIGTERM)
- `ActivityManager.killBackgroundProcesses()`
- `restartPackage()`

### SSL Bypass (optional, toggle flag)

- Disables SSL pinning (set `sslByp = true`)
- Overrides hostname verifier to trust everything

### Play Integrity / SafetyNet Bypass (experimental)

- Hooks `DroidGuardClient.attest()` and returns a fake token
- Hooks `IntegrityManager.requestIntegrityToken()` and returns a fake token
- Hooks `SafetyNetApi.attest()` and returns null

These are still experimental and might need class name adjustments per app.

### Other Tweaks

- Spoofs `Build.getSerial()`
- Spoofs `NetworkInterface.getHardwareAddress()` (MAC)
- Zero manual configuration needed: everything auto-generates

## How to Use

Load with Frida:

```javascript
frida -U -f com.target.app -l script.js
```

Or attach to a running process:

```javascript
frida -U com.target.app -l script.js
```

## RPC Commands

You can change spoofed values on the fly.

Command Description:

```javascript
setImei("123456789012345") Change IMEI
setAndroidId("a1b2c3d4e5f67890") Change Android ID
setPhone("08123456789") Change phone number
setModel("SM-G998B") Change device model
setManufacturer("samsung") Change manufacturer
setOperator("Telkomsel") Change operator
reload() Re-apply all hooks
version() Show script version
```

### Example in Frida REPL:

```javascript
rpc.exports.setImei("358901234567890");
```

## Configuration

By default, the script works out of the box. You only need to touch a couple flags if you want to:

- Enable SSL bypass: `var sslByp = false; -> true`
- Turn off debug logs: `var debug = true; -> false`
- If you want to disable some anti-detection parts (not recommended), you can comment out sections.

## Important Notes and Caveats

- Duck Detector mount signals are now clean. The native layer no longer blocks `/proc/mountinfo` or `/proc/mounts`, so the "critical mount signal" reported in earlier versions should be gone.
- The script still blocks Frida-related file access, but it no longer causes the system to look weird by breaking standard `/proc` files.
- Memory scanning detectors (like the "68 high-risk memory signals" previously reported) will likely still see some noise because Frida's Java hooks leave ArtMethod trampolines. The extended `/proc` filtering helps reduce easy wins, but it's not a full memory cloaking.
- TEE/CRL verdicts cannot be cleared by this script. If your device has a revoked certificate or broken verified boot, Duck Detector will still show TAMPERED. That's an OS-level issue, not something a Frida script can fix.
- For extra safety, use Hide My Applist (HMA) or similar tools to hide apps like Frida server manager, LSPosed, MT Manager, Termux, etc. Duck Detector already looks for those apps, so keeping them hidden is a must.
- Play Integrity bypass here is purely Java-level; if the app uses hardware attestation or a strict nonce check, it will not hold. Combine with a proper keybox solution if you need real PI passing.
- Some anti-kill hooks may crash apps that rely on the original kill behavior. Test thoroughly.
- All native hooks assume a standard libc.so path and `__system_property_get` symbol. If the device uses a different libc or the symbol is stripped, adjust accordingly.

## Use Cases

Good for:

- Android app security testing
- Dynamic analysis and behavior observation
- Device spoofing experiments
- Reverse engineering practice
- Learning about Frida's native hooking capabilities

Not meant for:

- Illegal modification of third-party apps
- Cheating in online services
- Bypassing protections on apps you do not own

## Version

Current: 4.1.0 (**stealth hardened — selective native, extended Java proc**)

## License

<p align="center">
  <a href="../LICENSE">
    <img src="https://img.shields.io/badge/License-ridhoae303%20-green.svg" alt="License">
  </a>
</p>

## Created by

<p align="center">
  <a href="https://github.com/ridhoae303">
    <img src="https://img.shields.io/badge/Built%20by-@ridhoae303-111111?style=for-the-badge&logo=github">
  </a>
</p>
