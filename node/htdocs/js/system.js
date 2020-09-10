/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildSystemPage(parentId,pageId) {

	getCurrentContext().setBusy(true,getCurrentContext().UIProfileManager.getString("systemPageLoading"));
	
        var importList =[
                        "dijit/layout/ContentPane",
                        "dojox/layout/TableContainer",
                        "dijit/form/TextBox",
                        "dijit/form/ValidationTextBox",
                        "dijit/form/Button",
         ];
            
	require(importList, 
         function(){
        	 internalBuildSystemPage(parentId,pageId);
        	 getCurrentContext().setBusy(false);
         }
);
}
    
function internalBuildSystemPage(parentId,pageId) {
	var mainId = pageId;
	var context = anyWidgetById(mainId);
    var mainForm = mainId + "form";
    var connectorList = new Array();
    var registeredWidgetList = new Array();
    console.log("analyze page context " + context + " in : " + mainId);
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


var padY = 10;
var tabList = [{"id": mainForm + "asset","label":"assetTabName","buildwith" : "buildAssetPage","loadfile": "js/asset.js"}
        ];            

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
