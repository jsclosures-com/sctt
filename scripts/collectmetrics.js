var http = require('http');
//var zlib = require('zlib');

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

//node ./collectionmectrics.js validateSolrHost=localhost sourceSolrHost=localhost metricsInterval=1000
//process.exit(0);

var testName = Object.prototype.hasOwnProperty.call(commandLine,'testName') ? commandLine['testName'].split(",") : [];
var metricsInterval = commandLine.hasOwnProperty('metricsInterval') ? commandLine['metricsInterval'] : 10000;

var debug = Object.prototype.hasOwnProperty.call(commandLine,'debug') ? commandLine['debug'] : 1;
var sourceSolrHost = Object.prototype.hasOwnProperty.call(commandLine,'sourceSolrHost') ? commandLine['sourceSolrHost'] : "localhost";
var sourceSolrPort = Object.prototype.hasOwnProperty.call(commandLine,'sourceSolrPort') ? commandLine['sourceSolrPort'] : 8983;
var sourceSolrPath = Object.prototype.hasOwnProperty.call(commandLine,'sourceSolrPath') ? commandLine['sourceSolrPath'] : "/solr/admin/metrics?wt=json";

var validateSolrHost = Object.prototype.hasOwnProperty.call(commandLine,'validateSolrHost') ? commandLine['validateSolrHost'] : "localhost";
var validateSolrPort = Object.prototype.hasOwnProperty.call(commandLine,'validateSolrPort') ? commandLine['validateSolrPort'] : 8983;
var validateSolrUpdatePath = Object.prototype.hasOwnProperty.call(commandLine,'validateSolrUpdatePath') ? commandLine['validateSolrUpdatePath'] : "/solr/validate/update";
var validateContentType = Object.prototype.hasOwnProperty.call(commandLine,'validateContentType') ? commandLine['validateContentType'] : "METRIC"; 
var authKey = Object.prototype.hasOwnProperty.call(commandLine,'authKey') ? commandLine['authKey'] : '';

if( debug > 0 ) console.log("commandline",commandLine);


function emitMetrics(){

	let doMetrics = function(){
		let currentIndex = this.currentIndex;
		
		if( debug > 0 ) console.log("current index",testName[currentIndex]);

		getMetrics(currentIndex);

		setTimeout(doMetrics.bind({currentIndex: currentIndex}),metricsInterval);
		
	}

	for(let i in testName){
		setTimeout(doMetrics.bind({currentIndex: i}),metricsInterval);	
	}
}

function saveMetricsCallback(res) {
  let str = "";
  let currentIndex = this.currentIndex;
  res.on('data', function (chunk) {
              str += chunk;
              
        });

  res.on('end', function () {
        if( debug > 1 ) console.log("METRICSUPDATE",currentIndex,str);
  });
}
var recordCounter = 0;

function saveMetrics(currentIndex,metricsData){
	let tCallback = saveMetricsCallback.bind({currentIndex: currentIndex});

	let docs = [ {id: testName[currentIndex] + "MT" + recordCounter++,contenttype: validateContentType,testname: testName[currentIndex],metricsdata:Buffer.from(metricsData,"UTF-8").toString("base64") } ];
	if( debug > 4 ) console.log(docs);
	let conf = {hostname: validateSolrHost,port: validateSolrPort,path: validateSolrUpdatePath,method: 'POST',headers: {'Content-Type': 'application/json'}};

	if( authKey ){
		conf.headers['Authorization'] = 'Basic ' + authKey;
	}
	let t = http.request(conf, tCallback);
	t.on('error', function(e) {console.log("Got error: " + e.message);});
	t.write(JSON.stringify(docs));
	t.end();
}

function  metricsCallback(res) {
  let str = "";
  let currentIndex = this.currentIndex;
  res.on('data', function (chunk) {
              str += chunk;
              
        });

  res.on('end', function () {
        if( debug > 2 ) console.log("METRICSDATA",str);

        saveMetrics(currentIndex,str);
  });
}

function getMetrics(currentIndex){
	var tCallback = metricsCallback.bind({currentIndex: currentIndex});
	let conf = {host: sourceSolrHost,port: sourceSolrPort,path: sourceSolrPath};

	if( authKey ){
		conf.headers = {};
		conf.headers['Authorization'] = 'Basic ' + authKey;
	}
	var t = http.get(conf,tCallback);
	t.on('error', function(e) {console.log("Got error: " + e.message);});
	t.end();
}

emitMetrics();



