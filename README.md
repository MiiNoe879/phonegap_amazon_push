# Cordova Push Notifications Plugin for Amazon Fire OS

## DESCRIPTION

This plugin is for use with [Cordova](http://incubator.apache.org/cordova/), and allows your application to receive push notifications on Amazon Fire OS devices.
* The Amazon Fire OS implementation uses [Amazon's ADM(Amazon Device Messaging) service](https://developer.amazon.com/sdk/adm.html).

##<a name="automatic_installation"></a>Automatic Installation

Below are the methods for installing this plugin automatically using command line tools. For additional info, take a look at the [Plugman Documentation](https://github.com/apache/cordova-plugman/blob/master/README.md) and [Cordova Plugin Specification](https://github.com/alunny/cordova-plugin-spec).

### Adobe PhoneGap Build Service

<code><plugin spec="https://github.com/MiiNoe879/phonegap_amazon_push.git" source="git" /></code>
You will be able to replace as your git repository.

### Cordova

The plugin can be installed via the Cordova command line interface:

1) Navigate to the root folder for your phonegap project. 2) Run the command.

```sh
cordova plugin add https://github.com/MiiNoe879/phonegap_amazon_push.git
```

### Phonegap

The plugin can be installed using the Phonegap command line interface:

1) Navigate to the root folder for your phonegap project. 2) Run the command.

```sh
phonegap local plugin add https://github.com/MiiNoe879/phonegap_amazon_push.git
```

### Plugman

The plugin is based on [plugman](https://github.com/apache/cordova-plugman) and can be installed using the Plugman command line interface:

```sh
plugman install --platform [PLATFORM] --project [TARGET-PATH] --plugin [PLUGIN-PATH]

where
  [PLATFORM] = amazon-fireos
  [TARGET-PATH] = path to folder containing your phonegap project
  [PLUGIN-PATH] = path to folder containing this plugin
```

##<a name="plugin_api"></a> Plugin API

In the plugin `examples` folder you will find a sample implementation showing how to interact with the PushPlugin. Modify it to suit your needs.

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
if ( device.platform == "amazon-fireos" ){
    pushNotification.register(
    successHandler,
    errorHandler,
    {
        "senderID":"replace_with_sender_id",
        "ecb":"onNotification"
    });
}
```

On success, you will get a call to onNotification, allowing you to obtain the device token or registration ID, or push channel name and Uri respectively. Those values will typically get posted to your intermediary push server so it knows who it can send notifications to.

***Note***

- **Amazon Fire OS**:  "ecb" MUST be provided in order to get callback notifications. If you have not already registered with Amazon developer portal,you will have to obtain credentials and api_key for your app. This is described more in detail in the [Registering your app for Amazon Device Messaging (ADM)](#registering_for_adm) section below.

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

#### ecb (Amazon Fire OS)
Event callback that gets called when your device receives a notification

```js
function onNotification(e) {
  $("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');

  switch( e.event )
  {
  case 'registered':
    if ( e.regid.length > 0 )
    {
      $("#app-status-ul").append('<li>REGISTERED -> REGID:' + e.regid + "</li>");
      // Your  push server needs to know the regID before it can push to this device
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

Looking at the above message handling code for Amazon Fire OS, a few things bear explanation. Your app may receive a notification while it is active (INLINE). If you background the app by hitting the Home button on your device, you may later receive a status bar notification. Selecting that notification from the status will bring your app to the front and allow you to process the notification (BACKGROUND). Finally, should you completely exit the app by hitting the back button from the home page, you may still receive a notification. Touching that notification in the notification tray will relaunch your app and allow you to process the notification (COLDSTART). In this case the **coldstart** flag will be set on the incoming event. You can look at the **foreground** flag on the event to determine whether you are processing a background or an in-line notification. You may choose, for example to play a sound or show a dialog only for inline or coldstart notifications since the user has already been alerted via the status bar.

For Amazon Fire OS, offline message can also be received when app is launched via carousel or by tapping on app icon from apps. In either case once app delivers the offline message to JS, notification will be cleared.

Since the Amazon Fire OS notification data models are much more flexible than that of iOS, there may be additional elements beyond **message**. You can access those elements and any additional ones via the **payload** element. This means that if your data model should change in the future, there will be no need to change and recompile the plugin.

#### unregister
You will typically call this when your app is exiting, to cleanup any used resources. Its not strictly necessary to call it, and indeed it may be desireable to NOT call it if you are debugging your intermediarry push server. When you call unregister(), the current token for a particular device will get invalidated, and the next call to register() will return a new token. If you do NOT call unregister(), the last token will remain in effect until it is invalidated for some reason at the ADM side. Since such invalidations are beyond your control, its recommended that, in a production environment, that you have a matching unregister() call, for every call to register(), and that your server updates the devices' records each time.

```js
pushNotification.unregister(successHandler, errorHandler, options);
```

You'll probably want to trap on the **backbutton** event and only call this when the home page is showing. Remember, the back button on android is not the same as the Home button. When you hit the back button from the home page, your activity gets dismissed. Here is an example of how to trap the backbutton event;

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

For the above to work, make sure the content for your home page is wrapped in an element with an id of home, like this;

```html
<div id="home">
  <div id="app-status-div">
    <ul id="app-status-ul">
      <li>Cordova ADM PushNotification Plugin Demo</li>
    </ul>
  </div>
</div>
```

### Testing ADM Notifications for Amazon Fire OS

####<a name="registering_for_adm"></a>Register your app for Amazon Device Messaging (ADM)

1. Create a developer account on [Amazon Developer Portal](https://developer.amazon.com/home.html)
2. [Add a new app](https://developer.amazon.com/application/new.html) and turn Device Messaging switch to ON. Create a sample app for your device so you have the app name and package name used to register online.
3. Create [Security Profile](https://developer.amazon.com/iba-sp/overview.html) and obtain [ADM credentials](https://developer.amazon.com/sdk/adm/credentials.html) for your app.

####  Sending a test notification

1. Inside the plugin's examples/server folder, open the `pushADM.js` NodeJS script with a text editor. (You should already have NodeJS installed).
2. Edit the CLIENT_ID and CLIENT_SECRET variables with the values from the ADM Security Profile page for your app. This will allow your app to securely identify itself to Amazon services.
3. Compile and run the sample app on your device. Note the sample app requires the Cordova Device and Media plugins to work.
4. The sample app will display your device's registration ID. Copy that value (it's very long) from your device into `pushADM.js`, entered in the REGISTRATION_IDS array. To test sending messages to more than one device, you can enter in multiple REGISTRATION_IDS into the array.
5. To send a test push notification, run the test script via a command line using NodeJS: `$ node pushADM.js`.

### Troubleshooting and next steps
If all went well, you should see a notification show up on each device. If not, make sure you are not being blocked by a firewall, and that you have internet access. Check and recheck the registration ID.

In a production environment, your app, upon registration, would send the registration id (Android/Amazon), to your intermediary push server. When a push request is processed, this information is then used to target specific apps running on individual devices.

If you're not up to building and maintaining your own intermediary push server, there are a number of commercial push services out there which support both APNS and GCM.

- [Amazon Simple Notification Service](https://aws.amazon.com/sns/)
- [kony](http://www.kony.com/push-notification-services)
- [openpush](http://openpush.im)
- [Pushwoosh](http://www.pushwoosh.com/)
- [Urban Airship](http://urbanairship.com/products/push-notifications/)
- etc.

##<a name="additional_resources"></a>Additional Resources

- [Amazon Device Messaging](https://developer.amazon.com/sdk/adm/credentials.html)