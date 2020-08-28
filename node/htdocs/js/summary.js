/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildSummaryPage(parentId,pageId) {

	getCurrentContext().setBusy(true,getCurrentContext().UIProfileManager.getString("samplePageLoading"));
	
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
        	 //console.log("building Main page");
        	 
        	 internalBuildSummaryPage(parentId,pageId);

                 getCurrentContext().setBusy(false);
                //console.log("end build Main page");
         }
);
}

function internalBuildSummaryPage(parentId,pageId) {
var mainId = pageId;

var uiManager = getCurrentContext().UIProfileManager;

var restURL = uiManager.getSetting("mojoStoreUrl");

function loadTestSummaryData(callback){	
  var doLater = function(data){
      
      setBusy(false,false);
       
      if( callback ) callback(data);
  }
  let test = getCurrentContext().getCurrentTest().test;
  var theURL = restURL + "?action=GET&contenttype=SUMMARY&headeronly=true&testname=" + test.testname;

  doDeferredSend(theURL, doLater,getCurrentContext().UIProfileManager.getString("pleaseWait"));
}

var CONTENTTYPE = "SUMMARY";
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
    context.clearLabel = uiManager.getString("clearSummary");
    context.duplicateLabel = uiManager.getString("downloadTest");
    context.formCustomClass = "crudForm";
    context.autoQuery = false;
    context.params = {};

    var FIELDS = [
	
	{
        label: uiManager.getString("query_txt"),
        id: mainId + 'query_txt',
        name: mainId + 'query_txt',
        dataname: 'query_txt',
        type: 'TEXTBOX',
        integrated: true
    },
	{
        label: uiManager.getString("qtime"),
        id: mainId + 'qtime',
        name: mainId + 'qtime',
        dataname: 'qtime',
        type: 'NUMBERTEXTBOX',
        required: true,
        constraints: {min:1,max:1000000,places:0,pattern: "######"}
    }
    ];
    
    var GRIDCOLUMNS = [
    {
        name : uiManager.getString("query_txt"),
        field : 'query_txt',
        width : '55%'
    },
    {
        name : uiManager.getString("mscore"),
        field : 'matchscore',
        width : '5%'
    },
    {
        name : uiManager.getString("qtime"),
        field : 'qtime',
        width : '5%'
    },
    {
        name : uiManager.getString("qtimea"),
        field : 'qtimea',
        width : '5%'
    },
	{
        name : uiManager.getString("qtimeb"),
        field : 'qtimeb',
        width : '5%'
    },
    {
        name : uiManager.getString("rowcount"),
        field : 'rowcount',
        width : '5%'
    },
    {
        name : uiManager.getString("rowcounta"),
        field : 'rowcounta',
        width : '5%'
    },
    {
        name : uiManager.getString("rowcountb"),
        field : 'rowcountb',
        width : '5%'
    },
    {
        name : "",
        field : '',
        width : '60px', 
		formatter: function (rvalue,r,props) {  
			let rec = anyWidgetById(this.gridName).getItem(r);
			let value = rec.parentid;
			
			return new dijit.form.Button({label: "Compare", onClick: function () {  
              // getCurrentContext().setMainPageTab('mainmainresultscompare');
               getCurrentContext().setResultsPageTab('mainmainresultstabcontentformcompare');
			   let existsFunc = function(value,rec){
				if( getCurrentContext().setCompareSearchValue )
					getCurrentContext().setCompareSearchValue(value,rec);
				else
					setTimeout(existsFunc,1000,value,rec);
			   }
			   
			   setTimeout(existsFunc,100,this.value,this.rec);
			}.bind({value: value,rec: rec}) })  ;

		} .bind({gridName: context.gridName})  
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
    
    var formHeight = dojo.isIE ? 340 : 370;
    
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

    context.duplicateAction = function(e,oldRec,newRec)
    {
        //console.log('save: ' + newRec.channelid_s);
        console.log(newRec);
        let test = getCurrentContext().getCurrentTest().test;
        if( test.testname ){
            console.log(test.testname);
            var callback = function(data){
                console.log("testname: " + test.testname,data);
                let a = document.createElement("a");
                a.style.display = "none";
                document.body.appendChild(a);
                let type = "text/plain";
                // Set the HREF to a Blob representation of the data to be downloaded
                a.href = window.URL.createObjectURL(
                    new Blob([data], { type })
                );

                // Use download attribute to set set desired file name
                a.setAttribute("download", test.testname + "csv");

                // Trigger the download by simulating click
                a.click();

                // Cleanup
                window.URL.revokeObjectURL(a.href);
                document.body.removeChild(a);
            };

            var dataService = getDataService(restURL, callback, "", "");
                        var payload = {testname: test.testname};
                        payload.contenttype = "DOWNLOADSUMMARY";
                        payload.action = "GET";
                        dataService["post"](payload, payload,"text",{
                            "Content-Type" : "text/plain",
                            "Accept" : "text/plain"
                        });
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
