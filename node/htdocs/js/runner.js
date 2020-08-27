/**
 * Implement a view that will be used provide administrative control
 * 
 * 
 * @param pageId 
 */
function buildRunnerPage(parentId,pageId) {

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
        	 
        	 internalBuildRunnerPage(parentId,pageId);

                 getCurrentContext().setBusy(false);
                //console.log("end build Main page");
         }
);
}

function internalBuildRunnerPage(parentId,pageId) {
var mainId = pageId;

var uiManager = getCurrentContext().UIProfileManager;

var restURL = uiManager.getSetting("mojoStoreUrl");

var CONTENTTYPE = "RUNNER";

var context = {};
    context.mainId = mainId;
    context.customName = mainId + "customargs";
    context.template = '<div id="' + mainId + 'message"></div><div id="' + mainId + 'form"></div><div id="' + context.customName + '"></div><div id="' + mainId + 'controls"></div>' + '<div id="' + mainId + 'output"></div>';
    context.useDojo = false;
    
    context.gridName = mainId + "grid";
    context.formName = mainId + "form";
    context.controlsName = mainId + "controls";
    context.messageName = mainId + "message";
    context.showGrid = false;
    context.integrateGrid = false;
    context.saveLabel = uiManager.getString("runScript");
    context.formCustomClass = "crudForm";
    context.autoQuery = false;
    context.params = {};
    context.customLabel = uiManager.getString("clearMessages");
    
    var typeStoreData = {
        identifier : 'abbr', label : 'name', items : [
	{abbr : "testharvestscript", name : uiManager.getString('testharvestscript')},
	{abbr : "testcopyscript", name : uiManager.getString('testcopyscript')},
	{abbr : "testbuildscript", name : uiManager.getString('testbuildscript')},
	{abbr : "testextractscript", name : uiManager.getString('testextractscript')},
	{abbr : "testsummaryscript", name : uiManager.getString('testsummaryscript')}]
    };

    var typeStore = new dojo.data.ItemFileReadStore( {
        data : typeStoreData
    });
    function getTestFields(){
        let result = [];
        let test = getCurrentContext().getCurrentTest().test;
         
        for(let i in typeStoreData.items){
            if( currentType == typeStoreData.items[i].abbr){
                let commandStr = test[currentType+"_s"];
                if( commandStr ){
                    let commandList = commandStr.split(" ");
                    for(let c in commandList){
                        let tIdx;

                        if( (tIdx = commandList[c].indexOf("=")) > -1 ){
                            let fName = commandList[c].substring(0,tIdx);
                            let val = commandList[c].substring(tIdx+1);
                            let newArg = {name: mainId + fName,label: fName,dataname: fName,default: val};
                            result.push(newArg);
                        }
                        else {
                            result.push({name: mainId + commandList[c],label: commandList[c],dataname: commandList[c]});
                        }
                        
                    }
                }
                break;
            }
        }
        
        return( result );
    }
    function destroyArgumentForm(){
        let result = getTestFields();
        let form = dijit.byId(context.customName);
        if( form ){
            for(let i in result){
                let tChild = dijit.byId(result[i].name);
                try {
                form.removeChild(tChild);
                tChild.destroy();
                }
                catch(e){}
                deregisterDijitWidget(result[i].name);
            }
            form.destroy(true);
            dojo.empty(context.customName);
            deregisterDijitWidget(context.customName);
        }
        return( result );
    }
    function buildArgumentForm(){
        let result = getTestFields();
        let form = dijit.byId(context.customName);
        if( !form ){
         form = new dojox.layout.TableContainer({id: context.customName,
            showLabels: true,
            cols : 1,
            xorientation: 'horiz',
            labelWidth : 150,
            xcustomClass: 'formLabel',
            xstyle: "width: " + (getCurrentContext().screenWidth-170) + "px;height:" + (getCurrentContext().screenHeight-444) + "px;"
           },dojo.byId(context.customName));
        //form.set("showLabels","true");
        }
        for(let i in result){
            let newField;

            if( result[i].dataname == 'csvData'){
                newField = new dijit.form.SimpleTextarea({
                    id : result[i].name,
                    name : result[i].dataname,
                    label : result[i].label,
                    title : result[i].label,
                    type: result[i].dataname.toLowerCase() == 'password' ? 'password': '',
                    value: result[i].default,
                    rows : "8",
                    style: "width: 50%;"
                }, result[i].name);
            }
            else {
                newField = new dijit.form.TextBox({
                    id : result[i].name,
                    name : result[i].dataname,
                    label : result[i].label,
                    title : result[i].label,
                    type: result[i].dataname.toLowerCase() == 'password' ? 'password': '',
                    value: result[i].default,
                    style: "width: 50%;"
                }, result[i].name);
            }
            
            form.addChild(newField);
        }
        try {
            form.startup();
            //form.layout();
        } catch (exception) {
            
        }
        
        return( result );
    }
    var currentType = typeStoreData.items[0].abbr;
    function getFieldList(){
        let result = getTestFields();


        return( result );
    }
    function scriptChange(evt){
        console.log("changed",evt);
        destroyArgumentForm();
        currentType = evt;
        buildArgumentForm();
    }

    var FIELDS = [
	{
        label: uiManager.getString("testType"),
        id: mainId + 'testType',
        name: mainId + 'testType',
        dataname: 'type',
        type: 'SELECT',
        store: typeStore,
        searchAttr: 'name',
        onChange: scriptChange
    },
    {
        type: 'CUSTOM',
        name: mainId + "custom",
        label: "custom",
        list: getFieldList,
        buildField: function(field){
            var uiManager = getCurrentContext().UIProfileManager;
            var result = new dijit.layout.ContentPane({id: field.name,
                content:  uiManager.getString("customScriptArguments")
               });

            /*var result = new dojox.layout.TableContainer({id: field.name,
                                                                    showLabels: true,
                                                                    cols : 1,
                                                                    xorientation: 'horiz',
                                                                    labelWidth : 150,
                                                                    xcustomClass: 'formLabel',
                                                                    xstyle: "width: " + (getCurrentContext().screenWidth-170) + "px;height:" + (getCurrentContext().screenHeight-444) + "px;"
                                                                   });
           try {
            result.startup();
            } catch (exception) {
                //console.log('dojo 1.7.2 issue,  ignore ' + exception);
            }*/
            return( result );
        },
        readValue: function(field,target){
            let fieldList = field.list();

            for(let i in fieldList){
                var tObj = dijit.byId(fieldList[i].name);
                if( tObj )
                    target[fieldList[i].dataname] = tObj.attr("value");
            }
        },
        writeValue: function(field,target){
            let fieldList = field.list();

            for(let i in fieldList){
                var tObj = dijit.byId(fieldList[i].name);
                if( tObj )
                    tObj.attr("value",!target[fieldList[i].dataname] ? fieldList[i].default : target[fieldList[i].dataname]);
            }
        }
    }
    ];
    
    
    
			  
    
    
    context.fieldList = FIELDS;
    //auto selected record
    context.target = {};
	
	context.preLoadTarget = function(rec){
		console.log("load",rec);
	}
	function changeDataCallback(data) {
        //console.log("change data callback");
        var fObj = anyWidgetById(mainId);
       // console.log("main obj " + fObj);
        fObj.restartChild();
        
        //if( data && data.items && data.items.length > 0 )
        // fObj.loadTarget( {type: 'build'});
         
       if( data ) {
            if( data.status && data.status.message )
                fObj.setActionMessage(data.status.message);
            else 
                fObj.setActionMessage(data.message);
       }

        
        setBusy(false);
    }
   
    context.saveAction = function(e,oldRec,newRec)
    {
        //console.log('save: ' + newRec.channelid_s);
        
        if( newRec.type ){
            setBusy(true,uiManager.getString("pleaseWait"));
            
            var dataService = getDataService(restURL, changeDataCallback, "", "");
			let test = getCurrentContext().getCurrentTest().test;
			
            var payload = {type: newRec.type}; 
            
            let testFields = getTestFields();
            let inputStr = '';
            for(let i in testFields){
                let tName = testFields[i].dataname;
                if( i > 0 )
                    inputStr += " ";
                inputStr += tName + "=" + newRec[tName].replace(/ /g,'+');
            }
            payload.input = inputStr;
			payload.testname = test.testname;
			
            payload.contenttype = CONTENTTYPE;
            payload.action = "POST";
            console.log(payload);
            dataService["post"](payload, payload);
        }
        else {
            showAlertMessageDialog(uiManager.getString("runnerUnableToRun"));
        }
    };

    context.customAction = function(e,oldRec,newRec)
    {
        let tObj = dijit.byId(mainId + "output");
        tObj.attr("value",'');
    };
    
    var formHeight = dojo.isIE ? 450 : 480;
    
    
    context.loadTargetHandler = function(target){
        
       
    }
	
    buildForm(context);


    let messageField = new dijit.form.SimpleTextarea({
        id : mainId + "output",
        name : mainId + "output",
        label : uiManager.getString("outputMessages"),
        title : uiManager.getString("outputMessages"),
        rows: 20,
        xcolumns: 80,
        style: ""
    }, mainId + "output");


    function messageUpdateCallback(message){
        let tObj = dijit.byId(mainId + "output");
        let content = tObj.attr("value");
        tObj.attr("value",message + "\n" + content);
    }

    startMessageService({username: getCurrentContext().SessionManager.getAttribute("userId"),callback: messageUpdateCallback});
    
    var fObj = anyWidgetById(mainId);
        //console.log("main obj " + fObj);
        fObj.loadTarget( {"type": "build"} );
        
    var lifecycle = {};
    
    lifecycle.resizeDisplay = function(){

    }
    
    anyWidgetById(parentId).lifecycle = lifecycle;
	


}
