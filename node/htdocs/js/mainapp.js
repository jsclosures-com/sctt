
/**
 * Build into the header the current user message and the logout button
 */
function buildHeader(args) {
    var context = {
    };

    context.mainDivName = args.mainContainerName;

    context.headerDivName = args.headerContainerName;
    context.footerDivName = args.footerContainerName;
    context.currentUser = 'currentuser';
    context.currentUserTab = 'settings';
    context.mainUserTab = 'main';
    context.logout = 'logout';
    context.callback = args.callback ;
    context.help = 'help';
    context.toolbar = 'toolbar';
    context.toolbarStyle = "width: 150px;float: right;position: relative;top: 0px;";

    context.message = getCurrentContext().UIProfileManager.getString("welcome").replace("${0}",getCurrentContext().SessionManager.getAttribute("alias"));

    buildApplicationHeader(context);
}

function buildFooter(args) {
    var context = {
    };

    context.mainDivName = args.mainContainerName;
    context.headerDivName = args.headerContainerName;
    context.footerDivName = args.footerContainerName;
    context.toolbar = 'toolbar';
    context.statusbar = 'statusbar';
    context.version = "4.0";
    
    buildApplicationFooter(context);
}

/** main starting point for an app.
 */
function buildMainApp(args) {

    
    //console.log("width: " + getCurrentContext().screenWidth + " height: " + getCurrentContext().screenHeight);

    var context = {
    };

    context.paddingX = globalAppPadX;
    context.paddingY = globalAppPadY;
    context.appDivName = args.mainContainerName;
    context.headerDivName = args.headerContainerName;
    context.footerDivName = args.footerContainerName;
    context.useDojo = false;
    context.tabHeight = 20;
    context.footerHeight = 20;

    var cContext = getCurrentContext();


    cContext.statusContainerName = args.footerContainerName;   
    
    context.style = 'height: ' + cContext.screenHeight + 'px; width: ' + cContext.screenWidth + 'px;';
    context.height = cContext.screenHeight;
    context.width = cContext.screenWidth;
    context.tabWidth = cContext.screenWidth;
    context.footerWidth = cContext.screenWidth;

    context.serviceURL = true;

    context.childrenContent = new Array();

    context.initializeChild = function (currentChild) {
    	var doLater = function(){
    		if( currentChild.buildwith ){
                var ev = function(e){
                    return( dojo.eval(e) );
                }
                ev(currentChild.buildwith)(context, currentChild.id, currentChild);
            }
    	}
    	
    	if( currentChild.loadfile ) {
    		require([currentChild.loadfile],
		     function(){
    			doLater();
		     });
    	}
    	else {
    		doLater();
    	}
    }

    context.startChild = function (currentChild) {
        var doLater = function(){  
            try{
                if ( anyWidgetById(currentChild.id)) {
                    anyWidgetById(currentChild.id).startChild();
                }
            }
            catch(exp){
                console.log(exp);
            }
        }
        //var de = new dojo.Deferred();
        //de.then(doLater);
        setTimeout(doLater,100);
    }

    context.stopChild = function (currentChild) {
        if (anyWidgetById(currentChild.id))
            anyWidgetById(currentChild.id).stopChild();
    }

    context.destroyChild = function (currentChild) {
        if (anyWidgetById(currentChild.id))
            anyWidgetById(currentChild.id).destroyChild();
    }

    context.initComplete = function (data) {
    
        buildHeader(args);
        buildFooter(args);
        
        context.reLoadScreenDimensions();
        //console.log("do init start ");

        var tTitle = getCurrentContext().UIProfileManager.getString("appName");
        
        if( !tTitle )
            tTitle = getCurrentContext().UIProfileManager.getSetting("appName");
        
        //console.log("check app title " + tTitle);

        if (tTitle) {
            var tObj = anyWidgetById(context.headerDivName);

            if (tObj) {
                //console.log("set app title " + tTitle);

                //tObj.set("label", tTitle);
                
                //var initialMessage = getCurrentContext().UIProfileManager.getString("initialSearch");
                //tObj.set("label", initialMessage);
            }
        }
        
        //set up the version
        
        
        var doLater = function(versionData){
            var footer = anyWidgetById(getCurrentContext().footerContainerName);
            
            if( footer && footer.lifecycle ){
                footer.lifecycle.setVersionData(versionData);
            }
            
            setBusy(false);
            
            if( true ){
                var preloadObjectList = getCurrentContext().UIProfileManager.getSetting("preloadObjects");
    
                if( preloadObjectList && preloadObjectList.length > 0 ){
                    
                    var rec = preloadObjectList[0];
                    
                    if( true ){
                        var cb = function(mode,args){
                            console.log("load others callback");
                            
                            var doFinally = function() {
                                                        //connectToRTM();
                                                        //connectToGeoLocation();
                                                        getCurrentContext().setCurrentView("main");
                                                    }

                            setTimeout(doFinally,1000);
                        }
                        var uiManager = getCurrentContext().UIProfileManager;
                        
                        showObjectDialog(uiManager.getString(rec.message),uiManager.getString(rec.message),cb,rec);
                    }
                    
                }
				else {
					getCurrentContext().setCurrentView("main");
				}
				
				anyWidgetById('apptitle').set('content',getCurrentContext().UIProfileManager.getString("applicationTitle"));
            }
            else {
                //connectToRTM();
                //connectToGeoLocation();
                getCurrentContext().setCurrentView("main");
				anyWidgetById('apptitle').set('content',getCurrentContext().UIProfileManager.getString("applicationTitle"));
            }
        }
        
        doDeferredSendByType('text',
                             "text/plain",
                             getCurrentContext().UIProfileManager.getSetting("versionUrl"), 
                             doLater,
                             getCurrentContext().UIProfileManager.getString("pleaseWait"));
        
        //console.log("do init complete ");

    }

    context.reLoadScreenDimensions = function () {
        //console.log("reload main dimensions");
        
        var cContext = getCurrentContext();

        context.style = 'height: ' + cContext.screenHeight + 'px; width: ' + cContext.screenWidth + 'px;';
        context.height = cContext.screenHeight;
        context.width = cContext.screenWidth;
        context.tabWidth = cContext.screenWidth;
        context.footerWidth = cContext.screenWidth;

        var mainApp = cContext.dom.byId(context.appDivName);
        dojo.style(mainApp, "width", (cContext.screenWidth) + 'px');
        dojo.style(mainApp, "height", (cContext.screenHeight) + 'px');

        var tHeaderDijit = dijit.byId(context.headerDivName);
        if( tHeaderDijit && tHeaderDijit.lifecycle && tHeaderDijit.lifecycle.resizeDisplay )
            tHeaderDijit.lifecycle.resizeDisplay();
        
        var tFooterDijit = dijit.byId(context.footerDivName);
        if( tFooterDijit && tFooterDijit.lifecycle && tFooterDijit.lifecycle.resizeDisplay )
            tFooterDijit.lifecycle.resizeDisplay();
    }
    
    var cContext = getCurrentContext();
    
    cContext.appDivName = context.appDivName;
    cContext.headerDivName = context.headerDivName;
    cContext.footerDivName = context.footerDivName;

    buildApplication(context);

    anyWidgetById(context.appDivName).start();
    
    return( {destroyChild: anyWidgetById(context.appDivName).destroyApp} );
}

