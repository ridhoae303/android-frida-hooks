# Android Frida Hooks Script

[![Social Banner](frida-script-banner.jpg)](https://github.com/ridhoae303/android-frida-hooks)

Multi-purpose Frida script for Android testing, spoofing, and basic bypass scenarios.

This started as a personal learning project while messing around with Android dynamic analysis. Most of what's here is experimental, but useful enough to share.

## Disclaimer

This project is for **educational and security research purposes only**.

Don't use this on apps you don't own or don't have permission to test. If you misuse it, that's on you.

## Why this exists

Made mainly to:

- Learn Android dynamic analysis
- Understand how Android APIs behave at runtime
- Test apps in controlled environments
- Try basic bypass and spoofing techniques
- Break things and see what happens

## Features

### Package & Signature Hooks

- Replace app signatures at runtime
- Bypass signature verification (always returns `true`)
- Fake installer package name (defaults to Play Store)
- Override `checkSignatures()` to always return `0`

### Device Spoofing  
*(auto-generated — no hardcoded values)*

Everything is generated automatically when the script loads.

- IMEI — generated with valid **Luhn checksum**
- Android ID — random **16-digit hex**
- Phone number — random (**Indonesian-style prefixes**)
- Network operator — randomly picked from a list
- Device model — randomly selected
- Manufacturer — randomly selected

All values can still be changed later using RPC.

### Anti-Detection & Hiding

- Blocks root checks (`su`, `busybox`, `Superuser.apk`)
- Disables Xposed detection (`XposedBridge.hookAllMethods`)
- Blocks Frida-related library loading  
  (`frida-gadget`, `frida-agent`)
- Hides debugger detection  
  (`isDebuggerConnected()` always returns `false`)
- Filters Frida processes from `getRunningAppProcesses`
- Spoofs MAC address
- Overrides system properties:
  - `ro.debuggable`
  - `ro.secure`
  - `ro.build.tags`
- Fakes `hasSystemFeature()` results  
  (telephony / wifi / bluetooth)

### Anti-Kill / Anti-Exit

Stops apps from killing themselves.

- Blocks `Activity.finish()`
- Blocks `finishAffinity()`
- Blocks `moveTaskToBack()`
- Blocks `System.exit()`
- Blocks `runFinalizersOnExit()`
- Blocks `Process.killProcess()`
- Blocks `sendSignal()` (`SIGKILL` / `SIGTERM`)
- Blocks `ActivityManager.killBackgroundProcesses()`
- Blocks `restartPackage()`

### SSL Bypass *(Optional)*

- Disables SSL pinning  
  *(just flip the flag in the script)*
- Overrides `HostnameVerifier`  
  (trusts all hosts)

### Play Integrity / SafetyNet *(Experimental)*

Still experimental. Might need tweaks depending on the target app.

- Hooks `DroidGuardClient.attest()` → returns fake token
- Hooks `IntegrityManager.requestIntegrityToken()` → returns fake token
- Hooks `SafetyNetApi.attest()` → returns `null`

### Other Stuff

- Spoofs `Build.getSerial()`
- Spoofs `NetworkInterface.getHardwareAddress()` (MAC)
- All spoofed values are generated automatically at startup

No manual editing needed.

## Configuration

Out of the box, **you don't need to change anything**.

The script automatically generates:

- IMEI
- Android ID
- Phone number
- Device model
- Manufacturer
- Operator

If you want to tweak behavior, edit these flags inside the script.

### Examples

```javascript
SSL Bypass
var sslByp = false;   // change to true

Disable Debug Logs
var debug = true;   // change to false

Disable Anti-Detection (not recommended)
var hide_traces = true;   // change to false
```

## Usage

Load the script with Frida:

```javascript
frida -U -f com.target.app -l script.js
```

## RPC Commands

You can change spoofed values while the script is running.

Command	Description

- setImei("123456789012345")	Change IMEI
- setAndroidId("a1b2c3d4e5f67890")	Change Android ID
- setPhone("08123456789")	Change phone number
- setModel("SM-G998B")	Change device model
- setManufacturer("samsung")	Change manufacturer
- setOperator("Telkomsel")	Change operator
- reload()	Re-apply hooks
- version()	Show script version

Example inside Frida REPL:
```javascript
rpc.exports.setImei("358901234567890");
```

## Version

Current version: **4.1.0**

## Notes

Fully self-contained — no external dependencies

Some Play Integrity hooks may need class name adjustments

If an app crashes, try disabling anti-kill hooks first

This is experimental — don't expect it to bypass everything

## Use Cases

Useful for:
- Android testing
- App behavior analysis
- Device spoofing experiments
- Reverse engineering practice
- Testing basic integrity checks

### Created by

<p align="center">
  <a href="https://github.com/ridhoae303">
    <img src="https://img.shields.io/badge/Built%20by-@ridhoae303-111111?style=for-the-badge&logo=github">
  </a>
</p>
