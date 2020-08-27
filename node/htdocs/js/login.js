function buildAuthPage(mainContext, mainId,currentChild) {

	require([
                    "dojo/parser",
                    "dijit/form/Button",
                    "dojox/widget/DialogSimple",
                    "dojox/widget/Dialog",
                    "dojo/fx/easing",
                    "dojox/layout/TableContainer",
                    "dijit/form/TextBox",
                    "dijit/form/Select",
                    "dojo/data/ItemFileReadStore",
                    "js/global.js"
         ], 
         function(){
        	 console.log("building Login page");
        	 
        	 internalBuildAuthPage(mainContext, mainId);
			 
                anyWidgetById(mainId).initChild();
                anyWidgetById(mainId).startChild();
                currentChild.started = true;
                console.log("end build Login page");
         }
);
}

function internalBuildAuthPage(mainContext, mainId) {

    var context = anyWidgetById(mainId);
    var loginForm = mainId + "form";
    
    console.log("login page context " + context + " in : " + mainId + " " + loginForm);

    if (context) {
        context.initChild = function () {
		  console.log("init login page");
		  var iHtml = '<div id="' + loginForm + '" style="width:  ' + (getCurrentContext().screenWidth-2) + 'px;height: ' + (getCurrentContext().screenHeight-2) + 'px;"></div>';
		  
                if( !context.useDojo ) 
                {
                        dojo.byId(mainId).innerHTML = iHtml;
                }
                else
                {
                        dijit.byId(mainId).attr("content",iHtml);
                }
                
                buildLoginPage({id: loginForm});
        }

        context.resizeDisplay = function () {
            console.log("resize login page: ");
		  
         var cContext = getCurrentContext();
		  
		  var tObj = dojo.byId(loginForm);
		dojo.style(tObj, "width", (cContext.screenWidth-2) + 'px');
		dojo.style(tObj, "height", (cContext.screenHeight-2) + 'px');
        }

        context.startChild = function () {
		console.log("start login page");
		
        }

        context.stopChild = function () {
		console.log("stop login page");
		
        }

        context.destroyChild = function () {
		console.log("destroy login page");
	   }

        console.log("added lifecycle handlers to login page context");
    }
}

function buildLoginPage(context){
	var mainId = context.id;
        var profileManager = getCurrentContext().UIProfileManager;
        
        var connectorList = new Array();
	var registeredWidgetList = new Array();
        
        var destroyChild = function () {
                //console.log("destroy login page");
        
                for(var i = 0;i < connectorList.length;i++)
                {
                    deregisterEventHandler(connectorList[i]);
                }
                
                for(var i = 0;i < registeredWidgetList.length;i++)
                {
                    deregisterDijitWidget(registeredWidgetList[i]);
                }
        }
                
        var result = {destroyChild: destroyChild};

		var outerContainer = new dojox.layout.TableContainer({id: mainId,cols: 1,showLabels: false,baseClass: "logincontainer"},dojo.byId(mainId));
		registeredWidgetList.push(outerContainer.id);
                //outerContainer.startup();

                result.container = outerContainer;
                
		var container = new dojox.layout.TableContainer({id: "loginapp-inner",showLabels: false,colspan: 1,cols: 2,baseClass: "loginpanel",showLabels: false});
		registeredWidgetList.push(container.id);
                outerContainer.addChild(container);
		//container.startup();
		//console.log("logo class: " + profileManager.getSetting("largeLogo"));
                
		var logo = new dijit.layout.ContentPane({id: "login_logo", colspan: 1,baseClass: profileManager.getSetting("largeLogo")});
		registeredWidgetList.push(logo.id);
		container.addChild(logo);
		
		var formContainer = new dojox.layout.TableContainer({id: "login_form",
                                                                     customClass: "loginTable",
                                                                     baseClass: "loginform",
                                                                     cols: 2,
                                                                     colspan: 1,
                                                                     showLabels: true});
		registeredWidgetList.push(formContainer.id);
                //formContainer.startup();
                
		container.addChild(formContainer);
	   
	     var titleMessage = new dijit.layout.ContentPane({id: "login_message",
                                                                baseClass: "loginmessage",
                                                                colspan: 2,
                                                                content: profileManager.getString("welcomeMessage")});
		registeredWidgetList.push(titleMessage.id);
                formContainer.addChild(titleMessage);

          var userField = new dijit.form.TextBox(
                      {
                          id: "login",
                          name: "login",
                          colspan: 2,
                          label: profileManager.getString("userName"),
                          title: profileManager.getString("userName")
                      }
                  );
               registeredWidgetList.push(userField.id);   
          
        formContainer.addChild(userField);
        
  
        var passwordField = new dijit.form.TextBox(
                      {
                          id: "password",
                          name: "password",
                          type: 'password',
                          colspan: 2,
                          label: profileManager.getString("password"),
                          title: profileManager.getString("password"),
                          onKeyPress: function(evt){
                              if ( evt && evt.keyCode == dojo.keys.ENTER) {
                                doLogin();
                              }
                          }
                      }
                  );
        
        registeredWidgetList.push(passwordField.id);
        
        formContainer.addChild(passwordField);
        
        
        var controlContainer = new dojox.layout.TableContainer({id: "loginapp-innercontrol",showLabels: false,colspan: 2,cols: 2,showLabels: false});
        registeredWidgetList.push(controlContainer.id);
        formContainer.addChild(controlContainer);
        

        var loginButton = new dijit.form.Button({
                label: "",
                name: "Login",
                innerHTML: profileManager.getString("login"),
                colspan: 1,
                showLabel: false,
                iconClass: "loginIcon",
                onClick: function(){
                    doLogin();
                }
        });
        
        registeredWidgetList.push(loginButton.id);
        controlContainer.addChild(loginButton); 

        var storeData =   {
            identifier: 'value',
            label: 'label',
            items: profileManager.getSetting("language")
        };
                                            
        var store = new dojo.data.ItemFileReadStore({
            data: storeData
        });
        var cLanguage = profileManager.getSetting("currentLanguage");
           
        var languageField = new dijit.form.Select(
                                                    {
                                                         id : "language", 
                                                         name : "language", 
                                                         label : profileManager.getString("language"), 
                                                         colspan: 1,
                                                         store : store, 
                                                         value: cLanguage,
                                                         searchAttr : "label", 
                                                         style: "padding-left: 10px;",
                                                         width:  "", 
                                                         onChange: function(evt){
                                                               var tLangObj = dijit.byId("language");
                                   
                                                               if( tLangObj ){
                                                                   var tLang = tLangObj.get("value");
                                                                   context.languageChangeCallback({language: tLang});
                                                               }
                                                         }
                                                    });
                                                    
           registeredWidgetList.push(languageField.id);
           controlContainer.addChild(languageField); 
        
           formContainer.startup();
	   container.startup();
	   controlContainer.startup();
	   
	   var footer = new dijit.layout.ContentPane({id: "login_footer",baseClass: "loginfooter",colspan: 1,content: "<a href=\"JavaScript:void(0)\" onClick=\"showHelpDialog(getCurrentContext().UIProfileManager.getHelp('login'));\">" + profileManager.getString("help") + "</a> | " + profileManager.getString("copyright")});
	   registeredWidgetList.push(footer.id);
	   outerContainer.addChild(footer);
	   
        outerContainer.startup();

        function doLogin() {
			  var queryFrame = {};
			   var user = dijit.byId('login').get('value');
			   var passwd = dijit.byId('password').get('value');
			   
           
			   if( user != null && user.length > 0 
						&& passwd != null && passwd.length > 0)
			  {
				   queryFrame.user = user;
				   queryFrame.password = passwd;
                                   
                                   var sm = mojo.data.SessionManager.getInstance(queryFrame);
                                   
                                   
                                   sm.createSession({query: queryFrame,callback: context.callback});
			  }
        }
        
        
        return( result );
}
