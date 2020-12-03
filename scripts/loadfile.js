var http = require('http');
var fs = require('fs'),
    readline = require('readline'),
    stream = require('stream');

var commandLine = {};

process.argv.forEach((val, index) => {
  console.log(`${index}: ${val}`);
  if( index > 1 ){
	let v = val;
	
	if( v.indexOf("=") ){
		let name = v.substring(0,v.indexOf("="));
		commandLine[name] = v.substring(v.indexOf("=")+1);
	}
  }
});

var debug = Object.prototype.hasOwnProperty.call(commandLine,'debug') ? commandLine['debug'] : 1;

var sourceFile = Object.prototype.hasOwnProperty.call(commandLine,'sourceFile') ? commandLine['sourceFile'] : "sourceFile";
var batchSize = Object.prototype.hasOwnProperty.call(commandLine,'batchSize') ? commandLine['batchSize'] :  10;
var prefix = Object.prototype.hasOwnProperty.call(commandLine,'prefix') ? commandLine['prefix'] : "csv"
var delimiter = Object.prototype.hasOwnProperty.call(commandLine,'delimiter') ? commandLine['delimiter'] :  ',';
var destinationSolrHost = Object.prototype.hasOwnProperty.call(commandLine,'validateSolrHost') ? commandLine['validateSolrHost'] : "localhost";
var destinationSolrPort = Object.prototype.hasOwnProperty.call(commandLine,'validateSolrPort') ? commandLine['validateSolrPort'] : 8983;
var destinationSolrUpdatePath = Object.prototype.hasOwnProperty.call(commandLine,'validateSolrUpdatePath') ? commandLine['validateSolrUpdatePath'] : "/solr/validate/update";
var authKey = Object.prototype.hasOwnProperty.call(commandLine,'authKey') ? commandLine['authKey'] : '';

if( debug > 0 ) console.log("commandline",commandLine);

var readStats = {count: 0,queue: []};

var instream = fs.createReadStream(sourceFile);
instream.readable = true;

var rl = readline.createInterface({
    input: instream,
    terminal: false
});

function readFunc(line) {
    console.log(line);
    if( this.stats.count == 0 ){
		//build the headers
		this.stats.header = line.split(delimiter);
	}
	else {
		let vals = line.split(delimiter);
		let newRec = {id: prefix + this.stats.count};
		for(let i in vals){
			if( i < this.stats.header.length ){
				newRec[this.stats.header[i]] = val[i];
			}
		}
		this.stats.queue.push(newRec);

		if( this.stats.queue.length >= batchSize ){
			writeBatch(this.stats.queue);
			this.stats.queue = [];
		}
	}
	this.stats.count++;
}

function closeFunc(){
	if( debug > 0 ) console.log("done");
}

rl.on('line', readFunc.bind({stats: readStats}));
rl.on('close', closeFunc.bind({stats: readStats}));

function commitCallback(){
	let str = "";
	res.on('data', function (chunk) {
				str += chunk;				
		  });
  
	res.on('end', function () {
		  if( debug > 2 ) console.log("COMMIT",str);
	});
}

function commitBatch(){
	let tCallback = commitCallback;

	let conf = {hostname: destinationSolrHost,port: destinationSolrPort,path: destinationSolrUpdatePath + "?commit=true",method: 'GET',headers: {'Content-Type': 'application/json'}};

	if( authKey ){
		conf.headers['Authorization'] = 'Basic ' + authKey;
	}
	let t = http.request(conf, tCallback);
	t.on('error', function(e) {console.log("Got error: " + e.message);});
	t.end();
}

function writeCallback(){
	let str = "";
	res.on('data', function (chunk) {
				str += chunk;				
		  });
  
	res.on('end', function () {
		  if( debug > 2 ) console.log("BATCH",str);
	});
}

function writeBatch(docs){
	let tCallback = writeCallback;

	if( debug > 4 ) console.log(docs);
	let conf = {hostname: destinationSolrHost,port: destinationSolrPort,path: destinationSolrUpdatePath,method: 'POST',headers: {'Content-Type': 'application/json'}};

	if( authKey ){
		conf.headers['Authorization'] = 'Basic ' + authKey;
	}
	let t = http.request(conf, tCallback);
	t.on('error', function(e) {console.log("Got error: " + e.message);});
	t.write(JSON.stringify(docs));
	t.end();
}
