var HANDLERS = {
	"ZEN": function (args) {
		let result = { status: 1, message: "HANDLED" };
		let CONTEXT = args.CONTEXT;

		return (result);
	},
	"EXTRACT": function (args) {
		let result = { status: 1, message: "HANDLED" };
		let CONTEXT = args.CONTEXT;

		let testName = "default";
		let input = "";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;

		let getTestCallback = function (test) {
			//console.log(test);

			result.items = [{ testname: test.testname }];

			let scriptToExecute = false;

			let script = CONTEXT.lib.Buffer.from(test.testextractscript, 'base64');

			eval('scriptToExecute = ' + script + ";");

			let sendArgs = this.args.queryObj.input ? CONTEXT.lib.parseArgs(this.args.queryObj.input) : this.args;

			if (CONTEXT.DEBUG > 1) console.log("sendArgs", sendArgs);

			scriptToExecute(sendArgs);

			args.callback(result);
		};
		CONTEXT.lib.loadTest(testName, getTestCallback.bind({ args: args }));

		return (result);
	},
	"BUILD": function (args) {
		let result = { status: 1, message: "HANDLED" };
		let CONTEXT = args.CONTEXT;

		let testName = "default";
		let input = "";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;

		let getTestCallback = function (test) {
			//console.log(test);

			result.items = [{ testname: test.testname }];

			let scriptToExecute = false;

			let script = CONTEXT.lib.Buffer.from(test.testsamplescript, 'base64');

			eval('scriptToExecute = ' + script + ";");

			let sendArgs = this.args.queryObj.input ? CONTEXT.lib.parseArgs(this.args.queryObj.input) : this.args;

			if (CONTEXT.DEBUG > 1) console.log("sendArgs", sendArgs);

			scriptToExecute(sendArgs);

			args.callback(result);
		};
		CONTEXT.lib.loadTest(testName, getTestCallback.bind({ args: args }));

		return (result);
	},
	"RUNNER": function (args) {
		let result = { status: 1, message: "HANDLED" };
		let CONTEXT = args.CONTEXT;

		let testName = "default";
		let testType = "build";
		let input = "";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;
		if (args.queryObj.type)
			testType = args.queryObj.type;

		let getTestCallback = function (test) {
			//console.log(test);

			result.items = [{ testname: test.testname }];

			try {
				let scriptToExecute = false;

				/*let script = Buffer.from(test[this.type], 'base64');

				if( script.startsWith("ASSET:") ){

				}*/

				let script = test[this.type];

				eval('scriptToExecute = ' + script + ";");

				let sendArgs = this.args.queryObj.input ? CONTEXT.lib.parseRunnerArgs(this.args.queryObj.input) : this.args;

				sendArgs.callback = args.callback;

				result.message = "executed " + this.type + " in " + test.testname;

				sendArgs.resultContext = result;

				if (CONTEXT.DEBUG > 1) console.log("sendArgs", sendArgs);

				scriptToExecute(sendArgs);


			}
			catch (ee) {
				if (CONTEXT.DEBUG > 0) console.log("exception running script", ee);
			}

			/*try{
				args.callback(result);
			}
			catch(ee){ console.log(ee);}*/
		};
		CONTEXT.lib.loadTest(testName, getTestCallback.bind({ args: args, type: testType, name: testName }), testType);

		return (result);
	},
	"SUMMARY": function (args) {
		let result = { status: 1, message: "HANDLED" };
		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrPath = "/solr/" + CONTEXT.SOLRCOLLECTION + "/select?q=query_txt:%s&wt=json&indent=on";
		let contentType = "SUMMARY";
		if (args.queryObj.headeronly) {
			contentType = "SUMMARYHEADER";
			solrPath = "/solr/" + CONTEXT.SOLRCOLLECTION + "/select?q=*:*&wt=json&indent=on";
		}

		solrPath += "&fq=contenttype:*" + contentType;

		let input = "*";
		if (args.queryObj.query_txt)
			input = args.queryObj.query_txt + '*';
		let testName = "default";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;

		if (testName) {
			solrPath += "&fq=testname:" + testName;
		}


		if (args.queryObj._start)
			solrPath += '&start=' + args.queryObj._start;

		if (args.queryObj._rows)
			solrPath += '&rows=' + (2 * args.queryObj._rows);

		if (args.queryObj._sort) {
			let sortField = args.queryObj._sort;
			solrPath += '&sort=' + sortField;
			if (args.queryObj._ascending) {
				solrPath += '+asc';
			}
			else {
				solrPath += '+desc';
			}
		}
		if (CONTEXT.DEBUG > 1) console.log("solrpath", solrPath);

		let callback = function (res) {
			let str = "";

			res.on('data', function (chunk) {
				str += chunk;

			});

			res.on('end', function () {
				console.log("sample complete", str);
				try {
					let data = JSON.parse(str);
					if (data.response && data.response.docs) {
						let docs = data.response.docs;

						result.items = docs;
						result._totalItems = data.response.numFound;
					}
				}
				catch(exp){
					if (CONTEXT.DEBUG > 0) console.log("handler error", exp);
				}
				args.callback(result);
			});
		}
		//let tCallback = callback.bind({field: fieldList[i]});
		let tCallback = callback;

		let tUrl = solrPath.replace("%s", input).replace(/ /g, "%20");

		if (CONTEXT.DEBUG > 1) console.log('solr path', tUrl);

		let config = { host: solrHost, port: solrPort, path: tUrl };
		if (CONTEXT.AUTHKEY)
			config.headers = { "Authorization": "Basic " + CONTEXT.AUTHKEY };

		let t = CONTEXT.lib.http.get(config, tCallback);
		t.on('error', function (e) {
			if (CONTEXT.DEBUG > 0) console.log("Got error: " + e.message);
			args.callback({ error: e.message });
		});

		return (result);
	},
	"COMPARE": function (args) {
		let result = { status: 1, message: "HANDLED" };

		let action = "GET";

		if (args.queryObj.action)
			action = args.queryObj.action;
		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrCollection = CONTEXT.SOLRCOLLECTION;

		let testName = "default";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;

		let parentId = false;

		if (args.queryObj.parentid)
			parentId = args.queryObj.parentid;

		if (action === "GET") {
			let solrPath = "/solr/" + solrCollection + "/select?q=*:*&fq=testname:" + testName + "&fq=-contenttype:TEST&fq=-contenttype:SEARCH&wt=json&indent=on";

			if (parentId) {
				solrPath += "&fq=parentid:" + parentId;
			}

			let callback = function (res) {
				let str = "";

				res.on('data', function (chunk) {
					str += chunk;

				});

				res.on('end', function () {
					if (CONTEXT.DEBUG > 0) console.log("sample complete", str);
					try {
						let data = JSON.parse(str);
						if (data.response && data.response.docs) {
							result.items = data.response.docs;
							result.count = data.response.numFound;
						}
					}
					catch(exp){
						if (CONTEXT.DEBUG > 0) console.log("handler error", exp);
					}
					args.callback(result);
				});
			}
			//let tCallback = callback.bind({field: fieldList[i]});
			let tCallback = callback;
			if (CONTEXT.DEBUG > 1) console.log('solr path', solrPath);

			let config = { host: solrHost, port: solrPort, path: solrPath };
			if (CONTEXT.AUTHKEY)
				config.headers = { "Authorization": "Basic " + CONTEXT.AUTHKEY };

			let t = CONTEXT.lib.http.get(config, tCallback);
			t.on('error', function (e) {
				if (CONTEXT.DEBUG > 0) console.log("Got error: " + e.message);
				args.callback({ error: e.message });
			});
		}


		return (result);
	},
	"SEARCH": function (args) {
		let result = { status: 1, message: "HANDLED" };
		let testName = "default";
		let input = "audit";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;
		if (args.queryObj.input)
			input = args.queryObj.input;

		var getTestCallback = function (data) {
			result.items = [{ testname: testName }];
			args.callback(result);
		};
		args.CONTEXT.lib.loadTest(testName, getTestCallback);

		return (result);
	},
	"SAMPLE": function (args) {
		let result = { status: 1, message: "HANDLED" };

		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrCollection = CONTEXT.SOLRCOLLECTION;
		let solrPath = "/solr/" + solrCollection + "/select?q=query_txt:%s&fq=contenttype:SEARCH&wt=json&indent=on";

		let input = "*";
		if (args.queryObj.query_txt)
			input = args.queryObj.query_txt + '*';
		let testName = "default";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;

		if (testName) {
			solrPath += "&fq=testname:" + testName;
		}

		if (args.queryObj._start)
			solrPath += '&start=' + args.queryObj._start;

		if (args.queryObj._rows)
			solrPath += '&rows=' + args.queryObj._rows;

		if (args.queryObj._sort) {
			solrPath += '&sort=' + args.queryObj._sort;
			if (args.queryObj._ascending) {
				solrPath += '+asc';
			}
			else {
				solrPath += '+desc';
			}
		}

		let callback = function (res) {
			let str = "";

			res.on('data', function (chunk) {
				str += chunk;

			});

			res.on('end', function () {
				if (CONTEXT.DEBUG > 1) console.log("sample complete", str);
				try {
					let data = JSON.parse(str);
					if (data.response && data.response.docs) {
						result.items = data.response.docs;
						result._totalItems = data.response.numFound;
					}
				}
				catch(exp){
					if (CONTEXT.DEBUG > 0) console.log("handler error", exp);
				}
				args.callback(result);
			});
		}
		//let tCallback = callback.bind({field: fieldList[i]});
		let tCallback = callback;

		let tUrl = solrPath.replace("%s", input).replace(/ /g, "%20");

		if (CONTEXT.DEBUG > 1) console.log('solr path', tUrl);

		let config = { host: solrHost, port: solrPort, path: tUrl };
		if (CONTEXT.AUTHKEY)
			config.headers = { "Authorization": "Basic " + CONTEXT.AUTHKEY };

		let t = CONTEXT.lib.http.get(config, tCallback);
		t.on('error', function (e) {
			if (CONTEXT.DEBUG > 0) console.log("Got error: " + e.message);
			args.callback({ error: e.message });
		});

		return (result);
	},
	"FEEDBACK": function (args) {
		let result = { status: 1, message: "HANDLED" };

		let action = "GET";

		if (args.queryObj.action)
			action = args.queryObj.action;

		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrCollection = CONTEXT.SOLRCOLLECTION;

		if (action === "GET") {
			let solrPath = "/solr/" + solrCollection + "/select?q=*:*&fq=contenttype:FEEDBACK&wt=json&indent=on";

			if (args.queryObj._start)
				solrPath += '&start=' + args.queryObj._start;

			if (args.queryObj._rows)
				solrPath += '&rows=' + args.queryObj._rows;

			if (args.queryObj._sort) {
				solrPath += '&sort=' + args.queryObj._sort;
				if (args.queryObj._ascending) {
					solrPath += '+asc';
				}
				else {
					solrPath += '+desc';
				}
			}

			let callback = function (res) {
				let str = "";

				res.on('data', function (chunk) {
					str += chunk;

				});

				res.on('end', function () {
					if (CONTEXT.DEBUG > 1) console.log("sample complete", str);
					try {
						let data = JSON.parse(str);
						if (data.response && data.response.docs) {
							result.items = data.response.docs;
							result._totalItems = data.response.numFound;
						}
					}
					catch(exp){
						if (CONTEXT.DEBUG > 0) console.log("handler error", exp);
					}
					args.callback(result);
				});
			}
			//let tCallback = callback.bind({field: fieldList[i]});
			let tCallback = callback;
			if (CONTEXT.DEBUG > 1) console.log('solr path', solrPath);

			let config = { host: solrHost, port: solrPort, path: solrPath };
			if (CONTEXT.AUTHKEY)
				config.headers = { "Authorization": "Basic " + CONTEXT.AUTHKEY };

			let t = CONTEXT.lib.http.get(config, tCallback);
			t.on('error', function (e) {
				if (CONTEXT.DEBUG > 0) console.log("Got error: " + e.message);
				args.callback({ error: e.message });
			});
			t.end();
		}
		else if (action === 'POST') {
			let solrPath = "/solr/" + solrCollection + "/update";
			let callback = function (res) {
				let str = "";

				res.on('data', function (chunk) {
					str += chunk;

				});

				res.on('end', function () {
					if (CONTEXT.DEBUG > 1) console.log("update complete", str);
					let data = JSON.parse(str);

					args.callback(data);
				});
			}
			let tCallback = callback;
			if (CONTEXT.DEBUG > 1) console.log('solr path', solrPath);

			let config = { host: solrHost, port: solrPort, path: solrPath, headers: { 'Content-Type': 'application/json' } };
			if (CONTEXT.AUTHKEY)
				config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
			let t = CONTEXT.lib.http.request(config, tCallback);
			t.on('error', function (e) {
				if (CONTEXT.DEBUG > 0) console.log("Got error: " + e.message);
				args.callback({ error: e.message });
			});
			if (!args.queryObj.doc.id) {
				args.queryObj.doc.id = "FEEDBACK" + new Date().getTime();
			}
			args.queryObj.doc.contenttype = "FEEDBACK";
			let docs = { "add": { doc: args.queryObj.doc, "commitWithin": 500 } };
			t.write(JSON.stringify(docs));
			t.end();
		}
		else if (action === 'DELETE') {
			let solrPath = "/solr/" + solrCollection + "/update";
			let callback = function (res) {
				let str = "";

				res.on('data', function (chunk) {
					str += chunk;

				});

				res.on('end', function () {
					if (CONTEXT.DEBUG > 1) console.log("update complete", str);
					let data = JSON.parse(str);

					args.callback(data);
				});
			}
			let tCallback = callback;
			if (CONTEXT.DEBUG > 0) console.log('solr path', solrPath);

			let config = { host: solrHost, port: solrPort, path: solrPath, headers: { 'Content-Type': 'application/json' } };
			if (CONTEXT.AUTHKEY)
				config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
			let t = CONTEXT.lib.uest(config, tCallback);
			t.on('error', function (e) {
				if (CONTEXT.DEBUG > 0) console.log("Got error: " + e.message);
				args.callback({ error: e.message });
			});
			let docs = { "delete": { id: args.queryObj.doc.id }, "commit": {} };
			if (CONTEXT.DEBUG > 1) console.log("Delete", docs);
			t.write(JSON.stringify(docs));
			t.end();

		}

		return (result);
	},
	"TEST": function (args) {
		let result = { status: 1, message: "HANDLED" };

		let action = "GET";

		if (args.queryObj.action)
			action = args.queryObj.action;

		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrCollection = CONTEXT.SOLRCOLLECTION;

		if (action === "GET") {
			let solrPath = "/solr/" + solrCollection + "/select?q=*:*&fq=contenttype:TEST&wt=json&indent=on";

			if (args.queryObj._start)
				solrPath += '&start=' + args.queryObj._start;

			if (args.queryObj._rows)
				solrPath += '&rows=' + args.queryObj._rows;

			if (args.queryObj._sort) {
				solrPath += '&sort=' + args.queryObj._sort;
				if (args.queryObj._ascending) {
					solrPath += '+asc';
				}
				else {
					solrPath += '+desc';
				}
			}

			let callback = function (res) {
				let str = "";

				res.on('data', function (chunk) {
					str += chunk;

				});

				res.on('end', function () {
					if (CONTEXT.DEBUG > 1) console.log("sample complete", str);
					let data = {};

					try {
						if (CONTEXT.DEBUG > 0) console.log(str);
						data = JSON.parse(str);
					}
					catch (e) {
						if (CONTEXT.DEBUG > 0) console.log("TEST", e, str);
					}
					if (data.response && data.response.docs) {
						result.items = data.response.docs;
						result._totalItems = data.response.numFound;
					}
					args.callback(result);
				});
			}
			//let tCallback = callback.bind({field: fieldList[i]});
			let tCallback = callback;
			if (CONTEXT.DEBUG > 1) console.log('solr path', solrPath);

			let config = { host: solrHost, port: solrPort, path: solrPath, headers: { 'Content-Type': 'application/json' } };
			if (CONTEXT.AUTHKEY)
				config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
			let t = CONTEXT.lib.http.request(config, tCallback);
			t.on('error', function (e) {
				if (CONTEXT.DEBUG > 1) console.log("Got error: " + e.message);
				args.callback({ error: e.message });
			});
			t.end();
		}
		else if (action === 'POST') {
			let solrPath = "/solr/" + solrCollection + "/update";
			let callback = function (res) {
				let str = "";

				res.on('data', function (chunk) {
					str += chunk;

				});

				res.on('end', function () {
					if (CONTEXT.DEBUG > 1) console.log("update complete", str);
					let data = JSON.parse(str);

					args.callback(data);
				});
			}
			let tCallback = callback;
			if (CONTEXT.DEBUG > 1) console.log('solr path', solrPath);

			let config = { method: "POST", host: solrHost, port: solrPort, path: solrPath, headers: { 'Content-Type': 'application/json' } };
			if (CONTEXT.AUTHKEY)
				config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
			let t = CONTEXT.lib.http.request(config, tCallback);
			t.on('error', function (e) {
				if (CONTEXT.DEBUG > 1) console.log("Got error: " + e.message);
				args.callback({ error: e.message });
			});
			if (!args.queryObj.doc.id) {
				args.queryObj.doc.id = "TEST" + new Date().getTime();
			}
			args.queryObj.doc.contenttype = "TEST";
			let docs = { "add": { doc: args.queryObj.doc, "commitWithin": 500 } };
			t.write(JSON.stringify(docs));
			t.end();
		}
		else if (action === 'DELETE') {
			let solrPath = "/solr/" + solrCollection + "/update";
			let callback = function (res) {
				let str = "";

				res.on('data', function (chunk) {
					str += chunk;

				});

				res.on('end', function () {
					if (CONTEXT.DEBUG > 0) console.log("update complete", str);
					let data = JSON.parse(str);

					args.callback(data);
				});
			}
			let tCallback = callback;
			if (CONTEXT.DEBUG > 1) console.log('solr path', solrPath);

			let config = { method: "POST", host: solrHost, port: solrPort, path: solrPath, headers: { 'Content-Type': 'application/json' } };
			if (CONTEXT.AUTHKEY)
				config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
			let t = CONTEXT.lib.http.request(config, tCallback);
			t.on('error', function (e) {
				if (CONTEXT.DEBUG > 1) console.log("Got error: " + e.message);
				args.callback({ error: e.message });
			});
			let docs = { "delete": { id: args.queryObj.doc.id }, "commit": {} };
			if (CONTEXT.DEBUG > 1) console.log("Delete", docs);
			t.write(JSON.stringify(docs));
			t.end();

		}

		return (result);
	},
	"RESULTS": function (args) {
		let result = { status: 1, message: "HANDLED" };

		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrCollection = CONTEXT.SOLRCOLLECTION;
		let solrPath = "/solr/" + solrCollection + "/select?q=*:*&wt=json&indent=on";

		let testName = "default";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;

		if (testName) {
			solrPath += "&fq=testname:" + testName;
		}

		let type = "JMX"; //JMX or MEMORY

		if (args.queryObj.type)
			type = args.queryObj.type;

		let subtype = "UPDATE"; //UPDATE or QUERY

		if (args.queryObj.subtype)
			subtype = args.queryObj.subtype;

		solrPath += "&fq=contenttype:" + type + subtype;
		let which = "BEFORE"; //BEFORE or AFTER

		if (args.queryObj.which)
			which = args.queryObj.which;
		solrPath += which;

		if (args.queryObj._start)
			solrPath += '&start=' + args.queryObj._start;

		if (args.queryObj._rows)
			solrPath += '&rows=' + (args.queryObj._rows);
		else
			solrPath += '&rows=1000';

		solrPath += '&sort=crawldate+asc,contenttype+desc';

		if (CONTEXT.DEBUG > 1) console.log("solrpath", solrPath);

		let callback = function (res) {
			let str = "";

			res.on('data', function (chunk) {
				str += chunk;

			});

			res.on('end', function () {
				if (CONTEXT.DEBUG > 0) console.log("sample complete", str);
				let data = JSON.parse(str);
				if (data.response && data.response.docs) {
					let docs = data.response.docs;

					result.items = docs;
					result._totalItems = data.response.numFound;
				}
				args.callback(result);
			});
		}
		let tCallback = callback;

		let tUrl = solrPath.replace(/ /g, "%20");

		if (CONTEXT.DEBUG > 1) console.log('solr path', tUrl);

		let config = { host: solrHost, port: solrPort, path: tUrl, headers: { 'Content-Type': 'application/json' } };
		if (CONTEXT.AUTHKEY)
			config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
		let t = CONTEXT.lib.http.request(config, tCallback);
		t.on('error', function (e) {
			if (CONTEXT.DEBUG > 0) console.log("Got error: " + e.message);
			args.callback({ error: e.message });
		});

		return (result);
	},
	"DOWNLOADSUMMARY": function (args) {
		let result = { status: 1, message: "HANDLED" };

		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrCollection = CONTEXT.SOLRCOLLECTION;
		let solrPath = "/solr/" + solrCollection + "/select?fl=query_txt,qtime,qtimeb,qtimea,rowcount,rowcounta,rowcountb,topdocdefore,topdocafter,countscore,matchscore,differencescore,matchscorelist&q=*:*&wt=csv&indent=on";

		let testName = "default";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;

		if (testName) {
			solrPath += "&fq=contenttype:SUMMARY&fq=testname:" + testName;
		}

		if (args.queryObj._rows)
			solrPath += '&rows=' + (args.queryObj._rows);
		else
			solrPath += '&rows=100000';

		solrPath += '&sort=crawldate+asc,contenttype+desc';

		if (CONTEXT.DEBUG > 1) console.log("solrpath", solrPath);

		let callback = function (res) {
			let str = "";

			res.on('data', function (chunk) {
				str += chunk;

			});

			res.on('end', function () {
				if (CONTEXT.DEBUG > 1) console.log("export complete", str);
				let data = str;

				args.callback({ payload: data, headers: [{ name: "Content-Type", value: "application/force-download" }, { name: "Content-Length", value: str.length }, { name: "Content-Type", value: "application/csv" }, { name: "Content-Disposition", value: "attachment; filename=" + testName + ".csv" }] });
			});
		}
		let tCallback = callback;

		let tUrl = solrPath.replace(/ /g, "%20");

		if (CONTEXT.DEBUG > 1) console.log('solr path', tUrl);

		let config = { host: solrHost, port: solrPort, path: tUrl, headers: { 'Content-Type': 'application/json' } };
		if (CONTEXT.AUTHKEY)
			config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
		let t = CONTEXT.lib.http.request(config, tCallback);
		t.on('error', function (e) {
			if (CONTEXT.DEBUG > 0) console.log("Got error: " + e.message);
			args.callback({ error: e.message });
		});

		return (result);
	},
	"DELETEALL": function (args) {
		let result = { status: 1, message: "HANDLED" };

		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrCollection = CONTEXT.SOLRCOLLECTION;
		let solrPath = "/solr/" + solrCollection + "/update?commitWithin=1000&overwrite=true&wt=json";

		let testName = "default";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;


		if (CONTEXT.DEBUG > 1) console.log("solrpath", solrPath);

		let callback = function (res) {
			let str = "";

			res.on('data', function (chunk) {
				str += chunk;

			});

			res.on('end', function () {
				if (CONTEXT.DEBUG > 1) console.log("delete complete", str);
				let data = JSON.parse(str);
				if (data.response && data.response.docs) {
					let docs = data.response.docs;

					result.items = docs;
					result._totalItems = data.response.numFound;
				}
				args.callback(result);
			});
		}
		let tCallback = callback;

		let tUrl = solrPath.replace(/ /g, "%20");

		if (CONTEXT.DEBUG > 1) console.log('solr path', tUrl);
		let payload = "<add><delete><query>-contenttype:TEST AND testname:" + testName + "</query></delete></add>";

		let config = { headers: { "Content-Type": "text/xml", "Content-Length": payload.length }, host: solrHost, port: solrPort, method: 'POST', path: tUrl };
		if (CONTEXT.AUTHKEY)
			config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
		let t = CONTEXT.lib.http.request(config, tCallback);
		t.on('error', function (e) {
			if (CONTEXT.DEBUG > 0) console.log("Got error: " + e.message);
			args.callback({ error: e.message });
		});
		t.write(payload);
		t.end();

		return (result);
	},
	"RESULTDETAILS": function (args) {
		let result = { status: 1, message: "HANDLED" };

		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrCollection = CONTEXT.SOLRCOLLECTION;
		let solrPath = "/solr/" + solrCollection + "/select?q=*:*";

		let testName = "default";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;

		if (testName) {
			solrPath += "&fq=testname:" + testName;
		}
		let finalResult = { items: [] };

		let collectorCB = function (data) {
			if (data.items) {
				this.result.items = this.result.items.concat(data.items);
				if (CONTEXT.DEBUG > 1) console.log("concat items", this.result, this);
			}

			if (this.nextEntry)
				CONTEXT.lib.getRESTData({ host: solrHost, port: solrPort, path: this.nextEntry.path, type: this.nextEntry.type, callback: this.nextEntry.callback, entry: this.nextEntry });
			else
				this.args.callback(this.result);
		}
		let pathList = [


		];
		for (let i = 0; i < pathList.length; i++) {
			if (i + 1 < pathList.length)
				pathList[i].callback = collectorCB.bind({ args: args, result: finalResult, nextEntry: pathList[i + 1] });
			else
				pathList[i].callback = collectorCB.bind({ args: args, result: finalResult });
		}

		if (CONTEXT.DEBUG > 1) console.log("solrpath", pathList[0].path);
		CONTEXT.lib.getRESTData({ host: solrHost, port: solrPort, path: pathList[0].path, type: pathList[0].type, callback: pathList[0].callback, entry: pathList[0] });

		return (result);
	},
	"DETAILSRUNNER": function (args) {
		let result = { status: 1, message: "HANDLED" };
		let testName = "default";
		let testType = "testdetailscript";
		let input = "";
		let CONTEXT = args.CONTEXT;

		if (args.queryObj.testname)
			testName = args.queryObj.testname;

		let getTestCallback = function (test) {
			//console.log(test);

			result.items = [{ testname: test.testname }];

			try {
				let scriptToExecute = false;

				let script = CONTEXT.lib.Buffer.from(test[this.type], 'base64');

				eval('scriptToExecute = ' + script + ";");

				let sendArgs = this.args.queryObj.input ? CONTEXT.lib.parseRunnerArgs(this.args.queryObj.input) : this.args;

				//console.log("sendArgs",sendArgs);

				scriptToExecute(sendArgs.queryObj, args.callback);

				result.message = "executed " + this.type + " in " + test.testname;
			}
			catch (ee) {
				if (CONTEXT.DEBUG > 0) console.log("exception running script", ee);
			}
		};
		CONTEXT.lib.loadTest(testName, getTestCallback.bind({ args: args, type: testType, name: testName }));

		return (result);
	},
	"REALTIME": function (args) {
		let result = { status: 1, message: "HANDLED" };

		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrCollection = CONTEXT.SOLRCOLLECTION;
		let url = "http://" + solrHost + ":" + solrPort + "/solr/admin/metrics?wt=json";

		if (args.queryObj.url)
			url = args.queryObj.url;

		let parsedURL = CONTEXT.lib.URL.parse(url);

		solrHost = parsedURL.hostname;
		solrPort = parsedURL.port;
		solrPath = parsedURL.pathname;

		let callback = function (res) {
			let str = "";

			res.on('data', function (chunk) {
				str += chunk;

			});

			res.on('end', function () {
				if (CONTEXT.DEBUG > 1) console.log("delete complete", str);
				let data = JSON.parse(str);

				args.callback(data);
			});
		}

		let config = { method: "GET", host: solrHost, port: solrPort, path: solrPath, headers: {} ,rejectUnauthorized: false};
		if (CONTEXT.AUTHKEY)
			config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;

		let t = url.indexOf("https") > -1 ? CONTEXT.lib.https.request(config, callback) : CONTEXT.lib.http.request(config, callback);
		t.on('error', function (e) {
			if (CONTEXT.DEBUG > 0) console.log("Got error: " + e.message);
			args.callback({ error: e.message });
		});
		t.end();
		return (result);
	},
	"PAGEMETRIC": function (args) {
		let result = { status: 1, message: "HANDLED" };

		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrCollection = CONTEXT.SOLRCOLLECTION;
		let solrPath = "/solr/" + solrCollection + "/select?q=*:*&wt=json&indent=on";

		let testName = "default";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;

		if (testName) {
			solrPath += "&fq=contenttype:METRIC&fq=testname:" + testName;
		}

		if (args.queryObj._rows)
			solrPath += '&rows=' + (args.queryObj._rows);
		else
			solrPath += '&rows=1';

		if (args.queryObj._start)
			solrPath += '&start=' + (args.queryObj._start);
		else
			solrPath += '&start=0';

		solrPath += '&sort=crawldate+asc';

		if (CONTEXT.DEBUG > 1) console.log("solrpath", solrPath);

		let callback = function (res) {
			let str = "";

			res.on('data', function (chunk) {
				str += chunk;

			});

			res.on('end', function () {
				if (CONTEXT.DEBUG > 1) console.log("export complete", str);
				let data = str;

				args.callback({ payload: data, headers: [{ name: "Content-Type", value: "application/json" }, { name: "Content-Length", value: str.length }] });
			});
		}
		let tCallback = callback;

		let tUrl = solrPath.replace(/ /g, "%20");

		if (CONTEXT.DEBUG > 1) console.log('solr path', tUrl);

		let config = { host: solrHost, port: solrPort, path: tUrl, headers: { 'Content-Type': 'application/json' } };
		if (CONTEXT.AUTHKEY)
			config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
		let t = CONTEXT.lib.http.request(config, tCallback);
		t.on('error', function (e) {
			if (CONTEXT.DEBUG > 0) console.log("Got error: " + e.message);
			args.callback({ error: e.message });
		});
		t.end();

		return (result);
	},
	"COLLECTMETRIC": function (args) {
		let result = { status: 1, message: "HANDLED" };

		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrCollection = CONTEXT.SOLRCOLLECTION;
		let solrPath = "/solr/" + solrCollection + "/select?q=*:*&wt=json&indent=on";
		let collection = "^[a-zA-Z0-9._/]+$";
		let handler = "^[a-zA-Z0-9._/]+$";
		let metric = "^[a-zA-Z0-9._/]+$";

		if (args.queryObj.collection)
			collection = args.queryObj.collection;
		if (args.queryObj.handler)
			handler = args.queryObj.handler;
		if (args.queryObj.metric)
			metric = args.queryObj.metric;

		let testName = "default";

		if (args.queryObj.testname)
			testName = args.queryObj.testname;

		if (testName) {
			solrPath += "&fq=contenttype:METRIC&fq=testname:" + testName;
		}

		if (args.queryObj._rows)
			solrPath += '&rows=' + (args.queryObj._rows);
		else
			solrPath += '&rows=1000';

		if (args.queryObj._start)
			solrPath += '&start=' + (args.queryObj._start);
		else
			solrPath += '&start=0';

		solrPath += '&sort=crawldate+asc';

		if (CONTEXT.DEBUG > 1) console.log("solrpath", solrPath);

		function analyzeIt(outputBuffer, inputObj, handler, collection, metric) {
			if (CONTEXT.DEBUG > 20) console.log(inputObj);

			if (inputObj) {
				if (!handler) handler = '^[a-zA-Z0-9._/]+$';
				let handlerRegEx = new RegExp(handler);
				if (!collection) collection = '^[a-zA-Z0-9._/]+$';
				let collectionRegEx = new RegExp(collection);
				if (!metric) metric = '^[a-zA-Z0-9._/]+$';
				let metricRegEx = new RegExp(metric);

				let data = inputObj["metricsdata"][0];
				data = JSON.parse(CONTEXT.lib.Buffer.from(data, "base64").toString("ascii")).metrics;
				if (CONTEXT.DEBUG > 20) console.log("mdata", data);
				for (let c in data) {
					//console.log(c);
					if (collectionRegEx.test(c)) {
						//console.log("do collection",c);
						let currentHandler = data[c];
						for (let h in currentHandler) {
							//console.log(h);
							if (handlerRegEx.test(h)) {
								//console.log("do handler",h);
								let currentMetric = currentHandler[h];

								if (currentMetric["count"] >= 0) {
									for (let m in currentMetric) {
										//console.log(m);
										if (metricRegEx.test(m)) {
											if (CONTEXT.DEBUG > 30) console.log("do metric", m);
											if (!Object.prototype.hasOwnProperty.call(outputBuffer, c))
												outputBuffer[c] = {};
											if (!Object.prototype.hasOwnProperty.call(outputBuffer[c], h))
												outputBuffer[c][h] = {};
											if (!Object.prototype.hasOwnProperty.call(outputBuffer[c][h], m))
												outputBuffer[c][h][m] = [];
											outputBuffer[c][h][m].push(currentMetric[m]);
										}
									}
								}
							}
						}
					}
				}
			}
			if (CONTEXT.DEBUG > 20)
				console.log(JSON.stringify(outputBuffer));
			return outputBuffer;
		}

		let callback = function (res) {
			let str = "";

			res.on('data', function (chunk) {
				str += chunk;

			});

			res.on('end', function () {
				if (CONTEXT.DEBUG > 20) console.log("export complete", str);
				let data = JSON.parse(str);
				let collectedMetrics = {};
				if (data && data.response && data.response.docs) {
					let docList = data.response.docs;
					collectedMetrics.numFound = docList.length;

					collectedMetrics.docs = [];
					let outputBuffer = {};
					collectedMetrics.docs.push(outputBuffer);
					for (let i in docList) {
						let m = docList[i];

						analyzeIt(outputBuffer, m, handler, collection, metric);
					}
				}

				args.callback({ payload: JSON.stringify(collectedMetrics), headers: [{ name: "Content-Type", value: "application/json" }] });
			});
		}
		let tCallback = callback;

		let tUrl = solrPath.replace(/ /g, "%20");

		if (CONTEXT.DEBUG > 1) console.log('solr path', tUrl);

		let config = { host: solrHost, port: solrPort, path: tUrl, headers: { 'Content-Type': 'application/json' } };
		if (CONTEXT.AUTHKEY)
			config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
		let t = CONTEXT.lib.http.request(config, tCallback);
		t.on('error', function (e) {
			if (CONTEXT.DEBUG > 0) console.log("Got error: " + e.message);
			args.callback({ error: e.message });
		});
		t.end();

		return (result);
	},
	"ASSET": function (args) {
		let result = { status: 1, message: "HANDLED" };

		let action = "GET";

		if (args.queryObj.action)
			action = args.queryObj.action;

		let CONTEXT = args.CONTEXT;
		let solrHost = CONTEXT.SOLRHOST;
		let solrPort = CONTEXT.SOLRPORT;
		let solrCollection = CONTEXT.SOLRCOLLECTION;

		if (action === "GET") {
			let solrPath = "/solr/" + solrCollection + "/select?q=*:*&fq=contenttype:ASSET&wt=json&indent=on";

			if (args.queryObj._start)
				solrPath += '&start=' + args.queryObj._start;

			if (args.queryObj._rows)
				solrPath += '&rows=' + args.queryObj._rows;

			if (args.queryObj._sort) {
				solrPath += '&sort=' + args.queryObj._sort;
				if (args.queryObj._ascending) {
					solrPath += '+asc';
				}
				else {
					solrPath += '+desc';
				}
			}

			let callback = function (res) {
				let str = "";

				res.on('data', function (chunk) {
					str += chunk;

				});

				res.on('end', function () {
					if (CONTEXT.DEBUG > 1) console.log("sample complete", str);
					let data = {};

					try {
						if (CONTEXT.DEBUG > 0) console.log(str);
						data = JSON.parse(str);
					}
					catch (e) {
						if (CONTEXT.DEBUG > 0) console.log("TEST", e, str);
					}
					if (data.response && data.response.docs) {
						result.items = data.response.docs;
						result._totalItems = data.response.numFound;
					}
					args.callback(result);
				});
			}
			//let tCallback = callback.bind({field: fieldList[i]});
			let tCallback = callback;
			if (CONTEXT.DEBUG > 1) console.log('solr path', solrPath);

			let config = { host: solrHost, port: solrPort, path: solrPath, headers: { 'Content-Type': 'application/json' } };
			if (CONTEXT.AUTHKEY)
				config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
			let t = CONTEXT.lib.http.request(config, tCallback);
			t.on('error', function (e) {
				if (CONTEXT.DEBUG > 1) console.log("Got error: " + e.message);
				args.callback({ error: e.message });
			});
			t.end();
		}
		else if (action === 'POST') {
			let solrPath = "/solr/" + solrCollection + "/update";
			let callback = function (res) {
				let str = "";

				res.on('data', function (chunk) {
					str += chunk;

				});

				res.on('end', function () {
					if (CONTEXT.DEBUG > 1) console.log("update complete", str);
					let data = JSON.parse(str);

					args.callback(data);
				});
			}
			let tCallback = callback;
			if (CONTEXT.DEBUG > 1) console.log('solr path', solrPath);

			let config = { method: "POST", host: solrHost, port: solrPort, path: solrPath, headers: { 'Content-Type': 'application/json' } };
			if (CONTEXT.AUTHKEY)
				config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
			let t = CONTEXT.lib.http.request(config, tCallback);
			t.on('error', function (e) {
				if (CONTEXT.DEBUG > 1) console.log("Got error: " + e.message);
				args.callback({ error: e.message });
			});
			if (!args.queryObj.doc.id) {
				args.queryObj.doc.id = "ASSET" + new Date().getTime();
			}
			args.queryObj.doc.contenttype = "ASSET";
			let docs = { "add": { doc: args.queryObj.doc, "commitWithin": 500 } };
			t.write(JSON.stringify(docs));
			t.end();
		}
		else if (action === 'DELETE') {
			let solrPath = "/solr/" + solrCollection + "/update";
			let callback = function (res) {
				let str = "";

				res.on('data', function (chunk) {
					str += chunk;

				});

				res.on('end', function () {
					if (CONTEXT.DEBUG > 0) console.log("update complete", str);
					let data = JSON.parse(str);

					args.callback(data);
				});
			}
			let tCallback = callback;
			if (CONTEXT.DEBUG > 1) console.log('solr path', solrPath);

			let config = { method: "POST", host: solrHost, port: solrPort, path: solrPath, headers: { 'Content-Type': 'application/json' } };
			if (CONTEXT.AUTHKEY)
				config.headers["Authorization"] = "Basic " + CONTEXT.AUTHKEY;
			let t = CONTEXT.lib.http.request(config, tCallback);
			t.on('error', function (e) {
				if (CONTEXT.DEBUG > 1) console.log("Got error: " + e.message);
				args.callback({ error: e.message });
			});
			let docs = { "delete": { id: args.queryObj.doc.id }, "commit": {} };
			if (CONTEXT.DEBUG > 1) console.log("Delete", docs);
			t.write(JSON.stringify(docs));
			t.end();

		}

		return (result);
	}
};

module.exports = {
	getHandlers: function () {
		return (HANDLERS);
	}
}


