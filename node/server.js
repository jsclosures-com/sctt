var http = require('http');
var https = require('https');
var url = require("url");
var fs = require('fs');
var path = require('path');
var readline = require('readline');
var URL = require('url');
var stream = require('stream');
//var SSH2Client = require('ssh2-sftp-client'); 
//var SSHClient = require('ssh2'); 
var WebSocketServer = require('websocket').server;
var utf8 = require("utf8");

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
var PORT=8180; 
var SOLRHOST="localhost";
var SOLRPORT=8983;
var SOLRCOLLECTION="validate";
var DEBUG = 0;
var AUTHKEY = false;
var AUTHMODE = false;

var commandLine = {};

function writeLog(level,message){
	if( level <= DEBUG ){
		console.log(message);
	}
}
process.argv.forEach((val, index) => {
  writeLog(1,`${index}: ${val}`);
  if( index > 1 ){
	let v = val;
	
	if( v.indexOf("=") ){
		let name = v.substring(0,v.indexOf("="));
		commandLine[name] = v.substring(v.indexOf("=")+1);
	}
  }
});

if( DEBUG > 1 ) console.log("commandline",commandLine);

if( commandLine.hasOwnProperty("port") )
	PORT = parseInt(commandLine.port);
if( commandLine.hasOwnProperty("solrhost") )
	SOLRHOST = commandLine.solrhost;	
if( commandLine.hasOwnProperty("solrport") )
	SOLRPORT = parseInt(commandLine.solrport);	
if( commandLine.hasOwnProperty("solrcollection") )
	SOLRCOLLECTION = commandLine.solrcollection;
if( commandLine.hasOwnProperty("debug") )
	DEBUG = parseInt(commandLine.debug);
if( commandLine.hasOwnProperty("authkey") )
	AUTHKEY = commandLine.authkey;
if( commandLine.hasOwnProperty("authmode") )
	AUTHMODE = commandLine.authmode;

var CONTEXT = {commandLine: commandLine,
	PORT: PORT,
	SOLRHOST: SOLRHOST,
	SOLRPORT:SOLRPORT,
	SOLRCOLLECTION: SOLRCOLLECTION,
	DEBUG:DEBUG,
	AUTHKEY:AUTHKEY,
	AUTHMODE:AUTHMODE,
	lib: {http: http,
		https: https,
		URL: URL,
		fs: fs,
		path: path,
		stream: stream,
		readline: readline,
		utf8: utf8}};

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

function handleRequest(request, response){
	if (request.method == 'POST' || request.method == 'DELETE' || request.method == 'PUT' ) {
		writeLog(1,'POST')
		var body = ''
		request.on('data', function(data) {
		  body += data
		  writeLog(1,'Partial body: ' + body)
		});
		request.on('end', function() {
		  writeLog(1,'Body: ' + body)
		  let data = body ? JSON.parse(body) : {};
		  actualHandleRequest(request,response,data);
		});
	}
	else if(request.method == 'GET') {
		actualHandleRequest(request,response);
	}	

	
}

//We need a function which handles requests and send response
function actualHandleRequest(request, response,bodyData){
    writeLog(1,"handle request");
	var result = {status: 0};

    var requestUrl = request.url;
    var requestObj = url.parse(requestUrl, true);
	var queryObj = requestObj.query;
	if( bodyData ){
		for(var p in bodyData){
			if( bodyData.hasOwnProperty(p) ){
				queryObj[p] = bodyData[p];
			}
		}
		
		
	}
	writeLog(1,"query obj",queryObj);
	var contentType = queryObj.contenttype;
	var pathname = requestObj.pathname;
	if( DEBUG > 1 ) console.log(pathname,requestUrl);
	
    if( requestUrl.lastIndexOf('/authservice',0) > -1 ){
    	//handle auth request
    	if( contentType === 'AUTH' ){
    		var cookieObj = parseCookies(request);
    		if( cookieObj.zen ){
	    		result.status = 1;
	    		result.message = "AOK";
				var userName = cookieObj.zen;
				result.user = {"alias": userName,"id": userName,"username": userName};
				result.role = {"id": "ADMINISTRATOR","label": "ADMINISTRATOR"};
				result.role.views = [{"id": "main","name": "main","autoStart": "true","buildwith": "buildMainPage","loadfile": "js/mainpage.js"}];
    		}
    		else {
	    		result.message = "FAILURE";
    		}
    		
    		response.end(JSON.stringify(result));
    	}
    	else if( contentType === 'LOGIN') {
			if( DEBUG > 1 ) console.log("login",queryObj);
			var isDelete = request.method == 'DELETE';
			var userName = queryObj.user;
    		var userKey = queryObj.password;

    		if( userName === userKey ){
	    		result.status = 1;
	    		result.message = "AOK";
	    		result.alias = userName;
				
				result.user = {"alias": userName,"id": userName,"username": userName};
				result.role = {"id": "ADMINISTRATOR","label": "ADMINISTRATOR"};
				result.role.views = [{"id": "main","name": "main","autostart": "true","buildwith": "buildMainPage","loadfile": "js/mainpage.js"}];
				
				if( isDelete ){
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
	    		if( isDelete ){
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
		
		if( DEBUG > 1 ) console.log("auth response",result);
    	result.contenttype = contentType;
    	response.end(JSON.stringify(result));
    }
    else if( pathname === '/restservice' ){
    	//handle auth request
		writeLog(1,"contentType " + contentType);
		if( HANDLERS.hasOwnProperty(contentType) ){
			let handlerCallback = function(resp){
				if( DEBUG > 1 ) console.log("handler called back",this.contentType);
				let parsedResponse = {};
				
				try {

					if( resp && resp.payload && resp.headers ){
						for(let h in resp.headers){
							response.setHeader(resp.headers[h].name,resp.headers[h].value);
							writeLog(1,"set header");
						}
						parsedResponse = resp.payload;

					}
					else
						parsedResponse = JSON.stringify(resp);
				}
				catch(exception){ 
					if( DEBUG > 0 ) console.log(exception);
				}
				
				try{
					this.response.end(parsedResponse);
				}
				catch(ee){ if( DEBUG > 0 ) console.log(ee);}
			}
			
			HANDLERS[contentType]({CONTEXT: CONTEXT,requestUrl: requestUrl,requestObj: requestObj,queryObj: queryObj,contentType: contentType,pathName: pathname,callback: handlerCallback.bind({response: response,contentType: contentType})});
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
		    if(!exist) {
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
		    fs.readFile(pathname, function(err, data){
		      if(err){
		        response.statusCode = 500;
		        response.end(`Error getting the file: ${err}.`);
		      } else {
		        // based on the URL path, extract the file extention. e.g. .js, .doc, ...
		        const ext = path.parse(pathname).ext;
		        // if the file is found, set Content-type and send data
		        response.setHeader('Content-type', mimeType[ext] || 'text/plain' );
		        response.end(data);
		      }
		    });
		  });
    }


    
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    if( DEBUG > 0 ) console.log("Server listening on: http://localhost:%s", PORT);
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var logMultiplexer = {
						sockets: {},
						register: function(key,conn){
							logMultiplexer.sockets[key] = conn;
						},
						deregister: function(key){
							delete logMultiplexer.sockets[key];
						},
						notify: function(message){
							for(let c in logMultiplexer.sockets){
								try {
									logMultiplexer.sockets[c].sendUTF(message);
								}
								catch(e){
									if( DEBUG > 0 ) console.log(e);
									logMultiplexer.deregister(c);
								}
							}
						}
};

var messageQueue = [];

function clearLogQueue(){

	for(let i = 0;i < 100;i++){
		let m = messageQueue.shift();
		if( m ) 
			logMultiplexer.notify(m);
		else
			break;
	}
	setTimeout(clearLogQueue,100);
}

clearLogQueue();


console.wslog = function() {
	if( DEBUG > 1 ) console.log(arguments);
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

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      if( DEBUG > 1 ) console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
	if( DEBUG > 1 ) console.log('brequest',request);
	let key = "harcor";
	var connection = request.accept('echo-protocol', request.origin);
	
	if( DEBUG > 1 ) console.log((new Date()) + ' Connection accepted.');
	
	logMultiplexer.register(key,connection);

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            if( DEBUG > 1 ) console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            if( DEBUG > 1 ) console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        if( DEBUG > 1 ) console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

///solr/validate/select?facet.field=contenttype&facet=on&fq=testname%3Aorder_product_en&q=*%3A*&rows=0
function getRESTData(args){

	var callback = function(res){
		var str = "";
		var args = this.args;

		res.on('data', function (chunk) {
					str += chunk;
					
			  });

		res.on('end', function () {
			  //console.log("sample complete",str);
			  let data = JSON.parse(str);
			  if( data.response && data.response.docs ){
				if( args.type == 'facet' ){
					let facetData = {items: []};
					if( data.facet_counts && data.facet_counts.facet_fields ){
						let ff = data.facet_counts.facet_fields;
						for( let f in ff ){
							let tempItems = ff[f];
							for(let i = 0;i < tempItems.length;i+=2 ){
								facetData.items.push({id: tempItems[i],value: tempItems[i+1]});
							}
							facetData._totalItems = data.response.numFound;
							break;
						}
					}
		
					args.callback(facetData);
				}
				else if( args.type == 'query' ){
					let docData = {items:[]};
					let docs = data.response.docs;
					for(let i in docs){
						docData.items.push({id: args.entry.label,value: docs[i][args.entry.field]});
					}
					docData._totalItems = docs.length;
					args.callback(docData);
				}
				else {
					let docData = {items:[]};
		
					if( data.response && data.response.docs ){
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

	let config = {host: args.host,port: args.port,path: args.path};
	if( AUTHKEY )
		config.headers = {"Authorization": "Basic " + AUTHKEY};

	let t = http.get(config, callback.bind({args: args}));
		t.on('error', function(e) {
				if( DEBUG > 1 ) console.log("Got error: " + e.message);
				args.callback({error: e.message});
		});
}

CONTEXT.lib.getRESTData = getRESTData;

function replaceAll(str,find){
	let re = new RegExp(find, 'g');

	return( str.replace(re, '') );
}

CONTEXT.lib.getRESTData = getRESTData;

function loadAsset(assetName,callback,assetType){
	
	let solrHost = SOLRHOST;
	let solrPort = SOLRPORT;
	let solrPath = "/solr/" + SOLRCOLLECTION + "/select?wt=json&rows=1&indent=on&q=*:*&fq=contenttype:ASSET&fq=assetname:" + assetName;
	
	if( assetType ){
		solrPath += "&fq=assettype:" + assetType;
	}
	
	let queryCallback = function(res){
		var str = "";
		  
	  res.on('data', function (chunk) {
				  str += chunk;
				  
			});

	  res.on('end', function () {
			//console.log("testlookup",str);
			
			let resp = JSON.parse(str);
			
			var result = {};
			
			if( resp.response && resp.response.docs ){
				if( resp.response.docs.length > 0 ){
					result = resp.response.docs[0];
				}
			}
			
			callback(result);
	  });
	}
	
	
	let config = {host: solrHost,port: solrPort,path: solrPath};
	if( AUTHKEY )
		config.headers = {"Authorization": "Basic " + AUTHKEY};
	let t = http.get(config, queryCallback);
		t.on('error', function(e) {
			if( DEBUG > 1 ) console.log("Got error: " + e.message);
				args.callback({error: e.message});
		});
}

CONTEXT.lib.loadTest = loadAsset;

function loadTest(testName,callback,testType){
	
	let solrHost = SOLRHOST;
	let solrPort = SOLRPORT;
	let solrPath = "/solr/" + SOLRCOLLECTION + "/select?wt=json&rows=1&indent=on&q=*:*&fq=contenttype:TEST&fq=testname:" + testName;
	
	///if( testType ){
	//	solrPath += "&fq=testtype:" + testType;
	//}
	
	let queryCallback = function(res){
		var str = "";
		  
	  res.on('data', function (chunk) {
				  str += chunk;
				  
			});

	  res.on('end', function () {
			//console.log("testlookup",str);
			
			let resp = JSON.parse(str);
			
			var result = {};
			
			if( resp.response && resp.response.docs ){
				if( resp.response.docs.length > 0 ){
					result = resp.response.docs[0];
				}
			}
			//console.log("test",result);

			if( result[testType] ){
				let script = Buffer.from(result[testType], 'base64').toString("ascii");

				if( script.startsWith("ASSET:") ){
					let assetName = script.substring("ASSET:".length);
					if( DEBUG > 0 ) console.log("loading asset",assetName);
					let cb = function(asset){
						if( asset && asset["assetscript"] ){
							script = Buffer.from(asset["assetscript"], 'base64').toString("ascii");
							this.result[this.testType] = script;
						}
						this.callback(this.result);

					}.bind({assetname: assetName,testType: testType,result: result,callback: callback});

					loadAsset(assetName,cb,"script");

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
	
	
	let config = {host: solrHost,port: solrPort,path: solrPath};
	if( AUTHKEY )
		config.headers = {"Authorization": "Basic " + AUTHKEY};
	let t = http.get(config, queryCallback);
		t.on('error', function(e) {
			if( DEBUG > 1 ) console.log("Got error: " + e.message);
				args.callback({error: e.message});
		});
}

CONTEXT.lib.loadTest = loadTest;


function parseArgs(line){
	let result = {};
	
	if( line ){
		let fields = line.split(" ");
		
		for(let i in fields){
			let fieldParts = fields[i].split("=");
			
			if( fieldParts.length > 1 ){
				result[fieldParts[0]] = fieldParts[1];
			}
		}
	}
	if( DEBUG > 1 ) console.log("parsed",result);
	return( result );
}

CONTEXT.lib.parseArgs = parseArgs;


function parseRunnerArgs(line){
	let result = {};
	
	if( line ){
		let fields = line.split(" ");
		
		for(let i in fields){
			let fieldParts = fields[i].split("=");
			
			if( fieldParts.length > 1 ){
				result[fieldParts[0]] = fieldParts[1];
			}
		}
	}
	if( DEBUG > 1 ) console.log("runnerparsed",result);
	return( result );
}

CONTEXT.lib.parseRunnerArgs = parseRunnerArgs;


