# Lumière (server)

[Lumière](http://lumiere.lighting) are colored lights all around the world (well, soon hopefully) that anyone can change through a web interface, texts/SMS, and possibly more.  Technically speaking it is an internet connected lighting system.

## Details

There are over 1,500 color words and sets.  Color words are a combination of [Chroma.js](https://github.com/gka/chroma.js/blob/master/src/colors/w3cx11.coffee), [Name that Color](https://github.com/gka/chroma.js/blob/master/src/colors/colorbrewer.coffee), and some custom ones.  Feel free to [suggest](https://github.com/lumiere-lighting/lumiere-server/issues) some more.

Live server at at [lumiere.lighting](http://lumiere.lighting).  Watch a [video of an example deployment](https://www.youtube.com/watch?v=_k-bI2xsQ-s).

Inspiration taken from [textmas](https://github.com/emilyville/textmas).

## Server

* A Meteor application is run that keeps track of what color(s) the lights should be.
* Provides a web interface for choosing colors and basic representation of current colors.
* Provides basic API for retrieving colors as well as setting colors with SMS (Twilio).

## Nodes

See the [node projects](https://github.com/lumiere-lighting) to get started making your own nodes.

## Deploying a new server

### Install locally

The application is a [Meteor](http://www.meteor.com/) application.

1. Install Meteor: `curl https://install.meteor.com | /bin/sh`
1. Get the code: `git clone https://github.com/lumiere-lighting/lumiere-server.git`
1. To run locally, run the following from inside the code directory: `meteor`

### Set up SMS phone number

These instructions are for using Twilio, but it would not be too hard to change things around for another SMS service.

1. Create an account at Twilio.
1. Obtain a [phone number](https://www.twilio.com/user/account/phone-numbers) or use an existing one if you already have one set up.
1. Under the settings for that phone number, set the Messaging POST value to `http://<YOUR_APP_NAME>.meteor.com/api/colors/twilio`.

### Settings

You can override some of the configuration by using a settings file through [Meteor](http://docs.meteor.com/#meteor_settings).  The default values are the following:

    {
      "name": "Lumière",
      "phone": "+1 651 400 1501",
      "lights": 160
    }

### Deploy

You can deploy to Meteors architecture for free.

1. Deploy to Meteor.com: `meteor deploy <YOUR_APP_NAME>.meteor.com`
