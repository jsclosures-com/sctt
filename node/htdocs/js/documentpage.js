
function buildDocumentPage(mainContext, mainId,target) {
	require([		
		 "dijit/form/TextBox",
		"dijit/form/Textarea",
		"dojox/grid/EnhancedGrid",
		"dojox/grid/enhanced/plugins/IndirectSelection",
		"dojox/grid/enhanced/plugins/Pagination"
         ], 
         function(){
        	 //console.log("building password page");
        	 
        	 internalBuildDocumentPage(mainContext, mainId,target);
			 
			 anyWidgetById(mainId).initChild();
			 anyWidgetById(mainId).startChild();
			 //currentChild.started = true;
		 
			//console.log("build password page");
         }
);
}

function internalBuildDocumentPage(mainContext, mainId,target) {

    /*var uiManager = getCurrentContext().UIProfileManager;
    
    var FORMFIELDS = [
    {
        label: uiManager.getString("id"),
        id: mainId + 'id',
        name: mainId + 'id',
        dataname: 'id',
        type: 'TEXTFIELD',
		cols: 40,
		style: "width:100%;"
    },
    {
        label: uiManager.getString("eyDocId"),
        id: mainId + 'eyDocId',
        name: mainId + 'eyDocId',
        dataname: 'eyDocId',
        type: 'TEXTFIELD',
		cols: 40,
		style: "width:100%;"
    },
    {
        label: uiManager.getString("bookTitle"),
        id: mainId + 'eyBookTitleEn',
        name: mainId + 'eyBookTitleEn',
        dataname: 'eyBookTitleEn',
        type: 'TEXTFIELD',
		cols: 40,
		style: "width:100%;"
    },
    {
        label: uiManager.getString("score"),
        id: mainId + 'score',
        name: mainId + 'score',
        dataname: 'score',
        type: 'TEXTFIELD',
		cols: 40,
		style: "width:100%;"
    }
    ];

			  
    var context = {};
    context.mainId = mainId;
    
    context.template = '<div id="' + mainId + 'message"></div><div id="' + mainId + 'form"></div><div id="' + mainId + 'controls"></div><div id="' + mainId + 'grid"></div>';
    context.useDojo = mainContext.useDojo;
    
    context.gridName = mainId + "grid";
    context.formName = mainId + "form";
    context.controlsName = mainId + "controls";
    context.messageName = mainId + "message";
    context.showGrid = false;
    context.integrateGrid = false;
    //context.saveLabel = uiManager.getString("save");
    context.formCustomClass = "passwordDialog";
    
    context.fieldList = FORMFIELDS;
    //auto selected record
    context.target = {};
    context.saveAction = function(e,oldRec,newRec)
    {
        //console.log('save: ' + newRec);
        var currentPassword = anyWidgetById(mainId + "currentPassword").get("value");
        var password1 = anyWidgetById(mainId + "newPassword1").get("value");
        var password2 = anyWidgetById(mainId + "newPassword2").get("value");
        

    };
    context.gridRowClick = function(e)
    {
    //alert(e);
    };
    context.params =
    {
        target : "restservice",
        parameters : []
    };
	    
    context.getQueryStr = function(target)
    {
        return( '' );
    };
	
    context.gridStyle = "height: 386px;width: 400px;";
	
    buildForm(context);
    
    var fObj = anyWidgetById(mainId);
        //console.log("main obj " + fObj);
        fObj.loadTarget( target);*/
	var cContext = getCurrentContext();
	
	var contentPanel = new dijit.layout.ContentPane({
				id : mainId,
				xstyle : "height: 30px;"
			}, cContext.dom.byId(mainId));
			
			
	
	
	var cp = anyWidgetById(mainId);
	
	cp.loadTarget = function(target){
		console.log("load",target);
		let rec = target.doc;
		let input = target.input;
		let page = "<ul>";
		let regex = new RegExp(input, 'ig')				
		for(let a in rec){
			if( !a.startsWith("_") ){
				page += "<li>" + a + ": " + (""+rec[a]).replace(regex,"<b>" + input + "</b>") + "</li>";
			}
		}
				
							
		page += "</ul>";
					
        anyWidgetById(this.parentid).set('content',page);
		
	}.bind({parentid: mainId});
	
	
	cp.loadTarget(target);
	
	cp.initChild = function(){
		console.log("init");
	}
	
	cp.startChild = function(){
		console.log("start");
	}
	
	cp.stopChild = function(){
		console.log("stop");
	}
	
	cp.destroyChild = function(){
		console.log("destroy");
	}
}