
function buildFeedbackForm(mainContext, mainId,target) {
	require([		
		 "dijit/form/TextBox",
		"dijit/form/Textarea",
		"dojox/grid/EnhancedGrid",
		"dojox/grid/enhanced/plugins/IndirectSelection",
		"dojox/grid/enhanced/plugins/Pagination"
         ], 
         function(){
        	 //console.log("building password page");
        	 
        	 internalBuildFeedbackForm(mainContext, mainId,target);
			 
			 anyWidgetById(mainId).initChild();
			 anyWidgetById(mainId).startChild();
			 //currentChild.started = true;
		 
			//console.log("build password page");
         }
);
}

function internalBuildFeedbackForm(mainContext, mainId,target) {

    var uiManager = getCurrentContext().UIProfileManager;
    
    var FORMFIELDS = [
    {
        label: uiManager.getString("query_txt"),
        id: mainId + 'parent',
        name: mainId + 'parent',
        dataname: 'parent',
        type: 'ROTEXTBOX',
		disable: true
    },
    {
        label: uiManager.getString("confidencescore"),
        id: mainId + 'confidencescore',
        name: mainId + 'confidencescore',
        dataname: 'confidencescore',
        type: 'NUMBERTEXTBOX',
        required: true,
        constraints: {min:1,max:1000000,places:0,pattern: "######"}
    },
    {
        label: uiManager.getString("comments"),
        id: mainId + 'comments',
        name: mainId + 'comments',
        dataname: 'comments',
        type: 'TEXTAREA',
		rows: 10,
		cols: 40
    }
    ];

			  
    var context = {};
    context.mainId = mainId;
    
    context.template = '<div id="' + mainId + 'message"></div><div id="' + mainId + 'form"></div><div id="' + mainId + 'controls"></div>';
    context.useDojo = mainContext.useDojo;
    
    context.gridName = mainId + "grid";
    context.formName = mainId + "form";
    context.controlsName = mainId + "controls";
    context.messageName = mainId + "message";
    context.showGrid = false;
    context.integrateGrid = false;
    context.saveLabel = uiManager.getString("save");
    context.formCustomClass = "passwordDialog";
    
    context.fieldList = FORMFIELDS;
    //auto selected record
    context.target = {};
    context.saveAction = function(e,oldRec,xnewRec)
    {
        //console.log('save: ' + newRec);
        var parentid = target.id;
		var comments = anyWidgetById(mainId + "comments").get("value");
		var confidenceScore = anyWidgetById(mainId + "confidencescore").get("value");
        
		console.log(parentid,comments,confidenceScore);
		var newRec = {parentid: parentid,comments: comments, confidencescore: confidenceScore};
		
		var restURL = uiManager.getSetting("mojoStoreUrl");

		setBusy(true,uiManager.getString("pleaseWait"));
		
		var callback = function(resp){
				setBusy(false);
				hideFeedbackDialog();
		}
            
		var dataService = getDataService(restURL, callback, "", "");
		
		var payload = {doc: newRec}; 
		payload.contenttype = "FEEDBACK";
		payload.action = "POST";
		if( newRec.comments ){

			dataService["post"](payload, payload);
		}
	

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
        fObj.loadTarget( target);
}