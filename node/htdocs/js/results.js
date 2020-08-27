/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildResultsPage(parentId,pageId) {

	getCurrentContext().setBusy(true,getCurrentContext().UIProfileManager.getString("resultsPageLoading"));
	
        var importList =[
                        "dijit/layout/ContentPane",
                        "dojox/layout/TableContainer",
                        "dijit/form/TextBox",
                        "dijit/form/ValidationTextBox",
                        "dijit/form/Button",
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
        	 internalBuildResultsPage(parentId,pageId);
        	 getCurrentContext().setBusy(false);
         }
);
}

function resetGraphData(){
    console.log("set test",this.graphId);
    getCurrentContext().handleTestGraphChange({id: this.graphId});
}
var padY = 10;
var chartList = [];
function buildUpdateMemoryTab(mainId,item,parentId,min,max,miny,maxy){	
    var wrapper = new dojox.layout.TableContainer({id: item + "cwrapper",
    showLabels: false,
    cols : 1,
    xstyle: "width: " + (getCurrentContext().screenWidth-70) + "px;height:" + (getCurrentContext().screenHeight-280) + "px;"
   },dojo.byId(item + "cwrapper"));

   var toolbar = new dijit.Toolbar({
    id : item + "control",
    style : "height: 30px;"});
    wrapper.addChild(toolbar);
    var resetButton = new dijit.form.Button({
        label : getCurrentContext().UIProfileManager.getString("resetResultsButton"),
        showLabel : true,
        iconClass : "dijitEditorIcon dijitEditorIcon" + 'reset',
        id : item + 'reset',
        graphId: parentId,
        onClick: resetGraphData
    });
    toolbar.addChild(resetButton);

    var rowCount = new dijit.form.TextBox({
        title : getCurrentContext().UIProfileManager.getString("graphRowCount"),
        id : item + 'rowcount',
        constraints: {min:1,max:1000000,places:0,pattern: "######"},
        value: 1000
    });
    toolbar.addChild(rowCount);


    var content = new dijit.layout.ContentPane({
        id : item,
        content: "<div id=\"" + item + "\" xsxtyle=\"border: 1px solid red;xwidth:" + (getCurrentContext().screenWidth-200) + "px;xheight: " + (getCurrentContext().screenHeight-380) + "px;\"></div>"
    });
    wrapper.addChild(content);
    wrapper.startup();
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
    chart.addSeries("default",chartData);


    var legend = new dojox.charting.widget.SelectableLegend({chart: chart,horizontal: false},item+"legend");
    chartList.push({id: item,chart: chart,legend: legend,parentid: parentId});

    // Render the chart!
    chart.render();
}

function buildUQueryMemoryTab(mainId,item,parentId,min,max,miny,maxy){	
    var wrapper = new dojox.layout.TableContainer({id: item + "cwrapper",
    showLabels: false,
    cols : 1,
    xstyle: "width: " + (getCurrentContext().screenWidth-70) + "px;height:" + (getCurrentContext().screenHeight-280) + "px;"
   },dojo.byId(item + "cwrapper"));

   var toolbar = new dijit.Toolbar({
    id : item + "control",
    style : "height: 30px;"});
    wrapper.addChild(toolbar);
    var resetButton = new dijit.form.Button({
        label : getCurrentContext().UIProfileManager.getString("resetResultsButton"),
        showLabel : true,
        iconClass : "dijitEditorIcon dijitEditorIcon" + 'reset',
        id : item + 'reset',
        graphId: parentId,
        onClick: resetGraphData
    });
    toolbar.addChild(resetButton);

    var rowCount = new dijit.form.TextBox({
        title : getCurrentContext().UIProfileManager.getString("graphRowCount"),
        id : item + 'rowcount',
        constraints: {min:1,max:1000000,places:0,pattern: "######"},
        value: 1000
    });
    toolbar.addChild(rowCount);


    var content = new dijit.layout.ContentPane({
        id : item,
        content: "<div id=\"" + item + "\" xstyle=\"border: 1px solid red;xwidth:" + (getCurrentContext().screenWidth-170) + "px;height: " + (getCurrentContext().screenHeight-380) + "px;\"></div>"
    });
    wrapper.addChild(content);
    wrapper.startup();

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
    chart.addSeries("default",chartData);
    var legend = new dojox.charting.widget.SelectableLegend({chart: chart,horizontal: false},item+"legend");
    chartList.push({id: item,chart: chart,legend: legend,parentid: parentId});

    // Render the chart!
    chart.render();
}

function buildUpdateJMXTab(mainId,item,parentId,min,max,miny,maxy){	
    var wrapper = new dojox.layout.TableContainer({id: item + "cwrapper",
    showLabels: false,
    cols : 1,
    xstyle: "width: " + (getCurrentContext().screenWidth-70) + "px;height:" + (getCurrentContext().screenHeight-280) + "px;"
   },dojo.byId(item + "cwrapper"));

   var toolbar = new dijit.Toolbar({
    id : item + "control",
    style : "height: 30px;"});
    wrapper.addChild(toolbar);
    var resetButton = new dijit.form.Button({
        label : getCurrentContext().UIProfileManager.getString("resetResultsButton"),
        showLabel : true,
        iconClass : "dijitEditorIcon dijitEditorIcon" + 'reset',
        id : item + 'reset',
        graphId: parentId,
        onClick: resetGraphData
    });
    toolbar.addChild(resetButton);

    var rowCount = new dijit.form.TextBox({
        title : getCurrentContext().UIProfileManager.getString("graphRowCount"),
        id : item + 'rowcount',
        constraints: {min:1,max:1000000,places:0,pattern: "######"},
        value: 1000
    });
    toolbar.addChild(rowCount);


    var content = new dijit.layout.ContentPane({
        id : item,
        content: "<div id=\"" + item + "\" xstyle=\"border: 1px solid red;xwidth:" + (getCurrentContext().screenWidth-170) + "px;height: " + (getCurrentContext().screenHeight-380) + "px;\"></div>"
    });
    wrapper.addChild(content);
    wrapper.startup();
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
    chart.addSeries("default",chartData);
    var legend = new dojox.charting.widget.SelectableLegend({chart: chart,horizontal: false},item+"legend");
    chartList.push({id: item,chart: chart,legend: legend,parentid: parentId});

    // Render the chart!
    chart.render();
}

function buildUQueryJMXTab(mainId,item,parentId,min,max,miny,maxy){	
    var wrapper = new dojox.layout.TableContainer({id: item + "cwrapper",
    showLabels: false,
    cols : 1,
    xstyle: "width: " + (getCurrentContext().screenWidth-70) + "px;height:" + (getCurrentContext().screenHeight-280) + "px;"
   },dojo.byId(item + "cwrapper"));

   var toolbar = new dijit.Toolbar({
    id : item + "control",
    style : "height: 30px;"});
    wrapper.addChild(toolbar);
    var resetButton = new dijit.form.Button({
        label : getCurrentContext().UIProfileManager.getString("resetResultsButton"),
        showLabel : true,
        iconClass : "dijitEditorIcon dijitEditorIcon" + 'reset',
        id : item + 'reset',
        graphId: parentId,
        onClick: resetGraphData
    });
    toolbar.addChild(resetButton);

    var rowCount = new dijit.form.TextBox({
        title : getCurrentContext().UIProfileManager.getString("graphRowCount"),
        id : item + 'rowcount',
        constraints: {min:1,max:1000000,places:0,pattern: "######"},
        value: 1000
    });
    toolbar.addChild(rowCount);


    var content = new dijit.layout.ContentPane({
        id : item,
        content: "<div id=\"" + item + "\" xstyle=\"border: 1px solid red;xwidth:" + (getCurrentContext().screenWidth-170) + "px;height: " + (getCurrentContext().screenHeight-380) + "px;\"></div>"
    });
    wrapper.addChild(content);
    wrapper.startup();
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
    chart.addSeries("default",chartData);
    var legend = new dojox.charting.widget.SelectableLegend({chart: chart,horizontal: false},item+"legend");
    chartList.push({id: item,chart: chart,legend: legend,parentid: parentId});

    // Render the chart!
    chart.render();
}
    
function internalBuildResultsPage(parentId,pageId) {
	var mainId = pageId;
	var context = anyWidgetById(mainId);
    var mainForm = mainId + "form";
    var connectorList = new Array();
    var registeredWidgetList = new Array();
    console.log("results page context " + context + " in : " + mainId);
    var cContext = getCurrentContext();
    var uiManager = cContext.UIProfileManager;


function resolveObject(recId){
    let result = {};
    
    if( tabList ){
        for(let i in tabList){
            if( tabList[i].id == recId ){
                result = tabList[i];
                break;
            }
        }
    }
    
    return( result );
}



var tabList = [{"id": mainForm + "sample","label":"sampleTabName","buildwith" : "buildSamplePage","loadfile": "js/sample.js"},
            {"id": mainForm + "resultssummary","label":"resultsSummaryTabName","buildwith" : "buildResultsSummaryPage","loadfile": "js/resultssummary.js"},
            {"id": mainForm + "compare","label":"compareTabName","buildwith" : "buildComparePage","loadfile": "js/compare.js"},
            {"id": mainForm + "summary","label":"summaryTabName","buildwith" : "buildSummaryPage","loadfile": "js/summary.js"},
            {"id": mainForm + "feedback","label":"feedbackTabName","buildwith" : "buildFeedbackPage","loadfile": "js/feedback.js"},
        ];            
    console.log("sample tab name ", tabList[0].id);
    console.log("compare tab name ", tabList[1].id);
    //console.log("main page context " + context + " in : " + mainId);

    if (context) {
        context.initChild = function () {
		  //console.log("init main page");
		  var iHtml = '<div id="' + mainForm + '" xstyle="border: 0px solid #fff;width:  ' + (getCurrentContext().screenWidth) + 'px;height: ' + (getCurrentContext().screenHeight+padY) + 'px;"></div>';
		  
			if( !context.useDojo ) 
			{
				dojo.byId(mainId).innerHTML = iHtml;
			}
			else
			{
				dijit.byId(mainId).attr("content",iHtml);
			}
                    
               
                    
            var mainContainer = buildMainPage({id: mainForm});         
            mainContainer.startup();
            
            for(var i =0;i < tabList.length;i++){
                var tmpTab = new dijit.layout.ContentPane({
                    id: tabList[i].id,
                    title: uiManager.getString(tabList[i].label),
                    xxstyle: uiManager.getSetting("pageBackgroundStyle") + ";" + ("width:" + (getCurrentContext().screenWidth-50)  + "px;height: " + (getCurrentContext().screenHeight-180)  + "px;"),
                    buildwith: tabList[i].buildwith,
                    loadfile: tabList[i].loadfile,
                    href: uiManager.getSetting("blankPage"),
                    onLoad:  function(){
                        
                        if( !this.contentReplaced ){
                            this.contentReplaced = true;
                            var cId = this.id;
                            let tabInfo = resolveObject(cId);
                            var itemName = cId + "content";
                            
                            var content = "<div id=\"" + itemName + ( this.loadfile ? "" : "cwrapper") + "\" xstyle=\"width:100%;height: 80%\"></div>";
                            content += "<div id=\"" + itemName + "legend\" xstyle=\"width:100%;height: 20%\"></div>";
                            this.set("content",content);
                            
                            var buildwith = this.get("buildwith");

                            if( this.loadfile ){
                                var doLater = function(){
                                   
                                   var doFinally = function(){
                                        dojo.eval(this.buildwith + "('" + this.mainForm + "','" + this.itemName + "','" + this.cId + "'," + this.min + "," + this.max + "," + this.miny + "," + this.maxy + ")");
                                    }.bind({buildwith: this.buildwith,mainForm: this.mainForm,itemName: this.itemName,cId: this.cId, min: this.min,max: this.max, miny: this.miny,maxy: this.maxy});
                                    
                                    setTimeout(doFinally,100);
                                }.bind({buildwith: buildwith,mainForm: mainForm,itemName: itemName,cId: cId, min: tabInfo.minx,max: tabInfo.maxx, miny: tabInfo.miny,maxy: tabInfo.maxy});
                                
                                require([this.loadfile],
                                        function(){
                                           doLater();
                                        });
                            }
                            else {
                                dojo.eval(buildwith + "('" + mainForm + "','" + itemName + "','" + cId + "'," + tabInfo.minx + "," + tabInfo.maxx + "," + tabInfo.miny + "," + tabInfo.maxy + ")");
                            }
                        }
                    }
                });
                
                tmpTab.set("buildWith",tabList[i].buildwith);
                
                mainContainer.addChild(tmpTab);
                
                registeredWidgetList.push({id: tmpTab.id});
            }

            mainContainer.resize();
            
            mainContainer.selectChild(tabList[0].id);
            
        }

        context.resizeDisplay = function () {
           // console.log("resize Main page: ");
		  
         var cContext = getCurrentContext();
		  
		  var tObj = dojo.byId(mainForm);
        }
        var started = false;
        
        context.startChild = function () {
		console.log("start Main page");
		
        }

        context.stopChild = function () {
		//console.log("stop Main page");
		
        }

        context.destroyChild = function () {
		//console.log("destroy Main page");
                for(var i = 0;i < connectorList.length;i++)
                {
                    deregisterEventHandler(connectorList[i]);
                }
                
                for(var i = 0;i < registeredWidgetList.length;i++)
                {
                    deregisterDijitWidget(registeredWidgetList[i]);
                }
	   }

        console.log("added lifecycle handlers to content page context");
    }


    function buildMainPage(context){
            var mainId = context.id;
            var profileManager = getCurrentContext().UIProfileManager;

            var destroyChild = function () {
                    //console.log("destroy login page");
            
                    for(var i = 0;i < connectorList.length;i++)
                    {
                        deregisterEventHandler(connectorList[i]);
                    }
                    
                    for(var i = 0;i < registeredWidgetList.length;i++)
                    {
                        deregisterDijitWidget(registeredWidgetList[i]);
                    }
                };

            var tabContainer = new dijit.layout.TabContainer({id: mainId,
               tabPosition: "top",
               tabStrip: "true",
               title: uiManager.getString("tabManager"),
               style: "width: " + (getCurrentContext().screenWidth-30) + "px;height:" + (getCurrentContext().screenHeight-164) + "px;"
          },dojo.byId(mainId));
          registeredWidgetList.push(tabContainer.id);

          getCurrentContext().setResultsPageTab = function(tabName){
            tabContainer.selectChild(tabName)
        
    }
         
            return( tabContainer );
    }

    

	
	context.initChild();
}
