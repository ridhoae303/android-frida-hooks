# Android Frida Hooks Script

[![Social Banner](frida-script-banner.jpg)](https://github.com/ridhoae303/android-frida-hooks)

A simple, multi-purpose Frida script for Android testing, spoofing, and basic bypass scenarios. This project is mostly experimental and created for learning and testing purposes.

## Disclaimer

This project is intended for educational and security research purposes only. Do not use this tool on applications without proper authorization. The developer is not responsible for misuse or illegal activities.

## Purpose

This repository is created to help developers and security researchers:

- Learn Android dynamic analysis
- Understand how Android APIs work
- Test their own applications

---

### 📦 Features

This script includes multiple hooks commonly used in Android testing environments.

🔧 Package & Signature Hooks

- Replace app signatures
- Bypass signature verification
- Fake installer package (Play Store spoof)
- Override "checkSignatures()"

---

### 📱 Device Spoofing

Supports replacing common device identifiers:

- IMEI spoof
- Android ID spoof
- Phone number spoof
- Network operator spoof
- Device model spoof
- Device manufacturer spoof

---

### 🛡️ Anti-Detection Features

Enabled when:

> ENABLE_ANTI_DETECTION = true;

Includes:

- Root detection bypass
- Hide "su" binaries
- Xposed detection bypass
- Frida detection blocking
- Debugger detection bypass
- Emulator fingerprint replacement

---

### 🔐 SSL Pinning Bypass (Optional)

Disabled by default:

> HOOK_SSL = false;

When enabled:

- Hostname verification bypass
- SSL socket factory interception

---

### 🧠 Debug Logging

Controlled using:

> ENABLE_DEBUG_LOGGING = true;

Displays detailed hook logs in the console.

---

### ⚙️ Configuration

Edit values inside the script:

var IMEI = "###imei###";
var AND_ID = "###id###";
var PHONE = "###phone###";

var DEVICE_MODEL = "###model###";
var DEVICE_MANUFACTURER = "###manufacturer###";
var NETWORK_OPERATOR = "###operator###";

Leave empty to use default system values.

---

### 🧪 RPC Commands

This script supports runtime commands:

Command| Description
reload()| Reload configuration
list()| Show active hooks
disable()| Disable all hooks
version()| Show script version

---

### 📜 Script Version

Current version: v3.1.0

---

### ⚠️ Notes

- This script is experimental.
- It may not work on all apps.
- Some protections may still detect Frida depending on the target.

---

# 📚 Use Case

This script may be useful for:

- Android testing
- App behavior analysis
- Device spoofing experiments
- Reverse engineering practice


# 👤 Author

### *ridhoae303*

GitHub:
> https://github.com/ridhoae303
