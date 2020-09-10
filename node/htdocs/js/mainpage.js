/**
 * Build a view for the application.
 * 
 * 
 * This view will provide a "lifecycle" frame that will provide the following state methods:
 * 
 * initChild ->  called once after the view has been created
 *                  1)  build a tab container and attach it to the dom
 *                  2)  add a tab for each option
 *                  3)  set up callback to load a blank view and then after loading 
 *                      replace the content to create a new dom element        
 *              
 * startChild ->  called once or more times during the live of the application
 *                  1)  do nothing at this time
 * stopchild -> called once or more times after the startChild method has been called
 *                  1)  do nothing at this time
 * destroyChild -> called once when the view is being removed from its parent
 *                  1)  delete all references to child 
 *                  2)  remove any connectors that where created
 * @param mainContext 
 * @param mainId 
 * @param currentChild 
 */
function buildMainPage(mainContext, mainId,currentChild) {

	getCurrentContext().setBusy(true,getCurrentContext().UIProfileManager.getString("applicationLoading"));
	
        var importList =[
			"dijit/layout/TabContainer",
			"dijit/layout/ContentPane",
			"dojox/layout/TableContainer"
         ];
         
         var emList = getCurrentContext().UIProfileManager.getSetting("externalImports");
         
         if( emList )
            importList = importList.concat(emList);
            
	require(importList, 
         function(){
        	 //console.log("building Main page");
        	 
        	 internalBuildMainPage(mainContext, mainId);
			 
                 anyWidgetById(mainId).initChild();
                 anyWidgetById(mainId).startChild();
                 currentChild.started = true;
                 getCurrentContext().setBusy(false,null);
                //console.log("end build Main page");
         }
);
}
/**
 * Build a tab container and add a list of child that will be loaded asynchronously
 * @param mainContext 
 * @param mainId 
 */
function internalBuildMainPage(mainContext, mainId) {

    var context = anyWidgetById(mainId);
    var mainName = mainId + "main";
    var connectorList = new Array();
    var registeredWidgetList = new Array();
    var padY = 0;
    var restURL = getCurrentContext().UIProfileManager.getSetting("mojoStoreUrl");

    getCurrentContext().mainName = mainName;

	var tabList = [
					{"id": mainName + "systemtab","label":"systemTabName","buildwith" : "buildSystemPage","loadfile": "js/system.js"},
					{"id": mainName + "testtab","label":"testTabName","buildwith" : "buildTestPage","loadfile": "js/test.js"},
					{"id": mainName + "runnertab","label":"runnerTabName","buildwith" : "buildRunnerPage","loadfile": "js/runner.js"},
					{"id": mainName + "resultstab","label":"resultsTabName","buildwith" : "buildResultsPage","loadfile": "js/results.js"},
					{"id": mainName + "analyzetab","label":"analyzeTabName","buildwith" : "buildAnalyzePage","loadfile": "js/analyze.js"}
				   ];

    if (context) {
        context.initChild = function () {
		  //console.log("init main page");
		  var iHtml = '<div id="' + mainName + '" style="border: 0px solid #fff;width:  ' + (getCurrentContext().screenWidth) + 'px;height: ' + (getCurrentContext().screenHeight+padY) + 'px;"></div>';
		  
			if( !context.useDojo ) 
			{
				dojo.byId(mainId).innerHTML = iHtml;
			}
			else
			{
				dijit.byId(mainId).attr("content",iHtml);
			}
                        
                    //build a tab container for the page that will start the child once they have been clicked on
                    buildCustomPage();
                    
                    var cContext = getCurrentContext();
                    var uiManager = cContext.UIProfileManager;
                
                    var mainContainer = anyWidgetById(mainName+"tab");
       
                    for(var i =0;i < tabList.length;i++){
                        var tmpTab = new dijit.layout.ContentPane({
                            id: tabList[i].id,
                            title: uiManager.getString(tabList[i].label),
                            style: uiManager.getSetting("pageBackgroundStyle"),
                            buildwith: tabList[i].buildwith,
                            loadfile: tabList[i].loadfile,
                            href: uiManager.getSetting("blankPage"),
                            onLoad:  function(){
                                
                                if( !this.contentReplaced ){
                                    this.contentReplaced = true;
                                    var cId = this.id;
                                    
                                    var itemName = cId + "content";
                                    
                                    var content = "<div id=\"" + itemName + "\"></div>";
                                    this.set("content",content);
                                    
                                    var buildwith = this.get("buildwith");
                                    
                                    var doLater = function(){
                                    	var doFinally = function(){
                                    		dojo.eval(buildwith + "('" + mainId + "','" + itemName + "')")
                                    	}
                                    	
                                    	setTimeout(doFinally,100);
                                    }
                                    
                                    require([this.loadfile],
                               		     function(){
                                   			doLater();
                               		     });
                                }
                            }
                        });
                        
                        tmpTab.set("buildWith",tabList[i].buildwith);
                        
                        mainContainer.addChild(tmpTab);
                        
                        registeredWidgetList.push({id: tmpTab.id});
                    }

        }
	function loadTestStoreData(callback){	
		  var doLater = function(data){
            loadTestStoreDataCallback(data);
            
            setBusy(false,false);
			
			if( callback ) callback();
        }
        var theURL = restURL + "?action=GET&contenttype=TEST&_rows=10000";//&_sort=query_txt&_ascending=true";

        doDeferredSend(theURL, doLater,getCurrentContext().UIProfileManager.getString("pleaseWait"));
    }
    
    let testList = false;
	
	function resolveObject(recId){
		let result = {};
		
		if( testList ){
			for(let i in testList){
				if( testList[i].id == recId ){
					result = testList[i];
					break;
				}
			}
		}
		
		return( result );
	}
    function loadTestStoreDataCallback(data){
	
		let test = getCurrentContext().getCurrentTest();
        var items = data.items;
        testList = {};
        
        //update grid with VMS names
        var gObj = dijit.byId(mainId + 'grid');
        if (gObj) gObj.update();
        
        dojo.forEach(items,function(item,i){
                                                item.id = item.id;
                                                item.name = (item.testname ? item.testname : "") ;
												testList[item.id] = dojo.clone(item);
                                        });
        
        var storeData =   {
            identifier: 'id',
            label: 'name',
            items: items
        };
        
        var datastore = new dojo.data.ItemFileReadStore({
            data: storeData
        });
        
        //console.log("setting store");
        dijit.byId(mainName + "test").set("store",datastore);
        dijit.byId(mainName + "test").startup();
		dijit.byId(mainName + "test").reset();
		
		if( test && test.test )
			dijit.byId(mainName + "test").set("value",test.test.id);
		else
        	dijit.byId(mainName + "test").set("value","");
    }

        context.resizeDisplay = function () {
            //console.log("resize main page: ");
            var cContext = getCurrentContext();	  
            var mainContainer = anyWidgetById(mainName);
            
            dojo.style(mainContainer.domNode,"width",(getCurrentContext().screenWidth) + "px");
            dojo.style(mainContainer.domNode,"height",(getCurrentContext().screenHeight+padY) + "px");
            mainContainer.resize();
        }

        context.startChild = function () {
		var cContext = getCurrentContext();
		var uiManager = getCurrentContext().UIProfileManager;
            
		var mainContainer = anyWidgetById(mainName);
                                                                                                
                
        }

        context.stopChild = function () {
		
        }

        context.destroyChild = function () {
            
                
                for(var i = 0;i < connectorList.length;i++)
		{
			deregisterEventHandler(connectorList[i]);
		}
		
		for(var i = 0;i < registeredWidgetList.length;i++)
		{
			deregisterDijitWidget(registeredWidgetList[i]);
		}
	   }

        //console.log("added lifecycle handlers to main page context");
    }
	
	function onTestSelectorChange(evt){
			console.log("test selector",resolveObject(evt));
			//if( getCurrentContext().handleTestGraphChange )
			//	getCurrentContext().handleTestGraphChange(resolveObject(evt));
	}
    
    
    function buildCustomPage() {
		//console.log("build page for main");
		var cContext = getCurrentContext();
		var uiManager = getCurrentContext().UIProfileManager;
            
		var mainContainer = new dojox.layout.TableContainer({id: mainName,
																	showLabels: false,
                                                                        style: "background: #ddd;width: " + (getCurrentContext().screenWidth-2) + "px;height:" + (getCurrentContext().screenHeight-24) + "px;"
                                                                   },mainName);
																   
		var testSelectorContainer = new dojox.layout.TableContainer({id: mainName + "testwrapper",
																	showLabels: true,
																	cols: 2,
                                                                        xxstyle: "background: #ddd;width: " + (getCurrentContext().screenWidth-2) + "px;height:" + (getCurrentContext().screenHeight-24) + "px;"
                                                                   });														   
																   
		var testSelector = new dijit.form.Select({
					id : mainName + "test",
					name : mainName + "test",
					label : uiManager.getString("testselector"),
					tabindex : 1,
					width : "20",
					xstyle : "width:auto;",
					onChange : onTestSelectorChange
				});
		testSelectorContainer.addChild(testSelector);
		
		mainContainer.addChild(testSelectorContainer);
		
		var tabContainer = new dijit.layout.TabContainer({id: mainName+"tab",

                                                                        tabPosition: "top",
                                                                        tabStrip: "true",
                                                                        title: uiManager.getString("tabManager"),
                                                                        style: "width: " + (getCurrentContext().screenWidth-2) + "px;height:" + (getCurrentContext().screenHeight-94) + "px;"
                                                                   });
		mainContainer.addChild(tabContainer);
		
		var tConnect = registerEventHandler(tabContainer, "selectChild",
						getCurrentContext().loadTestStoreData);
		
		registeredWidgetList.push(testSelector);
        registeredWidgetList.push(testSelectorContainer);		
		 registeredWidgetList.push(tabContainer);
         		
		registeredWidgetList.push(mainContainer);
                 
		
		mainContainer.startup();

		cContext.setMainPageTab = function(tabName){
				tabContainer.selectChild(tabName)
			
		}
		
		cContext.getCurrentTest = function(){
				let result = {};
				let test = testSelector;
				
				if( test ){
					let testName = test.attr('value');
					result["testname"] = testName;

					
				    result["test"] = resolveObject(testName);
				}
				
				return( result );
		}
		//console.log("build page for main complete");
		
		cContext.loadTestStoreData = loadTestStoreData;

		loadTestStoreData();
	}
	
	
}


