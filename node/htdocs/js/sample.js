/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildSamplePage(parentId,pageId) {

	getCurrentContext().setBusy(true,getCurrentContext().UIProfileManager.getString("samplePageLoading"));
	
        var importList =[
                        "dijit/layout/ContentPane",
                        "dojox/layout/TableContainer",
                        "dijit/form/TextBox",
                        "dijit/form/ValidationTextBox",
                        "dijit/form/Button",
                        "dojox/grid/EnhancedGrid",
                        "dojox/grid/enhanced/plugins/IndirectSelection",
                        "dojox/grid/enhanced/plugins/Pagination",
                        "js/feedbackform.js"
         ];
            
	require(importList, 
         function(){
        	 //console.log("building Main page");
        	 
        	 internalBuildSamplePage(parentId,pageId);

                 getCurrentContext().setBusy(false);
                //console.log("end build Main page");
         }
);
}

function internalBuildSamplePage(parentId,pageId) {
    var mainId = pageId;

    var uiManager = getCurrentContext().UIProfileManager;

    var restURL = uiManager.getSetting("mojoStoreUrl");

    var CONTENTTYPE = "SAMPLE";
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
    context.saveLabel = uiManager.getString("saveSample");
    context.deleteLabel = uiManager.getString("deleteSample");
    context.clearLabel = uiManager.getString("clearSample");
    context.formCustomClass = "crudForm";
    context.autoQuery = false;
    context.params = {};
    var FIELDS = [
	
	{
        label: uiManager.getString("query_txt"),
        id: mainId + 'query_s',
        name: mainId + 'query_s',
        dataname: 'query_s',
        type: 'TEXTBOX',
        integrated: true
    }
    ];
    
    var GRIDCOLUMNS = [
    {
        name : uiManager.getString("query_txt"),
        field : 'query_txt',
        width : '60%'
    },
    {
        name : "",
        field : '',
        width : '60px', 
		formatter: function (rvalue,r,props) {  
			//console.log(rvalue,r,props);
			let rec = anyWidgetById(this.gridName).getItem(r);
			let value = rec.id;
			
			return new dijit.form.Button({label: "Compare", onClick: function () {  
			   // your stuff depending on value  
			   //console.log(this.value);
			   //console.log(this.rec);
			   getCurrentContext().setResultsPageTab('mainmainresultstabcontentformcompare');
			   let existsFunc = function(value,rec){
				if( getCurrentContext().setCompareSearchValue )
					getCurrentContext().setCompareSearchValue(value,rec);
				else
					setTimeout(existsFunc,1000,value,rec);
			   }
			   
			   setTimeout(existsFunc,100,this.value,this.rec);
			}.bind({value: value,rec: rec}) })  ;

		}.bind({gridName: context.gridName})  
    },
    {
        name : "",
        field : '',
        width : '70px', 
		formatter: function (rvalue,r,props) {  
			//console.log(rvalue,r,props);
			let rec = anyWidgetById(this.gridName).getItem(r);
			let value = rec.query_txt;
			
			return new dijit.form.Button({label: "Feedback", onClick: function () {  
			   // your stuff depending on value  
			   //console.log(this.value);
			   //console.log(this.rec);
			   /*getCurrentContext().setMainPageTab('mainmainfeedback');
			   let existsFunc = function(value,rec){
				if( getCurrentContext().setFeedbackTarget )
					getCurrentContext().setFeedbackTarget(value,rec);
				else
					setTimeout(existsFunc,1000,value,rec);
			   }
			   
			   setTimeout(existsFunc,100,value,rec);*/
			   var uiManager = getCurrentContext().UIProfileManager;
			   var recTarget = this.rec;
			   recTarget.parent = recTarget.query_txt;
			   showFeedbackDialog(uiManager.getString("feedback"),uiManager.getString("feedback"),function(){ console.log("callback")},recTarget);
	
			}.bind({value: value,rec: rec}) })  ;

		}.bind({gridName: context.gridName})   
    }
    ];
    
    function changeDataCallback(data) {
        //console.log("change data callback");
        var fObj = anyWidgetById(mainId);
        //console.log("main obj " + fObj);
        fObj.restartChild();
        
        //if( data && data.items && data.items.length > 0 )
         fObj.loadTarget( {channelid: ''});
         
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
            channelid : ''
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
			  
    
    
    context.gridLayout = GRIDCOLUMNS;
    context.fieldList = FIELDS;
    //auto selected record
    context.target = {};
   
    context.params = {
	        target : restURL,
	        allowNoTrailingSlash: true,
	        gridName: context.gridName,
	        contenttype: CONTENTTYPE,
	        defaultfield: "query_txt"
	    };
   
    context.saveAction = function(e,oldRec,newRec)
    {
        //console.log('save: ' + newRec.channelid);
        
        if( newRec.channelid && newRec.query_text ){
            setBusy(true,uiManager.getString("pleaseWait"));
            
            var dataService = getDataService(restURL, changeDataCallback, "", "");
            
            var payload = newRec; 
            payload.contenttype = CONTENTTYPE;
            
            if( oldRec.channelid ){
                //REST post
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
            showAlertMessageDialog(uiManager.getString("searchUnableToSave"));
        }
    };
    
    context.deleteAction = function(e,oldRec,newRec)
    {
        //console.log('delete: ' + oldRec.name);
        
        if( oldRec.channelid ){
            var callback = function(mode,args){    
                    if( mode ) {
                       setBusy(true,uiManager.getString("pleaseWait"));
                        var dataService = getDataService(restURL, deleteDataCallback, "", "")["delete"];
                        delete args["__parent"];
                        
                        var payload = args;
                        payload.contenttype = CONTENTTYPE;
                        
                        if( args.channelid ){
                            //REST delete
                            //console.log("existing rec so just delete " + args);
                            dataService["delete"](payload, payload);
                        }
                       
                   }
               }
                                   
                showModalDialog(uiManager.getString("modalDialogTitle"),uiManager.getString("searchConfirmDeleteMessage"),callback,oldRec);
        }
        else {
            showAlertMessageDialog(uiManager.getString("sampleUnableToDelete"));
        }
    };
    
    context.gridRowClick = function(e)
    {
    //alert(e);
    };
	    
    context.getQueryStr = function(target)
    {    
	    let result = {};
		if( target && target.query_txt ){
			result.query_txt = target.query_txt;
		}
		
		let test = getCurrentContext().getCurrentTest().test;
			
		result.testname = test.testname;

		
        return( result );
    };
    
    var formHeight = dojo.isIE ? 310 : 340;
    
    context.gridStyle = "height: " + (getCurrentContext().screenHeight-formHeight) + "px;";
    
    context.loadTargetHandler = function(target){
        
        var tObj = anyWidgetById(mainId + 'channelid');
        
        if( tObj ){
            if( target.hasOwnProperty("channelid") && target.channelid > 0 ){
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
        fObj.loadTarget( {"channelid": ""} );
        
     
    var doFinally = function(){   
        var gObj = anyWidgetById(context.gridName);
        
        if( gObj ){
            gObj.setStore(context.store,context.getQueryStr());
        }
    }
    
    setTimeout(doFinally,500);
    
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
}
