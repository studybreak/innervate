
var rand =  function(bits) {
	return Math.floor(Math.random() * (2 << bits));
};


exports.createTag = function(byte_size) {
	byte_size = byte_size || 8;
	var id = new Buffer(byte_size);
	for (var i = 0; i < byte_size; i++) {
		id[i] = exports.rand(8);
	}
	return id.toString('base64')
			     .replace(/={1,3}$/, '')
           .replace(/\+/g, '')
           .replace(/\//g, '');
};


exports.tagHtml = function(html, tag) {
	var attr = ' id="in_' + tag + '" ';
	var match = html.match(/$\s<\w+/m);
	if (match) {
		return [match, attr, html.slice(match.length)].join('');
	}
	else {
		return ["<span ", attr, ">", html, "</span"].join('');
	}
};
