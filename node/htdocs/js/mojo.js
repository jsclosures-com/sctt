
var mojo = {};
mojo.data = {};
/*
 *  Initial UI Profile manager
 *  
 *  User getInstance() to load into current context the Singleton
 *  
 *  User API:
 *  
 *  getInstance:  create the singleton instance
 *  getString: will return a localized string 
 *  getSetting:  will return a top level attribute to the profile
 *  getHelp:  will return help for a given token
 *  
 */
 
mojo.data.UIProfileManager = {
cache: false,
profileData: false,
getInstance: function(responseData){
	mojo.data.UIProfileManager.profileData = dojo.clone(responseData);
    
	mojo.data.UIProfileManager.cache = {};
    
    getCurrentContext().UIProfileManager = mojo.data.UIProfileManager;
    //load the storemanager code
    mojo.data.StoreManager.getInstance();
                
    
    getCurrentContext().UIProfileManager.initializeUserPreferences();
    
    //set the theme if it exists in the data 
    /*var theme = getCurrentContext().UIProfileManager.getUserPreference("theme");
    if( theme ){
        setDocumentTheme(theme);
    }*/
    
    //ie8 accellator hack
    if( dojo.isIE )
        document.selected = false;
        
    if( true ){
        var origin = '';
        
        if( window.location.origin )
            origin = window.location.origin;
        else {
            origin = window.location.protocol + "//" + window.location.host;
        }
        
        mojo.data.UIProfileManager.profileData["mojoBaseUrl"] = origin + mojo.data.UIProfileManager.profileData["mojoBaseUrl"];
    }
        
    //load busy function into context
    getCurrentContext().setBusy = setBusy;
    
    return( mojo.data.UIProfileManager );
},
cacheObject: function(tag,obj){
  var pCache = getCurrentContext().UIProfileManager.cache;
  
  if( pCache ){
    pCache[tag] = obj;
  }
},
getCachedObject: function(tag){
  var result = false;
  var pCache = getCurrentContext().UIProfileManager.cache;
  
  if( pCache ){
     result = pCache[tag];
  }
  
  return( result );
},
getIsStandardDirection: function() {
    var result = true;
    
    var lang = getCurrentContext().UIProfileManager.getSetting("language");
    if( lang ){
        var cLang = getCurrentContext().UIProfileManager.getSetting("currentLanguage");
        var idx = indexOf(lang,"value",cLang);
        if( idx > -1 ){
            if( 'ltr' != lang[idx].direction )
                result = false;
        }
    } 
    
    return( result );
},
getLanguageSetting: function(settingName){
    var result = getCurrentContext().UIProfileManager.getSetting(settingName);
    
    var lang = getCurrentContext().UIProfileManager.getSetting("language");
    if( lang ){
        var cLang = getCurrentContext().UIProfileManager.getSetting("currentLanguage");
        var idx = indexOf(lang,"value",cLang);
        if( idx > -1 ){
            result = getCurrentContext().UIProfileManager.ensureString(lang[idx][settingName]);
        }
    } 
    
    return( result );
},
getData: function(){
    return( mojo.data.UIProfileManager.profileData );
},
getSetting: function(stringToken){
    var result = false;
    
    if( mojo.data.UIProfileManager.profileData && mojo.data.UIProfileManager.profileData[stringToken] )
        result = mojo.data.UIProfileManager.profileData[stringToken];
        
    return( result );
},
setSetting: function(stringToken,value){
    if( mojo.data.UIProfileManager.profileData )
        mojo.data.UIProfileManager.profileData[stringToken] = value;
        
    return( mojo.data.UIProfileManager.profileData[stringToken] );
},
getLocaleSetting: function(stringToken){
    var result = false;
    
    if( mojo.data.UIProfileManager.profileData && mojo.data.UIProfileManager.profileData.locale && mojo.data.UIProfileManager.profileData.locale[stringToken] )
        result = mojo.data.UIProfileManager.profileData.locale[stringToken];
        
    return( result );
},
getString: function(stringToken){
    var result = stringToken;
    
    if( mojo.data.UIProfileManager.profileData && mojo.data.UIProfileManager.profileData.translation && mojo.data.UIProfileManager.profileData.translation[stringToken] )
        result = mojo.data.UIProfileManager.profileData.translation[stringToken];
        
    return( result );
},
getCurrentTime: function(hoursApart){
    var startTime = new Date();
     var endTime = new Date();
    endTime.setTime(startTime.getTime() + (hoursApart*60*60*1000));
    var uiManager = getCurrentContext().UIProfileManager;
    
    var result = {starttime: uiManager.formatDate(startTime),endtime: uiManager.formatDate(endTime)};
    return( result );
},
getHelp: function(stringToken){
    var result = stringToken;
    
    if( mojo.data.UIProfileManager.profileData &&  mojo.data.UIProfileManager.profileData.help && mojo.data.UIProfileManager.profileData.help[stringToken] )
        result = mojo.data.UIProfileManager.profileData.help[stringToken];
        
    return( result );
},
normalizeName: function(str){
    return( str ? str.replace(" ","_").replace(".","_") : "" );  
},
formatTimeStamp: function(timeStamp){
    var result = timeStamp;
    
    try {
        var tDate = getCurrentContext().UIProfileManager.strictParseDate(result,".");
        var tFStr = getCurrentContext().UIProfileManager.getUserPreference("resultDateFormat");
        var idx = tFStr.indexOf(" ");
        var params;
        if( idx > -1 )
            params = {datePattern: tFStr.substring(0,idx),timePattern: tFStr.substring(idx+1)};
        else
            params = {datePattern: tFStr};
            
        result = dojo.date.locale.format(tDate,params);
    }
    catch(ex){
        console.log("invalid date");
        result = timeStamp;
    }
    
    return( result );
},
formatDate: function(tDate){
    var result = tDate;
    
    try {

    	var tFStr = getCurrentContext().UIProfileManager.getUserPreference("resultDateFormat");
        var idx = tFStr.indexOf(" ");
        var params;
        if( idx > -1 )
            params = {datePattern: tFStr.substring(0,idx),timePattern: tFStr.substring(idx+1)};
        else
            params = {datePattern: tFStr};
            
        result = dojo.date.locale.format(tDate,params);
    }
    catch(ex){
        console.log("invalid date");
        result = tDate;
    }
    
    return( result );
},
validateInput: function(val){
  return(   new RegExp(/^[s-zS-Z][a-hA-H][0-9]$/).test(val) ||
            !(new RegExp(/^<script>(.*?)$/).test(val) ||
              new RegExp(/^src[\r\n]*=[\r\n]*\\\'(.*?)\\\'$/).test(val) ||
              new RegExp(/^src[\r\n]*=[\r\n]*\\\"(.*?)\\\"$/).test(val) ||
              new RegExp(/^script>$/).test(val) ||
              new RegExp(/^<script(.*?)>$/).test(val) ||
              new RegExp(/^eval\\((.*?)\\)$/).test(val) ||
              new RegExp(/^javascript:$/).test(val) ||
              new RegExp(/^vbscript:$/).test(val) ||
              new RegExp(/^onload(.*?)=$/).test(val)) 
        );  
},
calculateUTF8Length: function(str){
  var result = 0;
  
  if( str ){
    result = unescape(encodeURIComponent(str)).length;   
  }
  
  return( result );
},
normalizePercentage: function(value){
    var result = !isNaN(value) ? dojo.number.format(value/100,{places: 2}) + "%" : "--";
    return( result );
},
capitalizeString: function(str)
{
    return( str.charAt(0).toUpperCase() + str.slice(1)) ;
},
parseDate: function(dateStr,timeDelimiter){
    var tDate = this.ensureString(dateStr).split("T");
    var d = tDate[0].split("-");
    var t = tDate[1].split(timeDelimiter ? timeDelimiter : ":");
    //console.log(d[0] + " " + d[1] + " " + d[2] + " " + t[0] + " " + t[1] + " " + t[2] + " ");
    var month = d[1].length > 1 && d[1].charAt(0) == '0' ? d[1].substring(1) : d[1];
    
    var date = new Date(d[0],parseInt(month)-1,d[2],t[0],t[1],0);

    return( date );
},
strictParseDate: function(dateStr){
    var tDate = this.ensureString(dateStr).split("T");
    var d = tDate[0].split("-");
    var t = tDate[1].split(/[\/ .:]/);
    //console.log(d[0] + " " + d[1] + " " + d[2] + " " + t[0] + " " + t[1] + " " + t[2] + " ");
    var month = d[1].length > 1 && d[1].charAt(0) == '0' ? d[1].substring(1) : d[1];
    
    var date = new Date(d[0],parseInt(month)-1,d[2],t[0],t[1],t[2]);

    return( date );
},
reparseDate: function(dateStr,timeDelimiter){
    var tDate = this.ensureString(dateStr);
   
    return( getCurrentContext().stamp.fromISOString(tDate) );
},
ensureInteger: function(tValue){
    if( tValue != undefined && !isNaN(tValue) )
        return( typeof tValue != "integer" ? parseInt(tValue) : tValue );
    else
        return( 0 );
},
ensureString: function(tValue){
    if( tValue != undefined )
        return( typeof tValue != "string" ? "" + tValue : tValue );
    else
        return( "" );
},
ensureBoolean: function(tValue){
    if( tValue != undefined )
        return( typeof tValue != "boolean" ? ("" + tValue).toLowerCase() == "true" : tValue );
    else
        return( false );
},
finalizeUserPreferences: function(){
    var result = getCurrentContext().UIProfileManager.getUserPreferences();
    
    //console.log("setting secondary preferences specifically items loaded in locale");
    
    if( !result.hasOwnProperty("resultDateFormat") ){
      if( getCurrentContext().UIProfileManager.getLocaleSetting("resultDateFormat") )
        result["resultDateFormat"] = getCurrentContext().UIProfileManager.getLocaleSetting("resultDateFormat")[0].value;
    }
    
    return( result );
},
getDefaultUserPreferences: function(baseArgs){
    var result = baseArgs ? baseArgs : {};
    
    //console.log("setting default preferences " + baseArgs);
    if( !result.hasOwnProperty("theme") || !result["theme"] )
      result["theme"] = getCurrentContext().UIProfileManager.getSetting("theme")[0].value;

    return( result );
},
getUserPreference: function(preferenceName){
    var result = getCurrentContext().userPreferences[preferenceName];
    
    return( result );
},
getUserPreferences: function(){
    var result = getCurrentContext().userPreferences;
    
    return( result );
},
initializeUserPreferences: function(){
  var defaults = getCurrentContext().UIProfileManager.getDefaultUserPreferences();
  getCurrentContext().userPreferences = defaults;  
},
loadUserPreferences: function(callback,callbackArgs){

    var dataStoreParams = {
				"contenttype": "userpreference",
                                "pageSize": 150,
                                "totalItems": false
                          };
    var mStore = getCurrentContext().StoreManager.getQueryStore(dataStoreParams);
    
    var aUserQuery = null;
                        
    mStore.query(aUserQuery, {pageSize: 150})
    .then(function(data) {
            //;
            //console.log("success: " + data);
            if( !data || !data.items || data.items.length == 0 ){
                var defaults = {};
                
                //getCurrentContext().userPreferences = defaults;
            }
            else {
                //console.log("existing data: " + data.items[0].information);
                var newPrefs = dojo.fromJson(data.items[0].information);
                
                getCurrentContext().userPreferences = getCurrentContext().UIProfileManager.getDefaultUserPreferences(newPrefs);
                getCurrentContext().UIProfileManager.finalizeUserPreferences();
            }
            
            setBusy(false,false);
            
            if( callback )
                callback(callbackArgs);
            
    }, function(failureStatus) {
            //;
            //console.log("failure: " + failureStatus);
            setBusy(false,false);
            
            if( callback )
                callback(callbackArgs);
    });
},
updateUserPreference: function(name,value,callback){
    var tValue  = ""+value;
    
    if( !isNaN(tValue) ){
        if( getCurrentContext().UIProfileManager.isInteger(tValue) ) 
            tValue = parseInt(tValue);
        else
            tValue = parseFloat(tValue);
    }
    else if( tValue == "true" || tValue == "false" )
        tValue = tValue == "true" ? true : false;
        
    getCurrentContext().userPreferences[""+name] = tValue;
    
    if( callback )
        callback();
},
saveUserPreference: function(callback){
    var payload = dojo.toJson(getCurrentContext().userPreferences);
    
    var queryDataStoreParams = {
				"contenttype": "userpreference"
                          };
                          
                        
                        
    var mStore = getCurrentContext().StoreManager.getQueryStore(queryDataStoreParams);
    var aUserQuery = null;
    
    var updateRecord = function(jsonData,fcallback){
                var dataStoreParams = {
				"contenttype": "userpreference"
                              };
                              
                var mStore = getCurrentContext().StoreManager.getPutStore(dataStoreParams);
                var aUserQuery = { "userId": getCurrentContext().SessionManager.getAttribute("userId"),
                                    "information": jsonData};
                
                mStore.put(aUserQuery, {})
                .then(function(successStatus) {
                        //;
                        //console.log("success: " + successStatus);
                        fcallback();
                }, function(failureStatus) {
                        //;
                        //console.log("failure: " + failureStatus);
                        fcallback();
                });
            }
            
    var createRecord = function(jsonData,fcallback){
                var dataStoreParams = {
				"contentType": "userpreference"
                              };
                              
                var mStore = getCurrentContext().StoreManager.getAddStore(dataStoreParams);
                var aUserQuery = { "userId": getCurrentContext().SessionManager.getAttribute("userId"),
                                    "information": jsonData};
                
                mStore.add(aUserQuery, {"contentIsWrapped": false})
                .then(function(successStatus) {
                        //;
                        //console.log("success: " + successStatus);
                        fcallback();
                }, function(failureStatus) {
                        //;
                        //console.log("failure: " + failureStatus);
                        fcallback();
                });
            }
    
    mStore.query(aUserQuery, {pageSize: 150})
    .then(function(data) {
            //;
            //console.log("success so update: " + data);
            
            var doLater = function(){
                setBusy(false,false);
        
                if( callback )
                    callback();
            }

            if( data.items && data.items.length > 0 ){
                updateRecord(payload,doLater);
            }
            else {
                createRecord(payload,doLater);
            }
            
    }, function(failureStatus) {
            //;
            //console.log("failure so create: " + failureStatus);
            var doLater = function(){
                setBusy(false,false);
        
                if( callback )
                    callback();
            }

            createRecord(payload,doLater);
    });
    
},
shallowClone: function(frameData){
    var result = {};
    
    for (var p in frameData) {
        if (frameData.hasOwnProperty(p)) {
            result[p] = frameData[p];
        }

    }

    return result;
},
deepClone: function(frameData){
    var result = {};
    
    for (var p in frameData) {
        if (frameData.hasOwnProperty(p)) {
            result[p] = dojo.clone(frameData[p]);
        }

    }

    return result;
},
isInteger: function(n) {
   return ((typeof n==='number')&&(n%1===0));
},
isFloat: function(n) {
   return ((typeof n==='number')&&(n%1!==0));
},
isNumber: function(n) {
   return (typeof n==='number');
},
generateUUID: function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}
};

/**
 * cached data
 * 
 * user api:
 * 
 * getInstance:  create access to singleton instance and initialize
 * reset:  reset the cached data for a given key,  will re-get the data
 * purge:  rest all the keys,  no re-get of data will occure
 * getData:  get cached data based on a key (args.contenttype)
 * 
 * 
 */
mojo.data.CacheManager = {
cachedData: {},
dataQueue: {},
eventListeners: [],
archivePlayers: false,
getInstance: function(responseData){
    //console.log("init cache manager");
    getCurrentContext().CacheManager = mojo.data.CacheManager;
    
    //setup global key listener
    var tConnect = registerEventHandler(document.body, "onkeyup", function (e) {
        //console.log("keyup");
        getCurrentContext().modifierKey = false;
        getCurrentContext().modifierCode = false;
    });
    
    mojo.data.CacheManager.eventListeners.push(tConnect);
    
    var tConnect = registerEventHandler(document.body, "onkeydown", function (evt) {
        //console.log("keydown keycode: " + evt.keyCode);
        getCurrentContext().keyCode = evt.keyCode;
        
        if( evt.ctrlKey && evt.shiftKey )
            getCurrentContext().modifierCode = "controlshift";
        else if( evt.ctrlKey )
            getCurrentContext().modifierCode = "control";
        else if( evt.shiftKey )
            getCurrentContext().modifierCode = "shift";
            
        //if( getCurrentContext().modifierCode )
        //    console.log("keydown modifier: " + getCurrentContext().modifierCode);
        
    });
    
    mojo.data.CacheManager.eventListeners.push(tConnect);
    
    var preloadList = getCurrentContext().UIProfileManager.getSetting("preloadCachedData");
    
    if( preloadList ){
        dojo.forEach(preloadList,function(rec,i){
            getCurrentContext().CacheManager.getData({contenttype: rec.id});
        });
    }
    
    return( mojo.data.CacheManager );
},
preload: function(parentView){
    var uiManager = getCurrentContext().UIProfileManager;
    
    
},
purge:  function(args) {
    mojo.data.CacheManager.cachedData = {};
    mojo.data.CacheManager.dataQueue = {};
    
    if( mojo.data.CacheManager.eventListeners ){
        for(var i = 0;i < mojo.data.CacheManager.eventListeners.length;i++){
            deregisterEventHandler(mojo.data.CacheManager.eventListeners[i]);
        }
    }
    
    mojo.data.CacheManager.eventListeners = [];
    getCurrentContext().keyCode = false;
    getCurrentContext().modifierCode = false;
},
purgeType: function(args){
    mojo.data.CacheManager.cachedData[args.contenttype] = false;
},
reset: function(args){
    mojo.data.CacheManager.cachedData[args.contenttype] = false;
    getData(args);
},
queueGetData: function(args){
    if( !mojo.data.CacheManager.dataQueue[args.contenttype] )
        mojo.data.CacheManager.dataQueue[args.contenttype] = new Array();
                    
    mojo.data.CacheManager.dataQueue[args.contenttype].push(args);            
},
deQueueGetData: function(args){
    if( mojo.data.CacheManager.dataQueue[args.contenttype] ){
        var items = mojo.data.CacheManager.dataQueue[args.contenttype];
        
        for(var i = 0;i < items.length;i++){
            var tArgs = items[i];
            
            if( tArgs.callback ){
                tArgs.callback(dojo.clone(mojo.data.CacheManager.cachedData[args.contenttype]));
            }
        }
    }
    mojo.data.CacheManager.dataQueue[args.contenttype] = new Array();
},
getData:  function(args){
	//required attributes: query, callback, contenttype, http, scope, window
	var cContext = args.window.getCurrentContext();
	var cacheManager = cContext.CacheManager;
	var uihelper = cContext.UIProfileManager;
	
	if( !cacheManager.cachedData[args.contenttype] ){
		var doLater = function(response){
			var data = response;
			if( uihelper.ensureInteger(data.status) != 0 || !data.items || data.items.length < 1 ){
				if( !args.nocache )
					cacheManager.cachedData[args.contenttype] = false;
			}
			else {
				cacheManager.cachedData[args.contenttype] = data;
		    }
			
			args.callback(args,data);
		  }  
		  
		  //hack
		  //args.query.contenttype_s = args.query.contenttype;
		
			var tURL = cContext.UIProfileManager.getSetting("mojoStoreUrl");
			var dataType = "json";
			
			tURL += "?";
            
            var counter = 0;
            for(var p in args.query){
                if( args.query.hasOwnProperty(p) ){
                    if( counter > 0 )
                        tURL += "&";
                    tURL += p + "=" + args.query[p];    
                    counter++;
                }
            }

		  var options = {
                  url: tURL,
                  handleAs: dataType,
                  preventCache: true,
                  load: function(response, ioArgs){
                        doLater(response);
                  },
                  error: function(response, ioArgs){
                    console.log("error from store");
                  }
        };
        
	    //if( headers ){
	    //    options.headers = headers;
	    //}
    
    	//console.log("loading data into view ObjectSelector: " + tURL);
    	dojo.xhrGet( options);
	}
	else {
		args.callback(args,cacheManager.cachedData[args.contenttype]);
	}

},
purgeData: function(args){
	var cContext = args.window.getCurrentContext();
	var cacheManager = cContext.cacheManager;

	if( !args || !args.contenttype ){
		cacheManager.dataCache = {};
	}
	else if( cacheManager.dataCache[args.contenttype] ){
		cacheManager.dataCache[args.contenttype] = false;
	}
}

};

/**
 * user api to session for application:
 * 
 * user api:
 * 
 * getInstance:  get access to manager code.
 * createSession:  create a session
 * valdiateSession:  validate the session
 * deleteSession:  delete the session
 * doAPICall:  AJAX calls to store api,  maybe specific to auth server
 */
mojo.data.SessionManager = {
cachedData: false,
getAttribute: function(stringToken){
    var result = stringToken;
    
    if( mojo.data.SessionManager.cachedData && (mojo.data.SessionManager.cachedData[stringToken] || !isNaN(mojo.data.SessionManager.cachedData[stringToken]) ) )
        result = mojo.data.SessionManager.cachedData[stringToken];
        
    return( result );
},
setAttribute: function(stringToken,value){
    var result = value;
    
    if( !mojo.data.SessionManager.cachedData )
         mojo.data.SessionManager.cachedData = {};    
        
    mojo.data.SessionManager.cachedData[stringToken] = value;
        
    return( result );
},
setData: function(data){
    mojo.data.SessionManager.cachedData = data; 
    return( mojo.data.SessionManager.cachedData );
},
getInstance: function(responseData){
    
    getCurrentContext().SessionManager = mojo.data.SessionManager;
    
    return( mojo.data.SessionManager );
},
createSession: function(args){
    var cContext = getCurrentContext();
    var uiProfileManager = cContext.UIProfileManager;
    
	var url = uiProfileManager.getSetting("authUrl");
    
    var callback = function(data){
        //var ioArgs = xhrHandle.ioArgs;
        //var cookie = ioArgs.xhr.getResponseHeader("Set-Cookie");
        
        var doFinally = function(fData){
            var proxyData = {};
            
            if( fData && fData.user && fData.user.id ){
                proxyData.status = 1;
                
                if( !getCurrentContext().UIProfileManager.getSetting("debug") ){
                    var uData = fData.user;
                    
                    proxyData.userId = uData.id;
                    proxyData.alias = uData.username ? uData.username : uData.id;
                    proxyData.utcOffsetMins = 0;
					proxyData.role = fData.role;
                }
                else {
                    proxyData.userId = args.query.user;
                    proxyData.alias = args.query.user;
                    proxyData.utcOffsetMins = 0;
                }
            }
            else
                proxyData.status = 0;
            
            getCurrentContext().SessionManager.setData(dojo.clone(proxyData));
            
            args.callback(proxyData);
        }
        
        if( uiProfileManager.ensureInteger(data.status) == 1 ){
            
           // mojo.data.SessionManager.doGetAPICall(url,{},doFinally,getCurrentContext().UIProfileManager.getString("pleaseWait"));
			doFinally(data);
        }
        else {
            var proxyData = {};
            proxyData.status = 0;
            getCurrentContext().SessionManager.setData(dojo.clone(proxyData));
            
            args.callback(proxyData);
        }
        
    };
    
    var xhrHandle = mojo.data.SessionManager.doPostAPICall(url,args.query,callback,getCurrentContext().UIProfileManager.getString("pleaseWait"));
},
validateSession: function(args){
    var url = getCurrentContext().UIProfileManager.getSetting("validationUrl");
    
    var callback = function(data,res){
        
        var proxyData = {};
        if( data && data.status ){
            proxyData.status = 1;
            
            if( !getCurrentContext().UIProfileManager.getSetting("debug") ){
                var uData = data.user;
                
                proxyData.userId = uData.id;
                proxyData.alias = uData.username ? uData.username : uData.id;
                proxyData.utcOffsetMins = 0;
                proxyData.role = data.role;
            }
            else {
                proxyData.userId = args.query.user;
                proxyData.alias = args.query.user;
                proxyData.utcOffsetMins = 0;
                proxyData.role = "unknown";
            }
        }
        else
            proxyData.status = 0;
            
        getCurrentContext().SessionManager.setData(dojo.clone(proxyData));
        
        args.callback(proxyData);
    };
    
    mojo.data.SessionManager.doGetAPICall(url,{},callback,getCurrentContext().UIProfileManager.getString("pleaseWait"));
},
deleteSession: function(args){
    var url = getCurrentContext().UIProfileManager.getSetting("authUrl");
    //url += "?contenttype=AUTH";
    
    mojo.data.SessionManager.doDeleteAPICall(url,{},args.callback,getCurrentContext().UIProfileManager.getString("pleaseWait"));
},
doPostAPICall: function(theURL, queryArgs,callback,message)
{
     //console.log('doing api call to ' + theURL);
     var uiManager = getCurrentContext().UIProfileManager;
     
     var queryData =  queryArgs;
        
         var postData = dojo.toJson(queryData);

	getCurrentContext().setBusy(true,message);
	
         var result = dojo.xhrPost({
                        headers: { "Content-Type": "application/json", "Accept" : "application/json"},
                        url: theURL,
                        handleAs:'json',
                        postData: postData,
                        load: callback,
                        error: callback
                        });
         
        return( result );
     //console.log('completed deferredSend to ' + theURL);
},
doGetAPICall: function(theURL, queryArgs,callback,message)
{
     //console.log('doing api call to ' + theURL);


	getCurrentContext().setBusy(true,message);
	
     dojo.xhrGet(
     {
          url : theURL, 
          handleAs : 'json', 
          headers :  { "Content-Type" : "application/json" },
          content: queryArgs,
          load: callback,
          error: callback
     });


     //console.log('completed deferredSend to ' + theURL);
},
doDeleteAPICall: function(theURL, queryArgs,callback,message)
{
     //console.log('doing api call to ' + theURL);


	getCurrentContext().setBusy(true,message);
	
     dojo.xhrDelete(
     {
          url : theURL, 
          handleAs : 'json', 
          xxheaders :  { "Content-Type" : "application/json" },
          cccontent: queryArgs,
          load: callback,
          error: callback
     });


     //console.log('completed deferredSend to ' + theURL);
},
doAPICall: function(theURL, queryArgs,callback,message)
{
     //console.log('doing api call to ' + theURL);


	getCurrentContext().setBusy(true,message);
	
     var deferred = dojo.xhrGet(
     {
          url : theURL, handleAs : 'json', headers : 
          {
               "Content-Type" : "application/json"
          },
          content: queryArgs
     });
     deferred.then(callback);

     //console.log('completed deferredSend to ' + theURL);
}
};

mojo.data.StoreManager = {
getInstance: function(){
    getCurrentContext().StoreManager = mojo.data.StoreManager;
    
    return( mojo.data.StoreManager );
},
getStore: function(args){
    //args.type args.cameraView and args.query

    
    
    return( result );
},
cloneStore: function(store){
  var baseOptions = store.getBaseOptions();

  var result =  new mojo.util.mojoStore(getCurrentContext().UIProfileManager.deepClone(baseOptions));

  return( result ); 
},
getStoreInstance: function(params){
  return( new mojo.util.mojoStore(params) ); 
},
getAddStore: function(args){
    var defaultParams = dojo.clone(args);
    
    defaultParams["target"] = getCurrentContext().UIProfileManager.getSetting("mojoStoreUrl");
    
    var result = new mojo.util.mojoStore(defaultParams);

    return( result );
},
getPutStore: function(args){
    var defaultParams = dojo.clone(args);
    defaultParams["target"] = getCurrentContext().UIProfileManager.getSetting("mojoStoreUrl");
    
    var result = new mojo.util.mojoStore(defaultParams);

    return( result );
},
getRemoveStore: function(args){
    var defaultParams = dojo.clone(args);
    defaultParams["target"] = getCurrentContext().UIProfileManager.getSetting("mojoStoreUrl");
     
    var result = new mojo.util.mojoStore(defaultParams);

    return( result );
},
getQueryStore: function(args){
    var defaultParams = dojo.clone(args);
    defaultParams["target"] = getCurrentContext().UIProfileManager.getSetting("mojoStoreUrl");
     
    var result = new mojo.util.mojoStore(defaultParams);

    return( result );
},
purge: function(){
    //do clean up
},
updateUserPreferences: function(preferences,callback){
   var dataStoreParams = {
				"contentType": "userQuery",
				"idProperties": {"queryName":"queryName"}
                                };
    var mStore = getCurrentContext().StoreManager.getQueryStore(dataStoreParams);
    
    var aUserQuery = null;
                        
    mStore.query(aUserQuery, {pageSize: 150})
    .then(function(data) {
            //;
            //console.log("success: " + data);
            loadGridData(data.items);
    }, function(failureStatus) {
            //;
            //console.log("failure: " + failureStatus);
    });
} 
};



define(["dojo/_base/declare", 
		"dojo/_base/lang", 
		"dojo/_base/xhr", 
		"dojo/io-query", 
		"dojo/store/util/QueryResults",
		"dojo/_base/Deferred"
		], 
	function (declare, lang, xhr, ioQuery, QueryResults, Deferred) {
		return declare("mojo.util.mojoStore", null, {
			
			_baseOptions: false,
			constructor: function(options) {
				declare.safeMixin(this, options);
                this._baseOptions = options;
			},
			getBaseOptions: function(){
                return( this._baseOptions );
            },
			query: function(args){ 
				
				var dfr2 = new Deferred();
				
				var theURL = this.target;
				
				xhr.get({
					url: theURL,
                                        preventCache: true,
					handleAs: "json" 
				}).then(function(content) {
					//var items = {items: content.items};
					//items.totalItems = content.totalItems;
					//console.debug("MILSStore1:: items.totalItems : " + items.totalItems);
					dfr2.resolve(content);
				}, function(err) {
					var errMsg = null;
					try {
						errMsg = dojo.fromJson(err.responseText);
					}
					catch (e) {
						errMsg = {
							"status": {
								"success": false,
								"code": "UnexpectedError",
								"message": "Unable to establish connection to server. Please try again later or report error."
							}
						}
					}
					dfr2.reject(500);
				});
			
				
				return QueryResults(dfr2);
				
			}
			
		});
	}
);

require(["dojox/data/JsonRestStore"],function(){
	
	dojo.declare("com.ibm.JsonRestStoreMessage", dojox.data.JsonRestStore, 
			   {
			        fetch: function(args){
			            let newArgs = false;
						if(dojo.isObject(args.query)){
			                newArgs = dojo.objectToQuery(args.query);
			            }
			            var gObj = anyWidgetById(this.gridName);
			            
			            args.query = "?preventCache=";
			            
			            args.query += new Date().getTime();
			            args.query += "&contenttype=" + this.contenttype;
			            
			            args.query += "&_start=" + (gObj.currentPage()-1);
			            
			            args.query += "&_rows=" + (gObj.currentPageSize() ? gObj.currentPageSize() : 10);
			            
			            var sInfo = gObj.getSortProps();
			            if( sInfo && sInfo.length > 0 ){
			               args.query += "&_sort=" + sInfo[0].attribute.toLowerCase();
			               args.query +=  !sInfo[0].descending ? "&_ascending=true" : ""; 
			            }
			            else {
			                args.query += "&_sort=" + this.defaultfield;
			                args.query +=  "&_ascending=true"; 
			            }
						
						if( newArgs ){
							args.query += "&" + newArgs;
						}
			            
			            return dojox.data.JsonRestStore.prototype.fetch.apply(this,arguments);
			        },
			        _processResults : function (results, deferred)
			        {	
			             var nResults = results.items;
			             
			             var count = nResults.length;

			             if( results.hasOwnProperty("_totalItems") )
			                this.totalItems = results._totalItems;
			             else {
			            	 var gObj = anyWidgetById(this.gridName);
			                 var pSize = gObj.currentPageSize();
			                 var cPage = gObj.currentPage();
			                 
			            	 if( gObj ){
			            		 if( count < pSize ){
			            			 this.totalItems = (cPage*pSize);
			            		 }
			            		 else {
			            			 this.totalItems = (cPage*pSize)+1;
			            		 }
			            	 }
			            	 else {
			            		 this.totalItems = count;
			            	 }
			            	
			             }
			             
			             if( this.fakeid ){
				             dojo.forEach(nResults,function(entry,i){
				                 entry.id = this.fakeid == "auto" ? i+1 : entry[this.fakeid];
				             });
			             }
			             
			             
			             //setTimeout(focusWidget, 1);

			             return (
			             {
			                  totalCount : this.totalItems, count : count, items : nResults
			             });
			        },
			        totalItems: 0,
			        contenttype: "SAMPLE",
			        defaultfield: "languageid",
			        fakeid: false
			   });
	 });