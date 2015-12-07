# Lumière (server)

[Lumière](http://lumiere.lighting) are colored lights all around the world (well, soon hopefully) that anyone can change through a web interface, texts/SMS, and possibly more.  Technically speaking it is an internet connected lighting system.

## Details

There are over 1,500 color words and sets.  Color words are a combination of [Chroma.js](https://github.com/gka/chroma.js/blob/master/src/colors/w3cx11.coffee), [Name that Color](https://github.com/gka/chroma.js/blob/master/src/colors/colorbrewer.coffee), and some custom ones.  Feel free to [suggest](https://github.com/lumiere-lighting/lumiere-server/issues) some more.

Live server at [lumiere.lighting](http://lumiere.lighting).  Watch a [video of an example deployment](https://www.youtube.com/watch?v=_k-bI2xsQ-s).

Inspiration taken from [textmas](https://github.com/emilyville/textmas).

## Server

* A Meteor application is run that keeps track of what color(s) the lights should be.
* Provides a web interface for choosing colors and basic representation of current colors.
* Provides basic API for retrieving colors as well as setting colors with other services like Twilio or Twitter.

## Nodes

See the [node projects](https://github.com/lumiere-lighting) to get started making your own nodes.

## Deploying a new server

### Install locally

The application is a [Meteor](http://www.meteor.com/) application.

1. Install Meteor: `curl https://install.meteor.com | /bin/sh`
1. Get the code: `git clone https://github.com/lumiere-lighting/lumiere-server.git`
1. If you plan on running your own server (as opposed to helping to develop the existing one), remove the Meteor ID file first.  A new one will be created when you run `meteor` and you should check this into your new repo.  `rm .meteor/.id`
1. To run locally, run the following from inside the code directory: `meteor`
    * Depending on your integration and settings below, you will probably want to run: `meteor --settings=your-settings.json`

### Twilio integration

These instructions are for using Twilio, but it would not be too hard to change things around for another SMS service.

1. Create an account at Twilio.
1. Obtain a [phone number](https://www.twilio.com/user/account/phone-numbers) or use an existing one if you already have one set up.
1. Under the settings for that phone number, set the Messaging POST value to `http://<YOUR URL>/api/colors/twilio`.

### Yo integration

Make a Yo account and set up the [Yo API](http://dev.justyo.co/) to post to `http://<YOUR URL>/api/colors/yo`.  If you want the account to Yo back then make sure to add your Yo API key in the settings (see below) in the `yoAuth` value.

### Twitter integration

Setup a Twitter application; it's actually good to have two (one for dev) as Twitter will disconnect the streaming API if it thinks there are multiple connections going on.  Generate an access token set for your application, and then update the relevant values in the settings (see below).

Use the `twitterFilter` value in the settings to filter what keywords will trigger Lumiere to look at tweets for colors.

### Settings

For config and sensitive data like authentication tokens or to override some of the configuration by, use a [Meteor settings](http://docs.meteor.com/#meteor_settings) file, which can be an arbitrary JSON file.  The options are the following; only a couple are provided by default

    {
      // Note that anything in public will be available on the client
      "public": {
        // Name of application, provided by default
        "name": "Lumière",
        // Number of lights to display in the web interface, provided by
        // default
        "lights": 10,
        // Phone to use for Twilio integration, this is just for output,
        // integration will still be available without this
        "phone": "+1 651 400 1501",
        // Array of keywords to listen to from Twitter (optional), this and
        // twitter auth are needed for twitter integration
        "twitterFilter": [ "lumierebot" ],
        // Account that someone should Yo to as set up above (optional),
        // this is just for display purposes
        "yoUser": "LUMIEREBOT"
      },
      // Twitter auth keys (optional)
      "twitterAuth": {
        "consumer_key": "xxx",
        "consumer_secret": "xxx",
        "access_token_key": "xxx",
        "access_token_secret": "xxx"
      },
      // Yo auth key (optional), allows for a Yo account to Yo back when
      // someone Yo's to the account you set up above.
      "yoAuth": "xxxx"
    }

Make sure to use `meteor --settings=settings.json` and `meteor deploy --settings=settings.json` respectively.

### Deploy

You can deploy to Meteors architecture for free.

1. Deploy to Meteor.com: `meteor deploy <YOUR_APP_NAME>.meteor.com`
    * Or if you have your settings file: `meteor deploy --settings=settings.json <YOUR_APP_NAME>.meteor.com`

## Credit

* [Texting icon by baabullah hasan](http://thenounproject.com/term/texting/47176/)
* [Twitter icon by Housin Aziz](http://thenounproject.com/term/twitter/49609/)
