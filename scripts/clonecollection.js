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
				else if( index+1 < context.docs.length )
					nextCB(index+1);
			});
		};

		let nextCB = function(index){
			let doc = this.context.docs[index];
			docLoop(ctx,index,doc);
		}.bind({context: ctx});

		let docLoop = function(ctx,i,doc){
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

		nextCB(0);
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



