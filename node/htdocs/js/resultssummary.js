/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildResultsSummaryPage(parentId,pageId) {

	getCurrentContext().setBusy(true,getCurrentContext().UIProfileManager.getString("comparePageLoading"));
	
        var importList =[
                        "dijit/layout/ContentPane",
                        "dojox/layout/TableContainer",
                        "dijit/form/TextBox",
                        "dijit/form/Button",
                        "dijit/Toolbar"
         ];
            
	require(importList, 
         function(){
        	 internalBuildResultsSummaryPage(parentId,pageId);
        	 getCurrentContext().setBusy(false);
         }
);
}

function internalBuildResultsSummaryPage(parentId,pageId) {
	var mainId = pageId;
	var context = anyWidgetById(mainId);
    var mainForm = mainId + "form";
    var connectorList = new Array();
    var registeredWidgetList = new Array();
    console.log("compare page context " + context + " in : " + mainId);
    
    if (context) {
        
        context.initChild = function () {
		  //console.log("init Main page");
		  var iHtml = '<div id="' + mainForm + '"></div>';
		  
                if( !context.useDojo ) 
                {
                        dojo.byId(mainId).innerHTML = iHtml;
                }
                else
                {
                        dijit.byId(mainId).attr("content",iHtml);
                }
                
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
            }

			var outerContainer = new dojox.layout.TableContainer({id: mainId,cols : '1',labelWidth : 150,showLabels: false,customClass: 'formLabel'},dojo.byId(mainId));
            registeredWidgetList.push(outerContainer.id);

            let resetDetailData = function(data){
                let test = getCurrentContext().getCurrentTest().test;
        
                let handleInput = false;

                let cb = function(response){
                    console.log("response");
                    let tObj = anyWidgetById(mainId + 'content');

                    if( tObj ){
                        let newContent = '';

                        if( response.items ){
                            var profileManager = getCurrentContext().UIProfileManager;
            
                            for(let i in response.items){
                                if( i > 0 )
                                    newContent += "<br/>";
                                newContent += response.items[i].id + ": " + profileManager.getString(response.items[i].value);
                            }
                        }

                        tObj.attr('content',newContent);

                    }

                    setBusy();
                }
                
                let restURL = getCurrentContext().UIProfileManager.getSetting("mojoStoreUrl");
                let testInfo = test;
                console.log("test",testInfo);	
                let testName = testInfo.testname;
        
                let theURL =  restURL + "?contenttype=DETAILSRUNNER&testname=" + testName;
                
                doDeferredSend(theURL, cb.bind({test: testInfo}), getCurrentContext().UIProfileManager.getString("LOADINGDETAILDATA"));
            }
            
            var toolbar = new dijit.Toolbar({
                id : mainId + "control",
                style : "height: 30px;"});
                outerContainer.addChild(toolbar);

                var resetButton = new dijit.form.Button({
                    label : getCurrentContext().UIProfileManager.getString("resetDetailsButton"),
                    showLabel : true,
                    iconClass : "dijitEditorIcon dijitEditorIcon" + 'reset',
                    id : mainId + 'reset',
                    onClick: resetDetailData
                });
                toolbar.addChild(resetButton);
			
			var content = new dijit.layout.ContentPane({
				id : mainId + 'content',
			});
		
			outerContainer.addChild(content);
			
			content.attr("content","<div id='" + mainId + "container'></div>");

			outerContainer.startup();

			let restURL = profileManager.getSetting("mojoStoreUrl");
			
			
			
			
			let title = profileManager.getString("details");
			let container = anyWidgetById(mainId + "container");
			

            return( outerContainer );
    }
	
	context.initChild();
	
	if( !started ){
		buildMainPage({id: mainForm});
		started = true;
		
	}
}
