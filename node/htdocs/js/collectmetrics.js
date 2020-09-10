/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildCollectMetricsPage(parentId,pageId) {

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
                        "dojox/grid/enhanced/plugins/Pagination",
                        "dojox/charting/Chart",
                        "dojox/charting/themes/Claro",
                        "dojox/charting/plot2d/Lines",
                        "dojox/charting/plot2d/Markers",
                        "dojox/charting/action2d/Tooltip",
			"dojox/charting/widget/SelectableLegend",
                        "dojox/charting/axis2d/Default"
         ];
            
	require(importList, 
         function(){
        	 //console.log("building Main page");
        	 
        	 internalBuildCollectMetricsPage(parentId,pageId);

                 getCurrentContext().setBusy(false);
                //console.log("end build Main page");
         }
);
}

function internalBuildCollectMetricsPage(parentId,pageId) {
    var mainId = pageId;

var uiManager = getCurrentContext().UIProfileManager;

var restURL = uiManager.getSetting("mojoStoreUrl");

var CONTENTTYPE = "COLLECTMETRIC";

var context = {};
    context.mainId = mainId;
    context.customName = mainId + "customargs";
    context.template = '<div id="' + mainId + 'message"></div><div id="' + mainId + 'form"></div><div id="' + mainId + 'controls"></div>' + '<div id="' + mainId + 'graph" style="width: 100%;height: 400px;"></div>' + '<div id="' + mainId + 'legend" style="position: relative;width: 100%;"></div>';
    context.useDojo = false;
    
    context.gridName = mainId + "grid";
    context.formName = mainId + "form";
    context.controlsName = mainId + "controls";
    context.messageName = mainId + "message";
    context.showGrid = false;
    context.integrateGrid = false;
    context.saveLabel = uiManager.getString("collectMetrics");
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
    let builtGraph = false;

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

       if( !builtGraph ){
           builtGraph = true;
           buildGraph(mainId,mainId + "graph",mainId,0,1000,0,1000);
       }

       let target = fObj.readForm();
        let handler = target.handler;
        if( !handler ) handler = '^[a-zA-Z0-9._\/]+$';
        let collection = target.collection;
        if( !collection ) collection = '^[a-zA-Z0-9._\/]+$';
        let metric = target.metric;
        if( !metric ) metric = '^[a-zA-Z0-9._\/]+$';
        
        analyzeIt(data,handler,collection,metric);

        
        
        setBusy(false);
    }

    function analyzeIt(input,handler,collection,metric){
        console.log(input);
        if( !handler ) handler = '^[a-zA-Z0-9._\/]+$';
        let handlerRegEx = new RegExp(handler);
        if( !collection ) collection = '^[a-zA-Z0-9._\/]+$';
        let collectionRegEx = new RegExp(collection);
        if( !metric ) metric = '^[a-zA-Z0-9._\/]+$';
        let metricRegEx = new RegExp(metric);
        
        let data = input.docs[0];
        console.log("mdata",data);
        let outputBuffer = {};
        let seriesData = {};
        let min = 0;let max = input.numFound;
        let miny = 0;let maxy = 0;
        for(let c in data){
            //console.log(c);
            if( collectionRegEx.test(c) ){
                //console.log("do collection",c);
                let currentHandler = data[c];
                for(let h in currentHandler){
                    //console.log(h);
                    if( handlerRegEx.test(h) ){
                        //console.log("do handler",h);
                        let currentMetric = currentHandler[h];

                        if( currentMetric["count"] ){
                            for(let m in currentMetric){
                                //console.log(m);
                                if( metricRegEx.test(m) ){
                                    //console.log("do metric",m);
                                    if( !outputBuffer.hasOwnProperty(c) )
                                        outputBuffer[c] = {};
                                    if( !outputBuffer[c].hasOwnProperty(h) )
                                        outputBuffer[c][h] = {};
                                    if( !outputBuffer[c][h].hasOwnProperty(m) )
                                        outputBuffer[c][h][m] = [];
                                    outputBuffer[c][h][m].push(currentMetric[m]);
                                    let key = c + " " + h + " " + m;
                                    
                                    if( !seriesData.hasOwnProperty(key) )
                                        seriesData[key] = [];

                                    seriesData[key].push( currentMetric[m]);

                                    if( miny > currentMetric[m] ) miny = currentMetric[m];
                                    if( maxy < currentMetric[m] ) maxy = currentMetric[m];
                                }
                            }
                        }
                    }
                }
            }
        }

        console.log("out",outputBuffer);


        if( chartList.length > 0 ){
            let chart = chartList[0].chart;

            
            if( chart.getSeries("DEFAULT") )
                chart.removeSeries("DEFAULT");
            let counter = 0;
            for(let s in seriesData){
                let sData = seriesData[s][0];
                let seriesDataList = [];
                for(let j = 0;j < sData.length;j++){
                    //seriesDataList.push({x: j,y: j*10*counter});
                    seriesDataList.push({x: j,y: sData[j]});
                }
                chart.addSeries(s,seriesDataList);
                if( counter++ > 10 ) break;
            }
            chart.removeAxis("x");
            chart.removeAxis("y");

            chart.addAxis("x", { min: min, max: max});
             chart.addAxis("y", { min: miny, max: maxy, vertical: true, fixLower: "major", fixUpper: "major" });

            chart.render();
            chartList[0].legend.refresh();
        }
    }
    var chartList  = [];
    function buildGraph(mainId,item,parentId,min,max,miny,maxy){	
        var chartData = [];
    
        // Create the chart within it&#x27;s "holding" node
        var chart = new dojox.charting.Chart(item);
        // Set the theme
        //chart.setTheme("Claro");
    
        // Add the only/default plot
        chart.addPlot("default", {
            type: "Lines",
            markers: true
        });
    
        var tip = new dojox.charting.action2d.Tooltip(chart,"default");
        // Add axes
        chart.addAxis("x", { min: min, max: max});
        chart.addAxis("y", { min: miny, max: maxy, vertical: true, fixLower: "major", fixUpper: "major" });
    
        // Add the series of data
        chart.addSeries("DEFAULT",chartData);
        var legend = new dojox.charting.widget.SelectableLegend({chart: chart,horizontal: false},parentId+"legend");
        chartList.push({id: item,chart: chart,legend: legend,parentid: parentId});
    
        // Render the chart!
        chart.render();
    }

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
            payload._rows = 1000;
            
            payload.contenttype = CONTENTTYPE;
            payload.action = "GET";
            console.log(payload);
            dataService["post"](payload, payload);
        }
        else {
            showAlertMessageDialog(uiManager.getString("pageMetricFailedToLoad"));
        }
    };

   
    
    var formHeight = dojo.isIE ? 150 : 180;
    
    
    context.loadTargetHandler = function(target){
        
       
    }
	
    buildForm(context);

    
    function resetGraphData(){
        console.log("set test",this.graphId);
        //getCurrentContext().handleTestGraphChange({id: this.graphId});
    }
    /*let messageField = new dijit.layout.ContentPane({
        id : mainId + "output",
        name : mainId + "output",
    }, mainId + "output");


    function messageUpdateCallback(message){
        let tObj = dijit.byId(mainId + "output");
        tObj.set("content",message);
    }*/

    //startMessageService({username: getCurrentContext().SessionManager.getAttribute("userId"),callback: messageUpdateCallback});
    
    var fObj = anyWidgetById(mainId);
        //console.log("main obj " + fObj);
        fObj.loadTarget( {"type": "build"} );
        
    var lifecycle = {};
    
    lifecycle.resizeDisplay = function(){

    }
    
    anyWidgetById(parentId).lifecycle = lifecycle;
	


}
