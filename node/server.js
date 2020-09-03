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
	DEBUG = parseInt(commandLine.DEBUG);
if( commandLine.hasOwnProperty("authkey") )
	AUTHKEY = commandLine.authkey;
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
			
			HANDLERS[contentType]({requestUrl: requestUrl,requestObj: requestObj,queryObj: queryObj,contentType: contentType,pathName: pathname,callback: handlerCallback.bind({response: response,contentType: contentType})});
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

function replaceAll(str,find){
	let re = new RegExp(find, 'g');

	return( str.replace(re, '') );
}

function loadTest(testName,callback,testType){
	
	let solrHost = SOLRHOST;
	let solrPort = SOLRPORT;
	let solrPath = "/solr/" + SOLRCOLLECTION + "/select?wt=json&rows=1&indent=on&q=*:*&fq=contenttype:TEST&fq=testname:" + testName;
	
	if( testType ){
		solrPath += "&fq=testtype:" + testType;
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
			//console.log("test",result);
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

var HANDLERS = {
	"ZEN": function(args){
		let result = {status: 1,message: "HANDLED"};
		
		
		return( result );
	},
	"EXTRACT": function(args){
		let result = {status: 1,message: "HANDLED"};
		let testName = "default";
		let input = "";
		
		if( args.queryObj.testname )
			testName = args.queryObj.testname;
		
		var getTestCallback = function(test){
			//console.log(test);
			
			result.items = [{testname: test.testname}];
			
			let scriptToExecute = false;
			
			let script = Buffer.from(test.testextractscript, 'base64');
			
			eval('scriptToExecute = ' + script + ";");
			
			let sendArgs = this.args.queryObj.input ? parseArgs(this.args.queryObj.input) : this.args;
			
			if( DEBUG > 1 ) console.log("sendArgs",sendArgs);
			
			scriptToExecute(sendArgs);
			
			args.callback(result);
		};
		loadTest(testName,getTestCallback.bind({args: args}));
		
		return( result );
	},
	"BUILD": function(args){
		let result = {status: 1,message: "HANDLED"};
		let testName = "default";
		let input = "";
		
		if( args.queryObj.testname )
			testName = args.queryObj.testname;
		
		var getTestCallback = function(test){
			//console.log(test);
			
			result.items = [{testname: test.testname}];
			
			let scriptToExecute = false;
			
			let script = Buffer.from(test.testsamplescript, 'base64');
			
			eval('scriptToExecute = ' + script + ";");
			
			let sendArgs = this.args.queryObj.input ? parseArgs(this.args.queryObj.input) : this.args;
			
			if( DEBUG > 1 ) console.log("sendArgs",sendArgs);
			
			scriptToExecute(sendArgs);
			
			args.callback(result);
		};
		loadTest(testName,getTestCallback.bind({args: args}));
		
		return( result );
	},
	"RUNNER": function(args){
		let result = {status: 1,message: "HANDLED"};
		let testName = "default";
		let testType = "build";
		let input = "";
		
		if( args.queryObj.testname )
			testName = args.queryObj.testname;
		if( args.queryObj.type )
			testType = args.queryObj.type;

		var getTestCallback = function(test){
			//console.log(test);
			
			result.items = [{testname: test.testname}];
			
			try{
				let scriptToExecute = false;
				
				let script = Buffer.from(test[this.type], 'base64');
				
				eval('scriptToExecute = ' + script + ";");
				
				let sendArgs = this.args.queryObj.input ? parseRunnerArgs(this.args.queryObj.input) : this.args;

				sendArgs.callback = args.callback;

				result.message = "executed " + this.type + " in " + test.testname;

				sendArgs.resultContext = result;
				
				if( DEBUG > 1 ) console.log("sendArgs",sendArgs);
				
				scriptToExecute(sendArgs);
				
				
			}
			catch(ee){
				if( DEBUG > 0 ) console.log("exception running script",ee);
			}
			
			/*try{
				args.callback(result);
			}
			catch(ee){ console.log(ee);}*/
		};
		loadTest(testName,getTestCallback.bind({args: args,type: testType,name: testName}));
		
		return( result );
	},
	"SUMMARY": function(args){
		let result = {status: 1,message: "HANDLED"};
		
		var solrHost = SOLRHOST;
		var solrPort = SOLRPORT;
		var solrPath = "/solr/" + SOLRCOLLECTION + "/select?q=query_txt:%s&wt=json&indent=on";
		var contentType = "SUMMARY";
		if( args.queryObj.headeronly ){
			contentType = "SUMMARYHEADER";
		        solrPath = "/solr/" + SOLRCOLLECTION + "/select?q=*:*&wt=json&indent=on";
	        }
	
		solrPath += "&fq=contenttype:*" + contentType;
		
		var input = "*";
		if( args.queryObj.query_txt )
			input = args.queryObj.query_txt + '*';
		let testName = "default"; 

		if( args.queryObj.testname )
			testName = args.queryObj.testname;
		
		if( testName ){
			solrPath += "&fq=testname:" + testName;
		}

		
		if( args.queryObj._start )
			solrPath += '&start=' + args.queryObj._start;

		if( args.queryObj._rows )
			solrPath += '&rows=' + (2*args.queryObj._rows);

		if( args.queryObj._sort ){
			let sortField = args.queryObj._sort;
			solrPath += '&sort=' +  sortField;
			if( args.queryObj._ascending ){
				solrPath += '+asc';
			}
			else {
				solrPath += '+desc';
			}
		}
		if( DEBUG > 1 ) console.log("solrpath",solrPath);

		var callback = function(res){
			  var str = "";
	  
			  res.on('data', function (chunk) {
						  str += chunk;
						  
					});

			  res.on('end', function () {
					console.log("sample complete",str);
					let data = JSON.parse(str);
					if( data.response && data.response.docs ){
						let docs = data.response.docs;
						
						result.items = docs;
						result._totalItems = data.response.numFound;
					}
					args.callback(result);
			  });
		}
		//var tCallback = callback.bind({field: fieldList[i]});
		var tCallback = callback;
		
		let tUrl = solrPath.replace("%s",input).replace(/ /g,"%20");

		if( DEBUG > 1 ) console.log('solr path',tUrl);
		
		let config = {host: solrHost,port: solrPort,path: tUrl};
		if( AUTHKEY )
			config.headers = {"Authorization": "Basic " + AUTHKEY};

		let t = http.get(config,tCallback);
		t.on('error', function(e) {
			if( DEBUG > 0 ) console.log("Got error: " + e.message);
				args.callback({error: e.message});
		});
		
		return( result );
	},
	"COMPARE": function(args){
				let result = {status: 1,message: "HANDLED"};
		
		let action = "GET";
		
		if( args.queryObj.action )
			action = args.queryObj.action;
		
		var solrHost = SOLRHOST;
		var solrPort = SOLRPORT;
		var solrCollection = SOLRCOLLECTION;
		let testName = "default";

		if( args.queryObj.testname )
			testName = args.queryObj.testname;
		
		let parentId = false;

		if( args.queryObj.parentid )
			parentId = args.queryObj.parentid;
		
		if( action === "GET" ){
			var solrPath = "/solr/" + solrCollection + "/select?q=*:*&fq=testname:" + testName + "&fq=-contenttype:TEST&fq=-contenttype:SEARCH&wt=json&indent=on";
			
			if( parentId ){
				solrPath += "&fq=parentid:" + parentId;
			}
			
			var callback = function(res){
				  var str = "";
		  
				  res.on('data', function (chunk) {
							  str += chunk;
							  
						});

				  res.on('end', function () {
						console.log("sample complete",str);
						let data = JSON.parse(str);
						if( data.response && data.response.docs ){
							result.items = data.response.docs;
							result.count = data.response.numFound;
						}
						args.callback(result);
				  });
			}
			//var tCallback = callback.bind({field: fieldList[i]});
			var tCallback = callback;
			if( DEBUG > 1 ) console.log('solr path',solrPath);
			
			let config = {host: solrHost,port: solrPort,path: solrPath};
			if( AUTHKEY )
				config.headers = {"Authorization": "Basic " + AUTHKEY};

			let t = http.get(config,tCallback);
			t.on('error', function(e) {
				if( DEBUG > 0 ) console.log("Got error: " + e.message);
					args.callback({error: e.message});
			});
		}

		
		return( result );
	},
	"SEARCH": function(args){
		let result = {status: 1,message: "HANDLED"};
		let testName = "default";
		let input = "audit";
		
		if( args.queryObj.testname )
			testName = args.queryObj.testname;
		if( args.queryObj.input )
			input = args.queryObj.input;
		
		var getTestCallback = function(data){
			result.items = [{testname: testName}];
			args.callback(result);
		};
		loadTest(testName,getTestCallback);
		
		return( result );
	},
	"SAMPLE": function(args){
		let result = {status: 1,message: "HANDLED"};
		
		var solrHost = SOLRHOST;
		var solrPort = SOLRPORT;
		var solrPath = "/solr/" + SOLRCOLLECTION + "/select?q=query_txt:%s&fq=contenttype:SEARCH&wt=json&indent=on";
		
		var input = "*";
		if( args.queryObj.query_txt )
			input = args.queryObj.query_txt + '*';
		let testName = "default"; 

		if( args.queryObj.testname )
			testName = args.queryObj.testname;
		
		if( testName ){
			solrPath += "&fq=testname:" + testName;
		}
		
		if( args.queryObj._start )
			solrPath += '&start=' + args.queryObj._start;

		if( args.queryObj._rows )
			solrPath += '&rows=' + args.queryObj._rows;

		if( args.queryObj._sort ){
			solrPath += '&sort=' + args.queryObj._sort;
			if( args.queryObj._ascending ){
				solrPath += '+asc';
			}
			else {
				solrPath += '+desc';
			}
		}

		var callback = function(res){
			  var str = "";
	  
			  res.on('data', function (chunk) {
						  str += chunk;
						  
					});

			  res.on('end', function () {
				if( DEBUG > 1 ) console.log("sample complete",str);
					let data = JSON.parse(str);
					if( data.response && data.response.docs ){
						result.items = data.response.docs;
						result._totalItems = data.response.numFound;
					}
					args.callback(result);
			  });
		}
		//var tCallback = callback.bind({field: fieldList[i]});
		var tCallback = callback;
		
		let tUrl = solrPath.replace("%s",input).replace(/ /g,"%20");

		if( DEBUG > 1 ) console.log('solr path',tUrl);
		
		let config = {host: solrHost,port: solrPort,path: tUrl};
		if( AUTHKEY )
			config.headers = {"Authorization": "Basic " + AUTHKEY};

		let t = http.get(config, tCallback);
		t.on('error', function(e) {
			if( DEBUG > 0 ) console.log("Got error: " + e.message);
				args.callback({error: e.message});
		});
		
		return( result );
	},
	"FEEDBACK": function(args){
		let result = {status: 1,message: "HANDLED"};
		
		let action = "GET";
		
		if( args.queryObj.action )
			action = args.queryObj.action;
		
		var solrHost = SOLRHOST;
		var solrPort = SOLRPORT;
		var solrCollection = SOLRCOLLECTION;
		
		if( action === "GET" ){
			var solrPath = "/solr/" + solrCollection + "/select?q=*:*&fq=contenttype:FEEDBACK&wt=json&indent=on";
			
			if( args.queryObj._start )
				solrPath += '&start=' + args.queryObj._start;

			if( args.queryObj._rows )
				solrPath += '&rows=' + args.queryObj._rows;

			if( args.queryObj._sort ){
				solrPath += '&sort=' + args.queryObj._sort;
				if( args.queryObj._ascending ){
					solrPath += '+asc';
				}
				else {
					solrPath += '+desc';
				}
			}

			var callback = function(res){
				  var str = "";
		  
				  res.on('data', function (chunk) {
							  str += chunk;
							  
						});

				  res.on('end', function () {
					if( DEBUG > 1 ) console.log("sample complete",str);
						let data = JSON.parse(str);
						if( data.response && data.response.docs ){
							result.items = data.response.docs;
							result._totalItems = data.response.numFound;
						}
						args.callback(result);
				  });
			}
			//var tCallback = callback.bind({field: fieldList[i]});
			var tCallback = callback;
			if( DEBUG > 1 ) console.log('solr path',solrPath);
			
			let config = {host: solrHost,port: solrPort,path: solrPath};
			if( AUTHKEY )
				config.headers = {"Authorization": "Basic " + AUTHKEY};

			let t = http.get(config, tCallback);
			t.on('error', function(e) {
				if( DEBUG > 0 ) console.log("Got error: " + e.message);
					args.callback({error: e.message});
			});
		}
		else if( action === 'POST' ){
			var solrPath = "/solr/" + solrCollection + "/update";
			var callback = function(res){
				  var str = "";
		  
				  res.on('data', function (chunk) {
							  str += chunk;
							  
						});

				  res.on('end', function () {
					if( DEBUG > 1 ) console.log("update complete",str);
						let data = JSON.parse(str);
						
						args.callback(data);
				  });
			}
			var tCallback = callback;
			if( DEBUG > 1 ) console.log('solr path',solrPath);
			
			let config = {host: solrHost,port: solrPort,path: solrPath,headers : {'Content-Type': 'application/json'}};
			if( AUTHKEY )
				config.headers["Authorization"] = "Basic " + AUTHKEY;
			let t = http.request(config, tCallback);
			t.on('error', function(e) {
				if( DEBUG > 0) console.log("Got error: " + e.message);
					args.callback({error: e.message});
			});
			if( !args.queryObj.doc.id ){
					args.queryObj.doc.id = "FEEDBACK" + new Date().getTime();
			}
			args.queryObj.doc.contenttype = "FEEDBACK";
			let docs = {"add": {doc: args.queryObj.doc,"commitWithin": 500}};
			t.write(JSON.stringify(docs));
			t.end();
		}
		else if( action === 'DELETE' ){
			var solrPath = "/solr/" + solrCollection + "/update";
			var callback = function(res){
				  var str = "";
		  
				  res.on('data', function (chunk) {
							  str += chunk;
							  
						});

				  res.on('end', function () {
					if( DEBUG > 1 ) console.log("update complete",str);
						let data = JSON.parse(str);
						
						args.callback(data);
				  });
			}
			var tCallback = callback;
			console.log('solr path',solrPath);
			
			let config = {host: solrHost,port: solrPort,path: solrPath,headers : {'Content-Type': 'application/json'}};
			if( AUTHKEY )
				config.headers["Authorization"] = "Basic " + AUTHKEY;
			let t = http.request(config, tCallback);
			t.on('error', function(e) {
				if( DEBUG > 0 ) console.log("Got error: " + e.message);
					args.callback({error: e.message});
			});
			let docs = {"delete": {id: args.queryObj.doc.id },"commit": {}};
			if( DEBUG > 1 ) console.log("Delete",docs);
			t.write(JSON.stringify(docs));
			t.end();
			
		}
		
		return( result );
	},
	"TEST": function(args){
		let result = {status: 1,message: "HANDLED"};
		
		let action = "GET";
		
		if( args.queryObj.action )
			action = args.queryObj.action;
		
		var solrHost = SOLRHOST;
		var solrPort = SOLRPORT;
		var solrCollection = SOLRCOLLECTION;
		
		if( action === "GET" ){
			var solrPath = "/solr/" + solrCollection + "/select?q=*:*&fq=contenttype:TEST&wt=json&indent=on";
			
			if( args.queryObj._start )
				solrPath += '&start=' + args.queryObj._start;

			if( args.queryObj._rows )
				solrPath += '&rows=' + args.queryObj._rows;

			if( args.queryObj._sort ){
				solrPath += '&sort=' + args.queryObj._sort;
				if( args.queryObj._ascending ){
					solrPath += '+asc';
				}
				else {
					solrPath += '+desc';
				}
			}

			var callback = function(res){
				  var str = "";
		  
				  res.on('data', function (chunk) {
							  str += chunk;
							  
						});

				  res.on('end', function () {
					    if( DEBUG > 1 ) console.log("sample complete",str);
						let data = JSON.parse(str);
						if( data.response && data.response.docs ){
							result.items = data.response.docs;
							result._totalItems = data.response.numFound;
						}
						args.callback(result);
				  });
			}
			//var tCallback = callback.bind({field: fieldList[i]});
			var tCallback = callback;
			if( DEBUG > 1 ) console.log('solr path',solrPath);
			
			let config = {host: solrHost,port: solrPort,path: solrPath,headers : {'Content-Type': 'application/json'}};
			if( AUTHKEY )
				config.headers["Authorization"] = "Basic " + AUTHKEY;
			let t = http.request(config, tCallback);
			t.on('error', function(e) {
				if( DEBUG > 1 ) console.log("Got error: " + e.message);
					args.callback({error: e.message});
			});
			t.end();
		}
		else if( action === 'POST' ){
			var solrPath = "/solr/" + solrCollection + "/update";
			var callback = function(res){
				  var str = "";
		  
				  res.on('data', function (chunk) {
							  str += chunk;
							  
						});

				  res.on('end', function () {
					if( DEBUG > 1 ) console.log("update complete",str);
						let data = JSON.parse(str);
						
						args.callback(data);
				  });
			}
			var tCallback = callback;
			if( DEBUG > 1 ) console.log('solr path',solrPath);
			
			let config = {method: "POST",host: solrHost,port: solrPort,path: solrPath,headers : {'Content-Type': 'application/json'}};
			if( AUTHKEY )
				config.headers["Authorization"] = "Basic " + AUTHKEY;
			let t = http.request(config, tCallback);
			t.on('error', function(e) {
				if( DEBUG > 1 ) console.log("Got error: " + e.message);
					args.callback({error: e.message});
			});
			if( !args.queryObj.doc.id ){
					args.queryObj.doc.id = "TEST" + new Date().getTime();
			}
			args.queryObj.doc.contenttype = "TEST";
			let docs = {"add": {doc: args.queryObj.doc,"commitWithin": 500}};
			t.write(JSON.stringify(docs));
			t.end();
		}
		else if( action === 'DELETE' ){
			var solrPath = "/solr/" + solrCollection + "/update";
			var callback = function(res){
				  var str = "";
		  
				  res.on('data', function (chunk) {
							  str += chunk;
							  
						});

				  res.on('end', function () {
						console.log("update complete",str);
						let data = JSON.parse(str);
						
						args.callback(data);
				  });
			}
			var tCallback = callback;
			if( DEBUG > 1 ) console.log('solr path',solrPath);
			
			let config = {method: "POST",host: solrHost,port: solrPort,path: solrPath,headers : {'Content-Type': 'application/json'}};
			if( AUTHKEY )
				config.headers["Authorization"] = "Basic " + AUTHKEY;
			let t = http.request(config, tCallback);
			t.on('error', function(e) {
				if( DEBUG > 1 ) console.log("Got error: " + e.message);
					args.callback({error: e.message});
			});
			let docs = {"delete": {id: args.queryObj.doc.id },"commit": {}};
			if( DEBUG > 1 ) console.log("Delete",docs);
			t.write(JSON.stringify(docs));
			t.end();
			
		}
		
		return( result );
	},
	"RESULTS": function(args){
		let result = {status: 1,message: "HANDLED"};
		
		var solrHost = SOLRHOST;
		var solrPort = SOLRPORT;
		var solrPath = "/solr/" + SOLRCOLLECTION + "/select?q=*:*&wt=json&indent=on";
		
		let testName = "default"; 

		if( args.queryObj.testname )
			testName = args.queryObj.testname;
		
		if( testName ){
			solrPath += "&fq=testname:" + testName;
		}

		let type = "JMX"; //JMX or MEMORY

		if( args.queryObj.type )
			type = args.queryObj.type;

		let subtype = "UPDATE"; //UPDATE or QUERY

		if( args.queryObj.subtype )
			subtype = args.queryObj.subtype;
		
		solrPath += "&fq=contenttype:" + type + subtype;
		let which = "BEFORE"; //BEFORE or AFTER

		if( args.queryObj.which )
		which = args.queryObj.which;
		solrPath += which;
		
		if( args.queryObj._start )
			solrPath += '&start=' + args.queryObj._start;

		if( args.queryObj._rows )
			solrPath += '&rows=' + (args.queryObj._rows);
		else 
			solrPath += '&rows=1000';

		solrPath += '&sort=crawldate+asc,contenttype+desc';

		if( DEBUG > 1 ) console.log("solrpath",solrPath);

		var callback = function(res){
			  var str = "";
	  
			  res.on('data', function (chunk) {
						  str += chunk;
						  
					});

			  res.on('end', function () {
					console.log("sample complete",str);
					let data = JSON.parse(str);
					if( data.response && data.response.docs ){
						let docs = data.response.docs;
						
						result.items = docs;
						result._totalItems = data.response.numFound;
					}
					args.callback(result);
			  });
		}
		var tCallback = callback;
		
		let tUrl = solrPath.replace(/ /g,"%20");

		if( DEBUG > 1 ) console.log('solr path',tUrl);
		
		let config = {host: solrHost,port: solrPort,path: tUrl,headers : {'Content-Type': 'application/json'}};
			if( AUTHKEY )
				config.headers["Authorization"] = "Basic " + AUTHKEY;
			let t = http.request(config,tCallback);
		t.on('error', function(e) {
			if( DEBUG > 0 ) console.log("Got error: " + e.message);
				args.callback({error: e.message});
		});
		
		return( result );
	},
	"DOWNLOADSUMMARY": function(args){
		let result = {status: 1,message: "HANDLED"};
		
		var solrHost = SOLRHOST;
		var solrPort = SOLRPORT;
		var solrPath = "/solr/" + SOLRCOLLECTION + "/select?fl=query_txt,qtime,qtimeb,qtimea,rowcount,rowcounta,rowcountb,topdocdefore,topdocafter,countscore,matchscore,differencescore,matchscorelist&q=*:*&wt=csv&indent=on";
		
		let testName = "default"; 

		if( args.queryObj.testname )
			testName = args.queryObj.testname;
		
		if( testName ){
			solrPath += "&fq=contenttype:SUMMARY&fq=testname:" + testName;
		}

		if( args.queryObj._rows )
			solrPath += '&rows=' + (args.queryObj._rows);
		else 
			solrPath += '&rows=100000';

		solrPath += '&sort=crawldate+asc,contenttype+desc';

		if( DEBUG > 1 ) console.log("solrpath",solrPath);

		var callback = function(res){
			  var str = "";
	  
			  res.on('data', function (chunk) {
						  str += chunk;
						  
					});

			  res.on('end', function () {
				if( DEBUG > 1 ) console.log("export complete",str);
					let data = str;
					
					args.callback({payload: data,headers: [{name: "Content-Type",value: "application/force-download"},{name: "Content-Length",value: str.length},{name: "Content-Type",value: "application/csv"},{name: "Content-Disposition",value: "attachment; filename=" + testName + ".csv"}]});
			  });
		}
		var tCallback = callback;
		
		let tUrl = solrPath.replace(/ /g,"%20");

		if( DEBUG > 1 ) console.log('solr path',tUrl);
		
		let config = {host: solrHost,port: solrPort,path: tUrl,headers : {'Content-Type': 'application/json'}};
			if( AUTHKEY )
				config.headers["Authorization"] = "Basic " + AUTHKEY;
			let t = http.request(config, tCallback);
		t.on('error', function(e) {
			if( DEBUG > 0 ) console.log("Got error: " + e.message);
				args.callback({error: e.message});
		});
		
		return( result );
	},
	"DELETEALL": function(args){
		let result = {status: 1,message: "HANDLED"};
		
		var solrHost = SOLRHOST;
		var solrPort = SOLRPORT;
		var solrPath = "/solr/" + SOLRCOLLECTION + "/update?commitWithin=1000&overwrite=true&wt=json";
		
		let testName = "default"; 

		if( args.queryObj.testname )
			testName = args.queryObj.testname;
	

			if( DEBUG > 1 ) console.log("solrpath",solrPath);

		var callback = function(res){
			  var str = "";
	  
			  res.on('data', function (chunk) {
						  str += chunk;
						  
					});

			  res.on('end', function () {
				if( DEBUG > 1 ) console.log("delete complete",str);
					let data = JSON.parse(str);
					if( data.response && data.response.docs ){
						let docs = data.response.docs;
						
						result.items = docs;
						result._totalItems = data.response.numFound;
					}
					args.callback(result);
			  });
		}
		var tCallback = callback;
		
		let tUrl = solrPath.replace(/ /g,"%20");

		if( DEBUG > 1 ) console.log('solr path',tUrl);
		let payload = "<add><delete><query>-contenttype:TEST AND testname:" + testName + "</query></delete></add>";

		let config = {headers: {"Content-Type": "text/xml","Content-Length": payload.length},host: solrHost,port: solrPort,method: 'POST',path: tUrl};
		if( AUTHKEY )
			config.headers["Authorization"] = "Basic " + AUTHKEY;
		let t = http.request(config,  tCallback);
		t.on('error', function(e) {
			if( DEBUG > 0 ) console.log("Got error: " + e.message);
				args.callback({error: e.message});
		});
		t.write(payload);
		t.end();

		return( result );
	},
	"RESULTDETAILS": function(args){
		let result = {status: 1,message: "HANDLED"};
		
		var solrHost = SOLRHOST;
		var solrPort = SOLRPORT;
		var solrPath = "/solr/" + SOLRCOLLECTION + "/select?q=*:*";
		
		let testName = "default"; 

		if( args.queryObj.testname )
			testName = args.queryObj.testname;
		
		if( testName ){
			solrPath += "&fq=testname:" + testName;
		}
		var finalResult = {items: []};

		var collectorCB = function(data){
			if( data.items ){
				this.result.items = this.result.items.concat(data.items);
				if( DEBUG > 1 ) console.log("concat items",this.result,this);
			}

			if( this.nextEntry )
				getRESTData({host: solrHost,port: solrPort,path: this.nextEntry.path,type: this.nextEntry.type,callback: this.nextEntry.callback,entry: this.nextEntry});
			else
				this.args.callback(this.result);
		}
		var pathList = [
						

						];
		for(let i = 0;i < pathList.length;i++){
			if( i+1 < pathList.length )
				pathList[i].callback = collectorCB.bind({args: args,result: finalResult,nextEntry: pathList[i+1] });
			else	
				pathList[i].callback = collectorCB.bind({args: args,result: finalResult });
		}

		if( DEBUG > 1 ) console.log("solrpath",pathList[0].path);
		getRESTData({host: solrHost,port: solrPort,path: pathList[0].path,type: pathList[0].type,callback: pathList[0].callback,entry: pathList[0]});

		return( result );
	},
	"DETAILSRUNNER": function(args){
		let result = {status: 1,message: "HANDLED"};
		let testName = "default";
		let testType = "testdetailscript";
		let input = "";
		
		if( args.queryObj.testname )
			testName = args.queryObj.testname;
		
		var getTestCallback = function(test){
			//console.log(test);
			
			result.items = [{testname: test.testname}];
			
			try{
				let scriptToExecute = false;
				
				let script = Buffer.from(test[this.type], 'base64');
				
				eval('scriptToExecute = ' + script + ";");
				
				let sendArgs = this.args.queryObj.input ? parseRunnerArgs(this.args.queryObj.input) : this.args;
				
				//console.log("sendArgs",sendArgs);
				
				scriptToExecute(sendArgs.queryObj,args.callback);
				
				result.message = "executed " + this.type + " in " + test.testname;
			}
			catch(ee){
				if( DEBUG > 0 ) console.log("exception running script",ee);
			}
		};
		loadTest(testName,getTestCallback.bind({args: args,type: testType,name: testName}));
		
		return( result );
	},
	"REALTIME": function(args){
		let result = {status: 1,message: "HANDLED"};
		
		
		let url = "http://" + SOLRHOST + ":" + SOLRPORT + "/solr/admin/metrics?wt=json"; 

		if( args.queryObj.url )
			url = args.queryObj.url;

		let parsedURL =  URL.parse(url);
		
		var solrHost = parsedURL.hostname;
		var solrPort = parsedURL.port;
		var solrPath = parsedURL.pathname;

		var callback = function(res){
			var str = "";
	
			res.on('data', function (chunk) {
						str += chunk;
						
				  });

			res.on('end', function () {
				if( DEBUG > 1 ) console.log("delete complete",str);
				  let data = JSON.parse(str);
				 
				  args.callback(data);
			});
	  }
		
	  let config = {method: "GET",host: solrHost,port: solrPort,path: tUrl,headers : {'Content-Type': 'application/json'}};
	  if( AUTHKEY )
		  config.headers["Authorization"] = "Basic " + AUTHKEY;
	  let t = http.request(config, callback);
		t.on('error', function(e) {
			if( DEBUG > 0 ) console.log("Got error: " + e.message);
				args.callback({error: e.message});
		});

		return( result );
	}
};



