/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildFeedbackPage(parentId,pageId) {

	getCurrentContext().setBusy(true,getCurrentContext().UIProfileManager.getString("samplePageLoading"));
	
        var importList =[
                        "dijit/layout/ContentPane",
                        "dojox/layout/TableContainer",
                        "dijit/form/TextBox",
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
        	 
        	 internalBuildFeedbackPage(parentId,pageId);

                 getCurrentContext().setBusy(false);
                //console.log("end build Main page");
         }
);
}

function internalBuildFeedbackPage(parentId,pageId) {
var mainId = pageId;

var uiManager = getCurrentContext().UIProfileManager;

var restURL = uiManager.getSetting("mojoStoreUrl");

var CONTENTTYPE = "FEEDBACK";

function loadSampleStoreData(callback){
        var doLater = function(data){
            loadSampleStoreDataCallback(data);
            
            setBusy(false,false);
			
			if( callback ) callback();
        }
        var theURL = restURL + "?action=GET&contenttype=SAMPLE&_rows=10000";//&_sort=query_txt&_ascending=true";

        doDeferredSend(theURL, doLater,uiManager.getString("pleaseWait"));
    }
    
    let sampleList = false;
    function loadSampleStoreDataCallback(data){
    
        var items = data.items;
        sampleList = {};
        
        //update grid with VMS names
        var gObj = dijit.byId(mainId + 'grid');
        if (gObj) gObj.update();
        
        dojo.forEach(items,function(item,i){
                                                item.id = item.id;
                                                item.name = (item.query_txt ? item.query_txt : "") ;
												sampleList[item.id] = item;
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
        dijit.byId(mainId + 'parentid').set("store",datastore);
        dijit.byId(mainId + 'parentid').startup();
        dijit.byId(mainId + 'parentid').reset();
        dijit.byId(mainId + 'parentid').set("value","");
    }

    var FIELDS = [
	
    {
	  label: uiManager.getString("query_txt"),
	  id: mainId + 'parentid',
	  name: mainId + 'parentid',
	  dataname: 'parentid',
	  required: true,
	  type: 'FILTERINGSELECT',
	  store: new dojo.store.Memory({data:[]}),
	  labelAttr: 'name'
  },
    {
        label: uiManager.getString("comments"),
        id: mainId + 'comments',
        name: mainId + 'comments',
        dataname: 'comments',
        type: 'TEXTBOX'
    },
	{
        label: uiManager.getString("confidencescore"),
        id: mainId + 'confidencescore',
        name: mainId + 'confidencescore',
        dataname: 'confidencescore',
        type: 'NUMBERTEXTBOX',
        required: true,
        constraints: {min:1,max:1000000,places:0,pattern: "######"}
    }
    ];
    
    var GRIDCOLUMNS = [
	{
        name : uiManager.getString("query_txt"),
        field : 'parentid',
        width : '14%',
		formatter: function(rvalue,r,props) {  
			//console.log(rvalue,r,props);
			let result = sampleList[rvalue];
			if( result ){
				result = result.query_txt;
			}
			else {
				result = '';
			}
			
			return( result );
		}
    },
    {
        name : uiManager.getString("confidencescore"),
        field : 'confidencescore',
        width : '14%'
    },
    {
        name : uiManager.getString("comments"),
        field : 'comments',
        width : '60%'
    }
    ];
    
    function changeDataCallback(data) {
        //console.log("change data callback");
        var fObj = anyWidgetById(mainId);
        //console.log("main obj " + fObj);
        fObj.restartChild();
        
        //if( data && data.items && data.items.length > 0 )
         fObj.loadTarget( {comments: ''});
         
       if( data ) {
            if( data.status && data.status.message )
                fObj.setActionMessage(data.status.message);
            else 
                fObj.setActionMessage(data.message);
       }
       
       var gObj = anyWidgetById(context.gridName);
        
        if( gObj && gObj.plugin("filter") ){
        	gObj.plugin("filter").filterDefDialog.clearFilter(false);
        }
        
        
        setBusy(false);
    }
    
    function deleteDataCallback(data) {
        //console.log("delete data callback");
        var fObj = anyWidgetById(mainId);
        //console.log("main obj " + fObj);
        fObj.loadTarget( {
            comments : ''
        });

        fObj.restartChild();
        
        if( data && data.status )
            fObj.setActionMessage(data.status.message);
        
        var gObj = anyWidgetById(context.gridName);
        
        if( gObj && gObj.plugin("filter") ){
        	gObj.plugin("filter").filterDefDialog.clearFilter(false);
        }
        
        setBusy(false);
    }
			  
    var context = {};
    context.mainId = mainId;
    
    context.template = '<div id="' + mainId + 'message"></div><div id="' + mainId + 'form"></div><div id="' + mainId + 'controls"></div><div style="border: 1px solid red;" id="' + mainId + 'grid"></div>';
    context.useDojo = false;
    
    context.gridName = mainId + "grid";
    context.formName = mainId + "form";
    context.controlsName = mainId + "controls";
    context.messageName = mainId + "message";
    context.showGrid = true;
    context.integrateGrid = true;
    context.saveLabel = uiManager.getString("saveFeedback");
    context.deleteLabel = uiManager.getString("deleteFeedback");
    context.clearLabel = uiManager.getString("clearFeedback");
    context.formCustomClass = "crudForm";
    context.autoQuery = false;
    context.params = {};
    
    context.gridLayout = GRIDCOLUMNS;
    context.fieldList = FIELDS;
    //auto selected record
    context.target = {};
   context.xxxstore = new com.ibm.JsonRestStoreMessage({
        target : restURL,
        allowNoTrailingSlash: true,
        gridName: context.gridName
    });
    context.params = {
	        target : restURL,
	        allowNoTrailingSlash: true,
	        gridName: context.gridName,
	        contenttype: CONTENTTYPE,
	        defaultfield: "confidencescore"
	    };
   
    context.saveAction = function(e,oldRec,newRec)
    {
        //console.log('save: ' + newRec.channelid_s);
        
        if( newRec.comments && newRec.confidencescore ){
            setBusy(true,uiManager.getString("pleaseWait"));
            
            var dataService = getDataService(restURL, changeDataCallback, "", "");
            
            var payload = {doc: newRec}; 
            payload.contenttype = CONTENTTYPE;
            payload.action = "POST";
            if( oldRec.comments ){
                //REST post
                //delete payload.items[0].vms_server_id;
                //console.log("existing rec so just save " + newRec);
                dataService["post"](payload, payload);
            }
            else {
                //REST put
                //console.log("existing rec so just save " + newRec);
                dataService["put"](payload, payload);
            }
        }
        else {
            showAlertMessageDialog(uiManager.getString("feedbackUnableToSave"));
        }
    };
    
    context.deleteAction = function(e,oldRec,newRec)
    {
        //console.log('delete: ' + oldRec.name);
        
        if( oldRec.comments ){
            var callback = function(mode,args){    
                    if( mode ) {
                       setBusy(true,uiManager.getString("pleaseWait"));
                        var dataService = getDataService(restURL, deleteDataCallback, "", "");
                        delete args["__parent"];
                        
                        var payload = {doc: args};
                        payload.contenttype = CONTENTTYPE;
                        payload.action = "DELETE";
                        if( args.comments ){
                            //REST delete
                            //console.log("existing rec so just delete " + args);
                            dataService["delete"](payload, payload);
                        }
                       
                   }
               }
                                   
                showModalDialog(uiManager.getString("modalDialogTitle"),uiManager.getString("feedbackConfirmDeleteMessage"),callback,oldRec);
        }
        else {
            showAlertMessageDialog(uiManager.getString("feedbackUnableToDelete"));
        }
    };
    
    context.gridRowClick = function(e)
    {
    //alert(e);
    };
	    
    context.getQueryStr = function(target)
    {    
        return( '' );
    };
    
    var formHeight = dojo.isIE ? 360 : 390;
    
    context.gridStyle = "height: " + (getCurrentContext().screenHeight-formHeight) + "px;";
    
    context.loadTargetHandler = function(target){
        
        var tObj = anyWidgetById(mainId + 'comments');
        
        if( tObj ){
            if( target.hasOwnProperty("comments") ){
                tObj.set("disabled",true);
            }
            else{
                tObj.set("disabled",false);
            }
        }
    }
	
    buildForm(context);
    
    var fObj = anyWidgetById(mainId);
        //console.log("main obj " + fObj);
        fObj.loadTarget( {"comments": ""} );
        
    var lifecycle = {};
    
    lifecycle.resizeDisplay = function(){
        //console.log("resize servers");
        var tGrid = anyWidgetById(context.gridName);
        
        if( tGrid ){
            tGrid.attr("height",(getCurrentContext().screenHeight-formHeight) +"px");
            tGrid.resize({});
            tGrid.update();
        }
    }
    
    anyWidgetById(parentId).lifecycle = lifecycle;
	
	function refreshGrid(){
    	var gObj = anyWidgetById(context.gridName);
        
        if( gObj ){
            gObj.setStore(context.store,context.getQueryStr());
        }
    }
    context.getQueryStr = function(target)
    {
        var gObj = anyWidgetById(this.gridName);
            
        return( '' );
    }
    var doFinally = function(){  
		var callback = function(){
			var gObj = anyWidgetById(context.gridName);
        
			if( gObj ){
				gObj.setStore(context.store,context.getQueryStr());
			}
		}
	
		loadSampleStoreData(callback);
		
		
    }
	
	setTimeout(doFinally,500);
	
	
	getCurrentContext().setFeedbackTarget = function(searchValue,rec){
		console.log("feedback searchvalue",searchValue);
		/*var tObj = anyWidgetById(mainId + 'query_txt');
		
		if( tObj ){
			
		}*/
		var fObj = anyWidgetById(mainId);
       
         fObj.loadTarget( {parentid: rec.id});
	};

}
