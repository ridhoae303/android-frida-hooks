/**
 * v5.0.0-lean – minimal Java hooks, no native
 * added /proc/tcp, task threads, fd hiding (all Java)
 * @ridhoae303
 */
var DEBUG = false;
var TAG = "[FRIDA]";
var VERSION = "5.0.0-lean";

// ---- generators ----
function genImei() {
    var pfx = ["35","86","89","01","13"];
    var p = pfx[Math.floor(Math.random() * pfx.length)];
    var body = "";
    for (var i = 0; i < 13; i++) body += Math.floor(Math.random() * 10);
    var full = p + body;
    var sum = 0;
    for (var i = 0; i < 15; i++) {
        var d = parseInt(full[i]);
        if (i % 2 == 1) d *= 2;
        sum += Math.floor(d / 10) + (d % 10);
    }
    var chk = (10 - (sum % 10)) % 10;
    return full.substring(0, 14) + chk;
}

function genAndroidId() {
    var h = "0123456789abcdef";
    var id = "";
    for (var i = 0; i < 16; i++) id += h[Math.floor(Math.random() * 16)];
    return id;
}

function genPhone() {
    var pre = ["0812","0813","0821","0852","0878","0896"];
    var p = pre[Math.floor(Math.random() * pre.length)];
    for (var i = 0; i < 8; i++) p += Math.floor(Math.random() * 10);
    return p;
}

// ---- profile (RPC changeable) ----
var DEVICE_ID = genImei();
var ANDROID_ID = genAndroidId();
var PHONE_NUMBER = genPhone();
var DEVICE_MODEL = "Pixel 6 Pro";
var DEVICE_MANUFACTURER = "Google";
var INSTALLER = "com.android.vending";
var OPERATOR_NAME = "Telkomsel";

// ---- utils ----
function log(msg) { if (DEBUG) console.log(TAG + " " + msg); }
function logErr(msg) { console.error(TAG + " " + msg); }

function tryHook(className, methodName, repl, overloadArgs) {
    try {
        var clazz = Java.use(className);
        var target;
        if (overloadArgs) {
            target = clazz[methodName].overload.apply(clazz[methodName], overloadArgs);
        } else {
            target = clazz[methodName];
        }
        if (target) {
            target.implementation = repl;
            return true;
        }
    } catch (e) {
        logErr("hook fail " + className + "." + methodName + ": " + e.message);
    }
    return false;
}

// ---- main hooks ----
Java.perform(function() {
    log("installing minimal but comprehensive hooks...");

    // ----- Play Integrity / SafetyNet -----
    try {
        var Dgc = Java.use("com.google.android.gms.droidguard.DroidGuardClient");
        Dgc.attest.implementation = function(params, cb) {
            var j = Java.use("org.json.JSONObject").$new();
            j.put("tokenResult", "faketok_" + Date.now());
            cb.onSuccess(j);
        };
    } catch (e) {}
    try {
        var im = Java.use("com.google.android.play.core.integrity.IntegrityManager");
        im.requestIntegrityToken.implementation = function(req, cb) { cb.onSuccess("fake_token"); };
    } catch (e) {}
    try {
        var snet = Java.use("com.google.android.gms.safetynet.SafetyNetApi");
        snet.attest.implementation = function(c, nonce) { return null; };
    } catch (e) {}

    // ----- device identifiers -----
    tryHook("android.telephony.TelephonyManager", "getDeviceId", function() { return DEVICE_ID; });
    tryHook("android.telephony.TelephonyManager", "getImei", function() { return DEVICE_ID; });
    try {
        var tm = Java.use("android.telephony.TelephonyManager");
        tm.getImei.overload('int').implementation = function(slot) { return DEVICE_ID; };
        tm.getDeviceId.overload('int').implementation = function(slot) { return DEVICE_ID; };
    } catch (e) {}
    tryHook("android.telephony.TelephonyManager", "getMeid", function() { return "99000000000000"; });
    tryHook("android.telephony.TelephonyManager", "getSubscriberId", function() { return "310260123456789"; });
    tryHook("android.telephony.TelephonyManager", "getLine1Number", function() { return PHONE_NUMBER; });
    tryHook("android.telephony.TelephonyManager", "getNetworkOperatorName", function() { return OPERATOR_NAME; });
    tryHook("android.telephony.TelephonyManager", "getSimSerialNumber", function() { return "8982123456789012345"; });

    // ----- Android ID -----
    tryHook("android.provider.Settings$Secure", "getString", function(resolver, key) {
        if (key == "android_id") return ANDROID_ID;
        return this.getString(resolver, key);
    });

    // ----- installer package -----
    tryHook("android.app.ApplicationPackageManager", "getInstallerPackageName", function(pkg) {
        try {
            var cur = Java.use("android.app.ActivityThread").currentApplication().getPackageName();
            if (pkg === cur) return INSTALLER;
        } catch (e) {}
        return this.getInstallerPackageName(pkg);
    });

    // ----- System properties (no Build static edits) -----
    try {
        var Sys = Java.use("java.lang.System");
        var orig = Sys.getProperty;
        Sys.getProperty.overload('java.lang.String').implementation = function(k) {
            var v = orig.call(this, k);
            if (k === "ro.debuggable") return "0";
            if (k === "ro.secure") return "1";
            if (k === "ro.build.tags") return "release-keys";
            return v;
        };
        Sys.getProperty.overload('java.lang.String', 'java.lang.String').implementation = function(k, def) {
            var v = orig.call(this, k, def);
            if (k === "ro.debuggable") return "0";
            if (k === "ro.secure") return "1";
            if (k === "ro.build.tags") return "release-keys";
            return v;
        };
    } catch (e) {}

    // ----- block root/frida file existence -----
    tryHook("java.io.File", "exists", function() {
        var path = this.getAbsolutePath();
        var black = ["/system/bin/su","/system/xbin/su","/sbin/su",
                     "/system/app/Superuser.apk","/system/bin/busybox",
                     "frida","gadget"];
        for (var i = 0; i < black.length; i++) {
            if (path.indexOf(black[i]) !== -1) return false;
        }
        return this.exists();
    });

    // ----- filter process list (frida & gum-js) -----
    try {
        var am = Java.use("android.app.ActivityManager");
        am.getRunningAppProcesses.implementation = function() {
            var procs = this.getRunningAppProcesses();
            var out = Java.use("java.util.ArrayList").$new();
            for (var i = 0; i < procs.size(); i++) {
                var p = procs.get(i);
                var n = p.processName.toLowerCase();
                if (n.indexOf("frida") === -1 && n.indexOf("gum-js") === -1) out.add(p);
            }
            return out;
        };
    } catch (e) {}

    // ----- anti-debug -----
    tryHook("android.os.Debug", "isDebuggerConnected", function() { return false; });

    // ----- lightweight anti-kill + signature check bypass -----
    try {
        Java.use("android.os.Process").killProcess.implementation = function(p) { log("killProcess blocked"); };
        Java.use("android.os.Process").sendSignal.implementation = function(pid, sig) {
            if (sig === 9 || sig === 15) { log("signal " + sig + " ignored"); return; }
            this.sendSignal(pid, sig);
        };
    } catch (e) {}
    try { Java.use("java.lang.System").exit.implementation = function(c) { log("exit blocked"); }; } catch (e) {}
    tryHook("android.app.ApplicationPackageManager", "checkSignatures", function(a, b) { return 0; });

    // ----- Xposed stub -----
    try {
        Java.use("de.robv.android.xposed.XposedBridge").hookAllMethods.implementation = function() { return null; };
    } catch (e) {}

    // ----- fake MAC address -----
    try {
        Java.use("java.net.NetworkInterface").getHardwareAddress.implementation = function() {
            return Java.array('byte', [0x02,0x00,0x00,0x00,0x00,0x00]);
        };
    } catch (e) {}

    // ----- hide frida from file lists -----
    try {
        var File = Java.use("java.io.File");
        File.listFiles.overload().implementation = function() {
            var arr = this.listFiles.call(this);
            if (!arr) return arr;
            var filtered = Java.use("java.util.ArrayList").$new();
            for (var i = 0; i < arr.length; i++) {
                var n = arr[i].getName().toLowerCase();
                if (n.indexOf("frida") === -1 && n.indexOf("gadget") === -1) filtered.add(arr[i]);
            }
            return filtered.toArray(Java.array('java.io.File', []));
        };
        File.list.overload().implementation = function() {
            var names = this.list.call(this);
            if (!names) return names;
            var filtered = Java.use("java.util.ArrayList").$new();
            for (var i = 0; i < names.length; i++) {
                var n = String(names[i]).toLowerCase();
                if (n.indexOf("frida") === -1 && n.indexOf("gadget") === -1) filtered.add(names[i]);
            }
            return filtered.toArray(Java.array('java.lang.String', []));
        };
    } catch (e) {}

    // ========== extended /proc filtering (Java level, no native) ==========
    try {
        var ThreadLocal = Java.use("java.lang.ThreadLocal");
        var currentPath = ThreadLocal.$new();
        var sensitiveFis = new WeakMap();

        var FileInputStream = Java.use("java.io.FileInputStream");
        var FileClass = Java.use("java.io.File");

        function isSensitive(path) {
            if (!path) return false;
            var p = path.toLowerCase();
            return (p.indexOf("/proc/self/maps") !== -1 ||
                    p.indexOf("/proc/self/smaps") !== -1 ||
                    p.indexOf("/proc/self/status") !== -1 ||
                    p.indexOf("/proc/self/task") !== -1 ||
                    p.indexOf("/proc/net/tcp") !== -1 ||
                    p.indexOf("/proc/net/tcp6") !== -1 ||
                    p.indexOf("/proc/self/fd") !== -1);
        }

        FileInputStream.$init.overload('java.io.File').implementation = function(file) {
            var path = file.getAbsolutePath();
            if (isSensitive(path)) {
                currentPath.set(path);
                sensitiveFis.set(this, true);
            }
            return this.$init.call(this, file);
        };
        FileInputStream.$init.overload('java.lang.String').implementation = function(name) {
            var f = FileClass.$new(name);
            var path = f.getAbsolutePath();
            if (isSensitive(path)) {
                currentPath.set(path);
                sensitiveFis.set(this, true);
            }
            return this.$init.call(this, name);
        };

        FileInputStream.close.implementation = function() {
            if (sensitiveFis.get(this)) {
                currentPath.set(null);
                sensitiveFis.delete(this);
            }
            return this.close.call(this);
        };

        var BufferedReader = Java.use("java.io.BufferedReader");
        BufferedReader.readLine.implementation = function() {
            var line = this.readLine.call(this);
            var path = currentPath.get();
            if (path === null || line === null) return line;

            var lower = path.toLowerCase();

            // maps / smaps
            if (lower.indexOf("/maps") !== -1 || lower.indexOf("/smaps") !== -1) {
                if (line.toLowerCase().indexOf("frida") !== -1) {
                    return this.readLine();
                }
            }
            // main status
            else if (lower.endsWith("/status") && lower.indexOf("/task/") === -1) {
                if (line.startsWith("TracerPid:")) return "TracerPid:\t0";
            }
            // task subdirectories
            else if (lower.indexOf("/task/") !== -1) {
                if (lower.endsWith("/status") && line.startsWith("Name:")) {
                    if (/frida|gum-js|gadget/i.test(line)) return "Name:\tthread_main";
                } else if (lower.endsWith("/comm")) {
                    if (/frida|gum-js|gadget/i.test(line)) return "main";
                }
            }
            // tcp / tcp6
            else if (lower.indexOf("/proc/net/tcp") !== -1) {
                if (line.toLowerCase().indexOf("69b6") !== -1 || line.toLowerCase().indexOf("frida") !== -1) {
                    return this.readLine();
                }
            }
            // fd directory
            else if (lower.indexOf("/proc/self/fd") !== -1) {
                if (line.toLowerCase().indexOf("frida") !== -1) return this.readLine();
            }

            return line;
        };
    } catch (e) { logErr("proc filter extended fail: " + e); }

    log("all hooks installed. use RPC to change values.");
});

// ---- RPC exports (more complete) ----
rpc.exports = {
    setImei: function(v) { DEVICE_ID = v; },
    setAndroidId: function(v) { ANDROID_ID = v; },
    setPhone: function(v) { PHONE_NUMBER = v; },
    setModel: function(v) { DEVICE_MODEL = v; },
    setManufacturer: function(v) { DEVICE_MANUFACTURER = v; },
    setOperator: function(v) { OPERATOR_NAME = v; },
    version: function() { return VERSION; },
    reload: function() { Java.perform(function() {}); }
};