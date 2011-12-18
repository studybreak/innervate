//  index.js
//  (c) 2011 StudyBreak Inc; Allan Carroll <allan@studybreak.com>
//  Innervate is freely distributable under the MIT license.

//var exports = module.exports = require('./lib/innervate');

var findit = require('findit');
var fs = require('fs');
var jade = require('jade');
var uglify = require("uglify-js");


// TODO: decide how views are rendered server side and how models are specified.
// Also, how do models/collections and views correspond. Always 1-1 from view
// to one or the other?


var exports = module.exports = function (options) {

  options = options || {};
  options.mount = options.mount || '/innervate.js';
  options.require = options.require && !Array.isArray(options.require) ?
                    [options.require] : (options.require || []);

  // TODO: Add file watching support for easier use in development.

  var text = options.require
      // Gather a list of all files in the require directory and below.
      .map(findit.sync)
      // Flatten the list.
      .reduce(function (memo, files) { return memo.concat(files); })
      // Read the files' contents.
      .map(function (file) { return [file, fs.readFileSync(file, 'utf8')]; })
      // Filter the content using the file-extension based filter.
      .map(function (file) {
        var ext = file[0].split('.').slice(-1)[0];
        return filters[ext] && filters[ext](file[0], file[1], options);
      })
      // Remove the output of any files with no specified filter.
      .filter(function (text) { return text; });

  text.unshift(runtime);

  var output = minify(text.join(''));

  var self = function (req, res, next) {
    if (req.url.split('?')[0] !== options.mount) return next();

    res.statusCode = 200;
    res.setHeader('last-modified', self.modified.toString());
    res.setHeader('content-type', 'text/javascript');
    res.end(output);
  };

  self.modified = new Date();

  return self;
};


// TODO: figure out how filters correspond to a namespace better, not just the
// template namespace. Should be easy to specify which kind of thing the file is


/**
 *
 */

var filters = {
  /**
   *
   */

  js: function (filename, text, options) {
    return text;
  },

  /**
   *
   */

  // TODO: Make IV template agnostic. Probably needs ability to pass in filters
  // that produce js functions for template types
  jade: function (filename, text, options) {
    options = options || {};
    options.compileDebug = false;

    try {
      // Compile the template
      var parser = new jade.Parser(String(text), filename, options);
      var js = new jade.Compiler(parser.parse(), options).compile();

      // Take the extension and path off the filename and use as a template id.
      var id = filename.split('/').slice(-1)[0].split('.')[0];

      return ''
      + 'window.iv._[' + id + ']='
      + 'function (locals) {'
      +   'var buf = [], t = window.iv, attrs = t.$a, escape = t.$e;'
      +   'with (locals || {}) {' + js + '};'
      +   'return buf.join("");'
      + '};';
    }
    catch (err) {
      parser = parser.context();
      jade.runtime.rethrow(err, parser.filename, parser.lexer.lineno);
    }
  }
};


/**
 *
 */

function minify (js) {
	var ast = uglify.parser.parse(js); // parse code and get the initial AST
	ast = uglify.uglify.ast_mangle(ast); // get a new AST with mangled names
	ast = uglify.uglify.ast_squeeze(ast); // get an AST with compression optimizations
	return uglify.uglify.gen_code(ast, {beautify: false}); // compressed code here
}


/**
 * Stringify a runtime jade function preserving minification
 */

function stringify (fn) {
  return fn.toString().replace(/\n/g, '');
}


// TODO: Make the templates more ICH-like with syntax like iv.templatename({})
// TODO: Add logic to detect duplicate template names


/**
 * Client side wrapper code (minified).
 * Runtime borrowed from JadeVu [https://github.com/LearnBoost/jadevu]
 * Copyright (c) 2011 Guillermo Rauch <guillermo@learnboost.com>
 */

var runtime = ''
  + '(function () {'
  +   'var p = "undefined" != typeof iv ? iv : undefined'
  +     ', w = window'
  +     ', s = Object.prototype.toString'
  +     ', t = function(i, p){'
  +         'var r = _[i](p);'
  +         'return "undefined" != typeof jQuery ? jQuery(r) : r;'
  +       '}'
  +     ', exports = {t: t}'
  +     ', _ = t._ = {};'
  +   't.noConflict = function(){'
  +     'w.iv = p;'
  +     'return t;'
  +   '};'
  +   'var $k = Object.keys || function(obj){'
  +     'var a = [];'
  +     'for(var i in obj)'
  +       'if (obj.hasOwnProperty(i)) a.push(i);'
  +     'return a;'
  +   '};'
  +   'var $a = Array.isArray || function(obj){'
  +     'return "[object Array]" == s.call(obj);'
  +   '};'
  +   't.$e = ' + stringify(jade.runtime.escape) + ';'
  +   't.$a = '
        + stringify(jade.runtime.attrs)
          .replace(/escape/g, 't.$e')
          .replace(/Object\.keys/g, '$k')
          .replace(/Array\.isArray/g, '$a')
        + ';'
  +   'if (!w.iv) w.iv = t;'
  + '})();';
