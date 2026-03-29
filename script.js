// Created by ridhoae303
// Telegram: @ridhoae303 — https://t.me/ridhoae303

var IMEI = "###imei###";
var AND_ID = "###id###";
var PHONE = "###phone###";
var INSTALLER = "com.android.vending";
var DEVICE_MODEL = "###model###";
var DEVICE_MANUFACTURER = "###manufacturer###";
var NETWORK_OPERATOR = "###operator###";

var ENABLE_DEBUG_LOGGING = true;
var ENABLE_ANTI_DETECTION = true;
var HOOK_SSL = false;

var Log = null;
var Fix = null;
var Injector = null;
var fdone = null;
var APP_PKG = null;

var TAG_L = "[FRIDA_SCRIPT]";
var SCRIPT_VERSION = "3.1.0";

function logDebug(message) {
    if (ENABLE_DEBUG_LOGGING) {
        console.log(TAG_L + " " + message);
    }
}

function logInfo(message) {
    console.log(TAG_L + " " + message);
}

function logError(message) {
    console.error(TAG_L + " [ERROR] " + message);
}

function safeHook(className, methodName, implementation) {
    try {
        var targetClass = Java.use(className);
        if (targetClass[methodName]) {
            targetClass[methodName].implementation = implementation;
            logDebug("Successfully hooked: " + className + "." + methodName);
            return true;
        }
    } catch (e) {
        logError("Failed to hook " + className + "." + methodName + ": " + e.message);
    }
    return false;
}

function patch() {
    logInfo("Starting Enhanced Frida Script v" + SCRIPT_VERSION);
    
    try {
        Log = Java.use("android.util.Log");
        Fix = Java.use("com.frida.Fix");
        Injector = Java.use("com.frida.injector");
        fdone = Injector.getAppFilesDir() + "/done";
        APP_PKG = Injector.getAppPackageName();

        logInfo("Target package: " + APP_PKG);
        logInfo("[*] Starting comprehensive patching...");
        
        safeHook("android.app.ApplicationPackageManager", "getPackageInfo", function(package_name, flags) {
            var ret = this.getPackageInfo.call(this, package_name, flags);
            if (APP_PKG == package_name) {
                logDebug("Get package info for '" + package_name + "' - signatures replaced");
                ret.signatures = Fix.getSignatures(ret);
            } else {
                logDebug("Get package info for '" + package_name + "' - signatures preserved");
            }
            return ret;
        });

        safeHook("android.app.ApplicationPackageManager", "getInstallerPackageName", function(package_name) {
            var ret = this.getInstallerPackageName.call(this, package_name);
            logDebug("Get installer for '" + package_name + "' called");
            if (APP_PKG == package_name && INSTALLER !== "") {
                ret = INSTALLER;
                logDebug("Installer package name replaced with: " + INSTALLER);
            }
            return ret;
        });
        
        safeHook("java.security.Signature", "verify", function(signature) {
            var ret = this.verify.call(this, signature);
            logDebug("Signature verification intercepted - original: " + ret + ", forced: true");
            return true;
        });
        
        safeHook("android.app.ApplicationPackageManager", "checkSignatures", function(pkg1, pkg2) {
            var ret = this.checkSignatures.call(this, pkg1, pkg2);
            logDebug("checkSignatures intercepted - original: " + ret + ", forced: 0");
            return 0;
        });
        
        safeHook("android.telephony.TelephonyManager", "getDeviceId", function() {
            var ret = this.getDeviceId.call(this);
            if (IMEI !== "") {
                ret = IMEI;
                logDebug("IMEI replaced with: " + IMEI);
            }
            logDebug("Get device IMEI called - returned: " + ret);
            return ret;
        });

        safeHook("android.telephony.TelephonyManager", "getDeviceId", function(slotIndex) {
            var ret = this.getDeviceId.call(this, slotIndex);
            if (IMEI !== "") {
                ret = IMEI;
                logDebug("IMEI (slot " + slotIndex + ") replaced with: " + IMEI);
            }
            logDebug("Get device IMEI for slot " + slotIndex + " - returned: " + ret);
            return ret;
        });

        safeHook("android.telephony.TelephonyManager", "getImei", function() {
            var ret = this.getImei.call(this);
            if (IMEI !== "") {
                ret = IMEI;
                logDebug("getImei() replaced with: " + IMEI);
            }
            logDebug("getImei() called - returned: " + ret);
            return ret;
        });

        safeHook("android.telephony.TelephonyManager", "getImei", function(slotIndex) {
            var ret = this.getImei.call(this, slotIndex);
            if (IMEI !== "") {
                ret = IMEI;
                logDebug("getImei(slot " + slotIndex + ") replaced with: " + IMEI);
            }
            logDebug("getImei(slot " + slotIndex + ") called - returned: " + ret);
            return ret;
        });

        safeHook("android.telephony.TelephonyManager", "getMeid", function() {
            var ret = this.getMeid.call(this);
            logDebug("Get MEID called - returned: " + ret);
            return ret;
        });

        safeHook("android.telephony.TelephonyManager", "getMeid", function(slotIndex) {
            var ret = this.getMeid.call(this, slotIndex);
            logDebug("Get MEID for slot " + slotIndex + " - returned: " + ret);
            return ret;
        });

        safeHook("android.telephony.TelephonyManager", "getSimSerialNumber", function() {
            var ret = this.getSimSerialNumber.call(this);
            logDebug("Get SIM serial number called - returned: " + ret);
            return ret;
        });

        safeHook("android.telephony.TelephonyManager", "getSubscriberId", function() {
            var ret = this.getSubscriberId.call(this);
            logDebug("Get subscriber ID called - returned: " + ret);
            return ret;
        });

        safeHook("android.telephony.TelephonyManager", "getLine1Number", function() {
            var ret = this.getLine1Number.call(this);
            if (PHONE !== "") {
                ret = PHONE;
                logDebug("Phone number replaced with: " + PHONE);
            }
            logDebug("Get line 1 number called - returned: " + ret);
            return ret;
        });

        safeHook("android.telephony.TelephonyManager", "getNetworkOperatorName", function() {
            var ret = this.getNetworkOperatorName.call(this);
            if (NETWORK_OPERATOR !== "") {
                ret = NETWORK_OPERATOR;
                logDebug("Network operator replaced with: " + NETWORK_OPERATOR);
            }
            logDebug("Get network operator called - returned: " + ret);
            return ret;
        });
        
        safeHook("android.provider.Settings$Secure", "getString", function(resolver, name) {
            var ret = this.getString.call(this, resolver, name);
            if (name == "android_id" && AND_ID !== "") {
                ret = AND_ID;
                logDebug("Android ID replaced with: " + AND_ID);
            }
            return ret;
        });
        
        safeHook("android.provider.Settings$System", "getString", function(resolver, name) {
            var ret = this.getString.call(this, resolver, name);
            if (name == "android_id" && AND_ID !== "") {
                ret = AND_ID;
                logDebug("Android ID (System) replaced with: " + AND_ID);
            }
            return ret;
        });
        
        safeHook("android.os.Build", "MODEL", {
            get: function() {
                var ret = this.MODEL.value;
                if (DEVICE_MODEL !== "") {
                    ret = DEVICE_MODEL;
                    logDebug("Device model replaced with: " + DEVICE_MODEL);
                }
                logDebug("Build.MODEL called - returned: " + ret);
                return ret;
            }
        });

        safeHook("android.os.Build", "MANUFACTURER", {
            get: function() {
                var ret = this.MANUFACTURER.value;
                if (DEVICE_MANUFACTURER !== "") {
                    ret = DEVICE_MANUFACTURER;
                    logDebug("Device manufacturer replaced with: " + DEVICE_MANUFACTURER);
                }
                logDebug("Build.MANUFACTURER called - returned: " + ret);
                return ret;
            }
        });

        safeHook("android.os.Build", "PRODUCT", {
            get: function() {
                var ret = this.PRODUCT.value;
                logDebug("Build.PRODUCT called - returned: " + ret);
                return ret;
            }
        });

        safeHook("android.os.Build", "BRAND", {
            get: function() {
                var ret = this.BRAND.value;
                logDebug("Build.BRAND called - returned: " + ret);
                return ret;
            }
        });

        safeHook("android.os.Build", "DEVICE", {
            get: function() {
                var ret = this.DEVICE.value;
                logDebug("Build.DEVICE called - returned: " + ret);
                return ret;
            }
        });
        
        if (ENABLE_ANTI_DETECTION) {
            logInfo("[*] Enabling anti-detection features...");
            
            safeHook("java.io.File", "exists", function() {
                var path = this.getAbsolutePath.call(this);
                var ret = this.exists.call(this);
                
                var rootPaths = [
                    "/system/bin/su",
                    "/system/xbin/su", 
                    "/sbin/su",
                    "/system/app/Superuser.apk",
                    "/system/bin/busybox"
                ];
                
                if (rootPaths.includes(path)) {
                    logDebug("Root detection bypassed for path: " + path);
                    return false;
                }
                return ret;
            });
            
            safeHook("de.robv.android.xposed.XposedBridge", "hookAllMethods", function() {
                logDebug("Xposed detection triggered - bypassing");
                return null;
            });
            
            safeHook("java.lang.System", "loadLibrary", function(libname) {
                if (libname === "frida-gadget" || libname === "frida-agent") {
                    logDebug("Frida detection library load blocked: " + libname);
                    return;
                }
                return this.loadLibrary.call(this, libname);
            });
        }
        
        if (HOOK_SSL) {
            logInfo("[*] Enabling SSL pinning bypass...");
            
            safeHook("javax.net.ssl.HttpsURLConnection", "setSSLSocketFactory", function(factory) {
                logDebug("SSL socket factory setup intercepted");
                return null;
            });
            
            safeHook("javax.net.ssl.HostnameVerifier", "verify", function(hostname, session) {
                logDebug("Hostname verification bypassed for: " + hostname);
                return true;
            });
        }
        
        safeHook("android.os.Debug", "isDebuggerConnected", function() {
            logDebug("Debugger detection bypassed");
            return false;
        });
        
        safeHook("android.os.Build", "FINGERPRINT", {
            get: function() {
                var ret = this.FINGERPRINT.value;
                if (ret.includes("test-keys") || ret.includes("generic")) {
                    ret = "google/razor/razor:5.0.1/LRX22C/1602158:user/release-keys";
                    logDebug("Emulator fingerprint replaced");
                }
                return ret;
            }
        });

        logInfo("[*] Patching completed successfully!");
        logInfo("[*] All hooks are active and running");

    } catch (e) {
        logError("Error during patching: " + e.toString());
        logError("Stack trace: " + e.stack);
    }
}

if (Java.available) {
    Java.perform(function() {
        logInfo("Java VM detected, starting injection...");
        patch();
    });
} else {
    logError("Java VM not available!");
}

setTimeout(function() {
    if (Java.available) {
        Java.perform(function() {
            logInfo("Delayed injection started...");
            patch();
        });
    }
}, 1000);

function reloadConfig() {
    logInfo("Reloading configuration...");
    patch();
}

function listHooks() {
    logInfo("Active hooks:");
    logInfo("- Package Manager hooks");
    logInfo("- Telephony Manager hooks"); 
    logInfo("- Settings Secure hooks");
    logInfo("- Build information hooks");
    logInfo("- Security bypass hooks");
    if (ENABLE_ANTI_DETECTION) logInfo("- Anti-detection hooks");
    if (HOOK_SSL) logInfo("- SSL pinning bypass hooks");
}

function disableHooks() {
    logInfo("Disabling all hooks...");
    Java.perform(function() {
        Java.deoptimizeEverything();
    });
}

rpc.exports = {
    reload: reloadConfig,
    list: listHooks,
    disable: disableHooks,
    version: function() { return SCRIPT_VERSION; }
};

logInfo("Enhanced Frida Script v" + SCRIPT_VERSION + " loaded successfully!");
logInfo("Use rpc.exports to control the script:");
logInfo("  - reload(): Reload configuration");
logInfo("  - list(): List active hooks"); 
logInfo("  - disable(): Disable all hooks");
logInfo("  - version(): Get script version");
