var _ = require('underscore');
var template = require('ltd/services/template');




var clientInstances = [];

var addInstance = function (tag, instance) {
  var instantiation = [instance.constructor.name, '("', tag, '");'].join('');
  clientInstances.push(instantiation);
};



(function() {

  var Innervate = {};

  // global on the server, window in the browser
  var root = this;
  var previousInnervate = root.Innervate;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Innervate;
  }
  else {
    root.Innervate = Innervate;
  }

  Innervate.noConflict = function () {
    root.Innervate = previousInnervate;
    return Innervate;
  };


  Innervate.Presenter = function(options) { };

  Innervate.Presenter.prototype.render = function(data, callback) {
    var addTag = function (err, html) {
      if (err) return callback(err);

      var attr = ' id="in_' + tag + '"';
      var match = html.match(/^\s*<\w+/m);

      if (match) {
        html = [match[0], attr, html.slice(match[0].length)].join('');
      }
      else {
        html = ["<span", attr, ">", html, "</span"].join('');
      }


      return callback(null, html);
    };

    createTag = function(byte_size) {
      var rand =  function(bits) {
        return Math.floor(Math.random() * (2 << bits));
      };

      byte_size = byte_size || 8;
      var id = new Buffer(byte_size);
      for (var i = 0; i < byte_size; i++) {
        id[i] = rand(8);
      }
      return id.toString('base64').replace(/={1,3}$/, '')
               .replace(/\+/g, '').replace(/\//g, '');
    };

    var tag = createTag(4);
    addInstance(tag, this);

    var options = _.defaults(this.view(data), {});
    template.render(this.template, options, addTag);
  };


  // Shared empty constructor function to aid in prototype-chain creation.
  var ctor = function(){};

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var inherits = function(parent, protoProps, staticProps) {
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call `super()`.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Inherit class (static) properties from parent.
    _.extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Add static properties to the constructor function, if supplied.
    if (staticProps) _.extend(child, staticProps);

    // Correctly set child's `prototype.constructor`.
    child.prototype.constructor = child;

    // Set a convenience property in case the parent's prototype is needed later.
    child.__super__ = parent.prototype;

    return child;
  };

  // The self-propagating extend function that Backbone classes use.
  var extend = function (protoProps, classProps) {
    var child = inherits(this, protoProps, classProps);
    child.extend = this.extend;
    return child;
  };

  Innervate.Presenter.extend = extend;

})();
