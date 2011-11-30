//  template.js
//  (c) 2011 StudyBreak Inc.
//  Innervate is freely distributable under the MIT license.

var _ = require('underscore');
var fs = require('fs');
var jade = require('jade');
var path = require('path'),


/**
 * Renders the template with the given name and options.
 * Name may contain / separators and is relative to the views directory.
 */
exports.render = function(name, options, callback) {

    options || (options = {});
    options.cache = options.cache || (process.env.NODE_ENV !== 'development');
    options.filename = exports.resolveFilename(name);

    var content = exports.getFile(options.filename, options.cache);
    if (!content) {
        var msg = 'Template file ' + options.filename + ' could not be read';
        return callback(new Error(msg));
    }

    if (options.compile) {
        return jade.compile(content, options, callback);
    }
    else {
        return jade.render(content, options, callback);
    }
};


/**
 * Compiles the template with the given name and options.
 * Name may contain / separators and is relative to the views directory.
 * Returns a javascript function that takes a hash of locals and
 * renders the content in that context.
 */
exports.compile = function(name, options) {
    options.compile = true;
    return exports.render(name, options);
};

/**
 * Returns true if the template exists.
 * Because of caching this will normally return quickly, rather than checking the file system all the time.
 */
exports.exists = function(name) {
    return exports.getFile(exports.resolveFilename(name), true) ? true : false;
};

/**
 * Resolves the template name to a filename.
 */
exports.resolveFilename = function(name) {
    return path.resolve('views', name + '.jade');
};

/**
 * Loads the content from the given template file.
 * If useCache is true, looks in cache so we can quickly check for template existence.
 */
exports.getFile = function(filename, useCache) {

    // Look in cache
    var content = useCache ? fileCache[filename] : undefined;

    // We may have put 'false' in there to indicate a failed load.
    if (typeof content === 'boolean')
        return content;

    if (!content) {
        // Attempt to read content here.
        // We'll do it synchronously and perhaps because of caching it won't matter.
        // After all, jade does all its file reads synchronously.
        try {
            content = fs.readFileSync(filename, 'utf8');
        } catch (e) {
            content = false;
        }

        // Cache it
        if (useCache)
            fileCache[filename] = content;
    }

    return content;
};

// Cache of template file content.
var fileCache = {};

