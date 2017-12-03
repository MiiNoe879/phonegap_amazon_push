## DESCRIPTION

##<a name="manual_installation"></a>Manual Installation

1) Install the ADM library

- Download the [Amazon Mobile App SDK](https://developer.amazon.com/public/resources/development-tools/sdk) and unzip.
- Create a folder called `ext_libs` in your project's `platforms/amazon-fireos` folder.
- Copy `amazon-device-messaging-x.x.x.jar` into the `ext_libs` folder above.
- Create a new text file called `ant.properties` in the `platforms/amazon-fireos` folder, and add a java.compiler.classpath entry pointing at the library. For example: `java.compiler.classpath=./ext_libs/amazon-device-messaging.jar`


2) Copy the contents of the Push Notification Plugin's `src/amazon/com` folder to your project's `platforms/amazon-fireos/src/com` folder.

3) Modify your `AndroidManifest.xml` and add the following lines to your manifest tag:

```xml
<permission android:name="$PACKAGE_NAME.permission.RECEIVE_ADM_MESSAGE" android:protectionLevel="signature" />
<uses-permission android:name="$PACKAGE_NAME.permission.RECEIVE_ADM_MESSAGE" />
<uses-permission android:name="com.amazon.device.messaging.permission.RECEIVE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

4) Modify your `AndroidManifest.xml` and add the following **activity**, **receiver** and **service** tags to your **application** section.

```xml
<amazon:enable-feature android:name="com.amazon.device.messaging" android:required="true"/>
<service android:exported="false" android:name="com.amazon.cordova.plugin.ADMMessageHandler" />
<activity android:name="com.amazon.cordova.plugin.ADMHandlerActivity" />
<receiver android:name="com.amazon.cordova.plugin.ADMMessageHandler$Receiver" android:permission="com.amazon.device.messaging.permission.SEND">
	<intent-filter>
        	<action android:name="com.amazon.device.messaging.intent.REGISTRATION" />
                <action android:name="com.amazon.device.messaging.intent.RECEIVE" />
                <category android:name="$PACKAGE_NAME" />
	</intent-filter>
</receiver>
```

5) Modify your `AndroidManifest.xml` and add "amazon" XML namespace to <manifest> tag:

```xml
xmlns:amazon="http://schemas.amazon.com/apk/res/android"
```

6) Modify `res/xml/config.xml` to add a reference to PushPlugin:

```xml
<feature name="PushPlugin" >
	<param name="android-package" value="com.amazon.cordova.plugin.PushPlugin"/>
</feature>
```

7) Modify `res/xml/config.xml` to set config options to let Cordova know whether to display ADM message in the notification center or not. If not, provide the default message. By default, message will be visible in the notification. These config options are used if message arrives and app is not in the foreground (either killed or running in the background).

```xml
<preference name="showmessageinnotification" value="true" />
<preference name="defaultnotificationmessage" value="New message has arrived!" />
```

8) Create an file called `api_key.txt` in the platforms/amazon-fireos/assets folder containing the API Key from the "Security Profile Android/Kindle Settings" tab on the [Amazon Developer Portal](https://developer.amazon.com/sdk/adm.html). For detailed steps on how to register for ADM please refer to section below: [Registering your app for Amazon Device Messaging (ADM)](#registering_for_adm)

##<a name="plugin_api"></a> Plugin API

#### pushNotification
The plugin instance variable.

```js
var pushNotification;

document.addEventListener("deviceready", function(){
    pushNotification = window.plugins.pushNotification;
    ...
});
```

#### register
To be called as soon as the device becomes ready.

```js
$("#app-status-ul").append('<li>registering ' + device.platform + '</li>');
pushNotification.register(
    successHandler,
    errorHandler,
    {
        "senderID":"replace_with_sender_id",
        "ecb":"onNotification"
    });
```

On success, you will get a call to onNotification (Amazon Fire OS),allowing you to obtain the device token or registration ID, or push channel name and Uri respectively. Those values will typically get posted to your intermediary push server so it knows who it can send notifications to.

***Note***

-  "ecb" MUST be provided in order to get callback notifications. If you have not already registered with Amazon developer portal,you will have to obtain credentials and api_key for your app. This is described more in detail in the [Registering your app for Amazon Device Messaging (ADM)](#registering_for_adm) section below.

#### successHandler
Called when a plugin method returns without error

```js
// result contains any message sent from the plugin call
function successHandler (result) {
	alert('result = ' + result);
}
```

#### errorHandler
Called when the plugin returns an error

```js
// result contains any error description text returned from the plugin call
function errorHandler (error) {
	alert('error = ' + error);
}
```

#### ecb
Event callback that gets called when your device receives a notification

```js
//Amazon Fire OS
function onNotification(e) {
	$("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');

	switch( e.event )
	{
	case 'registered':
		if ( e.regid.length > 0 )
		{
			$("#app-status-ul").append('<li>REGISTERED -> REGID:' + e.regid + "</li>");
			// here is where you might want to send it the regID for later use.
			console.log("regID = " + e.regid);
		}
	break;

	case 'message':
		// if this flag is set, this notification happened while we were in the foreground.
		// you might want to play a sound to get the user's attention, throw up a dialog, etc.
		if ( e.foreground )
		{
			$("#app-status-ul").append('<li>--INLINE NOTIFICATION--' + '</li>');

			// On Amazon FireOS all custom attributes are contained within payload
			var soundfile = e.soundname || e.payload.sound;
			// if the notification contains a soundname, play it.
			var my_media = new Media("/android_asset/www/"+ soundfile);
			my_media.play();
		}
		else
		{  // otherwise we were launched because the user touched a notification in the notification tray.
			if ( e.coldstart )
			{
				$("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
			}
			else
			{
				$("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
			}
		}

	   $("#app-status-ul").append('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
           //Only works for GCM
	   $("#app-status-ul").append('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
	   //Only works on Amazon Fire OS
	   $status.append('<li>MESSAGE -> TIME: ' + e.payload.timeStamp + '</li>');
	break;

	case 'error':
		$("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
	break;

	default:
		$("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
	break;
  }
}
```

#### unregister
You will typically call this when your app is exiting, to cleanup any used resources. Its not strictly necessary to call it, and indeed it may be desireable to NOT call it if you are debugging your intermediarry push server. When you call unregister(), the current token for a particular device will get invalidated, and the next call to register() will return a new token. If you do NOT call unregister(), the last token will remain in effect until it is invalidated for some reason at the GCM/ADM side. Since such invalidations are beyond your control, its recommended that, in a production environment, that you have a matching unregister() call, for every call to register(), and that your server updates the devices' records each time.

```js
pushNotification.unregister(successHandler, errorHandler, options);
```

```js
function onDeviceReady() {
	$("#app-status-ul").append('<li>deviceready event received</li>');

	document.addEventListener("backbutton", function(e)
	{
		$("#app-status-ul").append('<li>backbutton event received</li>');

		if( $("#home").length > 0 )
		{
			e.preventDefault();
			pushNotification.unregister(successHandler, errorHandler);
			navigator.app.exitApp();
		}
		else
		{
			navigator.app.backHistory();
		}
	}, false);

	// additional onDeviceReady work...
}
```