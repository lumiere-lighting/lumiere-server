/**
 * Main application logic for Lumiere Meteor app.
 */

// Place hold some variables
var chroma, Twitter, twitter, profanity, profanityList, profanityRegex, purify, currentID;

// Persistant data stores
var Colors = new Meteor.Collection('colors');

// Allow a settings file to override defaults, _.extend does not
// do deep
Meteor.settings = Meteor.settings || {};
Meteor.settings.public = _.extend({}, {
  name: 'Lumière',
  lights: 10
}, Meteor.settings.public);

// Shared objects across client and server.
// Meteor.lumiere.colors comes in from colors.js
Meteor.lumiere = Meteor.lumiere || {};

// Shared methods that should not be called async
Meteor.lumiere.fillColor = function(color) {
  var colors = [];
  var i;

  // Repeat colors if longer than needed
  if (!_.isUndefined(color) && _.isObject(color) && color.colors.length < Meteor.settings.lights) {
    for (i = 0; i < Meteor.settings.lights; i++) {
      colors.push(color.colors[i % color.colors.length]);
    }
    color.colors = colors;
  }
  return color;
};


// Client side only.  Multiple templates are used
// as Meteor ends up rerendering everything when
// one value is updated and can be very slow.
if (Meteor.isClient) {
  // Meteor settings has a specifcal "public attribute" for the client
  // and why make extra work for ourselves
  if (_.isObject(Meteor.settings)) {
    Meteor.settings = Meteor.settings.public;
  }

  // Subscribe to specific data view
  Meteor.subscribe('colors-recent');

  // Change array into array of objects with index
  UI.registerHelper('addIndex', function(arr) {
    return _.map(arr, function(val, index) {
      return {
        index: index,
        value: val,
        first: (index === 0) ? true : false,
        last: (index === arr.length - 1) ? true : false
      };
    });
  });

  // Status allows for a simple icon to show if the client
  // is connected to the server
  Template.header.helpers({
    status: function() {
      return Meteor.status().status;
    },
    name: Meteor.settings.name
  });
  // Set title of page
  Template.header.rendered = function() {
    document.title = Meteor.settings.name;
  };

  // The current selection of lights
  Template.lights.helpers({
    current: function() {
      var recent = Colors.find().fetch()[0];

      // Check that we have something
      if (!_.isUndefined(recent)) {
        recent.input = recent.input.split(',').join(', ');
      }
      else {
        return false;
      }

      // Fill the lights
      recent =  Meteor.lumiere.fillColor(recent);
      length = recent.colors.length;
      recent.lightWidth = (length === 0) ? 0 : (100 / length) - 0.00001;

      // Some inputs are not worth showing
      if (recent.source === 'the Colorpicker') {
        recent.input = false;
      }

      return recent;
    }
  });

  // Lights scrolling thing.  'scroll window' does not work as a Meteor event
  Template.lights.rendered = function() {
    $(document).ready(function() {
      var container = '#color-output-canvas-container';
      var canvas = '#color-output-canvas';
      var stuckClass = 'stuck';

      if ($(container).size() > 0) {
        // Make sure container is constant height
        //$(container).height($(canvas).height());

        $(window).on('scroll', _.throttle(function(e) {
          var $container = $(container);
          var $canvas = $(canvas);
          var scrollTop = $(window).scrollTop();
          var stuck = $canvas.hasClass(stuckClass);
          // Offset a bit so the stuck container seems a bit more smooth
          var bottom = $container.offset().top + $container.height() - 10;

          if (!stuck && scrollTop > bottom) {
            $canvas.addClass(stuckClass);
          }
          else if (stuck && scrollTop <= bottom) {
            $canvas.removeClass(stuckClass);
          }
        }, 100));
      }
    });
  };

  // Colorpicker input
  Template.colorpicker.helpers({
    inputColors: function() {
      var inputs = Session.get('input');

      // If no inputs yet, use default
      if (!inputs || !_.isArray(inputs) || !inputs.length) {
        inputs = [{
          color: '#1b26f7'
        }];
      }
      // Add index because mustache is stupid
      inputs = _.map(inputs, function(i, ii) {
        return {
          color: i.color,
          current: (ii == inputs.length - 1) ? true : false,
          index: ii
        };
      });

      Session.set('input', inputs);
      return inputs;
    }
  });

  // When done rendered
  Template.colorpicker.rendered = function() {
    var $picker = $('.color-picker');
    var $inputs = $('.color-inputs');
    var defaultColor = '#1b26f7';
    var current = _.findWhere(Session.get('input'), { current: true });

    // Only do if not done
    if ($picker.size() > 0 && !$picker.hasClass('processed')) {
      // Make picker
      $picker.addClass('processed');
      $picker.iris({
        color: current.color,
        mode: 'hsl',
        controls: {
          horiz: 'h',
          vert: 's',
          strip: 'l'
        },
        hide: false,
        border: false,
        width: $picker.width(),
        palettes: false,
        change: function(e, ui) {
          $inputs.find('.current-input')
            .css('background-color', ui.color.toString())
            .attr('data-color', ui.color.toString());
        }
      });
    }
  };

  // Events handled in the input template.
  Template.colorpicker.events({
    // Add another color
    'click .add-another': function(e) {
      e.preventDefault();
      var color = $('.color-picker').iris('color').toString();
      var inputs = Session.get('input');
      var current = _.findWhere(inputs, { current: true });

      // Set current
      inputs[current.index].color = color;
      // Add new
      inputs.push({
        color: color
      });

      // This will trigger the
      Session.set('input', inputs);
    },
    // Remove color
    'click .color-inputs li[data-color]:not(.current-input)': function(e) {
      e.preventDefault();
      var inputs = Session.get('input');
      var current = _.findWhere(inputs, { current: true });
      var color = $('.color-picker').iris('color').toString();

      // Save current first, since we don't do this on every change
      inputs[current.index].color = color;

      // "this" ends up being the input object (not sure why)
      if (_.isObject(this) && !_.isUndefined(this.index)) {
        if (inputs.length > 1) {
          inputs.splice(this.index, 1);
          Session.set('input', inputs);
        }
      }
    },
    // Save color
    'click .save-input': function(e) {
      var inputs = Session.get('input');
      var current = _.findWhere(inputs, { current: true });
      var color = $('.color-picker').iris('color').toString();
      var saveInput;

      // Save current first, since we don't do this on every change
      inputs[current.index].color = color;

      // Create input
      saveInput = _.pluck(inputs, 'color').join(',');

      // Save
      Meteor.call('addColor', saveInput, { source: 'the Colorpicker' },
        function(error, response) {
          if (error) {
            throw new error;
          }
          else {
            // Reset input
            Session.set('input', undefined);
          }
        });
    }
  });

  // Textinput
  Template.textInput.events({
    'submit .text-input-form': function(e) {
      e.preventDefault();
      var val = $('#color-input-text').val();

      // Save
      if (val) {
        Meteor.call('addColor', val, { source: 'the Web Text' },
          function(error, response) {
            if (error) {
              throw new error;
            }
            else {
              // Reset input
              $('#color-input-text').val('');
            }
          });
      }
    }
  });

  // Home page
  Template.home.helpers({
    settings: Meteor.settings
  });

  // About page
  Template.about.helpers({
    settings: Meteor.settings
  });

  // Sign page
  Template.sign.helpers({
    settings: Meteor.settings
  });
  Template.sign.rendered = function() {
    $('body').addClass('sign-page');
  };
}


// Server side only.  Saving and processing colors.  Mostly we are just adding
// some methods that can be shared with the client
if (Meteor.isServer) {
  // "npm" packages
  chroma = Meteor.npmRequire('chroma-js');
  profanity = Meteor.npmRequire('profanity-util');
  // Profanity util has a good list of words, but does a stupid
  // regex when replacing (takes into account spacing)
  profanityList = Meteor.npmRequire('profanity-util/lib/swearwords.json');
  profanityRegex =  new RegExp('(' + profanityList.join('|') + ')', 'gi');
  purify = function(str) {
    return str.replace(profanityRegex, function(val) {
      var str = val.substr(0, 1);
      for (var i = 0; i < val.length - 2; i += 1) {
        str += '*';
      }
      return str + val.substr(-1);
    });
  }

  // Create an array of color names, and
  Meteor.lumiere.colorNames = _.pluck(Meteor.lumiere.colors, 'colorName');
  // Sort by length for later
  Meteor.lumiere.colorNamesSorted = _.sortBy(Meteor.lumiere.colorNames, 'length').reverse();

  // Connect to twitter
  if (_.isObject(Meteor.settings.twitterAuth)) {
    Twitter = Meteor.npmRequire('twitter');
    twitter = new Twitter(Meteor.settings.twitterAuth);
  }

  // Startup
  Meteor.startup(function() {
    // Create subscriptions to data for the client
    Meteor.publish('colors-recent', function() {
      return Colors.find({}, { sort: { timestamp: -1 }, limit: 1 });
    });

    // Methods that can be shared on both server and client
    Meteor.methods({
      // Turn a string into a color
      findColor: function(input) {
        var color = false;
        var colors = [];
        var found;
        var r;

        // First see if Chroma can handle the input, if that fails
        // do a look up of custom colors.
        //
        // We used to choose one at random, but handling bad language
        // made me rethink handling this at all.
        try {
          color = chroma(input);
          color = color.hex();
        }
        catch (e) {
          found = Meteor.lumiere.colorNames.indexOf(input);

          if (found !== -1) {
            color = Meteor.lumiere.colors[found].colors;
          }
          else {
            return false;
          }
        }

        // Turn values into hex
        if (_.isString(color)) {
          color = chroma(color).hex();
        }
        else if (_.isArray(color)) {
          color.forEach(function(c) {
            colors.push(chroma(c).hex());
          });
          color = colors;
        }

        return color;
      },

      // Turn input into a set of colors.  Using comma separation is way easier
      // to handle multiple colors but harder to explain to people, so we do
      // try to read multiple colors with spaces but this gets a bit diffcult
      // or inaccruate because there are colors like
      // "blue", "green" and "bluegreen"
      //
      // Some tests:
      // curl --data "Body=blue" -X POST http://localhost:3000/api/colors/twilio
      // curl --data "Body=blue red green" -X POST http://localhost:3000/api/colors/twilio
      // curl --data "Body=blue, red, green" -X POST http://localhost:3000/api/colors/twilio
      // curl --data "Body=blue green red" -X POST http://localhost:3000/api/colors/twilio
      // curl --data "Body=bluegreen red" -X POST http://localhost:3000/api/colors/twilio
      // curl --data "Body=red bright red" -X POST http://localhost:3000/api/colors/twilio
      makeColors: function(input) {
        var colors = [];
        var inputs = [];
        var outputs = [];
        var noCommas = [];
        var onlySpaces = [];
        var found, onlySpacesWorks;
        input = input.trim();


        // If no commas found, try to find words in the input and insert
        // commas.
        //
        // There is also the issue of a single hex color
        //
        // First we see if we can find each color separated by a space,
        // but if that doesn't work, the we try the more verbose way,
        // which is to replace each color we find with its index and then
        // put back together, using a list of colors ordered by length
        if (input.indexOf(',') === -1 && input.indexOf('#') !== 0) {
          // Try the simple approach
          onlySpacesWorks = true
          _.each(input.trim().replace(/\W/g, ' ').toLowerCase().split(' '), function(s, si) {
            if (Meteor.lumiere.colorNamesSorted.indexOf(s) !== -1) {
              onlySpaces.push(s);
            }
            else {
              onlySpacesWorks = false;
            }
          });

          // Check if the simple approach worked
          if (onlySpacesWorks) {
            input = onlySpaces.join(',');
          }
          else {
            input = input.trim().replace(/\W/g, '').toLowerCase();
            // Replace with indexes
            _.each(Meteor.lumiere.colorNamesSorted, function(c, ci) {
              if (input.indexOf(c) !== -1) {
                input = input.replace(new RegExp(c, 'g'), ci.toString() + ',');
              }
            });
            noCommas = input.split(',');
            // Put together with colors
            noCommas = _.map(noCommas, function(n, ni) {
              return (n) ? Meteor.lumiere.colorNamesSorted[parseInt(n, 10)] : '';
            });
            noCommas = _.filter(noCommas, function(n, ni) { return n; });
            input = noCommas.join(',');
          }
        }

        // Find colors from our input with commas
        _.each(input.trim().split(','), function(c) {
          c = c.trim().replace(/\W/g, '').toLowerCase();
          if (c.length > 0) {
            found = Meteor.call('findColor', c);

            if (_.isString(found)) {
              colors.push(found);
              inputs.push(c);
            }
            else if (_.isArray(found)) {
              found.forEach(function(f) {
                colors.push(f);
              });
              inputs.push(c);
            }
          }
        });

        // The final thing we want to do is make sure that the input is
        // not all black.  Black is valid if between other colors.
        if (_.uniq(colors).length === 1 && _.uniq(colors)[0] === '#000000') {
          colors = [];
        }

        return {
          input: inputs.join(','),
          colors: colors
        };
      },

      // Save colors to data-store.  Allow for arbitrary meta data
      saveColors: function(input, colors, meta) {
        meta = (_.isObject(meta)) ? meta : {};
        Colors.insert(_.extend(meta, {
          timestamp: (new Date()).getTime(),
          input: input,
          colors: colors
        }));
      },

      // Wrapper for make and save; this is what any input mechanisms
      // should call.
      addColor: function(input, meta) {
        var colors = Meteor.call('makeColors', input);

        if (colors.colors.length > 0) {
          Meteor.call('saveColors', colors.input, colors.colors, meta);
          return true;
        }
        else {
          return false;
        }
      }
    });
  });
}


// Twitter streaming input handling
if (_.isObject(Meteor.settings.twitterAuth) && Meteor.settings.public && Meteor.settings.public.twitterFilter) {
  twitter.stream('filter', { track: Meteor.settings.public.twitterFilter }, function(stream) {
    // Since we are out of the context of Meteor and Fiber, we have to wrap
    // this.
    stream.on('data', Meteor.bindEnvironment(function(data) {
      var text;

      // Data in, strip out non-word stuff and send through
      if (_.isObject(data) && data.text) {
        text = data.text.replace(/(#[A-Za-z0-9]+)|(@[A-Za-z0-9]+)|([^0-9A-Za-z, \t])|(\w+:\/\/\S+)/ig, ' ');
        if (text.length > 2) {
          Meteor.call('addColor', text, {
            source: 'Twitter',
            username: '@' + purify(data.user.screen_name)
          });
        }
      }
    }));

    // Handle error
    stream.on('error', Meteor.bindEnvironment(function(error) {
      if (error.source) {
        console.error(error.source);
      }
      else {
        console.error(error.stack);
      }
    }));

  });
}


// "API" routing

// Routing for text input via Twilio.  Can test locally with something like:
// curl --data "Body=blue" -X POST http://localhost:3000/api/colors/twilio
Router.route('incoming-twilio', {
  path: '/api/colors/twilio',
  where: 'server',
  action: function() {
    // Example input from Twilio
    /*
    { AccountSid: 'XXXXXX',
    MessageSid: 'XXXXXX',
    Body: 'green',
    ToZip: '55045',
    ToCity: 'LINDSTROM',
    FromState: 'GA',
    ToState: 'MN',
    SmsSid: 'XXXXXXX',
    To: '+16514001501',
    ToCountry: 'US',
    FromCountry: 'US',
    SmsMessageSid: 'XXXXX',
    ApiVersion: '2010-04-01',
    FromCity: 'ATLANTA',
    SmsStatus: 'received',
    NumMedia: '0',
    From: '+177059XXXXX',
    FromZip: '30354' }
    */

    // Responses
    var responses = [
      'Thanks for your input; your color(s) should show up in a few seconds.',
      'Yay! More colors! Might take a moment to update those colors for you.',
      'Our robots are working hard to get those colors just right for you.',
      'Wait for it... Bam! Colors!'
    ];
    var updated = false;
    var response;

    // Should return a TwiML document.
    // https://www.twilio.com/docs/api/twiml
    if (this.request.body && this.request.body.Body) {
      updated = Meteor.call('addColor', this.request.body.Body, {
        source: 'Twilio (SMS)',
        state: this.request.body.FromState,
        city: this.request.body.FromCity,
        country: this.request.body.FromCountry
      });
    }

    // Return some TwiML
    response = (updated) ? _.sample(responses) : 'We\'re sorry; we didn\'t recognize any of those colors. Try again; there are 1,000+ names of colors to choose from like "' + _.sample(Meteor.lumiere.colors).colorName + '".';
    this.response.writeHead(200, {
      'Content-Type': 'text/xml'
    });
    this.response.end('<?xml version="1.0" encoding="UTF-8" ?> <Response> <Sms> ' + response + ' -' + Meteor.settings.name + '</Sms> </Response>\n');
  }
});

// Routing Yo app input.  Can test locally with something like:
// curl -X GET http://localhost:3000/api/colors/yo?username=testing
Router.route('incoming-yo', {
  path: '/api/colors/yo',
  where: 'server',
  action: function() {
    var thisRoute = this;
    var username = (_.isObject(this.request.query)) ? purify(this.request.query.username) : false;

    // Just pick a random color
    Meteor.call('addColor', _.sample(Meteor.lumiere.colors).colorName, {
      source: 'Yo',
      username: username
    });

    if (_.isString(Meteor.settings.yoAuth)) {
      // Send Yo back
      HTTP.post('http://api.justyo.co/yo/', {
        data: {
          api_token: Meteor.settings.yoAuth,
          username: username,
          link: 'http://lumiere.lighting'
        }
      }, function() {
        thisRoute.response.end('Yo-ed');
      });
    }
    else {
      this.response.end('Yo-less');
    }
  }
});

// Routing for color api output
Router.route('outgoing-colors', {
  path: '/api/colors',
  where: 'server',
  action: function() {
    var thisRoute = this;
    var color = Colors.find({}, { sort: { timestamp: -1 }}).fetch()[0];

    // Output other formats such as hex, rgb, css
    if (_.isObject(this.params) && this.params.format) {
      color.colors = _.map(color.colors, function(c, ci) {
        var o = chroma(c);
        if (_.isFunction(o[thisRoute.params.format])) {
          return o[thisRoute.params.format]();
        }
        return c;
      });
    }

    // FastLED wants to use a hex format like 0x123456 so we provide this for
    // easier processing
    if (_.isObject(this.params) && this.params.format === 'hex0') {
      color.colors = _.map(color.colors, function(c, ci) {
        return chroma(c).hex().replace('#', '0x');
      });
    }

    // Handle limit
    if (_.isObject(this.params) && parseInt(this.params.limit, 10) > 0) {
      color.colors = _.first(color.colors, parseInt(this.params.limit, 10));
    }

    // Remove input, as this can help use less memory for client
    if (_.isObject(this.params) && this.params.noInput === 'true') {
      color = {
        _id: color._id,
        timestamp: color.timestamp,
        colors: color.colors
      };
    }


    // Write out
    this.response.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Document-ID': color._id
    });
    this.response.end(JSON.stringify(color) + '\n');
  }
});




// Handle visual routes.  Set default template.
Router.configure({
  layoutTemplate: 'layout'
});

// Router does not go back to top when switching pages, so this
// hacks around it
Router._filters = {
  resetScroll: function () {
    var scrollTo = window.currentScroll || 0;
    $('html, body').animate({ scrollTop: scrollTo }, 300);
    $('body').css('min-height', 0);
  }
};

if (Meteor.isClient) {
  Router.onAfterAction(Router._filters.resetScroll);
}

// About page
Router.route('about', {
  path: '/about'
});

// About page
Router.route('sign', {
  path: '/sign'
}, function() {
  this.template('');
});

// Default route is home
Router.route('home', {
  path: '*'
});
