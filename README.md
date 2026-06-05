# Android Frida Hooks Script

Multi-purpose Frida script for Android testing, spoofing, and basic bypass scenarios.

This started as a personal learning project while messing around with Android dynamic analysis. Most of what's here is experimental, but useful enough to share.

[![Social Banner](frida-script-banner.jpg)](https://github.com/ridhoae303/android-frida-hooks)

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

## Version

Current version: **4.1.0**

### Created by

<p align="center">
  <a href="https://github.com/ridhoae303">
    <img src="https://img.shields.io/badge/Built%20by-@ridhoae303-111111?style=for-the-badge&logo=github">
  </a>
</p>
