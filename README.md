Realplexor jQuery API
=====================

Author: Inpassor <inpassor@yandex.com>

GitHub repository: https://github.com/Inpassor/jquery-realplexor

This library is the jQuery plugin that implements
[Dklab_Realplexor](https://github.com/DmitryKoterov/dklab_realplexor)
JavaScript API.

Dklab_Realplexor is comet server which handles 1000000+ parallel
browser connections.

This library acts similar to native Dklab_Realplexor JavaScript API,
but have one difference: IFRAME is not used. So all the Dklab_Realplexor
server config parameters related to JavaScript should be declared on
client-side.
It is made to eliminate all the unnecessary dancing with a tambourine
for just getting these parameters, and no other targets.

Also all the deprecated "work-arounds" are removed and native
JavaScript functions replaced by jQuery's ones.

## Installation

Note that here is information about install this library, not
Dklab_Realplexor server itself. To install Dklab_Realplexor server
follow the instructions on
[Dklab_Realplexor GitHub repository](https://github.com/DmitryKoterov/dklab_realplexor).

### Using bower:

```
bower install inpassor-jquery-realplexor
```

### Using composer asset plugin:

```
composer require bower-asset/inpassor-jquery-realplexor
```

## Usage

To create Realplexor instance just call $.Realplexor(parameters) : 
```
var realplexor = $.Realplexor({
    url: '//rpl.yourdomain.com'
});
```
Note that **url** must be valid URL, that jQuery.ajax function accept. 

The list of available parameters:

Parameter | Default | Description
--- | --- | ---
**uid** | random string | The unique string indentifier of the Realplexor instance.
**url** | "" |The URL of Dklab_Realplexor server.
**namespace** | "" | The namespace to use.
**JS_WAIT_RECONNECT_DELAY** | 0.1 | The reconnect delay. 
**JS_WAIT_TIMEOUT** | 300 | The timeout in seconds to wait Dklab_Realplexor responce.
**JS_WAIT_URI** | "/" | What URI is used to access realplexor.

If the parameter **uid** is given, you can call the corresponding
Realplexor instance later by such way:
```
var realplexor = $.Realplexor('myUID');
```

Once created Realplexor instance you can call its methods to work with
Dklab_Realplexor server channels: 

Method | Description
--- | ---
**setCursor** | **setCursor(id, cursor)** . Set a cursor to a channel.
**subscribe** | **subscribe(id[, callback])** . Subscribe a callback to a channel.
**unsubscribe** | **unsubscribe(id[, callback])** . Unsubscribe a callback from a channel. If parameter **callback** is not given, all the callbacks will be unsubscribed from a channel.
**execute** | **execute()** . This method should be called after all the subscribe / unsubscribe calls.

The **id** of a channel is alpha-numeric string.

The **cursor** is the monotonically increasing sequence.

The **callback** declaration should be as follows:
```
someFunction(data, id, cursor) {
    ...
}
```
When Dklab_Realplexor sends data to a channel, the **callback** will be
called with these parameters: 

Parameter | Description
--- | ---
**data** | A data received to a channel. 
**id** | The id of a channel.
**cursor** | The current cursor of a channel.

## Example

Create Realplexor instance, set cursors to "0" and subscribe to
channels "Alpha" and "Beta":
```
var AlphaCallback = function (data, id, cursor) {
    console.log(data, id, cursor);
};

var BetaCallback = function (data, id, cursor) {
    console.log(data, id, cursor);
};

$.Realplexor({
    url: '//rpl.yourdomain.com'
})
    .setCursor('Alpha', 0).subscribe('Alpha', AlphaCallback)
    .setCursor('Beta', 0).subscribe('Beta', BetaCallback)
    .execute();
```
