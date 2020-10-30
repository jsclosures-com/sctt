/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildComparePage(parentId,pageId) {

	getCurrentContext().setBusy(true,getCurrentContext().UIProfileManager.getString("comparePageLoading"));
	
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
        	 internalBuildComparePage(parentId,pageId);
        	 getCurrentContext().setBusy(false);
         }
);
}

function internalBuildComparePage(parentId,pageId) {
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

			let restURL = profileManager.getSetting("mojoStoreUrl");
			
			let handleInputWrapper = function(data){
					let test = getCurrentContext().getCurrentTest().test;
			
					let handleInput = false;
					
					eval('handleInput = ' + atob(test.testinterpretscript) + ";");
					handleInput.bind({searchBox: this.searchBox,resultPanelA: this.resultPanelA,resultPanelB: this.resultPanelB,test: test})();
				
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
			
			WIDGETFACTORY.addHandler({widget: searchBox,handler: [{name: "onenter",callback: handleInputWrapper.bind({searchBox: searchBox,resultPanelA: resultPanelA,resultPanelB: resultPanelB})}]});
			searchBox.focus();
			
			let cBounds = container.getBoundingClientRect();
			let width = cBounds.width;
			let height = cBounds.height;
			
			//let canvas = WIDGETFACTORY.buildWidget({which:"canvas",width: width,height: height});
			//WIDGETFACTORY.addWidgetToContainer({parent: container,child: canvas});
			
			getCurrentContext().setCompareSearchValue = function(searchValue,rec){
				console.log("compare searvalue",searchValue);
					this.searchBox.value = searchValue;
					
					handleInputWrapper.bind({searchBox: this.searchBox,resultPanelA: this.resultPanelA,resultPanelB: this.resultPanelB})();
			}.bind({searchBox: searchBox,resultPanelA: resultPanelA,resultPanelB: resultPanelB});
    
            return( outerContainer );
    }
	
	context.initChild();
	
	if( !started ){
		buildMainPage({id: mainForm});
		started = true;
		
	}
}
