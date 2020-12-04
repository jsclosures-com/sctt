var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var readline = require('readline');
var url = require('url');
var stream = require('stream');
//var SSH2Client = require('ssh2-sftp-client'); 
//var SSHClient = require('ssh2'); 
var WebSocketServer = require('websocket').server;
var utf8 = require("utf8");
var Buffer = require("buffer").Buffer;

var getHandlers = require("./handlers.js").getHandlers;
var HANDLERS = getHandlers();

var mimeType = {
	'.ico': 'image/x-icon',
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.css': 'text/css',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.wav': 'audio/wav',
	'.mp3': 'audio/mpeg',
	'.svg': 'image/svg+xml',
	'.pdf': 'application/pdf',
	'.doc': 'application/msword',
	'.eot': 'appliaction/vnd.ms-fontobject',
	'.ttf': 'aplication/font-sfnt'
};

//Lets define a port we want to listen to
var PORT = 8180;
var SOLRHOST = "localhost";
var SOLRPORT = 8983;
var SOLRCOLLECTION = "validate";
var DEBUG = 0;
var AUTHKEY = false;
var AUTHMODE = false;
var LEADER = false;
var LEADERCHECK = 1000;
var WORKERS = false;
var WORKERSCHECK = 1000;
var WORKERLIFE = 5000;
var WORKER = "worker";

var commandLine = {};

function writeLog(level, message) {
	if (level <= DEBUG) {
		console.log(message);
	}
}
process.argv.forEach((val, index) => {
	writeLog(1, `${index}: ${val}`);
	if (index > 1) {
		let v = val;

		if (v.indexOf("=")) {
			let name = v.substring(0, v.indexOf("="));
			commandLine[name] = v.substring(v.indexOf("=") + 1);
		}
	}
});

if (DEBUG > 1) console.log("commandline", commandLine);

if (commandLine.info) {
	console.log("node .\\server.js authkey=c29scjpTb2xyUm9ja3M= debug=11");
	process.exit(0);
}
if (Object.prototype.hasOwnProperty.call(commandLine, "port"))
	PORT = parseInt(commandLine.port);
if (Object.prototype.hasOwnProperty.call(commandLine, "solrhost"))
	SOLRHOST = commandLine.solrhost;
if (Object.prototype.hasOwnProperty.call(commandLine, "solrport"))
	SOLRPORT = parseInt(commandLine.solrport);
if (Object.prototype.hasOwnProperty.call(commandLine, "solrcollection"))
	SOLRCOLLECTION = commandLine.solrcollection;
if (Object.prototype.hasOwnProperty.call(commandLine, "debug"))
	DEBUG = parseInt(commandLine.debug);
if (Object.prototype.hasOwnProperty.call(commandLine, "authkey"))
	AUTHKEY = commandLine.authkey;
if (Object.prototype.hasOwnProperty.call(commandLine, "authmode"))
	AUTHMODE = commandLine.authmode;
if (Object.prototype.hasOwnProperty.call(commandLine, "leader"))
	LEADER = commandLine.leader;
if (Object.prototype.hasOwnProperty.call(commandLine, "leadercheck"))
	LEADERCHECK = parseInt(commandLine.leadercheck);
if (Object.prototype.hasOwnProperty.call(commandLine, "workers"))
	WORKERS = commandLine.workers == 'true';
if (Object.prototype.hasOwnProperty.call(commandLine, "leadercheck"))
	WORKERSCHECK = commandLine.workerscheck;
if (Object.prototype.hasOwnProperty.call(commandLine, "workerlife"))
	WORKERLIFE = parseInt(commandLine.workerlife);
if (Object.prototype.hasOwnProperty.call(commandLine, "worker"))
	WORKER = commandLine.worker;
else
	WORKER = WORKER + new Date().getTime();

var CONTEXT = {
	commandLine: commandLine,
	PORT: PORT,
	SOLRHOST: SOLRHOST,
	SOLRPORT: SOLRPORT,
	SOLRCOLLECTION: SOLRCOLLECTION,
	DEBUG: DEBUG,
	AUTHKEY: AUTHKEY,
	AUTHMODE: AUTHMODE,
	LEADER: LEADER,
	LEADERCHECK: LEADERCHECK,
	WORKER: WORKER,
	lib: {
		http: http,
		https: https,
		URL: url,
		fs: fs,
		path: path,
		stream: stream,
		readline: readline,
		utf8: utf8,
		Buffer: Buffer
	}
};


//var WORKQUEUE = false;
//fake work
var WORKQUEUE = [{ "id": 1, script: "function(){ console.log('hello'); }" }];
var WORKERLIST = [];

function workCompleted(requestObj) {
	let work = requestObj.work;
	let worker = requestObj.worker;
	let status = requestObj.status;

	if (status == 'OK') {
		for (let i in WORKERLIST) {
			if (WORKERLIST[i].id = worker) {
				WORKERLIST.splice(i, 1);
				break;
			}
		}
	}
	else {
		WORKQUEUE.push(work);
	}

}

function assignWork() {
	let timeNow = new Date().getTime();

	for (let i in WORKERLIST) {
		let worker = WORKERLIST[i];
		if (!worker.isWorking) {
			if (timeNow - worker.timestamp < WORKERLIFE) {
				let work = WORKQUEUE.pop();
				if (work) {
					worker.result.work = [work];
					worker.result.worker = worker.id;
					worker.workingOn = work;
				}
			}
			else {
				worker.response.end(JSON.stringify(worker.result));
			}

			worker.isWorking = true;
		}
	}
}

if (WORKERS) {
	setTimeout(assignWork.bind({ CONTEXT: CONTEXT }), CONTEXT.WORKERCHECK);
}

function postWorker(args) {
	WORKERLIST.push(args);
}

function followTheLeader() {
	let CONTEXT = this.CONTEXT;
	if (CONTEXT.DEBUG > 0) console.log("following the leader", CONTEXT.LEADER);

	let callback = function (res) {
		let str = "";
		let CONTEXT = this.CONTEXT;

		res.on('data', function (chunk) {
			str += chunk;
		});

		res.on('end', function () {
			let data = JSON.parse(str);

			if (CONTEXT.DEBUG > 0) console.log("leader response", data);

			if (data.work && data.work.length > 0) {
				let work = data.work[0];
				if (CONTEXT.DEBUG > 0) console.log("work to do", work);

				let leaderInfo = url.parse(CONTEXT.LEADER);
				if (CONTEXT.DEBUG > 0) console.log("leader info", leaderInfo);

				let config = { method: "POST", host: leaderInfo.hostname, port: leaderInfo.port, path: leaderInfo.path + "/complete" };
				if (AUTHKEY)
					config.headers = { "Authorization": "Basic " + AUTHKEY };

				let cb = function (res) {
					let str = "";
					let CONTEXT = this.CONTEXT;

					res.on('data', function (chunk) {
						str += chunk;
					});

					res.on('end', function () {
						if (CONTEXT.DEBUG > 0) console.log("work complete", str);
					});
				}

				let t = http.request(config, cb.bind({ CONTEXT: CONTEXT }));
				t.on('error', function (e) {
					if (CONTEXT.DEBUG > 1) console.log("Got error: " + e.message);
				});

				t.write(JSON.stringify({ work: work, status: "OK" }));
				t.end();
			}
			else {
				if (CONTEXT.DEBUG > 0) console.log("no work to do");
			}

			setTimeout(followTheLeader.bind({ CONTEXT: CONTEXT }), CONTEXT.LEADERCHECK);
		});
	}

	let leaderInfo = url.parse(CONTEXT.LEADER);
	if (CONTEXT.DEBUG > 0) console.log("leader info", leaderInfo);

	let config = { method: 'POST', host: leaderInfo.hostname, port: leaderInfo.port, path: leaderInfo.path };
	if (AUTHKEY)
		config.headers = { "Authorization": "Basic " + AUTHKEY };

	let t = http.request(config, callback.bind({ CONTEXT: CONTEXT }));
	t.on('error', function (e) {
		if (CONTEXT.DEBUG > 1) console.log("Got error: " + e.message);
	});
	t.write(JSON.stringify({ worker: CONTEXT.WORKER }));
	t.end();
}

if (LEADER) {
	setTimeout(followTheLeader.bind({ CONTEXT: CONTEXT }), LEADERCHECK);
}

function parseCookies(request) {
	var list = {},
		rc = request.headers.cookie;

	rc && rc.split(';').forEach(function (cookie) {
		let parts = cookie.split('=');
		let value = decodeURI(parts.join('='));
		if( value && value != 'undefined' )
			list[parts.shift().trim()] = value;
	});

	return list;
}

function handleRequest(request, response) {
	if (request.method == 'POST' || request.method == 'DELETE' || request.method == 'PUT') {
		writeLog(1, 'POST')
		var body = ''
		request.on('data', function (data) {
			body += data
			writeLog(1, 'Partial body: ' + body)
		});
		request.on('end', function () {
			writeLog(1, 'Body: ' + body)
			let data = body ? JSON.parse(body) : {};
			actualHandleRequest(request, response, data);
		});
	}
	else if (request.method == 'GET') {
		actualHandleRequest(request, response);
	}


}

//We need a function which handles requests and send response
function actualHandleRequest(request, response, bodyData) {
	writeLog(1, "handle request");
	var result = { status: 0 };

	var requestUrl = request.url;
	var requestObj = url.parse(requestUrl, true);
	var queryObj = requestObj.query;
	if (bodyData) {
		for (var p in bodyData) {
			if (Object.prototype.hasOwnProperty.call(bodyData, p)) {
				queryObj[p] = bodyData[p];
			}
		}


	}
	writeLog(1, "query obj", queryObj);
	var contentType = queryObj.contenttype;
	var pathname = requestObj.pathname;
	if (DEBUG > 1) console.log(pathname, requestUrl);

	if (requestUrl.lastIndexOf('/worker/complete', 0) > -1) {

		workCompleted(requestObj);

		response.end(JSON.stringify(result));
	}
	else if (requestUrl.lastIndexOf('/worker', 0) > -1) {
		//TODO register server as worker 
		//worker sends {"status": "OK"}  server responds {"respond": 1000,"work": []}
		//work = {"id": uid,script: base64 compressed zip}
		postWorker({ response: response, result: result, timestamp: new Date().getTime(), id: requestObj.worker });

		//response.end(JSON.stringify(result));
	}
	else if (requestUrl.lastIndexOf('/authservice', 0) > -1) {
		//handle auth request
		if (contentType === 'AUTH') {
			let cookieObj = parseCookies(request);
			if (cookieObj.zen) {
				result.status = 1;
				result.message = "AOK";
				let userName = cookieObj.zen;
				result.user = { "alias": userName, "id": userName, "username": userName };
				result.role = { "id": "ADMINISTRATOR", "label": "ADMINISTRATOR" };
				result.role.views = [{ "id": "main", "name": "main", "autoStart": "true", "buildwith": "buildMainPage", "loadfile": "js/mainpage.js" }];
			}
			else {
				result.message = "FAILURE";
			}

			response.end(JSON.stringify(result));
		}
		else if (contentType === 'LOGIN') {
			if (DEBUG > 1) console.log("login", queryObj);
			let isDelete = request.method == 'DELETE';
			let userName = queryObj.user;
			let userKey = queryObj.password;

			if (userName === userKey) {
				result.status = 1;
				result.message = "AOK";
				result.alias = userName;

				result.user = { "alias": userName, "id": userName, "username": userName };
				result.role = { "id": "ADMINISTRATOR", "label": "ADMINISTRATOR" };
				result.role.views = [{ "id": "main", "name": "main", "autostart": "true", "buildwith": "buildMainPage", "loadfile": "js/mainpage.js" }];

				if (isDelete) {
					response.writeHead(200, {
						'Set-Cookie': 'zen=' + userName + ";expires=0;",
						'Content-Type': 'application/json'
					});
				}
				else {
					response.writeHead(200, {
						'Set-Cookie': 'zen=' + userName,
						'Content-Type': 'application/json'
					});
				}
			}
			else {
				if (isDelete) {
					response.writeHead(200, {
						'Set-Cookie': 'zen=' + ";expires=" + new Date().toISOString(),
						'Content-Type': 'application/json'
					});
				}
				else {
					response.writeHead(200, {
						'Set-Cookie': 'zen=',
						'Content-Type': 'application/json'
					});
				}
				result.status = -1;
				result.message = "FAILURE";
			}
		}

		if (DEBUG > 1) console.log("auth response", result);
		result.contenttype = contentType;
		response.end(JSON.stringify(result));
	}
	else if (pathname === '/restservice') {
		//handle auth request
		writeLog(1, "contentType " + contentType);
		if (Object.prototype.hasOwnProperty.call(HANDLERS, contentType)) {
			let handlerCallback = function (resp) {
				if (DEBUG > 1) console.log("handler called back", this.contentType);
				let parsedResponse = {};

				try {

					if (resp && resp.payload && resp.headers) {
						for (let h in resp.headers) {
							response.setHeader(resp.headers[h].name, resp.headers[h].value);
							writeLog(1, "set header");
						}
						parsedResponse = resp.payload;

					}
					else
						parsedResponse = JSON.stringify(resp);
				}
				catch (exception) {
					if (DEBUG > 0) console.log(exception);
				}

				try {
					this.response.end(parsedResponse);
				}
				catch (ee) { if (DEBUG > 0) console.log(ee); }
			}

			HANDLERS[contentType]({ CONTEXT: CONTEXT, requestUrl: requestUrl, requestObj: requestObj, queryObj: queryObj, contentType: contentType, pathName: pathname, callback: handlerCallback.bind({ response: response, contentType: contentType }) });
		}
		else {
			result.status = 1;
			result.message = "AOK";
			result.items = new Array();
			result.totalCount = 0;

			response.end(JSON.stringify(result));
		}


	}
	else {
		pathname = "./htdocs" + pathname;

		fs.exists(pathname, function (exist) {
			if (!exist) {
				// if the file is not found, return 404
				response.statusCode = 404;
				response.end(`File ${pathname} not found!`);
				return;
			}
			// if is a directory, then look for index.html
			if (fs.statSync(pathname).isDirectory()) {
				pathname += '/index.html';
			}
			// read file from file system
			fs.readFile(pathname, function (err, data) {
				if (err) {
					response.statusCode = 500;
					response.end(`Error getting the file: ${err}.`);
				} else {
					// based on the URL path, extract the file extention. e.g. .js, .doc, ...
					const ext = path.parse(pathname).ext;
					// if the file is found, set Content-type and send data
					response.setHeader('Content-type', mimeType[ext] || 'text/plain');
					response.end(data);
				}
			});
		});
	}



}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function () {
	//Callback triggered when server is successfully listening. Hurray!
	if (DEBUG > 0) console.log("Server listening on: http://localhost:%s", PORT);
});

var wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});

function originIsAllowed(origin) {
	// put logic here to detect whether the specified origin is allowed.
	return true;
}

var logMultiplexer = {
	sockets: {},
	register: function (key, conn) {
		logMultiplexer.sockets[key] = conn;
	},
	deregister: function (key) {
		delete logMultiplexer.sockets[key];
	},
	notify: function (message) {
		for (let c in logMultiplexer.sockets) {
			try {
				logMultiplexer.sockets[c].sendUTF(message);
			}
			catch (e) {
				if (DEBUG > 0) console.log(e);
				logMultiplexer.deregister(c);
			}
		}
	}
};

var messageQueue = [];

function clearLogQueue() {

	for (let i = 0; i < 100; i++) {
		let m = messageQueue.shift();
		if (m)
			logMultiplexer.notify(m);
		else
			break;
	}
	setTimeout(clearLogQueue, 100);
}

clearLogQueue();


console.wslog = function () {
	if (DEBUG > 1) console.log(arguments);
	messageQueue.push(JSON.stringify(arguments));

	//logMultiplexer.notify(JSON.stringify(arguments));
	/*for( let a in arguments){
		//
		if( typeof(arguments[a]) == 'object' ){
			let tVal = JSON.stringify(arguments[a]);
			if( DEBUG > 1 ) process.stdout.write(tVal + '\n');
			logMultiplexer.notify(tVal);
		}
		else {
			if( DEBUG > 1 ) process.stdout.write(arguments[a] + '\n');
			logMultiplexer.notify(arguments[a]);
		}
	}*/
};

wsServer.on('request', function (request) {
	if (!originIsAllowed(request.origin)) {
		// Make sure we only accept requests from an allowed origin
		request.reject();
		if (DEBUG > 1) console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
		return;
	}
	if (DEBUG > 1) console.log('brequest', request);
	let key = "harcor";
	var connection = request.accept('echo-protocol', request.origin);

	if (DEBUG > 1) console.log((new Date()) + ' Connection accepted.');

	logMultiplexer.register(key, connection);

	connection.on('message', function (message) {
		if (message.type === 'utf8') {
			if (DEBUG > 1) console.log('Received Message: ' + message.utf8Data);
			connection.sendUTF(message.utf8Data);
		}
		else if (message.type === 'binary') {
			if (DEBUG > 1) console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
			connection.sendBytes(message.binaryData);
		}
	});
	connection.on('close', function (reasonCode, description) {
		if (DEBUG > 1) console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
	});
});

///solr/validate/select?facet.field=contenttype&facet=on&fq=testname%3Aorder_product_en&q=*%3A*&rows=0
function getRESTData(args) {

	var callback = function (res) {
		var str = "";
		var args = this.args;

		res.on('data', function (chunk) {
			str += chunk;

		});

		res.on('end', function () {
			//console.log("sample complete",str);
			let data = JSON.parse(str);
			if (data.response && data.response.docs) {
				if (args.type == 'facet') {
					let facetData = { items: [] };
					if (data.facet_counts && data.facet_counts.facet_fields) {
						let ff = data.facet_counts.facet_fields;
						for (let f in ff) {
							let tempItems = ff[f];
							for (let i = 0; i < tempItems.length; i += 2) {
								facetData.items.push({ id: tempItems[i], value: tempItems[i + 1] });
							}
							facetData._totalItems = data.response.numFound;
							break;
						}
					}

					args.callback(facetData);
				}
				else if (args.type == 'query') {
					let docData = { items: [] };
					let docs = data.response.docs;
					for (let i in docs) {
						docData.items.push({ id: args.entry.label, value: docs[i][args.entry.field] });
					}
					docData._totalItems = docs.length;
					args.callback(docData);
				}
				else {
					let docData = { items: [] };

					if (data.response && data.response.docs) {
						let docs = data.response.docs;

						docData.items = docs;
						docData._totalItems = data.response.numFound;
					}
					args.callback(docData);
				}
			}
			else
				args.callback(data);
		});
	}

	let config = { host: args.host, port: args.port, path: args.path };
	if (AUTHKEY)
		config.headers = { "Authorization": "Basic " + AUTHKEY };

	let t = http.get(config, callback.bind({ args: args }));
	t.on('error', function (e) {
		if (DEBUG > 1) console.log("Got error: " + e.message);
		args.callback({ error: e.message });
	});
	t.end();
}

CONTEXT.lib.getRESTData = getRESTData;

function replaceAll(str, find) {
	let re = new RegExp(find, 'g');

	return (str.replace(re, ''));
}

CONTEXT.lib.getRESTData = getRESTData;

function loadAsset(assetName, callback, assetType) {

	let solrHost = SOLRHOST;
	let solrPort = SOLRPORT;
	let solrPath = "/solr/" + SOLRCOLLECTION + "/select?wt=json&rows=1&indent=on&q=*:*&fq=contenttype:ASSET&fq=assetname:" + assetName;

	if (assetType) {
		solrPath += "&fq=assettype:" + assetType;
	}

	let queryCallback = function (res) {
		var str = "";

		res.on('data', function (chunk) {
			str += chunk;

		});

		res.on('end', function () {
			//console.log("testlookup",str);

			let resp = JSON.parse(str);

			var result = {};

			if (resp.response && resp.response.docs) {
				if (resp.response.docs.length > 0) {
					result = resp.response.docs[0];
				}
			}

			callback(result);
		});
	}


	let config = { host: solrHost, port: solrPort, path: solrPath };
	if (AUTHKEY)
		config.headers = { "Authorization": "Basic " + AUTHKEY };
	let t = http.get(config, queryCallback);
	t.on('error', function (e) {
		if (DEBUG > 1) console.log("Got error: " + e.message);
		callback({ error: e.message });
	});
	t.end();
}

CONTEXT.lib.loadTest = loadAsset;

function loadTest(testName, callback, testType) {

	let solrHost = SOLRHOST;
	let solrPort = SOLRPORT;
	let solrPath = "/solr/" + SOLRCOLLECTION + "/select?wt=json&rows=1&indent=on&q=*:*&fq=contenttype:TEST&fq=testname:" + testName;

	///if( testType ){
	//	solrPath += "&fq=testtype:" + testType;
	//}

	let queryCallback = function (res) {
		var str = "";

		res.on('data', function (chunk) {
			str += chunk;

		});

		res.on('end', function () {
			//console.log("testlookup",str);

			let resp = JSON.parse(str);

			var result = {};

			if (resp.response && resp.response.docs) {
				if (resp.response.docs.length > 0) {
					result = resp.response.docs[0];
				}
			}
			//console.log("test",result);

			if (result[testType]) {
				let script = Buffer.from(result[testType], 'base64').toString("ascii");

				if (script.startsWith("ASSET:")) {
					let assetName = script.substring("ASSET:".length);
					if (DEBUG > 0) console.log("loading asset", assetName);
					let cb = function (asset) {
						if (asset && asset["assetscript"]) {
							script = Buffer.from(asset["assetscript"], 'base64').toString("ascii");
							this.result[this.testType] = script;
						}
						this.callback(this.result);

					}.bind({ assetname: assetName, testType: testType, result: result, callback: callback });

					loadAsset(assetName, cb, "script");

				}
				else {
					result[testType] = script;

					callback(result);
				}
			}
			else
				callback(result);
		});


	}


	let config = { host: solrHost, port: solrPort, path: solrPath };
	if (AUTHKEY)
		config.headers = { "Authorization": "Basic " + AUTHKEY };
	let t = http.get(config, queryCallback);
	t.on('error', function (e) {
		if (DEBUG > 1) console.log("Got error: " + e.message);
		callback({ error: e.message });
	});
	t.end();
}

CONTEXT.lib.loadTest = loadTest;


function parseArgs(line) {
	let result = {};

	if (line) {
		let fields = line.split(" ");

		for (let i in fields) {
			let fieldParts = fields[i].split("=");

			if (fieldParts.length > 1) {
				result[fieldParts[0]] = fieldParts[1];
			}
		}
	}
	if (DEBUG > 1) console.log("parsed", result);
	return (result);
}

CONTEXT.lib.parseArgs = parseArgs;


function parseRunnerArgs(line) {
	let result = {};

	if (line) {
		let fields = line.split(" ");

		for (let i in fields) {
			let fieldParts = fields[i].split("=");

			if (fieldParts.length > 1) {
				result[fieldParts[0]] = fieldParts[1];
			}
		}
	}
	if (DEBUG > 1) console.log("runnerparsed", result);
	return (result);
}

CONTEXT.lib.parseRunnerArgs = parseRunnerArgs;


