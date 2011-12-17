//  index.js
//  (c) 2011 StudyBreak Inc; Allan Carroll <allan@studybreak.com>
//  Innervate is freely distributable under the MIT license.

//var exports = module.exports = require('./lib/innervate');

var findit = require('findit');
var fs = require('fs');
var jade = require('jade');
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;


var exports = module.exports = function (options) {

  options = options || {};
  options.mount = options.mount || '/innervate.js';
  options.require = options.require && !Array.isArray(options.require) ?
                    [options.require] : (options.require || []);

  var templates = [];

  templates.push(runtime);

  // Iterate over all the required paths and compile the jade templates
  for (var i = options.require.length - 1; i >= 0; i--) {

    // Recurse through the paths and gather a list of all potential templates
    var files = findit.sync(options.require[i]);
    for (var j = files.length - 1; j >= 0; j--) {

	    // Filter out non .jade files
	    if (files[j].substr(-5) !== '.jade') continue;

		  // Take the extension and path off the filename and use as a template id.
		  var id = files[j].split('/').slice(-1)[0].split('.')[0];

	    templates.push('window.iv._[' + id + ']=' + compile(files[j]) + ';');
    }
  }

  var output = minify(templates.join(''));

  var self = function (req, res, next) {
    if (req.url.split('?')[0] !== options.mount) return next();

    res.statusCode = 200;
    res.setHeader('last-modified', self.modified.toString());
    res.setHeader('content-type', 'text/javascript');
    res.end(output);
  };

  self.modified = new Date;

  return self;
};


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


/**
 *
 */

function compile (path, options) {
	options = options || {compileDebug: false};

  // Read the file contents
  var text = fs.readFileSync(path, 'utf8');

  // Compile the template
  try {
    var parser = new jade.Parser(String(text), path, options);
    var js = new jade.Compiler(parser.parse(), options).compile();

    return ''
    + 'function (locals) {'
    +   'var buf = [], t = window.iv, attrs = t.$a, escape = t.$e;'
    +   'with (locals || {}) {' + js + '};'
    +   'return buf.join("");'
    + '}';
  }
  catch (err) {
    parser = parser.context();
    jade.runtime.rethrow(err, parser.filename, parser.lexer.lineno);
  }
}


/**
 *
 */

function minify (js) {
	var ast = jsp.parse(js);    // parse code and get the initial AST
	ast = pro.ast_mangle(ast);  // get a new AST with mangled names
	ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
	return pro.gen_code(ast, {beautify: true});   // compressed code here
}


/**
 * Stringify a runtime jade function preserving minification
 */

function stringify (fn) {
  return fn.toString().replace(/\n/g, '');
}
