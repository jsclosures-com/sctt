/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildTestPage(parentId,pageId) {

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
        	 
        	 internalBuildTestPage(parentId,pageId);

                 getCurrentContext().setBusy(false);
                //console.log("end build Main page");
         }
);
}

function internalBuildTestPage(parentId,pageId) {
var mainId = pageId;

var uiManager = getCurrentContext().UIProfileManager;

var restURL = uiManager.getSetting("mojoStoreUrl");


var editorTabList = [
    {name: mainId + "testnotes",label: uiManager.getString("testnotes"),dataname: "testnotes"},
    {name: mainId + "testdetailscript",label: uiManager.getString("testdetailscript"),dataname: "testdetailscript"},
    {name: mainId + "testharvestscript",label: uiManager.getString("testharvestscript"),dataname: "testharvestscript"},
        {name: mainId + "testcopyscript",label: uiManager.getString("testcopyscript"),dataname: "testcopyscript"},
        {name: mainId + "testbuildscript",label: uiManager.getString("testbuildscript"),dataname: "testbuildscript"},
                    {name: mainId + "testextractscript",label: uiManager.getString("testextractscript"),dataname: "testextractscript"},
                    {name: mainId + "testinterpretscript",label: uiManager.getString("testinterpretscript"),dataname: "testinterpretscript"},
                    {name: mainId + "testsummaryscript",label: uiManager.getString("testsummaryscript"),dataname: "testsummaryscript"}];

function enableEditorTabs(mode){
    for(let i in editorTabList){
        let tObj = anyWidgetById(editorTabList[i].name);
        if( tObj && editorTabList[i].name.indexOf("testnotes") < 0 ){
            tObj.attr("disabled",!mode);
        }
    }
}
var CONTENTTYPE = "TEST";

    var FIELDS = [
	
    {
	  label: uiManager.getString("testname"),
	  id: mainId + 'testname',
	  name: mainId + 'testname',
	  dataname: 'testname',
	  required: true,
	  type: 'TEXTBOX'
  },
    {
        label: uiManager.getString("comments"),
        id: mainId + 'comments',
        name: mainId + 'comments',
        dataname: 'comments',
        type: 'TEXTBOX'
    },
    {
        label: uiManager.getString("testsample"),
        id: mainId + 'testsample',
        name: mainId + 'testsample',
        dataname: 'testsample',
        type: 'TEXTBOX',
	    required: true
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
                                                                        style: "width: " + (getCurrentContext().screenWidth-170) + "px;height:" + (getCurrentContext().screenHeight-454) + "px;"
                                                                   });
            let fieldList = field.list;

            for(let i in fieldList){
                let newWrapper = new dijit.layout.ContentPane({
                    title : fieldList[i].label,
                    content: ""
                }, fieldList[i].name+"wrapper");

                result.addChild(newWrapper);
                let tStyle = "width: 99%;height: 90%;";

                if( fieldList[i].name.indexOf("testnotes") < 0 ){
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
        name : uiManager.getString("testname"),
        field : 'testname',
        width : '30%'
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

        getCurrentContext().loadTestStoreData();
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
    context.saveLabel = uiManager.getString("saveTest");
    context.deleteLabel = uiManager.getString("deleteTest");
    context.clearLabel = uiManager.getString("clearTest");
    context.duplicateLabel = uiManager.getString("duplicateTest");
    context.customLabel = uiManager.getString("deleteAllTestData");
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
        try {
            if( rec.testharvestscript )
                rec.testharvestscript = atob(rec.testharvestscript);
            if( rec.testcopyscript )
                rec.testcopyscript = atob(rec.testcopyscript);
            if( rec.testextractscript )
                rec.testextractscript = atob(rec.testextractscript);
                
            if( rec.testinterpretscript )
                rec.testinterpretscript = atob(rec.testinterpretscript);
            
            if( rec.testbuildscript )
                rec.testbuildscript = atob(rec.testbuildscript);
            if( rec.testsummaryscript )
                rec.testsummaryscript = atob(rec.testsummaryscript);
            if( rec.testnotes )
                rec.testnotes = atob(rec.testnotes);
            if( rec.testdetailscript )
                rec.testdetailscript = atob(rec.testdetailscript);
        }
        catch(e){ console.log("unable to dcode");}
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
	        defaultfield: "testname"
	    };
   
    context.saveAction = function(e,oldRec,newRec)
    {
        //console.log('save: ' + newRec.channelid_s);
        
        if( newRec.testname ){
            setBusy(true,uiManager.getString("pleaseWait"));
            
            var dataService = getDataService(restURL, changeDataCallback, "", "");
            
			if( newRec.testharvestscript )
				newRec.testharvestscript = btoa(newRec.testharvestscript);
			if( newRec.testcopyscript )
				newRec.testcopyscript = btoa(newRec.testcopyscript);
			if( newRec.testextractscript )
				newRec.testextractscript = btoa(newRec.testextractscript);
			
			if( newRec.testinterpretscript )
				newRec.testinterpretscript = btoa(newRec.testinterpretscript);

			if( newRec.testbuildscript )
				newRec.testbuildscript = btoa(newRec.testbuildscript);
			if( newRec.testsummaryscript )
				newRec.testsummaryscript = btoa(newRec.testsummaryscript);
            if( newRec.testnotes )
				newRec.testnotes = btoa(newRec.testnotes);
            
            if( newRec.testdetailscript )
				newRec.testdetailscript = btoa(newRec.testdetailscript);
		
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
            showAlertMessageDialog(uiManager.getString("testUnableToSave"));
        }
    };

    context.duplicateAction = function(e,oldRec,newRec)
    {
        //console.log('save: ' + newRec.channelid_s);
        
        if( newRec.testname ){
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
            if( newRec.testharvestscript )
                newTarget.testharvestscript = btoa(newRec.testharvestscript);
			if( newRec.testcopyscript )
                newTarget.testcopyscript = btoa(newRec.testcopyscript);
			if( newRec.testextractscript )
                newTarget.testextractscript = btoa(newRec.testextractscript);
			
			if( newRec.testinterpretscript )
                newTarget.testinterpretscript = btoa(newRec.testinterpretscript);

			if( newRec.testbuildscript )
                newTarget.testbuildscript = btoa(newRec.testbuildscript);
			if( newRec.testsummaryscript )
                newTarget.testsummaryscript = btoa(newRec.testsummaryscript);
            if( newRec.testnotes )
                newTarget.testnotes = btoa(newRec.testnotes);
            if( newRec.testdetailscript )
                newTarget.testdetailscript = btoa(newRec.testdetailscript);
            let d = new Date();

            newTarget.testname = newTarget.testname + d.getTime();
            var fObj = anyWidgetById(mainId);
            //console.log("main obj " + fObj);
            fObj.loadTarget( newTarget );
            console.log("load target",newTarget);
            fObj.setActionMessage(getCurrentContext().UIProfileManager.getString("CLICKSAVETODUPLICATE"));
        }
        else {
            showAlertMessageDialog(uiManager.getString("testUnableToDuplicate"));
        }
    };

    context.customAction = function(e,oldRec,newRec)
    {
        if( newRec.testname ){
            var callback = function(mode,args){    
                if( mode ) {
                   setBusy(true,uiManager.getString("pleaseWait"));
                    
                    var cb = function(data){
                        console.log("callback from delete all",data);
                        setBusy();
                    };

                    var dataService = getDataService(restURL, cb, "", "");
                    var payload = {testname: this.testname}; 
                    console.log("delete payload",payload);
                    payload.contenttype = "DELETEALL";
                    payload.action = "POST";
                    dataService["post"](payload, payload);
               }
           }
                               
            showModalDialog(uiManager.getString("modalDialogTitle"),uiManager.getString("testConfirmDeleteAllDataMessage"),callback.bind({testname: newRec.testname}),oldRec);
        }
        else {
            showAlertMessageDialog(uiManager.getString("testUnableToDeleteAll"));
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
                                   
                showModalDialog(uiManager.getString("modalDialogTitle"),uiManager.getString("testConfirmDeleteMessage"),callback,oldRec);
        }
        else {
            showAlertMessageDialog(uiManager.getString("testUnableToDelete"));
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

        getCurrentContext().loadTestStoreData();
    }
    context.getQueryStr = function(target)
    {
        var gObj = anyWidgetById(this.gridName);
            
        return( '' );
    }

}
