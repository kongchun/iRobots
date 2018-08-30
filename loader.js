var http = require('http');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
var request = require('request');
var userAgent = require('./userAgent.js');

var requestGet = function(url, options = {}) {
	var {
		header,
		charset,
		delay
	} = options;
	return requestBody({
		url: url,
		header: header,
		method: "GET",
		charset: charset,
		delay: delay
	});
};

var requestPost = function(url, postBody, options) {
	var {
		header,
		charset,
		delay
	} = options;
	return requestBody({
		url: url,
		header:header,
		method: "POST",
		charset: charset,
		formData: postBody,
		delay: delay
	})
};



var requestBody = function({
	url,
	method,
	header = {
		'User-Agent': userAgent.getRandom()
	},
	formData = {},
	charset = null,
	delay = 0
}) {
	let options = {
		method: method,
		url: url,
		encoding: null,
		headers: header,
		form: formData
	}

	//console.log(options);

	return new Promise(function(resolve, reject) {
		request(options, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				if (charset == null) {
					charset = getCharset(body);
				}
				var content = iconv.decode(body, charset);
				setTimeout(function() {
					resolve(content)
				}, delay);
			} else {
				reject(error);
			}
		});
	})
}



var getCharset = function(body) {
	var charset = ""
	var arr = body.toString().match(/<meta([^>]*?)>/g);
	if (arr) {
		arr.forEach(function(val) {
			var match = val.match(/charsets*=s*(.+)"/);
			if (match && match[1]) {
				if (match[1].substr(0, 1) == '"') match[1] = match[1].substr(1);
				charset = match[1].trim();
				return false;
			}
		})
	}
	if (charset == "") {
		charset = "utf-8";
	}
	return charset;
}



var get = function(url, options) {
	return requestGet(url, options);
}

var getDOM = function(url, options) {
	return get(url, options).then(function(html) {
		return parseHTML(html);
	})
}

var getJSON = function(url, options = {}) {
	options.charset = options.charset ? options.charset : "utf-8"
	return get(url, options).then(function(content) {
		var json = JSON.parse(content)
		return json;
	})
}

var post = function(url, postBody, options) {
	return requestPost(url, postBody, options);
}
var postDOM = function(url, postBody, options) {
	return post(url, postBody, options).then(function(html) {
		return parseHTML(html);
	})
}

var postJSON = function(url, postBody, options = {}) {
	options.charset = options.charset ? options.charset : "utf-8"
	return post(url, postBody, options).then(function(content) {
		var json = JSON.parse(content)
		return json;
	})
}

var parseHTML = function(html) {
	var dom = cheerio.load(html, {
		withDomLvl1: true,
		normalizeWhitespace: true,
		xmlMode: false,
		decodeEntities: false
	});
	return dom;
}

var Loader = {
	get: get,
	getJSON: getJSON,
	getDOM: getDOM,
	post: post,
	postJSON: postJSON,
	postDOM: postDOM,
	parseHTML: parseHTML
}

module.exports = Loader;
