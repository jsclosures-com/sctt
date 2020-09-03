/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildPageMetricsPage(parentId,pageId) {

	getCurrentContext().setBusy(true,getCurrentContext().UIProfileManager.getString("samplePageLoading"));
	
        var importList =[
                        "dijit/layout/ContentPane",
                        "dojox/layout/TableContainer",
                        "dijit/form/TextBox",
						"dijit/form/SimpleTextarea",
                        "dijit/form/ValidationTextBox",
                        "dijit/form/Button",
                        "dijit/form/FilteringSelect",
						"dojox/grid/EnhancedGrid",
                        "dojox/grid/enhanced/plugins/IndirectSelection",
                        "dojox/grid/enhanced/plugins/Pagination"
         ];
            
	require(importList, 
         function(){
        	 //console.log("building Main page");
        	 
        	 internalBuildPageMetricsPage(parentId,pageId);

                 getCurrentContext().setBusy(false);
                //console.log("end build Main page");
         }
);
}

function internalBuildPageMetricsPage(parentId,pageId) {
    var mainId = pageId;

var uiManager = getCurrentContext().UIProfileManager;

var restURL = uiManager.getSetting("mojoStoreUrl");

var CONTENTTYPE = "PAGEMETRIC";

var context = {};
    context.mainId = mainId;
    context.customName = mainId + "customargs";
    context.template = '<div id="' + mainId + 'message"></div><div id="' + mainId + 'form"></div><div id="' + context.customName + '"></div><div id="' + mainId + 'controls"></div>' + '<div id="' + mainId + 'output"></div>';
    context.useDojo = false;
    
    context.gridName = mainId + "grid";
    context.formName = mainId + "form";
    context.controlsName = mainId + "controls";
    context.messageName = mainId + "message";
    context.showGrid = false;
    context.integrateGrid = false;
    context.saveLabel = uiManager.getString("pageMetricStart");
    context.deleteLabel = uiManager.getString("pageMetricPrevious");
    context.customLabel = uiManager.getString("pageMetricNext");
    context.formCustomClass = "crudForm";
    context.autoQuery = false;
    context.params = {};
    //context.customLabel = uiManager.getString("clearMessages");
    

    var FIELDS = [
	{
        label: uiManager.getString("testName"),
        id: mainId + 'testname',
        name: mainId + 'testname',
        dataname: 'testname',
        type: 'TEXTFIELD'
    },
    {
        label: uiManager.getString("collectionName"),
        id: mainId + 'collection',
        name: mainId + 'collection',
        dataname: 'collection',
        type: 'TEXTFIELD'
    },
    {
        label: uiManager.getString("handlerName"),
        id: mainId + 'handler',
        name: mainId + 'handler',
        dataname: 'handler',
        type: 'TEXTFIELD'
    },
    {
        label: uiManager.getString("metricName"),
        id: mainId + 'metric',
        name: mainId + 'metric',
        dataname: 'metric',
        type: 'TEXTFIELD'
    }
    ];
    

    context.fieldList = FIELDS;
    //auto selected record
    context.target = {};
	
	context.preLoadTarget = function(rec){
        console.log("load",rec);
        rec.collection = '^[a-zA-Z0-9._\/]+$';
            rec.handler = '^[a-zA-Z0-9._\/]+$';
            rec.metric = '^[a-zA-Z0-9._\/]+$';
	}
	function changeDataCallback(data) {
        //console.log("change data callback");
        var fObj = anyWidgetById(mainId);
       // console.log("main obj " + fObj);
        fObj.restartChild();
        
        //if( data && data.items && data.items.length > 0 )
        // fObj.loadTarget( {type: 'build'});
         
       if( data ) {
            if( data.status && data.status.message )
                fObj.setActionMessage(data.status.message);
            else 
                fObj.setActionMessage(data.message);
       }
       console.log(data);

       let target = fObj.readForm();
        let handler = target.handler;
        if( !handler ) handler = '^[a-zA-Z0-9._\/]+$';
        let collection = target.collection;
        if( !collection ) collection = '^[a-zA-Z0-9._\/]+$';
        let metric = target.metric;
        if( !metric ) metric = '^[a-zA-Z0-9._\/]+$';
        
        let output = analyzeIt(JSON.stringify(data),handler,collection,metric);

        
        
        setBusy(false);
    }

    function analyzeIt(input,handler,collection,metric){
        console.log(input);
        let outputBuffer = '';

        if( input && input.indexOf("{") > -1){
            let inputObj = JSON.parse(input);
            console.log(inputObj);

            outputBuffer += "<table border=1><tr><td>collection</td><td>handler</td><td>metric</td><td>value</td></tr>";

            if( inputObj.response && inputObj.response.docs && inputObj.response.docs.length > 0 ){
                if( !handler ) handler = '^[a-zA-Z0-9._\/]+$';
                let handlerRegEx = new RegExp(handler);
                if( !collection ) collection = '^[a-zA-Z0-9._\/]+$';
                let collectionRegEx = new RegExp(collection);
                if( !metric ) metric = '^[a-zA-Z0-9._\/]+$';
                let metricRegEx = new RegExp(metric);
                
                let data = atob(inputObj.response.docs[0]["metricsdata"]);
                console.log(data);
                data = JSON.parse(data).metrics;
                maxOffset = inputObj.response.numFound;
                
                for(let c in data){
                    console.log(c);
                    if( collectionRegEx.test(c) ){
                        console.log("do collection",c);
                        let currentHandler = data[c];
                        for(let h in currentHandler){
                            console.log(h);
                            if( handlerRegEx.test(h) ){
                                console.log("do handler",h);
                                let currentMetric = currentHandler[h];

                                if( currentMetric["count"] > 0 ){
                                    for(let m in currentMetric){
                                        console.log(m);
                                        if( metricRegEx.test(m) ){
                                            console.log("do metric",m);
                                            outputBuffer += "<tr><td>" + c + "</td><td>" + h + "</td><td>" + m + "</td><td>" + currentMetric[m] + "</td></tr>";
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        else {
            outputBuffer += "invalid input";
        }

        outputBuffer += "</table>";

        messageUpdateCallback(outputBuffer);

        return outputBuffer;
    }
    let currentOffset = 0;
    let maxOffset = 1000;
    context.saveAction = function(e,oldRec,newRec)
    {
        //console.log('save: ' + newRec.channelid_s);
        
        if( newRec.testname ){
            setBusy(true,uiManager.getString("pleaseWait"));
            
            var dataService = getDataService(restURL, changeDataCallback, "", "");
			var payload = {testName: newRec.testname}; 
            if( newRec.collection ) payload.collection = newRec.collection;
            if( newRec.handler ) payload.handler = newRec.handler;
            if( newRec.metric ) payload.metric = newRec.metric;
            payload.testname = newRec.testname;
            payload._start = 0;
            payload._rows = 1;
            currentOffset = 0;
            maxOffset = 1000;
            
            payload.contenttype = CONTENTTYPE;
            payload.action = "GET";
            console.log(payload);
            dataService["post"](payload, payload);
        }
        else {
            showAlertMessageDialog(uiManager.getString("pageMetricFailedToLoad"));
        }
    };

    context.deleteAction = function(e,oldRec,newRec)
    {
        //console.log('save: ' + newRec.channelid_s);
        
        if( newRec.testname && currentOffset > 0 ){
            setBusy(true,uiManager.getString("pleaseWait"));
            
            var dataService = getDataService(restURL, changeDataCallback, "", "");
			var payload = {testName: newRec.testname}; 
            if( newRec.collection ) payload.collection = newRec.collection;
            if( newRec.handler ) payload.handler = newRec.handler;
            if( newRec.metric ) payload.metric = newRec.metric;
            payload.testname = newRec.testname;
            
            payload._start = currentOffset-1;
            payload._rows = 1;
            currentOffset--;
            
            payload.contenttype = CONTENTTYPE;
            payload.action = "GET";
            console.log(payload);
            dataService["post"](payload, payload);
        }
        else {
            showAlertMessageDialog(uiManager.getString("pageMetricNothingPrevious"));
        }
    };

    context.customAction = function(e,oldRec,newRec)
    {
        if( newRec.testname && currentOffset < maxOffset ){
            setBusy(true,uiManager.getString("pleaseWait"));
            
            var dataService = getDataService(restURL, changeDataCallback, "", "");
			var payload = {testName: newRec.testname}; 
            if( newRec.collection ) payload.collection = newRec.collection;
            if( newRec.handler ) payload.handler = newRec.handler;
            if( newRec.metric ) payload.metric = newRec.metric;
            payload.testname = newRec.testname;
            
            payload._start = currentOffset+1;
            payload._rows = 1;
            currentOffset++;
            
            payload.contenttype = CONTENTTYPE;
            payload.action = "GET";
            console.log(payload);
            dataService["post"](payload, payload);
        }
        else {
            showAlertMessageDialog(uiManager.getString("pageMetricNothingNext"));
        }
    };
    
    var formHeight = dojo.isIE ? 450 : 480;
    
    
    context.loadTargetHandler = function(target){
        
       
    }
	
    buildForm(context);


    let messageField = new dijit.layout.ContentPane({
        id : mainId + "output",
        name : mainId + "output",
    }, mainId + "output");


    function messageUpdateCallback(message){
        let tObj = dijit.byId(mainId + "output");
        tObj.set("content",message);
    }

    //startMessageService({username: getCurrentContext().SessionManager.getAttribute("userId"),callback: messageUpdateCallback});
    
    var fObj = anyWidgetById(mainId);
        //console.log("main obj " + fObj);
        fObj.loadTarget( {"type": "build"} );
        
    var lifecycle = {};
    
    lifecycle.resizeDisplay = function(){

    }
    
    anyWidgetById(parentId).lifecycle = lifecycle;
	


}
