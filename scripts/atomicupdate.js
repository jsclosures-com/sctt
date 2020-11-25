/*
	node ./automicaupdate authKey="c29scjpTb2xyUm9ja3M=" debug=11 batchSize=10 sourceSolrCollection=validate destinationSolrCollection=validatecopy 

	{"id": "2","source_s": "a"}
*/
var http = require('http');

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

var batchSize = Object.prototype.hasOwnProperty.call(commandLine,'batchSize') ? commandLine['batchSize'] : 10;
var sourceSolrIdField = Object.prototype.hasOwnProperty.call(commandLine,'sourceSolrIdField') ? commandLine['sourceSolrIdField'] : "id";
var sourceSolrQuery = Object.prototype.hasOwnProperty.call(commandLine,'sourceSolrQuery') ? commandLine['sourceSolrQuery'] : "*:*";

var sourceSolrHost = Object.prototype.hasOwnProperty.call(commandLine,'sourceSolrHost') ? commandLine['sourceSolrHost'] : "localhost";
var sourceSolrPort = Object.prototype.hasOwnProperty.call(commandLine,'sourceSolrPort') ? commandLine['sourceSolrPort'] : 8983;
var sourceSolrCollection = Object.prototype.hasOwnProperty.call(commandLine,'sourceSolrCollection') ? commandLine['sourceSolrCollection'] : 'test';
var sourceSolrPath = Object.prototype.hasOwnProperty.call(commandLine,'sourceSolrPath') ? commandLine['sourceSolrPath'] : "/solr/" + sourceSolrCollection + "/select?wt=json&sort=" + sourceSolrIdField + "+asc&rows=" + batchSize + "&q=" + sourceSolrQuery;
var sourceSolrUpdatePath = Object.prototype.hasOwnProperty.call(commandLine,'sourceSolrUpdatePath') ? commandLine['sourceSolrUpdatePath'] : "/solr/" + sourceSolrCollection + "/update";
var updateField = Object.prototype.hasOwnProperty.call(commandLine,'updateField') ? commandLine['updateField'] : 'source_s';
var updateValue = Object.prototype.hasOwnProperty.call(commandLine,'updateValue') ? JSON.parse(commandLine['updateValue']) : JSON.parse('{"set": "b"}');
var authKey = Object.prototype.hasOwnProperty.call(commandLine,'authKey') ? commandLine['authKey'] : '';
var async = Object.prototype.hasOwnProperty.call(commandLine,'async') ? commandLine['async'] === 'true' : false;
var debug = Object.prototype.hasOwnProperty.call(commandLine,'debug') ? commandLine['debug'] : 0;

if( debug > 0 ) console.log("commandline",commandLine);


var cursorMark = "*";

function queryCallback(res) {
  var str = "";
  
  res.on('data', function (chunk) {
              str += chunk;
              
        });

  res.on('end', function () {
        //console.log(res.field);
		//console.log(str);
		
		let data = JSON.parse(str);
		
		if( data.response && data.response.docs ){
			for(let d in data.response.docs){
				let doc = data.response.docs[d];
				for( let p in doc){
					if( Object.prototype.hasOwnProperty.call(doc,p) ){
						if( p === '_version_' || p === 'score' ){
							delete doc[p];
						}
					}

					if( updateField && p === updateField ){
						doc[updateField] = updateValue;
					}
				}
				
			}
			
			updateDocuments(data.response.docs,data.nextCursorMark && data.nextCursorMark != cursorMark && data.response.docs.length == batchSize);
		}
		//console.log(data);
		if( data.nextCursorMark ){
			if( cursorMark != data.nextCursorMark && data.response.docs.length == batchSize ){	
				cursorMark = data.nextCursorMark;
				if( async ) loadQueryBatch(cursorMark);
			}
		}
  });
}

function updateCallback(res) {
  var str = "";
  var hasMore = this.hasMore;
  var updateInfo = this.updateInfo;

  res.on('data', function (chunk) {
              str += chunk;
              
        });

  res.on('end', function () {
		updateInfo.count++;
		if( debug > 0 ) console.log("UPDATE",hasMore,str);
	
		if( updateInfo.count >= updateInfo.total ){
			if( !async && hasMore ){
				loadQueryBatch(cursorMark);
			}
			if( !hasMore ){
				console.log("complete");
				doCommit();
			}
		}
        
  });
}

function commitCallback(res) {
  var str = "";
  res.on('data', function (chunk) {
              str += chunk;
              
        });

  res.on('end', function () {
     if( debug > 1 ) console.log("COMMIT",str);
  });
}

function updateDocuments(docs,hasMore){
	let tCallback = updateCallback.bind({hasMore: hasMore,updateInfo: {total: 1,count: 0}});
	//console.log("hasmore",hasMore);
	let conf = {hostname: sourceSolrHost,port: sourceSolrPort,path: sourceSolrUpdatePath,method: 'POST',headers: {'Content-Type': 'application/json'}}

	if( authKey ){
		conf.headers['Authorization'] = 'Basic ' + authKey;
	}
		
	var t = http.request(conf, tCallback);
	t.on('error', function(e) {console.log("Got error: " + e.message);});
	t.write(JSON.stringify(docs));
	t.end();
}

function loadQueryBatch(cursorMark){
	let tCallback = queryCallback.bind({});
	
	let tSourceSolrPath = sourceSolrPath + "&cursorMark=" + cursorMark;
	let conf = {hostname: sourceSolrHost,port: sourceSolrPort,path: tSourceSolrPath,method: 'GET',headers: {'Content-Type': 'application/json'}};

	if( authKey ){
		conf.headers['Authorization'] = 'Basic ' + authKey;
	}

	let t = http.request(conf, tCallback);
	t.on('error', function(e) {console.log("Got error: " + e.message);});
	t.end();
}

function doCommit(){

	var tCallback = commitCallback.bind({});

	let conf = {host: sourceSolrHost,port: sourceSolrPort,path: sourceSolrUpdatePath + "?commit=true"};

	if( authKey ){
		conf.headers = {};
		conf.headers['Authorization'] = 'Basic ' + authKey;
	}

	var t = http.get(conf, tCallback);
	t.on('error', function(e) {console.log("Got error: " + e.message);});
	t.end();
}

loadQueryBatch(cursorMark);



