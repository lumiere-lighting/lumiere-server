# Lumière (server)

[Lumière](http://lumiere.lighting) are colored lights all around the world (well, soon hopefully) that anyone can change through a web interface, texts/SMS, and possibly more.  Technically speaking it is an internet connected lighting system.

## Details

There are over 1,500 color words and sets.  Color words are a combination of [Chroma.js](https://github.com/gka/chroma.js/blob/master/src/colors/w3cx11.coffee), [Name that Color](https://github.com/gka/chroma.js/blob/master/src/colors/colorbrewer.coffee), and some custom ones.  Feel free to [suggest](https://github.com/lumiere-lighting/lumiere-server/issues) some more.

Live server at at [lumiere.lighting](http://lumiere.lighting).  Watch a [video of an example deployment](https://www.youtube.com/watch?v=_k-bI2xsQ-s).

Inspiration taken from [textmas](https://github.com/emilyville/textmas).

## The server

* A Meteor application is run that keeps track of what color(s) the lights should be.
* Provides a web interface for choosing colors and basic representation of current colors.
* Accepts input via SMS.
* Provides basic API for retrieving colors.

## Nodes

(coming soon)

## Deploying a new server

Though these instructions are detailed, the code has not been abstracted to where configuration lives outside the code, so deploying means changing (just a few) values in code.

### Set up SMS phone number

These instructions are for using Twilio, but it would not be too hard to change things around for another SMS service.

1. Create an account at Twilio.
1. Obtain a [phone number](https://www.twilio.com/user/account/phone-numbers) or use an existing one if you already have one set up.
1. Under the settings for that phone number, set the Messaging POST value to `http://<YOUR_APP_NAME>.meteor.com/incoming`.
1. There is no real set up for the web application part, but the application displays the phone number so you may want to update that.

### Create web server

The application is a [Meteor](http://www.meteor.com/) application, and to note, my first Meteor application.

1. Install Meteor: `curl https://install.meteor.com | /bin/sh`
1. Run locally: `meteor`
1. Deploy to Meteor.com: `meteor deploy <YOUR_APP_NAME>.meteor.com`

### Nodes

You will have to update your nodes to point at your server.
