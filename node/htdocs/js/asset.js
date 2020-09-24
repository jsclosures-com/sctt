/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildAssetPage(parentId,pageId) {

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
                        "dojox/grid/enhanced/plugins/Pagination"
         ];
            
	require(importList, 
         function(){
        	 //console.log("building Main page");
        	 
        	 internalBuildAssetPage(parentId,pageId);

                 getCurrentContext().setBusy(false);
                //console.log("end build Main page");
         }
);
}

function internalBuildAssetPage(parentId,pageId) {
var mainId = pageId;

var uiManager = getCurrentContext().UIProfileManager;

var restURL = uiManager.getSetting("mojoStoreUrl");

var typeStoreData = {
    identifier : 'abbr', label : 'name', items : [
{abbr : "script", name : uiManager.getString('script')}]
};

var typeStore = new dojo.data.ItemFileReadStore( {
    data : typeStoreData
});

var editorTabList = [
    {name: mainId + "assetnotes",label: uiManager.getString("assetnotes"),dataname: "assetnotes"},
    {name: mainId + "assetscript",label: uiManager.getString("assetscript"),dataname: "assetscript"},
];

var CONTENTTYPE = "ASSET";

    var FIELDS = [
	
    {
	  label: uiManager.getString("assetname"),
	  id: mainId + 'assetname',
	  name: mainId + 'assetname',
	  dataname: 'assetname',
	  required: true,
	  type: 'TEXTBOX'
  },
    {
        label: uiManager.getString("assettype"),
        id: mainId + 'assettype',
        name: mainId + 'assettype',
        dataname: 'assettype',
        type: 'SELECT',
        store: typeStore,
        searchAttr: 'name'
    },
    {
        type: 'CUSTOM',
        name: mainId + "custom",
        label: "custom",
        list: editorTabList,
        buildField: function(field){
            var uiManager = getCurrentContext().UIProfileManager;

            var result = new dijit.layout.TabContainer({id: field.name,
                                                                        tabPosition: "top",
                                                                        tabStrip: "true",
                                                                        title: uiManager.getString("scriptManager"),
                                                                        style: "width: " + (getCurrentContext().screenWidth-170) + "px;height:" + (getCurrentContext().screenHeight-500) + "px;"
                                                                   });
            let fieldList = field.list;

            for(let i in fieldList){
                let newWrapper = new dijit.layout.ContentPane({
                    title : fieldList[i].label,
                    content: ""
                }, fieldList[i].name+"wrapper");

                result.addChild(newWrapper);
                let tStyle = "width: 99%;height: 90%;";

                if( fieldList[i].name.indexOf("assetnotes") < 0 ){
                    let newSField = new dijit.form.TextBox({
                        id : fieldList[i].name + '_s',
                        name : fieldList[i].name + '_s',
                        label : fieldList[i].label,
                        title : fieldList[i].label,
                        xrows: 10,
                        xcolumns: 80,
                        style: "width: 99%;"
                    }, fieldList[i].name + '_s');
                    newWrapper.addChild(newSField);
                }
                else {
                    tStyle = "width: 99%;height: 98%;";
                }

                let newField = new dijit.form.SimpleTextarea({
                    id : fieldList[i].name,
                    name : fieldList[i].name,
                    label : fieldList[i].label,
                    title : fieldList[i].label,
                    xrows: 10,
                    xcolumns: 80,
                    style: tStyle
                }, fieldList[i].name);
                newWrapper.addChild(newField);
            }

            return( result );
        },
        readValue: function(field,target){
            let fieldList = field.list;

            for(let i in fieldList){
                var tObj = dijit.byId(fieldList[i].name);
                target[fieldList[i].dataname] = tObj.attr("value");
                tObj = dijit.byId(fieldList[i].name+"_s");
                if( tObj )
                    target[fieldList[i].dataname+"_s"] = tObj.attr("value");
            }
        },
        writeValue: function(field,target){
            let fieldList = field.list;

            for(let i in fieldList){
                var tObj = dijit.byId(fieldList[i].name);
                tObj.attr("value",target[fieldList[i].dataname] == undefined ? '' : target[fieldList[i].dataname]);
                tObj = dijit.byId(fieldList[i].name+"_s");
                if( tObj )
                    tObj.attr("value",target[fieldList[i].dataname+"_s"] == undefined ? '' : target[fieldList[i].dataname+"_s"]);
            }
        }
    }
    ];
    
    var GRIDCOLUMNS = [
	
    {
        name : uiManager.getString("assetname"),
        field : 'assetname',
        width : '30%'
    },
    {
        name : uiManager.getString("assettype"),
        field : 'assettype',
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

        getCurrentContext().loadTestStoreData();
    }
    
    function deleteDataCallback(data) {
        //console.log("delete data callback");
        var fObj = anyWidgetById(mainId);
        //console.log("main obj " + fObj);
        fObj.loadTarget( {
            assetnotes : ''
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
    context.saveLabel = uiManager.getString("saveAsset");
    context.deleteLabel = uiManager.getString("deleteAsset");
    context.clearLabel = uiManager.getString("clearAsset");
    context.duplicateLabel = uiManager.getString("duplicateAsset");
    context.formCustomClass = "crudForm";
    context.autoQuery = false;
    context.params = {};
    
    context.gridLayout = GRIDCOLUMNS;
    context.fieldList = FIELDS;
    //auto selected record
    context.target = {};
	
	context.preLoadTarget = function(rec){
        console.log("load",rec);
        let isAdmin = getCurrentContext().SessionManager.getAttribute("userId") == 'admin';
        enableEditorTabs(isAdmin);
        
		if( rec.assetscript )
			rec.assetscript = atob(rec.assetscript);
		
        if( rec.assetnotes )
			rec.assetnotes = atob(rec.assetnotes);
    }
    
    function enableEditorTabs(mode){
        for(let i in editorTabList){
            let tObj = anyWidgetById(editorTabList[i].name);
            if( tObj && editorTabList[i].name.indexOf("assetnotes") < 0 ){
                tObj.attr("disabled",!mode);
            }
        }
    }
	
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
	        defaultfield: "assetname"
	    };
   
    context.saveAction = function(e,oldRec,newRec)
    {
        //console.log('save: ' + newRec.channelid_s);
        
        if( newRec.assetname ){
            setBusy(true,uiManager.getString("pleaseWait"));
            
            var dataService = getDataService(restURL, changeDataCallback, "", "");
            
			if( newRec.assetscript )
				newRec.assetscript = btoa(newRec.assetscript);
			if( newRec.assetnotes )
				newRec.assetnotes = btoa(newRec.assetnotes);
			
		
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
            showAlertMessageDialog(uiManager.getString("assetUnableToSave"));
        }
    };

    context.duplicateAction = function(e,oldRec,newRec)
    {
        //console.log('save: ' + newRec.channelid_s);
        
        if( newRec.assetname ){
            let newTarget = newRec;
            console.log("duplicate",newTarget);
            newTarget.id = '';

            var gObj = anyWidgetById(context.gridName);
        
            //if( gObj && gObj.plugin("filter") ){
            //    gObj.selection.setSelected();
            //}

            if (gObj.selection.selectedIndex >= 0)
            {
                gObj.selection.setSelected(gObj.selection.selectedIndex, false);
            }
            if( newRec.assetscript )
                newTarget.assetscript = btoa(newRec.assetscript);
			if( newRec.assetnotes )
                newTarget.assetnotes = btoa(newRec.assetnotes);
			
            let d = new Date();

            newTarget.assetname = newTarget.assetname + d.getTime();
            var fObj = anyWidgetById(mainId);
            //console.log("main obj " + fObj);
            fObj.loadTarget( newTarget );
            console.log("load target",newTarget);
            fObj.setActionMessage(getCurrentContext().UIProfileManager.getString("CLICKSAVETODUPLICATE"));
        }
        else {
            showAlertMessageDialog(uiManager.getString("assetUnableToDuplicate"));
        }
    };
    
    context.deleteAction = function(e,oldRec,newRec)
    {
        //console.log('delete: ' + oldRec.name);
        
        if( oldRec.assetname ){
            var callback = function(mode,args){    
                    if( mode ) {
                       setBusy(true,uiManager.getString("pleaseWait"));
                        var dataService = getDataService(restURL, deleteDataCallback, "", "");
                        delete args["__parent"];
                        
                        var payload = {doc: args};
                        payload.contenttype = CONTENTTYPE;
                        payload.action = "DELETE";
                        if( args.assetname ){
                            //REST delete
                            //console.log("existing rec so just delete " + args);
                            dataService["delete"](payload, payload);
                        }
                       
                   }
               }
                                   
                showModalDialog(uiManager.getString("modalDialogTitle"),uiManager.getString("assetConfirmDeleteMessage"),callback,oldRec);
        }
        else {
            showAlertMessageDialog(uiManager.getString("assetUnableToDelete"));
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
    
    var formHeight = dojo.isIE ? 720 : 760;
    
    context.gridStyle = "height: " + (getCurrentContext().screenHeight-formHeight) + "px;";
    
    context.loadTargetHandler = function(target){
        
        /*var tObj = anyWidgetById(mainId + 'notes');
        
        if( tObj ){
            if( target.hasOwnProperty("assetnotes") ){
                tObj.set("disabled",true);
            }
            else{
                tObj.set("disabled",false);
            }
        }*/
    }
	
    buildForm(context);
    
    var fObj = anyWidgetById(mainId);
        //console.log("main obj " + fObj);
        fObj.loadTarget( {"assetnotes": ""} );
        
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

        getCurrentContext().loadTestStoreData();
    }
    context.getQueryStr = function(target)
    {
        var gObj = anyWidgetById(this.gridName);
            
        return( '' );
    }

}
