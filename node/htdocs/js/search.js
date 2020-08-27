/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildSearchPage(parentId,pageId) {

	getCurrentContext().setBusy(true,getCurrentContext().UIProfileManager.getString("searchPageLoading"));
	
        var importList =[
                        "dijit/layout/ContentPane",
                        "dojox/layout/TableContainer",
                        "dijit/form/TextBox",
                        "dijit/form/ValidationTextBox",
                        "dijit/form/Button",
                        "dojox/grid/EnhancedGrid",
                        "dojox/grid/enhanced/plugins/IndirectSelection",
                        "dojox/grid/enhanced/plugins/Pagination"
         ];
            
	require(importList, 
         function(){
        	 internalBuildSearchPage(parentId,pageId);
        	 getCurrentContext().setBusy(false);
         }
);
}

function internalBuildSearchPage(parentId,pageId) {
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
            
			var handleClick = function(){
				var rec = this.doc;
				
				console.log("rec",rec);
				
				var uiManager = getCurrentContext().UIProfileManager;
				var recTarget = {doc: rec,input: this.input};
			    showDocumentDialog(uiManager.getString("document"),uiManager.getString("document"),function(){ console.log("callback")},recTarget)
			}

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
			
			/*var textInput = new dijit.form.TextBox({
				label : 'Compare',
				showLabel : true,
				iconClass : "dijitEditorIcon dijitEditorIcon" + 'save',
				id : mainId + 'input'
			});
			outerContainer.addChild(textInput);

			
			var submitButton = new dijit.form.Button({
				label : 'Submit',
				showLabel : true,
				iconClass : "dijitEditorIcon dijitEditorIcon" + 'save',
				id : mainId + 'submit'
			});
			outerContainer.addChild(submitButton);*/
			
			var content = new dijit.layout.ContentPane({
				id : mainId + 'content',
			});
		
			outerContainer.addChild(content);
			
			content.attr("content","<div id='" + mainId + "container'></div>");

			outerContainer.startup();
			
			let sourceA = "Atlas";
			let sourceB = "AtlasBase";
			let channel = "20052";

			let restURL = profileManager.getSetting("mojoStoreUrl");
			
			let handleInput = function(){
				var profileManager = getCurrentContext().UIProfileManager;
            
				let searchBox = this.searchBox;
				let messageBox = this.messageBox;
				let resultPanelA = this.resultPanelA;
				let resultPanelB = this.resultPanelB;
				let sourcea = this.sourcea;
				let sourceb = this.sourceb;
				let channel = this.channel;
				let allData = {};
				
				function findMatch(rec,key1,key2,otherList){
					var result = -1;
					for(var i = 0;i < otherList.length;i++){
						if( (rec[key1] && rec[key1] === otherList[i][key1]) || (rec[key2] && rec[key2] === otherList[i][key2]) ){
							result = i;
							break;
						}
					}
				
					return( result );
				}
				
				let callback = function(args,resp){
					console.log(resp);
					let resultPanel = this.resultPanel;
					let input = this.input;
					let source = this.source;
					let channel = this.channel;
					
					WIDGETFACTORY.clearChildren({widget: resultPanel});
					
					let docs = resp.items;
					
					if( docs ){
						allData[source] = {docs: docs,resultPanel: resultPanel,source: source,channel: channel};
					}
					else {
						allData[source] = {docs: [],resultPanel: resultPanel,source: source,channel: channel};
					}
					
					
					let done = 0;

					for(var p in allData){
						if( allData.hasOwnProperty(p) )
							done++;
					}
					
					if( done == 2 ){
						let sList = [sourceA,sourceB];
						let aList = allData[sourceA].docs;
						let bList = allData[sourceB].docs;
						
						let leftColor = "green";
						let rightColor = "green";
						let aDocWidget;
						let bDocWidget;
						
						for(let i in aList){
						
							if( i == 0 ){
								
								let cBounds = allData[sourceA].resultPanel.getBoundingClientRect();
								
								aDocWidget = WIDGETFACTORY.buildWidget({which:"div",style: {"max-width": cBounds.width + "px","width": cBounds.width + "px"},innerHTML: aList.length + (aList.length > 1 ? " docs found in " + allData[sourceA].source : " doc found in " + allData[sourceA].source) + " " + allData[sourceA].channel});
								
								WIDGETFACTORY.addWidgetToContainer({parent: allData[sourceA].resultPanel,child: aDocWidget});
								
								bDocWidget = WIDGETFACTORY.buildWidget({which:"div",style: {"max-width": cBounds.width + "px","width": cBounds.width + "px"},innerHTML: bList.length + (bList.length > 1 ? " docs found in " + allData[sourceB].source : " doc found in " + allData[sourceB].source) + " " + allData[sourceA].channel});
								
								WIDGETFACTORY.addWidgetToContainer({parent: allData[sourceB].resultPanel,child: bDocWidget});
							}
							
							var matchIndex = findMatch(aList[i],"id","eyDocId",bList);
							
							if( matchIndex > -1 ){
								if(  matchIndex != i ){
									if( matchIndex < i ){
										leftColor = "red";
										rightColor = "red";
									}
									else {
										leftColor = "green";
										rightColor = "green";
									}
								}
								else {
									leftColor = "green";
									rightColor = "green";
								}
							}
							else {
								leftColor = "yellow";
								rightColor = "yellow";
							}
								
							
							let entryWidgetA = WIDGETFACTORY.buildWidget({which:"ul",innerHTML: "Document " + i,style: {"background-color": leftColor}});
							WIDGETFACTORY.addHandler({widget: entryWidgetA,handler: [{name: "click",callback: handleClick.bind({doc: aList[i],input: input})}]});
								
							for(let a in aList[i]){
								if( !a.startsWith("_") && ["id","eyDocId","score","eyChannelProdId"].indexOf(a) > -1 ){
									let attributeWidget = WIDGETFACTORY.buildWidget({which:"li",style: {"white-space": "pre-wrap","overflow-wrap": "break-word","word-wrap": "break-word"},innerHTML: a + ": " + aList[i][a]});
									WIDGETFACTORY.addWidgetToContainer({parent: entryWidgetA,child: attributeWidget});
									
								}
							}
							WIDGETFACTORY.addWidgetToContainer({parent: aDocWidget,child: entryWidgetA});
							
							if( i < bList.length ){
								let entryWidgetB = WIDGETFACTORY.buildWidget({which:"ul",innerHTML: "Document " + i,style: {"background-color": rightColor}});
								WIDGETFACTORY.addHandler({widget: entryWidgetB,handler: [{name: "click",callback: handleClick.bind({doc: bList[i],input: input})}]});
										
								for(let a in bList[i]){
									if( !a.startsWith("_") && ["id","eyDocId","score","eyChannelProdId"].indexOf(a) > -1 ){
										let attributeWidget = WIDGETFACTORY.buildWidget({which:"li",style: {"white-space": "pre-wrap","overflow-wrap": "break-word","word-wrap": "break-word"},innerHTML: a + ": " + bList[i][a]});
										WIDGETFACTORY.addWidgetToContainer({parent: entryWidgetB,child: attributeWidget});
									}
								}
								WIDGETFACTORY.addWidgetToContainer({parent: bDocWidget,child: entryWidgetB});
							}
						}
					}
					
					getCurrentContext().setBusy();
				}
				
				console.log(searchBox,messageBox,resultPanelA,resultPanelB);
				let input = searchBox.value;
				getCurrentContext().setBusy(true,"SEARCH");	
				let newCallback = callback.bind({parent: container,resultPanel: resultPanelA,input: input,searchBox: searchBox,source: sourcea,channel: this.channel});
				getCurrentContext().CacheManager.getData({contenttype: "SEARCH",window: window,query:{ contenttype: "SEARCH",input: input,source: sourcea,channel: channel},callback: newCallback,nocache: true});
				
				
				
				newCallback = callback.bind({parent: container,resultPanel: resultPanelB,input: input,searchBox: searchBox,source: sourceb,channel: this.channel});
				getCurrentContext().CacheManager.getData({contenttype: "SEARCH",window: window,query: {contenttype: "SEARCH",input: input,source: sourceb,channel: channel},callback: newCallback,nocache: true});
				
			}
			
			let title = profileManager.getString("comparing");
			let container = anyWidgetById(mainId + "container");
			
			let inputPanel = WIDGETFACTORY.buildWidget({which:"div",class: "input"});
			WIDGETFACTORY.addWidgetToContainer({parent: container,child: inputPanel});
		
			let searchBox = WIDGETFACTORY.buildWidget({which:"input",type: "text"});
			WIDGETFACTORY.addWidgetToContainer({parent: inputPanel,child: searchBox});
		
			let resultPanelA = WIDGETFACTORY.buildWidget({which:"div",class: "resultleftside"});
			WIDGETFACTORY.addWidgetToContainer({parent: container,child: resultPanelA});	
			
			let resultPanelB = WIDGETFACTORY.buildWidget({which:"div",class: "resultrightside"});
			WIDGETFACTORY.addWidgetToContainer({parent: container,child: resultPanelB});
			
			WIDGETFACTORY.addHandler({widget: searchBox,handler: [{name: "onenter",callback: handleInput.bind({searchBox: searchBox,resultPanelA: resultPanelA,resultPanelB: resultPanelB,sourcea: sourceA,sourceb: sourceB,channel: channel})}]});
			searchBox.focus();
			
			let cBounds = container.getBoundingClientRect();
			let width = cBounds.width;
			let height = cBounds.height;
			
			//let canvas = WIDGETFACTORY.buildWidget({which:"canvas",width: width,height: height});
			//WIDGETFACTORY.addWidgetToContainer({parent: container,child: canvas});
			
			getCurrentContext().setSearchSearchValue = function(searchValue,rec){
				console.log("compare searvalue",searchValue);
					this.searchBox.value = searchValue;
					handleInput.bind({searchBox: this.searchBox,resultPanelA: this.resultPanelA,resultPanelB: this.resultPanelB,sourcea: this.sourcea,sourceb: this.sourceb,channel: rec.channelid})();
			}.bind({searchBox: searchBox,resultPanelA: resultPanelA,resultPanelB: resultPanelB,sourcea: sourceA,sourceb: sourceB,channel: channel});
    
            return( outerContainer );
    }
	
	context.initChild();
	
	if( !started ){
		buildMainPage({id: mainForm});
		started = true;
		
	}
}
