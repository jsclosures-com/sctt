/*
	node ./clonecollection authKey="c29scjpTb2xyUm9ja3M=" debug=11 batchSize=10 sourceSolrCollection=validate destinationSolrCollection=validatecopy 
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


if( debug > 0 ) console.log("commandline",commandLine);

//process.exit(0);

var batchSize = commandLine.hasOwnProperty('batchSize') ? commandLine['batchSize'] : 10;
var sourceSolrIdField = commandLine.hasOwnProperty('sourceSolrIdField') ? commandLine['sourceSolrIdField'] : "id";
var sourceSolrQuery = commandLine.hasOwnProperty('sourceSolrQuery') ? commandLine['sourceSolrQuery'] : "*:*";

var sourceSolrHost = commandLine.hasOwnProperty('sourceSolrHost') ? commandLine['sourceSolrHost'] : "localhost";
var sourceSolrPort = commandLine.hasOwnProperty('sourceSolrPort') ? commandLine['sourceSolrPort'] : 8983;
var sourceSolrCollection = commandLine.hasOwnProperty('sourceSolrCollection') ? commandLine['sourceSolrCollection'] : 'validate';
var sourceSolrPath = commandLine.hasOwnProperty('sourceSolrPath') ? commandLine['sourceSolrPath'] : "/solr/" + sourceSolrCollection + "/select?wt=json&sort=" + sourceSolrIdField + "+asc&rows=" + batchSize + "&q=" + sourceSolrQuery;

var destinationSolrHost = commandLine.hasOwnProperty('destinationSolrHost') ? commandLine['destinationSolrHost'] : "localhost";
var destinationSolrPort = commandLine.hasOwnProperty('destinationSolrPort') ? commandLine['destinationSolrPort'] : 8983;
var destinationSolrCollection = commandLine.hasOwnProperty('destinationSolrCollection') ? commandLine['destinationSolrCollection'] : "validatecopy";
var destinationSolrUpdatePath = commandLine.hasOwnProperty('destinationSolrUpdatePath') ? commandLine['destinationSolrUpdatePath'] : "/solr/" + destinationSolrCollection + "/update";
var async  = (commandLine.hasOwnProperty('async') ? commandLine['async'] : "true") == 'false';
var runForever  = (commandLine.hasOwnProperty('runForever') ? commandLine['runForever'] : "false") == 'true';
var fieldsToExclude = commandLine.hasOwnProperty('fieldsToExclude') ? commandLine['fieldsToExclude'].split(",") : [];
var authKey = commandLine.hasOwnProperty('authKey') ? commandLine['authKey'] : false;
var debug = commandLine.hasOwnProperty('debug') ? commandLine['debug'] : 0;

var HANDLERS = {
	documents:  function(args){
		copyDocuments(args.docs,args.hasMore);
	},
	eachdocuments:  function(args){
		let docs = args.docs;

		let ctx = {docs: args.docs,hasMore: args.hasMore,docListSize: docs.length};

		let finalCB = function(){
			copyDocuments(this.context.docs,this.context.hasMore);
		}.bind({context: ctx});

		let localCB = function(res){
			let str = "";
			let context = this.context;
			let index = this.index;
			let doc = this.doc;

			res.on('data', function (chunk) {
						str += chunk;
					});

			res.on('end', function () {
				let data = JSON.parse(str);

				if( debug > 1 ) console.log("query complete",str);

				if( data.response && data.response.docs && data.response.docs.length > 0 ){
					let responseList = data.response.docs;
					let uidList = [];

					for(let i in responseList){
						let foundDoc = responseList[i];
						if( foundDoc["TC_0Y0_ProductScope_0Y0_product_uid"] )
							uidList.push(foundDoc["TC_0Y0_ProductScope_0Y0_product_uid"]);
					}

					if( uidList.length > 0 )
						doc["product_uid_ss"] = uidList;
				}

				context.docListSize--;

				if( context.docListSize == 0 )
					finalCB();
			});
		};

		for(let i in docs){
			let doc = docs[i];
			let tSourceSolrPath = "/solr/" + sourceSolrCollection + "/select?wt=json&rows=1000&q=*:*";
			//tSourceSolrPath += tSourceSolrPath + "&fq=TC_0Y0_Item_0Y0_Item_uid:" + doc["TC_0Y0_Item_0Y0_Item_uid"];

			let conf = {hostname: sourceSolrHost,port: sourceSolrPort,path: tSourceSolrPath,method: 'GET',headers: {'Content-Type': 'application/json'}}

			if( authKey ){
				conf.headers['Authorization'] = 'Basic ' + authKey;
			}

			var t = http.request(conf, localCB.bind({context: ctx,index: i,doc: doc}));
			t.on('error', function(e) {console.log("Got error: " + e.message);});
			t.end();
		}
		
	}
};

var cursorMark = "*";

function inExcludeList(fieldName){
	let result = false;
        for(let i in fieldsToExclude){
		if( fieldName.indexOf(fieldsToExclude[i]) > -1 ){
			result = true;
			break;
		}
	}

	return( result );
}

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
					if( doc.hasOwnProperty(p) ){
						if( p === '_version_' || p === 'score' || inExcludeList(p) ){
							
							delete doc[p];
						}
					}
				}
				
			}
			
			if( HANDLERS && HANDLERS["documents"] )
				HANDLERS["documents"]({docs: data.response.docs,hasMore: data.nextCursorMark && data.nextCursorMark != cursorMark});
			else
				copyDocuments(data.response.docs,data.nextCursorMark && data.nextCursorMark != cursorMark);
		}
		//console.log(data);
		if( data.nextCursorMark ){
			if( cursorMark != data.nextCursorMark ){	
				cursorMark = data.nextCursorMark;
				if( async ) loadQueryBatch(cursorMark);
			}
			else {
				console.log("complete");
				doCommit();
			}
		}
  });
}

function updateCallback(res) {
  var str = "";
  var hasMore = this.hasMore;

  res.on('data', function (chunk) {
              str += chunk;
              
        });

  res.on('end', function () {
        if( debug > 0 ) console.log("UPDATE",hasMore,str);
	if( !async && hasMore ){
		loadQueryBatch(cursorMark);
	}
  });
}

function commitCallback(res) {
  var str = "";
  res.on('data', function (chunk) {
              str += chunk;
              
        });

  res.on('end', function () {
        console.log("COMMIT");

	if( runForever ){
		cursorMark = "*";
		loadQueryBatch(cursorMark);
	}
  });
}

function copyDocuments(docs,hasMore){
	let tCallback = updateCallback.bind({hasMore: hasMore});
	//console.log("hasmore",hasMore);
	let conf = {hostname: destinationSolrHost,port: destinationSolrPort,path: destinationSolrUpdatePath,method: 'POST',headers: {'Content-Type': 'application/json'}}

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

	let conf = {host: destinationSolrHost,port: destinationSolrPort,path: destinationSolrUpdatePath + "?stream.body=<commit/>"};

	if( authKey ){
		conf.headers = {};
		conf.headers['Authorization'] = 'Basic ' + authKey;
	}

	var t = http.get(conf, tCallback);
}

loadQueryBatch(cursorMark);



