// Created by ridhoae303
// TG: @ridhoae303


var debug = true;
var sslByp = false;

var IMEI = "";
var AND_ID = "";
var PHONE = "";
var INSTALLER = "com.android.vending";
var DEVICE_MODEL = "";
var DEVICE_MANUFACTURER = "";
var NETWORK_OPERATOR = "";

var TAG = "[FRIDA]";
var ver = "4.1.0";

function lg(m) { if(debug) console.log(TAG + " " + m); }
function li(m) { console.log(TAG + " " + m); }
function le(m) { console.error(TAG + " " + m); }

function genImei() {
    var pref = ["35","86","89","01","13"];
    var rand = pref[Math.floor(Math.random() * pref.length)];
    for(var i=0;i<13;i++) rand += Math.floor(Math.random() * 10);
    var sum = 0;
    for(var i=0;i<15;i++) {
        var digit = parseInt(rand[i]);
        if(i%2==1) digit *= 2;
        sum += Math.floor(digit/10) + (digit%10);
    }
    var checksum = (10 - (sum%10)) % 10;
    return rand.substring(0,14) + checksum;
}

function genAndroidId() {
    var hex = "0123456789abcdef";
    var id = "";
    for(var i=0;i<16;i++) id += hex[Math.floor(Math.random() * 16)];
    return id;
}

function genPhone() {
    var prefixes = ["0812","0813","0821","0852","0878","0896"];
    var pref = prefixes[Math.floor(Math.random() * prefixes.length)];
    for(var i=0;i<8;i++) pref += Math.floor(Math.random() * 10);
    return pref;
}

function genModel() {
    var models = ["SM-G998B", "Pixel 6 Pro", "IN2023", "LE2115", "M2102J20SG"];
    return models[Math.floor(Math.random() * models.length)];
}

function genManufacturer() {
    var mans = ["samsung", "Google", "OnePlus", "Xiaomi", "Oppo"];
    return mans[Math.floor(Math.random() * mans.length)];
}

function genOperator() {
    var ops = ["Telkomsel", "Indosat", "XL Axiata", "Tri", "Smartfren"];
    return ops[Math.floor(Math.random() * ops.length)];
}

function setRandomValues() {
    IMEI = genImei();
    AND_ID = genAndroidId();
    PHONE = genPhone();
    DEVICE_MODEL = genModel();
    DEVICE_MANUFACTURER = genManufacturer();
    NETWORK_OPERATOR = genOperator();
    li("Generated IMEI: " + IMEI);
    li("Generated Android ID: " + AND_ID);
    li("Generated Phone: " + PHONE);
    li("Generated Model: " + DEVICE_MODEL);
    li("Generated Manufacturer: " + DEVICE_MANUFACTURER);
    li("Generated Operator: " + NETWORK_OPERATOR);
}

function safeHook(cls, method, impl) {
    try {
        var target = Java.use(cls);
        if(target[method]) {
            target[method].implementation = impl;
            lg("hooked " + cls + "." + method);
            return true;
        }
    } catch(e) {
        le("fail " + cls + "." + method + ": " + e.message);
    }
    return false;
}

function patch() {
    li("script v" + ver);
    Java.perform(function() {
        try {
            var pkg = Java.use("android.app.ActivityThread").currentApplication().getPackageName();
            li("target: " + pkg);
        } catch(e) { li("cannot get pkg"); }
        
        safeHook("android.app.ApplicationPackageManager", "getPackageInfo", function(pkg, flags) {
            var ret = this.getPackageInfo.call(this, pkg, flags);
            if(ret && ret.signatures) {
                var fakeSig = Java.array('android.content.pm.Signature', [Java.use('android.content.pm.Signature').$new("308203c3")]);
                ret.signatures = fakeSig;
                lg("sig replaced for " + pkg);
            }
            return ret;
        });
        
        safeHook("android.app.ApplicationPackageManager", "getInstallerPackageName", function(pkg) {
            var ret = this.getInstallerPackageName.call(this, pkg);
            try {
                var currentPkg = Java.use("android.app.ActivityThread").currentApplication().getPackageName();
                if(pkg === currentPkg) return INSTALLER;
            } catch(e) {}
            return ret;
        });
        
        safeHook("java.security.Signature", "verify", function(sig) { return true; });
        safeHook("android.app.ApplicationPackageManager", "checkSignatures", function(a,b) { return 0; });
        
        safeHook("android.telephony.TelephonyManager", "getDeviceId", function() { return IMEI; });
        try {
            Java.use("android.telephony.TelephonyManager").getDeviceId.overload('int').implementation = function(slot) { return IMEI; };
        } catch(e) {}
        safeHook("android.telephony.TelephonyManager", "getImei", function() { return IMEI; });
        try {
            Java.use("android.telephony.TelephonyManager").getImei.overload('int').implementation = function(slot) { return IMEI; };
        } catch(e) {}
        safeHook("android.telephony.TelephonyManager", "getMeid", function() { return "99000000000000"; });
        safeHook("android.telephony.TelephonyManager", "getSimSerialNumber", function() { return "8982123456789012345"; });
        safeHook("android.telephony.TelephonyManager", "getSubscriberId", function() { return "310260123456789"; });
        safeHook("android.telephony.TelephonyManager", "getLine1Number", function() { return PHONE; });
        safeHook("android.telephony.TelephonyManager", "getNetworkOperatorName", function() { return NETWORK_OPERATOR; });
        
        safeHook("android.provider.Settings$Secure", "getString", function(resolver, name) {
            var ret = this.getString.call(this, resolver, name);
            if(name == "android_id") return AND_ID;
            return ret;
        });
        safeHook("android.provider.Settings$System", "getString", function(resolver, name) {
            var ret = this.getString.call(this, resolver, name);
            if(name == "android_id") return AND_ID;
            return ret;
        });
        
        var Build = Java.use("android.os.Build");
        Build.MODEL.value = DEVICE_MODEL;
        Build.MANUFACTURER.value = DEVICE_MANUFACTURER;
        Build.PRODUCT.value = "razor";
        Build.BRAND.value = "google";
        Build.DEVICE.value = "razor";
        Build.FINGERPRINT.value = "google/razor/razor:5.0.1/LRX22C/1602158:user/release-keys";
        try { Build.getSerial.implementation = function() { return "0123456789abcdef"; }; } catch(e) {}
        
        safeHook("java.io.File", "exists", function() {
            var p = this.getAbsolutePath();
            var bad = ["/system/bin/su","/system/xbin/su","/sbin/su","/system/app/Superuser.apk","/system/bin/busybox"];
            for(var i=0;i<bad.length;i++) {
                if(p.indexOf(bad[i]) !== -1) return false;
            }
            return this.exists();
        });
        
        try {
            Java.use("de.robv.android.xposed.XposedBridge").hookAllMethods.implementation = function() { return null; };
        } catch(e) {}
        
        safeHook("java.lang.System", "loadLibrary", function(lib) {
            if(lib.indexOf("frida") !== -1) return;
            return this.loadLibrary(lib);
        });
        
        safeHook("android.os.Debug", "isDebuggerConnected", function() { return false; });
        
        try {
            var am = Java.use("android.app.ActivityManager");
            am.getRunningAppProcesses.implementation = function() {
                var procs = this.getRunningAppProcesses();
                var filt = Java.use("java.util.ArrayList").$new();
                for(var i=0;i<procs.size();i++) {
                    var p = procs.get(i);
                    if(p.processName.toLowerCase().indexOf("frida") === -1) filt.add(p);
                }
                return filt;
            };
        } catch(e) {}
        
        if(sslByp) {
            safeHook("javax.net.ssl.HttpsURLConnection", "setSSLSocketFactory", function(f) {});
            safeHook("javax.net.ssl.HostnameVerifier", "verify", function(host, sess) { return true; });
        }
        
        try {
            var ni = Java.use("java.net.NetworkInterface");
            ni.getHardwareAddress.implementation = function() {
                return Java.array('byte', [0x02,0x00,0x00,0x00,0x00,0x00]);
            };
        } catch(e) {}
        
        try {
            var Sys = Java.use("java.lang.System");
            var origProp = Sys.getProperty;
            Sys.getProperty.implementation = function(key) {
                var val = origProp.call(this, key);
                if(key == "ro.debuggable") val = "0";
                if(key == "ro.secure") val = "1";
                if(key == "ro.build.tags") val = "release-keys";
                return val;
            };
        } catch(e) {}
        
        try {
            var pkgMgr = Java.use("android.app.ApplicationPackageManager");
            pkgMgr.hasSystemFeature.implementation = function(feat) {
                if(feat.indexOf("telephony") !== -1 || feat.indexOf("wifi") !== -1 || feat.indexOf("bluetooth") !== -1) return true;
                if(feat == "android.hardware.type.watch") return false;
                return this.hasSystemFeature(feat);
            };
        } catch(e) {}
        
        li("anti-kill hooks");
        try {
            Java.use("android.app.Activity").finish.implementation = function() { lg("finish blocked"); };
            Java.use("android.app.Activity").finishAffinity.implementation = function() { lg("finishAffinity blocked"); };
            Java.use("android.app.Activity").moveTaskToBack.implementation = function(flag) { return false; };
        } catch(e) {}
        try {
            Java.use("java.lang.System").exit.implementation = function(code) { lg("exit blocked"); };
            Java.use("java.lang.System").runFinalizersOnExit.implementation = function(val) {};
        } catch(e) {}
        try {
            Java.use("android.os.Process").killProcess.implementation = function(pid) { lg("killProcess blocked"); };
            Java.use("android.os.Process").sendSignal.implementation = function(pid, sig) {
                if(sig==9 || sig==15) return;
                return this.sendSignal(pid, sig);
            };
        } catch(e) {}
        try {
            var am2 = Java.use("android.app.ActivityManager");
            am2.killBackgroundProcesses.implementation = function(pkg) { lg("killBackground blocked for "+pkg); };
            am2.restartPackage.implementation = function(pkg) { lg("restartPackage blocked for "+pkg); };
        } catch(e) {}
        
        li("play integrity bypass");
        try {
            var dgc = Java.use("com.google.android.gms.droidguard.DroidGuardClient");
            dgc.attest.implementation = function(params, cb) {
                var fake = Java.use("org.json.JSONObject").$new();
                fake.put("tokenResult", "fake_token_" + Date.now());
                cb.onSuccess(fake);
            };
        } catch(e) {}
        try {
            var integrity = Java.use("com.google.android.play.core.integrity.IntegrityManager");
            integrity.requestIntegrityToken.implementation = function(req, cb) {
                cb.onSuccess("fake_integrity_token");
            };
        } catch(e) {}
        try {
            var snet = Java.use("com.google.android.gms.safetynet.SafetyNetApi");
            snet.attest.implementation = function(client, nonce) { return null; };
        } catch(e) {}
        
        li("patch complete");
    });
}

setRandomValues();
setTimeout(function() {
    if(Java.available) {
        patch();
    } else {
        le("Java not available");
    }
}, 100);

rpc.exports = {
    setImei: function(v) { IMEI = v; li("IMEI updated to " + v); },
    setAndroidId: function(v) { AND_ID = v; li("Android ID updated to " + v); },
    setPhone: function(v) { PHONE = v; li("Phone updated to " + v); },
    setModel: function(v) { DEVICE_MODEL = v; li("Model updated to " + v); },
    setManufacturer: function(v) { DEVICE_MANUFACTURER = v; li("Manufacturer updated to " + v); },
    setOperator: function(v) { NETWORK_OPERATOR = v; li("Operator updated to " + v); },
    reload: function() { patch(); },
    version: function() { return ver; }
};

li("Script v" + ver + " loaded. Use rpc.exports to change values.");