var globalAppPadX = 0;
var globalAppPadY = 60;

/** main starting point for an app.
 * 
 * The application needs the uiprofile.json, translations.json, and help.json before the
 * login page can load.  Once the page is loaded it should not be reloaded until the user
 * is complete with the application.
 * 
 * 
 * The index.html page simply calls launchApplication to the application.
 * 
 */
function launchApplication(args) {
	require(
			[ "dijit/registry", "dijit/dijit", "dojo/data/ItemFileReadStore",
					"dojo/store/Memory", "dojox/rpc/Service",
					"dojox/data/JsonRestStore", "dojox/layout/ContentPane",
					"dojox/fx/easing", "dojox/layout/TableContainer",
					"dojox/widget/DialogSimple", "dojox/widget/Dialog",
					"dijit/layout/ContentPane", "dijit/layout/TabContainer",
					"dijit/DropDownMenu", "dijit/form/DropDownButton",
					"dijit/MenuItem", "dijit/form/TextBox",
					"dijit/form/Select", "dijit/form/Button", "js/mojo.js",
					"js/uihelper.js", "js/login.js" ],

			function() {
				internLaunchApplication(args);
			});
}

function internLaunchApplication(args) {
	var mainId = args.id;
	var mainContainer = dojo.byId(mainId);
	var cContext = getCurrentContext();
	var domConstruct = cContext.domConstruct;

	loadScreenDimensions(globalAppPadX, globalAppPadY);

	var padY = 0;
	var padX = 0;
	//console.log("width: " + cContext.screenWidth + " height: " + cContext.screenHeight);
	dojo.style(mainContainer, "height", (cContext.windowHeight + padY) + 'px');
	dojo.style(mainContainer, "width", (cContext.windowWidth + padX) + 'px');

	buildBaseView();

	var resizing = false;

	var resizeDisplay = function(evt) {
		if (!resizing && !getCurrentContext().isBusy) {
			resizing = true;

			loadScreenDimensions(globalAppPadX, globalAppPadY);
			var cContext = getCurrentContext();
			//console.log("width: " + cContext.screenWidth + " height: " + cContext.screenHeight);

			dojo.style(mainContainer, "height", (cContext.windowHeight + padY)
					+ 'px');
			dojo.style(mainContainer, "width", (cContext.windowWidth + padX)
					+ 'px');

			var tMainApp = dojo.byId(cContext.mainContainerName);
			//console.log("main container: " + tMainApp + " from name: " + cContext.mainContainerName);
			if (tMainApp && tMainApp.resizeDisplay) {
				//console.log("call resizeDisplay on main");
				tMainApp.resizeDisplay(evt);
			}

			resizing = false;
		}
	}

	registerEventHandler(window, "onresize", resizeDisplay);
	registerEventHandler(mainContainer, "onresize", resizeDisplay);

	function buildBaseView() {

		cContext.paddingX = globalAppPadX;
		cContext.paddingY = globalAppPadY;
		cContext.loginContainerName = 'loginapp';
		cContext.headerContainerName = 'header';
		cContext.mainContainerName = 'mainwindow';
		cContext.footerContainerName = 'footer';
		var childList = [ cContext.headerContainerName,
				cContext.mainContainerName, cContext.footerContainerName ];

		var currentContainer = false;
		var showMain = false;
		var uiProfile = false;
		var retryCounter = 0;
		var initComplete = function(data, languageData) {

			//merge the uiprofile and the language data
			if (languageData) {
				getCurrentContext().UIProfileManager.setSetting("translation",
						languageData.translation);
				getCurrentContext().UIProfileManager.setSetting("locale",
						languageData.locale);
				getCurrentContext().UIProfileManager.setSetting("help",
						languageData.help);

				getCurrentContext().UIProfileManager.finalizeUserPreferences();

				//set document title
				document.title = getCurrentContext().UIProfileManager
						.getString("applicationTitle");
			}

			if (currentContainer && currentContainer.destroyChild)
				currentContainer.destroyChild();

			if (showMain) {
				//console.log("start loading main page");
				var afterInit = function() {
					mojo.data.CacheManager.getInstance(data);

					var doFinally = function() {
						dojo.empty(mainContainer);

						for (var i = 0, size = childList.length; i < size; i++) {
							if (true) {
								var newContainer = dojo.create('div');
								newContainer.setAttribute('id', childList[i]);

								domConstruct.place(newContainer, mainContainer,
										"" + i);
							}
						}

						var doLater = function() {

							//set the theme if it exists in the data 
							/*var theme = getCurrentContext().UIProfileManager.getUserPreference("theme");
							if( theme ){
							    setDocumentTheme(theme);
							}*/

							require(
									[ "js/mainapp.js" ],
									function() {
										currentContainer = buildMainApp({
											mainContainerName : cContext.mainContainerName,
											headerContainerName : cContext.headerContainerName,
											footerContainerName : cContext.footerContainerName,
											callback : logout
										});
									});
						}

						setTimeout(doLater, 1);
					}

					setTimeout(doFinally, 1);
				}

				getCurrentContext().UIProfileManager.loadUserPreferences(
						afterInit, {});

				//console.log("loading main page");
			} else {

				uiProfile = data;

				//console.log("start loading login page");

				dojo.empty(mainContainer);

				var sm = mojo.data.SessionManager.getInstance({});

				var checkCallback = function(xdata) {

					var proxyData = {};
					if (xdata && xdata.status) {
						proxyData.status = 1;
						retryCounter = 0;
					} else
						proxyData.status = 0;

					if (proxyData.status > 0) {
						showMain = true;

						initComplete(uiProfile, languageData);
					} else {
						var newContainer = dojo.create('div');
						newContainer.setAttribute('id',
								cContext.loginContainerName);

						domConstruct
								.place(newContainer, mainContainer, "first");

						var successCallback = function(responseData,
								responseStatus) {
							getCurrentContext().setBusy(false, false);
							if (responseData.status == 1) {
								//console.log("success");
								showMain = true;

								initComplete(uiProfile);
							} else {
								//console.log("failed to login");
								alert(getCurrentContext().UIProfileManager
										.getString("loginFailed"));
							}
						}

						var doLater = function() {
							currentContainer = buildLoginPage({
								id : cContext.loginContainerName,
								callback : successCallback,
								languageChangeCallback : languageChangeCallback
							});
						}

						setTimeout(doLater, 1);
						//console.log("loading login page");
					}
				}

				if (uiProfile.forceLogin || retryCounter > 1) {
					checkCallback({});
					retryCounter = 0;
				} else {
					sm.validateSession({
						callback : checkCallback
					});
					retryCounter++;
				}
			}

			getCurrentContext().setBusy(false);

		}

		function loadSupplementalUIProfileComplete(profileData) {

			var doLater = function(supplementalProfileData) {
				var mixedProfileData = dojo.mixin(profileData,
						supplementalProfileData);

				loadUIProfileComplete(mixedProfileData);
			}

			var supplementalURL = args.supplementalURL;

			doDeferredSend(supplementalURL, doLater, "Loading Configuration");
		}

		function loadUIProfileComplete(profileData) {

			//init the UIProfileManager
			mojo.data.UIProfileManager.getInstance(profileData);

			var doLater = function(languageData) {
				initComplete(profileData, languageData);
			}

			//console.log("starting up language");
			var languageList = mojo.data.UIProfileManager
					.getSetting("language");
			var languageFileName = languageList[0].value;

			loadLanguageFile(languageFileName, doLater);
		}

		function languageChangeCallback(args) {
			console.log("language change " + args.language);

			var doLater = function(languageData) {

				initComplete(getCurrentContext().UIProfileManager.getData(),
						languageData);
			}

			//console.log("starting up language");

			loadLanguageFile(args.language, doLater);
		}

		function loadLanguageFile(languageFileName, callback) {

			var doLater = function(languageData) {
				getCurrentContext().setBusy(false);
				callback(languageData);
			}
			//set langugage direction or unset it
			var lang = getCurrentContext().UIProfileManager
					.getSetting("language");
			if (lang) {
				var idx = indexOf(lang, "value", languageFileName);
				if (idx > -1) {
					document.dir = lang[idx].direction;
				} else
					document.dir = "ltr";
			}
			//console.log("starting up language");
			var translationsURL = getAPI().configurationPath;
			translationsURL += languageFileName;

			getCurrentContext().UIProfileManager.setSetting("currentLanguage",
					languageFileName);

			doDeferredSend(translationsURL, doLater, "Loading Language");
		}

		var startApp = function() {
			//console.log("starting up app");
			var uiProfileURL = getAPI().profileURL;

			if (args.supplementalURL)
				doDeferredSend(uiProfileURL, loadSupplementalUIProfileComplete,
						"Loading Application");
			else
				doDeferredSend(uiProfileURL, loadUIProfileComplete,
						"Loading Application");
		}

		var logout = function() {
			//console.log("logout");
			showMain = false;
			var sm = mojo.data.SessionManager.getInstance({});

			var doLater = function(data) {

				if (dojo.isIE) {
					window.location.reload();
				} else {
					getCurrentContext().CacheManager.purge();
					getCurrentContext().StoreManager.purge();

					initComplete(uiProfile);
				}
			}

			sm.deleteSession({
				callback : doLater
			});
		}

		getCurrentContext().logout = logout;

		startApp();
	}
}
