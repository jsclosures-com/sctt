/**
 * Controller section provides a single tab container and will take the context
 * the list of tab "children" to display.
 *
 * @param context
 */
function buildApplication(ctx) {
	var context = ctx;
	var registeredWidgets = new Array();
	var connectorList = new Array();
	var mainContainer = buildBaseView();

	function buildBaseView() {
		var cContext = getCurrentContext();
		var result = cContext.dom.byId(context.appDivName);

		if (result) {
			if (ctx.useDojo) {
				result = new dijit.layout.TabContainer({
					id : context.appDivName,
					style : context.style,
					preload : true
				}, cContext.dom.byId(context.appDivName));
				registeredWidgets.push(result);

				var tConnect = registerEventHandler(result, "selectChild",
						tabListener);

				connectorList.push(tConnect);

			} else {
				/*result = buildTabContainer({
					id : context.appDivName,
					applicationContext : context,
					tabHeight : context.tabHeight,
					tabWidth : context.tabWidth,
					style : context.style,
					width : context.width,
					height : context.height,
					clicklistener : tabListener
				});*/
				context.id = context.appDivName;
				context.clicklistener = tabListener;
				context.applicationContext = context;
				
				result = buildTabContainer(context);
			}

			result.start = function() {
				internalStart();
			}

			result.startTab = function(tabID) {
				internalStartTab(tabID);
			}

			result.restart = function() {
				internalRestart();
			}

			result.destroyApp = function() {
				internalDestroy();
			}

			result.setDefaultTab = function(tabName) {
				internalSetDefaultTab(tabName);
			}

			result.getSelectedTabId = function() {
				return (ctx.useDojo ? result.selectedChildWidget.id : result
						.getSelectedIndex());
			}

			result.selectTab = function(tabId) {
				if (ctx.useDojo) {
					result.selectChild(anyWidgetById(tabId));
					internalStartTab(tabId);
				} else {
					result.selectHTML5Tab(tabId);
				}
			}

			var resizing = false;
			result.resizeDisplay = function(evt) {
				//console.log("resize main app " + resizing);

				if (!resizing) {
					resizing = true;
					if (ctx.reLoadScreenDimensions)
						ctx.reLoadScreenDimensions();

					for (var i = 0; i < context.childrenContent.length; i++) {
						if (ctx.useDojo) {
							if (dijit.byId(context.childrenContent[i].id).resizeDisplay) {
								dijit.byId(context.childrenContent[i].id)
										.resizeDisplay();
							}
						} else {
							if (cContext.dom
									.byId(context.childrenContent[i].id).resizeDisplay) {
								cContext.dom
										.byId(context.childrenContent[i].id)
										.resizeDisplay();
							}
						}
					}
					resizing = false;
					//console.log("resize main app complete " + resizing);
				}
			}
		}

		return (result);
	}

	function internalStart() {

		//mainContainer.startup();
		if (context.serviceURL) {
			var sm = mojo.data.SessionManager.getInstance({});

			sm.validateSession({
				callback : initCallback
			});
			//doDeferredSend(context.serviceURL, initCallback,"Please Wait...");
		} else
			//if no url is set then expect the context.childrenContent to be set to an array of tabs
			startController();
	}

	function internalStartTab(tabID) {
		startTab(context.childrenContent, tabID);

	}

	function internalRestart() {

		internalDestory();

		//deregisterDijitWidget(context.appDivName);
		//console.log('build base view');
		mainContainer = buildBaseView();
		//console.log('build base view complete');
		//mainContainer.startup();
		if (context.serviceURL) {
			var sm = mojo.data.SessionManager.getInstance({});
			sm.validateSession({
				callback : initCallback
			});
			//doDeferredSend(context.serviceURL, initCallback,"Please Wait...");
		} else
			//if no url is set then expect the context.childrenContent to be set to an array of tabs
			startController();
	}

	function internalDestroy() {
		var cContext = getCurrentContext();

		if (context.childrenContent) {
			if (ctx.useDojo) {
				var g = dijit.registry.byId(context.appDivName);
				var tWidget;

				for (var i = 0; i < context.childrenContent.length; i++) {
					if (context.childrenContent[i].started) {
						context.stopChild(context.childrenContent[i]);
						context.childrenContent[i].started = false;
					}
					if (context.childrenContent[i].initialized) {
						context.destroyChild(context.childrenContent[i]);
						context.childrenContent[i].initialized = false;
					}
					tWidget = dijit.byId(context.childrenContent[i].id);
					//console.log('cleaning up ' + context.childrenContent[i].id + ' ' + tWidget);

					g.removeChild(tWidget);
					deregisterDijitWidget(context.childrenContent[i].id);
					//tWidget.destroy();
					//console.log('clean up complete ' + context.childrenContent[i].id + ' ' + tWidget);
				}
			} else {
				var g = cContext.dom.byId(context.appDivName);

				for (var i = 0; i < context.childrenContent.length; i++) {
					if (context.childrenContent[i].started) {
						context.stopChild(context.childrenContent[i]);
						context.childrenContent[i].started = false;
					}
					if (context.childrenContent[i].initialized) {
						context.destroyChild(context.childrenContent[i]);
						context.childrenContent[i].initialized = false;
					}
					//console.log('cleaning up ' + context.childrenContent[i].id);

					try {
						g.removeChild(context.childrenContent[i]);
					} catch (exp) {
						//console.log("unable to remove child " + context.childrenContent[i].id);
					}

					//console.log('clean up complete ' + context.childrenContent[i].id);
				}
			}
		}

		for (var i = 0; i < connectorList.length; i++) {
			deregisterEventHandler(connectorList[i]);
		}

		for (var i = 0; i < registeredWidgets.length; i++) {
			deregisterDijitWidget(registeredWidgets[i]);
		}

		var tHeader = anyWidgetById(context.headerDivName);

		if (tHeader && tHeader.lifecycle)
			tHeader.lifecycle.destroyChild();

		var tFooter = anyWidgetById(context.footerDivName);

		if (tFooter && tFooter.lifecycle)
			tFooter.lifecycle.destroyChild();

		if (!context.useDojo) {
			var tContainer = anyWidgetById(context.appDivName)
			dojo.empty(tContainer);
		}
	}

	function findChildContent(children, childID) {
		var idx = -1;

		for (var i = 0; i < children.length; i++) {
			if (children[i].id == childID) {
				idx = i;
				break;
			}
		}

		return (idx > -1 ? children[idx].content : "INVALIDCHILDCONTENT: "
				+ childID);
	}

	function findChild(children, childID) {
		var idx = -1;

		for (var i = 0; i < children.length; i++) {
			if (children[i].id == childID) {
				idx = i;
				break;
			}
		}

		return (idx > -1 ? children[idx] : null);
	}

	function buildChild(currentChild) {
		currentChild.content = findChildContent(context.childrenContent,
				currentChild.id);

		currentChild.title = currentChild.name;
	}

	function tabListener(page) {
		//console.log('clicked tab ' + page.id);
		startTab(context.childrenContent, page.id);
	}

	function internalSetDefaultTab(tabName) {
		context.defaultTab = tabName;
	}

	function startController() {
		//console.log("starting controller");
		buildTabs(mainContainer, context.childrenContent);
		//console.log("build tab complete");
		mainContainer.startup();
		//console.log("tab startup");
		mainContainer.resize();
		//console.log("tab resize");
	}

	function initCallback(data) {
		//console.log('init callback');
		var cContext = getCurrentContext();

		cContext.setBusy(false, null);

		if (context.initCallback)
			context.initCallback(data);
		var role = cContext.SessionManager.getAttribute("role");

		if (role && role.views) {
			context.childrenContent = cContext.SessionManager
					.getAttribute("role").views;
		} else {
			context.childrenContent = cContext.UIProfileManager
					.getSetting("views");
		}

		if (data.status != 1) {

			if (ctx.callback) {
				ctx.callback();
			} else {
				doDeferredSend(getAPI().authURL + "?logout=true",
						function(data) {
							getCurrentContext().setBusy(false, null);
							//console.log('logout callback');
							window.location = '';
						}, getCurrentContext().UIProfileManager
								.getString("pleaseWait"));
			}

		} else {
			var defaultTab;

			for (var i = 0; i < context.childrenContent.length; i++) {
				buildChild(context.childrenContent[i]);
			}

			startController();

			if (context.initComplete)
				context.initComplete();
			else {
				if (context.childrenContent.length > 0) {
					startTab(context.childrenContent,
							context.defaultTab ? context.defaultTab
									: context.childrenContent[0].id);
				}
			}
		}
	}

	/**
	 * buiild tabs
	 * @param mainContainer
	 * @param children
	 */
	function buildTabs(mainContainer, children) {
		if (children) {
			//console.log('building tabs ' + children.length);

			var currentTab;
			for (var i = 0; i < children.length; i++) {
				currentTab = children[i];

				if (ctx.useDojo) {
					var newTab = new dijit.layout.ContentPane(currentTab);
					mainContainer.addChild(newTab);
					//dojo.addClass(cContext.dom.byId(currentTab.id),"iconhelp");
					registeredWidgets.push(currentTab.id);
				} else {
					//var newTab = new dijit.layout.ContentPane(currentTab);
					mainContainer.addChild(currentTab);
					//dojo.addClass(cContext.dom.byId(currentTab.id),"tabSearch");
					registeredWidgets.push(currentTab.id);
				}
			}
		}
	}

	/**
	 * start the tab ,  stop the previously running tab
	 * @param children
	 * @param tabId
	 */
	function startTab(children, tabId) {
		var nextTab;
		var previousTab;

		for (var i = 0; i < children.length; i++) {
			if (children[i].started) {
				previousTab = children[i];
			}

			if (children[i].id == tabId) {
				nextTab = children[i];
			}
		}

		if (previousTab) {
			previousTab.started = false;
			context.stopChild(previousTab);
		}

		if (nextTab) {
			if (!nextTab.initialized) {
				nextTab.initialized = true;
				context.initializeChild(nextTab);
				nextTab.started = true;
				/*var de = new dojo.Deferred();
				
				var doLater = new function(){
				    nextTab.started = true;
				    context.applicationContext.startChild(nextTab);
				}
				
				de.then(doLater);*/
			} else {
				if (nextTab.autoStart && !nextTab.started) {
					//console.log("auto start tab: " + nextTab.id);
					nextTab.started = true;
					context.startChild(nextTab);
				}
			}

			//getCurrentContext().purgeNextActions();
		}
	}
}

/**
 Build the form using information from the call back

 */
function buildForm(context) {

	var registeredWidgets = new Array();
	var changedWidgetName = false;
	var gridLayout = context.gridLayout;
	var fieldList = context.fieldList;
	var params = context.params;
	var gridStyle = context.gridStyle;
	var autoQuery = context.autoQuery;

	var mainId = context.mainId;
	var gridName = context.gridName;
	var formName = context.formName;
	var controlsName = context.controlsName;
	var messageName = context.messageName;

	var showGrid = context.showGrid;
	var target = context.target;
	var integrateGrid = context.integrateGrid;

	var form;
	var store;
	var cContext = getCurrentContext();

	buildBaseView();

	function buildBaseView() {
		if (!context.useDojo) {
			cContext.dom.byId(mainId).innerHTML = context.template;
		} else {
			dijit.byId(mainId).attr("content", context.template);
		}

		form = new dojox.layout.TableContainer({
			id : formName,
			cols : '1',
			showLabels: true,
			labelWidth : 150,
			customClass : context.formCustomClass ? context.formCustomClass
					: 'formLabel'
		}, cContext.dom.byId(formName));
		registeredWidgets.push(formName);

		for (var i = 0; i < fieldList.length; i++) {
			registeredWidgets.push(fieldList[i].name);
			var newField;

			if (fieldList[i].type == 'TEXTAREA') {
				newField = new dijit.form.SimpleTextarea({
					id : fieldList[i].name,
					name : fieldList[i].name,
					label : fieldList[i].label,
					tabindex : i + 1,
					rows : fieldList[i].rows ? fieldList[i].rows : "8",
					cols : fieldList[i].cols ? fieldList[i].cols : "80",
					xstyle : "width:auto;"
				}, fieldList[i].name);

			} else if (fieldList[i].type == 'RICHTEXTAREA') {
				/*var plugins = [
				'collapsibletoolbar', 'breadcrumb', 'newpage', 'save',
				{name: 'viewSource', stripScripts: true, stripComments: true}, 
				'showBlockNodes', '|',
				{name: 'fullscreen', zIndex: 900}, 'preview', 'print', '|',
				'findreplace', 'selectAll', 'cut', 'copy','paste', 'pastefromword', 'delete', '|', 'undo', 'redo', '|',
				'pageBreak', 'insertHorizontalRule', 'insertOrderedList', 'insertUnorderedList', 'indent', 'outdent', 'blockquote', '|',
				'justifyLeft', 'justifyRight', 'justifyCenter', 'justifyFull', 'toggleDir', '|',
				'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'foreColor', 'hiliteColor', 'removeFormat', '||',
				'fontName', {name: 'fontSize', plainText: true}, {name: 'formatBlock', plainText: true}, '||' ,
				'insertEntity', 'smiley', 'createLink', 'insertanchor', 'unlink', 'insertImage', '|', 
				{name: 'dojox.editor.plugins.TablePlugins', command: 'insertTable'},
				{name: 'dojox.editor.plugins.TablePlugins', command: 'modifyTable'},
				{name: 'dojox.editor.plugins.TablePlugins', command: 'InsertTableRowBefore'},
				{name: 'dojox.editor.plugins.TablePlugins', command: 'InsertTableRowAfter'},
				{name: 'dojox.editor.plugins.TablePlugins', command: 'insertTableColumnBefore'},
				{name: 'dojox.editor.plugins.TablePlugins', command: 'insertTableColumnAfter'},
				{name: 'dojox.editor.plugins.TablePlugins', command: 'deleteTableRow'},
				{name: 'dojox.editor.plugins.TablePlugins', command: 'deleteTableColumn'},
				{name: 'dojox.editor.plugins.TablePlugins', command: 'colorTableCell'},
				{name: 'dojox.editor.plugins.TablePlugins', command: 'tableContextMenu'}, 
				{name: 'prettyprint', indentBy: 3, lineLength: 80, entityMap: dojox.html.entities.html.concat(dojox.html.entities.latin)},
				{name: 'dijit._editor.plugins.EnterKeyHandling', blockNodeForEnter: "P"},
				'normalizeindentoutdent', 'normalizestyle', {name: 'statusbar', resizer: false}
				];*/

				newField = new dijit.Editor({
					id : fieldList[i].name,
					name : fieldList[i].name,
					label : fieldList[i].label,
					tabindex : i + 1,
					height : fieldList[i].height
				}, fieldList[i].name);

			} else if (fieldList[i].type == 'DATEFIELD') {
				newField = new dijit.form.SimpleTextarea({
					id : fieldList[i].name,
					name : fieldList[i].name,
					label : fieldList[i].label,
					tabindex : i + 1,
					rows : fieldList[i].rows ? fieldList[i].rows : "4",
					cols : fieldList[i].cols ? fieldList[i].cols : "20",
					xstyle : "width:auto;"
				}, fieldList[i].name);

			} else if (fieldList[i].type == 'COMBOBOX') {
				newField = new dijit.form.ComboBox({
					id : fieldList[i].name,
					name : fieldList[i].name,
					label : fieldList[i].label,
					tabindex : i + 1,
					store : fieldList[i].store,
					searchAttr : fieldList[i].searchAttr,
					queryExpr : fieldList[i].queryExpr,
					xstyle : "width:auto;"
				}, fieldList[i].name);

			} else if (fieldList[i].type == 'SELECT') {
				newField = new dijit.form.Select({
					id : fieldList[i].name,
					name : fieldList[i].name,
					label : fieldList[i].label,
					tabindex : i + 1,
					store : fieldList[i].store,
					searchAttr : fieldList[i].searchAttr,
					queryExpr : fieldList[i].queryExpr,
					width : fieldList[i].width ? fieldList[i].width : "",
					xstyle : "width:auto;",
					onChange : fieldList[i].onChange
				}, fieldList[i].name);

			} else if (fieldList[i].type == 'FILTERINGSELECT') {
				newField = new dijit.form.FilteringSelect(
						{
							id : fieldList[i].name,
							name : fieldList[i].name,
							maxHeight : 200,
							label : fieldList[i].label,
							tabindex : i + 1,
							store : fieldList[i].store,
							searchAttr : fieldList[i].searchAttr ? fieldList[i].searchAttr
									: "name",
							width : fieldList[i].width ? fieldList[i].width
									: "",
							xstyle : "width:auto;"
						});

			} else if (fieldList[i].type == 'NUMBERTEXTBOX') {
				newField = new dijit.form.NumberTextBox({
					id : fieldList[i].name,
					name : fieldList[i].name,
					label : fieldList[i].label,
					tabindex : i + 1,
					cols : fieldList[i].cols ? fieldList[i].cols : "20",
					constraints : fieldList[i].constraints,
					xstyle : "width:auto;"
				}, fieldList[i].name);
			} 
			else if (fieldList[i].type == 'ROTEXTBOX') {
				newField = new dijit.form.TextBox({
					id : fieldList[i].name,
					name : fieldList[i].name,
					label : fieldList[i].label,
					".readOnly": true,
					disabled: true,
					tabindex : i + 1,
					cols : fieldList[i].cols ? fieldList[i].cols : "20",
					xstyle : "width:auto;"
				}, fieldList[i].name);
			}
			else if (fieldList[i].type == 'CUSTOM') {
				newField = fieldList[i].buildField(fieldList[i]);
			}
			else {
				newField = new dijit.form.TextBox({
					id : fieldList[i].name,
					name : fieldList[i].name,
					label : fieldList[i].label,
					tabindex : i + 1,
					cols : fieldList[i].cols ? fieldList[i].cols : "20",
					style : fieldList[i].style ? fieldList[i].style : ""
				}, fieldList[i].name);
			}

			if( newField ){
				//form.domNode.appendChild(newField.domNode);
				if( newField.hasOwnProperty("length") ){
					for(let ii in newField){
						form.addChild(newField[ii]);
					}
				}
				else
					form.addChild(newField);
			}

			if (newField && integrateGrid && fieldList[i].integrated) {
				registerEventHandler(newField, "onKeyPress", formChangeAction);
			}
		}
		try {
			form.startup();
		} catch (exception) {
			//console.log('dojo 1.7.2 issue,  ignore ' + exception);
		}

		var pageContext = anyWidgetById(mainId);

		pageContext.initChild = function() {
			internalInitChild();
		}

		pageContext.loadTarget = function(rec) {
			
			internalLoadTarget(rec);
		}

		pageContext.loadTargetFromForm = function() {
			return (internalLoadTargetFromFrom());
		}

		pageContext.readForm = function() {
			return (internalReadForm());
		}

		pageContext.startChild = function() {
			internalStartChild();
		}

		pageContext.restartChild = function() {
			internalRestartChild();
		}

		pageContext.stopChild = function() {
			internalStopChild();
		}

		pageContext.destroyChild = function() {
			internalDestroyChild();
		}

		pageContext.resizeDisplay = function() {
			internalResizeDisplay();
		}

		pageContext.setActionMessage = function(message) {
			internalSetActionMessage(message);
		}

		var toolbar = new dijit.Toolbar({
			id : controlsName,
			style : "height: 30px;"
		}, cContext.dom.byId(controlsName));
		registeredWidgets.push(controlsName);

		if (!context.customToolbar) {

			var saveButton = new dijit.form.Button({
				label : context.saveLabel ? context.saveLabel : 'Save',
				showLabel : true,
				iconClass : "dijitEditorIcon dijitEditorIcon" + 'save',
				id : formName + 'save'
			});
			toolbar.addChild(saveButton);

			if (!context.saveLabel)
				hideDojoWidget(true, saveButton.id);

			registeredWidgets.push(saveButton.id);
			registerEventHandler(saveButton, "onClick", saveAction);

			var deleteButton = new dijit.form.Button({
				label : context.deleteLabel ? context.deleteLabel : 'Delete',
				showLabel : true,
				iconClass : "dijitEditorIcon dijitEditorIcon" + 'delete',
				id : formName + 'delete'
			});
			toolbar.addChild(deleteButton);

			if (!context.deleteLabel)
				hideDojoWidget(true, deleteButton.id);

			registeredWidgets.push(deleteButton.id);
			registerEventHandler(deleteButton, "onClick", deleteAction);

			var clearButton = new dijit.form.Button({
				label : context.clearLabel ? context.clearLabel : 'Clear',
				showLabel : true,
				iconClass : "dijitEditorIcon dijitEditorIcon" + 'clear',
				id : formName + 'clear'
			});
			toolbar.addChild(clearButton);

			if (!context.clearLabel)
				hideDojoWidget(true, clearButton.id);

			registeredWidgets.push(clearButton.id);
			registerEventHandler(clearButton, "onClick", clearAction);

			var duplicateButton = new dijit.form.Button({
				label : context.duplicateLabel ? context.duplicateLabel : 'Duplicate',
				showLabel : true,
				iconClass : "dijitEditorIcon dijitEditorIcon" + 'duplicate',
				id : formName + 'duplicate'
			});
			toolbar.addChild(duplicateButton);

			if (!context.duplicateLabel)
				hideDojoWidget(true, duplicateButton.id);

			registeredWidgets.push(duplicateButton.id);
			registerEventHandler(duplicateButton, "onClick", duplicateAction);

			var customButton = new dijit.form.Button({
				label : context.customLabel ? context.customLabel : 'Custom',
				showLabel : true,
				iconClass : "dijitEditorIcon dijitEditorIcon" + 'custom',
				id : formName + 'custom'
			});
			toolbar.addChild(customButton);

			if (!context.customLabel)
				hideDojoWidget(true, customButton.id);

			registeredWidgets.push(customButton.id);
			registerEventHandler(customButton, "onClick", customAction);
		} else
			context.customToolbar(toolbar);

		toolbar.startup();

		if (showGrid) {
			if (context.customGridRender) {
				context.customGridRender(gridName);
			} else {
				var store = false;

				if (context.store) {
					store = context.store;
				} else {
					store = new com.ibm.JsonRestStoreMessage(params);
					context.store = store;
				}

				var gridParams = {
					id : gridName,
					structure : gridLayout,
					style : gridStyle,
					xxrowSelector : 'auto',
					autoHeight : false,
					plugins : {
						pagination : {
							id : gridName + 'paging',
							style : "width: 100%;",
							position : context.gridPaging ? context.gridPaging
									: "top"
						}
					}
				};

				if (autoQuery)
					gridParams.store = store;

				registeredWidgets.push(gridName + 'paging');

				var grid = new dojox.grid.EnhancedGrid(gridParams, dojo
						.byId(gridName));

				grid.startup();
				//grid.render();
				registeredWidgets.push(gridName);

				registerEventHandler(grid, "onRowClick", onRowClick);
			}
		}

		if (messageName) {
			var dataMessage = new dijit.layout.ContentPane({
				id : messageName,
				style : "height: 30px;"
			}, cContext.dom.byId(messageName));
			registeredWidgets.push(messageName);
		}
	}

	function saveAction(e) {
		var fObj = dijit.byId(mainId);

		if (showGrid) {
			var gObj = dijit.byId(gridName);
			var items = gObj.selection.getSelected();
			//console.log("checking selected items " + items.length);
			if (items.length > 0 && items[0]) {
				var oldRec = items[0];
				var newRec = internalReadForm();
				newRec.id = oldRec.id;
				//console.log("existing item id: " + newRec.id);
				context.saveAction(e, oldRec, newRec);

				//fObj.restartChild();
			} else {
				//console.log("nothing selected");

				var newRec = internalReadForm();
				var oldRec = newRec;

				context.saveAction(e, oldRec, newRec);

				//fObj.restartChild();
			}
		} else {
			var oldRec = target;
			var newRec = internalReadForm();
			newRec.id = oldRec.id;

			context.saveAction(e, oldRec, newRec);

			target = newRec;
			if (fObj && fObj.restartChild)
				fObj.restartChild();
		}

	}

	function deleteAction(e) {
		var fObj = dijit.byId(mainId);

		if (showGrid) {
			var gObj = dijit.byId(gridName);
			var items = gObj.selection.getSelected();
			//console.log("checking selected items " + items.length);
			if (items.length > 0 && items[0]) {
				var oldRec = items[0];
				var newRec = internalReadForm();
				newRec.id = oldRec.id;
				//console.log("existing item id: " + newRec.id);
				context.deleteAction(e, oldRec, newRec);

				if (fObj && fObj.restartChild)
					fObj.restartChild();
			}
		} else {
			var oldRec = target;
			var newRec = internalReadForm();
			newRec.id = oldRec.id;

			context.deleteAction(e, oldRec, newRec);

			target = newRec;
			if (fObj && fObj.restartChild)
				fObj.restartChild();
		}

	}

	function duplicateAction(e) {
		var fObj = dijit.byId(mainId);

		if (showGrid) {
			var gObj = dijit.byId(gridName);
			var items = gObj.selection.getSelected();
			//console.log("checking selected items " + items.length);
			if (items.length > 0 && items[0]) {
				var oldRec = items[0];
				var newRec = internalReadForm();
				newRec.id = oldRec.id;
				//console.log("existing item id: " + newRec.id);
				context.duplicateAction(e, oldRec, newRec);

				//fObj.restartChild();
			} else {
				//console.log("nothing selected");

				var newRec = internalReadForm();
				var oldRec = newRec;

				context.duplicateAction(e, oldRec, newRec);

				//fObj.restartChild();
			}
		} else {
			var oldRec = target;
			var newRec = internalReadForm();
			newRec.id = oldRec.id;

			context.duplicateAction(e, oldRec, newRec);

			target = newRec;
			if (fObj && fObj.restartChild)
				fObj.restartChild();
		}

	}

	function customAction(e) {
		var fObj = dijit.byId(mainId);

		if (showGrid) {
			var gObj = dijit.byId(gridName);
			var items = gObj.selection.getSelected();
			//console.log("checking selected items " + items.length);
			if (items.length > 0 && items[0]) {
				var oldRec = items[0];
				var newRec = internalReadForm();
				newRec.id = oldRec.id;
				//console.log("existing item id: " + newRec.id);
				context.customAction(e, oldRec, newRec);

				//fObj.restartChild();
			} else {
				//console.log("nothing selected");

				var newRec = internalReadForm();
				var oldRec = newRec;

				context.customAction(e, oldRec, newRec);

				//fObj.restartChild();
			}
		} else {
			var oldRec = target;
			var newRec = internalReadForm();
			newRec.id = oldRec.id;

			context.customAction(e, oldRec, newRec);

			target = newRec;
			if (fObj && fObj.restartChild)
				fObj.restartChild();
		}

	}


	function clearAction(e) {
		//var fObj = dijit.byId(formName);
		//console.log('clear form');

		if (showGrid) {
			internalLoadTarget({});
			internalRestartChild();
		} else {
			internalLoadTarget({});
			internalRestartChild();
		}

	}

	function onRowClick(e) {
		//var row = digit.byId('gridElement').model.getRow(e.rowIndex);
		var gObj = dijit.byId(gridName);
		var items = gObj.selection.getSelected();
		//console.log("grid row click: " + items.length);

		if (items.length > 0) {
			var rec = items[0];
			target = rec;

			if (integrateGrid)
				internalLoadTarget(target);

			if (showGrid && integrateGrid && autoQuery) {
				var tQstr = context.getQueryStr(target);
				var grid = dijit.byId(gridName);
				grid.setQuery(tQstr);
				grid.render();
			}
			e.actualRecord = rec;

			context.gridRowClick(e);

		}
	}
	;

	function focusWidget() {
		if (changedWidgetName) {
			var tObj = dijit.byId(changedWidgetName);

			//var cur = [tObj.curStart,tObj.curEnd];
			//tObj.textbox.setSelectionRange(cur[1], cur[1]);
			tObj.focus();
			//tObj.bringToTop();
			// focusUtil.focus(dom.byId(changedWidgetName));
		}
	}

	function translateFieldName(fieldName) {
		var result = fieldName;

		for (var i = 0; i < fieldList.length; i++) {

			if (fieldList[i].name == fieldName) {
				result = fieldList[i].dataname;
				break;
			}
		}

		return (result);
	}

	function formChangeAction(e) {
		if (showGrid) {

			if (e.charOrCode != 9) {
				var newVal = e.target.value;
				var doRefresh = true;
				if (e.charOrCode == 8) {
					if (newVal.length > 0)
						newVal = newVal.substring(0, newVal.length - 1);
					else
						doRefresh = false;
				} 
				else
					newVal += e.keyChar;
				changedWidgetName = e.target.name;

				target[translateFieldName(changedWidgetName)] = newVal;

				var tObj = dijit.byId(changedWidgetName);
				//tObj.attr('value', newVal);

				if (doRefresh) {
					//console.log("refresh from form change");
					var tQstr = context.getQueryStr(target);
					var grid = dijit.byId(gridName);
					grid.setQuery(tQstr);
					grid.render();
				}
			}
		}
	}
	function internalSetActionMessage(message) {
		var tMObj = anyWidgetById(messageName);

		if (tMObj) {
			tMObj.set("content", message ? message : "");
		}
	}

	function internalInitChild() {
		//console.log("init child");
		if (target && target.id) {
			internalLoadTarget(target);
		}

		if (context.initCustom)
			context.initCustom();

	}

	function internalLoadTarget(rec) {
		target = rec;
		//console.log("loading target: " + target);
		if( context.preLoadTarget ) context.preLoadTarget(rec);
			
		for (var i = 0; i < fieldList.length; i++) {
			if( fieldList[i].hasOwnProperty("writeValue") ){
				fieldList[i].writeValue(fieldList[i],target);
			}
			else {
				var tObj = dijit.byId(fieldList[i].id);
				//console.log('load object name ' + tObj);
				if (tObj) {
					var dataName = translateFieldName(fieldList[i].name);
					tObj.attr('value', target[dataName] == undefined ? ''
							: target[dataName]);
				}
			}
		}
	}

	function internalLoadTargetFromForm() {
		for (var i = 0; i < fieldList.length; i++) {
			if( fieldList[i].hasOwnProperty("writeValue") ){
				fieldList[i].writeValue(fieldList[i],target);
			}
			else {
				var tObj = dijit.byId(fieldList[i].id);
				if (tObj) {
					var dataName = translateFieldName(fieldList[i].name);
					target[dataName] = tObj.attr('value');
				}
			}
		}

		return (target);
	}

	function internalReadForm() {
		var newTarget = {};

		for (var i = 0; i < fieldList.length; i++) {
			if( fieldList[i].hasOwnProperty("readValue") ){
				fieldList[i].readValue(fieldList[i],newTarget);
			}
			else {
				var tObj = dijit.byId(fieldList[i].id);
				if (tObj) {
					var dataName = translateFieldName(fieldList[i].name);
					newTarget[dataName] = tObj.attr('value');
				}
			}
		}

		return (newTarget);
	}

	function internalStartChild() {
		//console.log("start child");
		//form.startup();
		//toolbar.startup();
		if (showGrid && autoQuery) {
			internalRestartChild();
		}

		if (context.startCustom)
			context.startCustom();
	}

	function internalRestartChild() {
		//console.log("restart child");
		//form.startup();
		//toolbar.startup();
		if (showGrid) {
			//grid.startup();
			if (autoQuery) {
				var tQstr = context.getQueryStr(target);
				//console.log("setting grid query to " + tQstr);
				var grid = dijit.byId(gridName);
				grid.selection.clear();
				grid.setQuery(tQstr);
			} else {
				var tQstr = context.getQueryStr(target);
				//console.log("setting grid query to " + tQstr);
				var grid = dijit.byId(gridName);
				grid.selection.clear();
				grid.setStore(context.store, tQstr);
			}

			grid.render();
		}

		if (context.restartCustom)
			context.restartCustom();
	}

	function internalStopChild() {
		//console.log("stop child");
		//called each time the form is made invisible

		if (context.stopCustom)
			context.stopCustom();
	}

	function internalDestroyChild() {
		//console.log("destroy child");
		registeredWidgets = destroyRegisteredWidgets(registeredWidgets);

		if (context.destroyCustom)
			context.destroyCustom();
	}

	function internalResizeDisplay() {
		//console.log("resize child");

		if (context.resizeDisplayCustom)
			context.resizeDisplayCustom();
		else {
			var tGrid = dijit.byId(gridName);

			if (tGrid) {
				console.log("resizing grid " + tGrid.id);
				tGrid.resize();
				tGrid.update();
			}
		}
	}

	if (context.initChildComplete)
		context.initChildComplete(context);
}

function buildApplicationHeader(context) {
	var connectorList = new Array();
	var registeredWidgetList = new Array();

	var cContext = getCurrentContext();
	var controlBarWidth = cContext.UIProfileManager
			.getSetting("controlBarWidth");
	if (!controlBarWidth) {
		controlBarWidth = 400;
	}

	//console.log("adding header to " + context.headerDivName);
	var tHeader = new dojox.layout.TableContainer({
		id : context.headerDivName,
		showLabels : false,
		baseClass : "appheader",
		cols : 2,
		style : "width: " + (cContext.screenWidth) + "px;"
	}, context.headerDivName);
	registeredWidgetList.push(tHeader.id);

	var tTitle = new dijit.layout.ContentPane({
		id : "apptitle",
		colspan : 1,
		baseClass : "apptitle",
		style : "width: 100%;xwidth: "
				+ (cContext.screenWidth - controlBarWidth) + "px;",
		content : cContext.UIProfileManager.getString("pleaseWait")
	});
	registeredWidgetList.push(tTitle.id);

	tHeader.addChild(tTitle);

	var tViewFieldWrapper = new dojox.layout.TableContainer({
		id : tHeader.id + "app" + "wrapper",
		customClass : "headertoolbarTable",
		style : "",
		showLabels : false,
		colspan : 1,
		cols : 2
	});
	registeredWidgetList.push(tViewFieldWrapper.id);

	tHeader.addChild(tViewFieldWrapper);

	var currentUser = context.currentUser;

	var logoutId = context.logout;
	var helpId = context.help;
	var toolbarId = context.toolbar;

	var actionMenu = new dijit.DropDownMenu({
		id : toolbarId,
		style : "display: none;"
	});
	registeredWidgetList.push(actionMenu.id);

	var actionMenuHelp = new dijit.MenuItem({
		id : helpId,
		label : cContext.UIProfileManager.getString("help"),
		iconClass : "helpIcon",
		onClick : function() {
			showHelpDialog(cContext.UIProfileManager.getHelp(anyWidgetById(
					context.mainDivName).getSelectedTabId()));
		}
	});
	actionMenu.addChild(actionMenuHelp);
	registeredWidgetList.push(actionMenuHelp.id);

	if (cContext.UIProfileManager.getSetting("showCurrentUser")) {
		var actionMenuSettings = new dijit.MenuItem({
			id : currentUser,
			label : cContext.UIProfileManager.getString("userProfile"),
			iconClass : "userProfileIcon",
			onClick : function() {
				console.log("select tab " + context.currentUserTab);
				var uiManager = getCurrentContext().UIProfileManager;
				showPreferenceDialog(uiManager.getString("userPreferences"),
						"", false, false);

				/*if( anyWidgetById(context.mainDivName).getSelectedTabId() == context.mainUserTab )
				        anyWidgetById(context.mainDivName).selectTab(context.currentUserTab);
				else
				        anyWidgetById(context.mainDivName).selectTab(context.mainUserTab);*/

			}
		});
		actionMenu.addChild(actionMenuSettings);
		registeredWidgetList.push(actionMenuSettings.id);
	}

	if (cContext.UIProfileManager.getSetting("showLogout")) {
		var actionMenuLogout = new dijit.MenuItem({
			id : logoutId,
			label : cContext.UIProfileManager.getString("logout"),
			iconClass : "logoutIcon",
			onClick : function() {
				if (context.callback) {
					context.callback();
				}
			}
		});
		actionMenu.addChild(actionMenuLogout);
		registeredWidgetList.push(actionMenuLogout.id);
	}

	var actionField = new dijit.form.DropDownButton({
		id : toolbarId + "_action_button",
		baseClass : "appheadertoolbar",
		name : toolbarId + "_action_button",
		label : context.message,
		dropDown : actionMenu,
		style : cContext.UIProfileManager.getSetting("actionBarStyle")
	});
	actionField.startup();
	//tHeader.addChild(actionField);
	if (true || cContext.UIProfileManager.getIsStandardDirection()) {
		tViewFieldWrapper.addChild(actionField);
		registeredWidgetList.push(actionField.id);

		//tViewFieldWrapper.addChild(viewField);   
		//registeredWidgetList.push(viewField.id);
	} else {
		//tViewFieldWrapper.addChild(viewField);   
		//registeredWidgetList.push(viewField.id);

		tViewFieldWrapper.addChild(actionField);
		registeredWidgetList.push(actionField.id);
	}

	var tLogo = new dijit.layout.ContentPane({
		id : "appheader_logo",
		colspan : 1,
		baseClass : cContext.UIProfileManager.getSetting("smallLogo")
	});

	//tHeader.addChild(tLogo);
	tViewFieldWrapper.addChild(tLogo);

	registeredWidgetList.push(tLogo.id);

	var tLip = new dijit.layout.ContentPane({
		id : "appheader_lip",
		colspan : 2,
		baseClass : "appheader_lip"
	});

	tHeader.addChild(tLip);

	registeredWidgetList.push(tLip.id);

	tHeader.startup();

	//add lifecycyle methods

	var lifecycle = {};
	tHeader.lifecycle = lifecycle;

	lifecycle.initChild = function() {
		//console.log("init header: ");
	}

	lifecycle.resizeDisplay = function() {
		//console.log("resize header: ");
		var cContext = getCurrentContext();

		var tHeader = cContext.dom.byId(context.headerDivName);
		cContext.domStyle.set(tHeader, "width", (cContext.screenWidth) + 'px');

		var tTitleContainer = cContext.dom.byId("apptitle");

		if (tTitleContainer) {
			//console.log("resize view header: titleContainer");
			//cContext.domStyle.set(tTitleContainer,"width",(cContext.screenWidth - controlBarWidth) + "px");
		}

	}

	lifecycle.startChild = function() {
		//console.log("start header");

	}

	lifecycle.stopChild = function() {
		//console.log("stop header");
	}

	lifecycle.destroyChild = function() {
		//console.log("destroy header");

		for (var i = 0; i < connectorList.length; i++) {
			deregisterEventHandler(connectorList[i]);
		}

		for (var i = 0; i < registeredWidgetList.length; i++) {
			deregisterDijitWidget(registeredWidgetList[i]);
		}
	}
}

function buildApplicationFooter(context) {
	var mainId = context.footerDivName;
	//console.log("adding footer to " + mainId);
	var cContext = getCurrentContext();
	var statusName = mainId + "_status";
	var versionName = mainId + "_version";

	var tFooter = new dojox.layout.TableContainer({
		id : mainId,
		showLabels : false,
		cols : 2,
		baseClass : "appfooter",
		style : "width: 100%;height: 20px;"
	}, mainId);

	var tStatus = new dijit.layout.ContentPane({
		id : statusName,
		colSpan : 1,
		baseClass : "appfooterstatus",
		content : cContext.UIProfileManager.getString("status")
				+ cContext.UIProfileManager.getString("ready")
	});

	tFooter.addChild(tStatus);

	//var tMessage = new dijit.layout.ContentPane({id: messageName,colSpan: 1,baseClass: "appfootermessage", content: "-------------------------------------------"});

	//tFooter.addChild(tMessage);

	var tVersion = new dijit.layout.ContentPane({
		id : versionName,
		colSpan : 1,
		baseClass : "appfooterversion",
		content : cContext.UIProfileManager.getString("version")
				+ context.version
	});

	tFooter.addChild(tVersion);

	tFooter.startup();

	//add lifecycyle methods
	var connectorList = new Array();
	var registeredWidgetList = new Array();

	registeredWidgetList.push(tFooter.id);
	registeredWidgetList.push(tStatus.id);
	//registeredWidgetList.push(tMessage.id);
	registeredWidgetList.push(tVersion.id);

	var lifecycle = {};
	tFooter.lifecycle = lifecycle;

	lifecycle.initChild = function() {
		//console.log("init footer: ");
	}

	lifecycle.setData = function(statusData) {
		//console.log("set data on footer: " + statusData.message);

		var status = anyWidgetById(statusName);

		if (status && statusData) {
			var tMessage = statusData.message;

			if (!tMessage)
				tMessage = getCurrentContext().UIProfileManager
						.getString("ready");
			status.set("content", getCurrentContext().UIProfileManager
					.getString("status")
					+ tMessage);
		}
	}

	lifecycle.setVersionData = function(versionData) {
		//console.log("set data on footer: " + statusData.message);
		var version = anyWidgetById(versionName);

		if (version && versionData) {
			version.set("content", getCurrentContext().UIProfileManager
					.getString("version")
					+ versionData);
		}
	}

	lifecycle.resizeDisplay = function() {
		//console.log("resize footer: ");
		var cContext = getCurrentContext();

		var tFooterContainer = cContext.dom.byId(context.footerDivName);

		if (tFooterContainer) {
			//console.log("resize view footer: mainContainer");
			cContext.domStyle.set(tFooterContainer, "width",
					(cContext.screenWidth - 4) + "px");
		}

	}

	lifecycle.startChild = function() {
		//console.log("start footer");

	}

	lifecycle.stopChild = function() {
		//console.log("stop footer");
	}

	lifecycle.destroyChild = function() {
		//console.log("destroy footer");

		for (var i = 0; i < connectorList.length; i++) {
			deregisterEventHandler(connectorList[i]);
		}

		for (var i = 0; i < registeredWidgetList.length; i++) {
			deregisterDijitWidget(registeredWidgetList[i]);
		}
	}
}

function hideDojoWidget(hideMe, name) {
	getCurrentContext().domStyle.set(dijit.byId(name).domNode, {
		visibility : (hideMe ? 'hidden' : 'visible'),
		display : (hideMe ? 'none' : 'block')
	});
}

function registerEventHandler(node, eventName, callback) {
	return (dojo.connect(node, eventName, callback));
}

function deregisterEventHandler(handler) {
	dojo.disconnect(handler);
}

function doDeferredSend(theURL, callback, message) {
	//console.log('doing deferredSend to ' + theURL);
	doDeferredSendByType('json', "application/json", theURL, callback, message);
	//console.log('completed deferredSend to ' + theURL);
}

function doDeferredSendByType(handleAs, contentType, theURL, callback, message) {
	//console.log('doing deferredSend to ' + theURL);

	setBusy(true, message);

	var doLater = function(responseData) {
		//console.log("deferredSend callback");
		if (true)//dojo.isIE )
			callback(responseData);
		else
			setTimeout(callback, 1, responseData);

	}

	dojo.xhrGet({
		url : theURL,
		handleAs : handleAs,
		headers : {
			"Content-Type" : contentType
		},
		preventCache : true,
		load : doLater,
		error : doLater
	});

	//console.log('completed deferredSend to ' + theURL);
}

function deregisterDijitWidget(widgetName) {
	if (widgetName) {
		try {
			var widgetId;

			if (typeof widgetName == 'string')
				widgetId = widgetName;
			else
				widgetId = widgetName.id;

			if (dijit.registry.byId(widgetId)) {
				// dijit.byId("groupsGrid").destroyRecursive();
				var g = dijit.registry.byId(widgetId);
				g.destroyRecursive();
				//console.log(widgetId + " destroyed recursive");
			}
		} catch (anErr) {
			//console.log('delete ' + widgetName + ' has type of: ' + (typeof widgetName) + " id: "+ widgetId + ' error' + anErr.message );
		}
	} else
		console.log("invalid widget in registered list " + widgetName);
}

function deregisterDijitWidgetSimple(widgetName) {
	if (widgetName) {
		try {
			var widgetId;

			if (typeof widgetName == 'string')
				widgetId = widgetName;
			else
				widgetId = widgetName.id;

			if (dijit.registry.byId(widgetId)) {
				// dijit.byId("groupsGrid").destroyRecursive();
				var g = dijit.registry.byId(widgetId);
				g.destroy();
				//console.log(widgetId + " destroyed recursive");
			}
		} catch (anErr) {
			//console.log('delete simple ' + widgetName + ' has type of: ' + (typeof widgetName) + " id: "+ widgetId + ' error' + anErr.message );
		}
	} else
		console.log("invalid widget in registered list " + widgetName);
}

function anyWidgetById(widgetName) {
	var result = dijit.byId(widgetName);

	if (!result)
		result = getCurrentContext().dom.byId(widgetName);

	return (result);
}

function destroyRegisteredWidgets(registeredWidgets) {
	//console.log("destroy child");

	for (var i = registeredWidgets.length - 1; i >= 0; i--) {
		if (dijit.registry.byId(registeredWidgets[i])) {
			try {
				if (true)
					dijit.registry.byId(registeredWidgets[i])
							.destroyRecursive();
				else
					dijit.registry.byId(registeredWidgets[i]).destroy();
			} catch (anErr) {
				console.log("destroy exception " + registeredWidgets[i] + ' '
						+ anErr.message);
			}
		}
	}

	return (new Array());
}

function getDataService(target, callback, query, queryOptions) {

	// console.log("Test callback: ");
	// callback();

	var userService = function(query, queryOptions) {
		return dojo.xhrGet({
			url : target,
			handleAs : 'json',
			content : {
				query : query,
				queryOptions : queryOptions
			}
		});
	}

	userService.target = target;

	userService.put = function(changingItem, jsonData) //
	{
		//console.log("PUT URL: "+target);

		var put_data = dojo.toJson(jsonData);//buildGridJSON(cgrid, changingItem, column, value);
		//put_data = "[{\"id\":"+uid+", \"value\":\""+value+"\", \"column\":\""+column+"\"}]";
		return dojo.xhrPut({
			url : target,
			headers : {
				"Content-Type" : "application/json",
				"Accept" : "application/json"
			},
			load : function(data) {
				callback(data);
			},
			handleAs : 'json',
			putData : put_data
		});

	}

	userService.putstr = function(changingItem, jsonData) //
	{
		//console.log("PUT URL: "+target);

		var put_data = dojo.toJson(jsonData);//buildGridJSON(cgrid, changingItem, column, value);
		//put_data = "[{\"id\":"+uid+", \"value\":\""+value+"\", \"column\":\""+column+"\"}]";
		return dojo.xhrPut({
			url : target,
			headers : {
				"Content-Type" : "application/json",
				"Accept" : "application/json"
			},
			load : function(data) {
				callback(data);
			},
			handleAs : 'json',
			putData : put_data
		});

	}

	userService.post = function(changingObject, jsonData,handleAs,headers) {
		//console.log("Post URL: "+target);

		let post_data = dojo.toJson(jsonData);//buildGridJSON(cgrid, changingObject, "", "");

		let doFrame = {
							headers : {
								"Content-Type" : "application/json",
								"Accept" : "application/json"
							},
							url : this.target,
							load : function(data) {
								callback(data);
							},
							handleAs : 'json',
							postData : post_data
						};
		if( handleAs ){
			doFrame.handleAs = handleAs;
		}
		if( headers ){
			doFrame.headers = headers;
		}
		return dojo.xhrPost(doFrame);

	}

	userService['delete'] = function(changingObj, jsonData) {
		var post_data = dojo.toJson(jsonData);

		return dojo.xhrDelete({
			url : target,
			headers : {
				"Content-Type" : "application/json",
				"Accept" : "application/json"
			},
			load : function(data) {
				callback(data);
			},
			handleAs : 'json',
			content : {
			//action:"delete",
			//id: id
			},
			postData : post_data
		});
	}

	return userService;
}

/**
 * html 5
 * @param parentName
 * @param data
 */

function buildTabContainer(ctx) {
	var context = ctx;
	var registeredWidgets = new Array();
	var canvas;
	var ctx2d;
	var children = new Array();
	var setupComplete = false;
	var cellWidth = 30;
	var cellHeight = ctx.tabHeight;
	var selectedChildIdx = -1;
	var cContext = getCurrentContext();
	var mainContainer = buildBaseView();

	function buildBaseView() {
		var result = cContext.dom.byId(context.id);

		if (!setupComplete) {
			cContext.domStyle.set(result, context.style);

			if (cellHeight > 0) {
				var tConnect = registerEventHandler(result, "onclick",
						handleClick);
			}

			if (cellHeight > 0) {
				canvas = document.createElement('canvas');
				canvas.height = ctx.tabHeight;
				canvas.width = context.tabWidth;
				result.appendChild(canvas);
				ctx2d = canvas.getContext("2d");
			}

			result.selectHTML5Tab = function(tabId) {
				//console.log("html5 select child tab: " + tabId);
				selectChild(tabId);
			}

			result.getSelectedIndex = function() {
				return (children[selectedChildIdx].id);
			}

			//registerEventHandler(result, "selectChild", tabListener);
			result.addChild = function(newChild) {
				internalAddChild(newChild);
			}

			result.removeTab = function(tab) {
				//todo
			}

			result.startup = function() {
				redisplay();
			}

			result.resize = function() {
				//redisplay();
			}
			result.selectChild = function(desiredTab) {
				selectedChildIdx = findTabIndex(desiredTab);

				redisplay();
			}
			setupComplete = true;
		}

		return (result);
	}

	function internalAddChild(newChild) {
		children.push(newChild);

		var newStyle = "";

		if (children.length == 1) {
			newStyle += "visibility:visible;";
			newStyle += "display: block;";
			selectedChildIdx = 0;
		} else {
			newStyle += "visibility:hidden;";
			newStyle += "display: none;";
		}

		newStyle += "width:100%;";
		newStyle += "height:100%;";

		newStyle += "border: 0px solid black;";
		newStyle += "padding: 0px;";
		newStyle += "top: 0px;";
		newStyle += "left: 0px;";
		newStyle += "position: relative;";

		var newDiv = getCurrentContext().domConstruct.create('div', {
			id : newChild.id,
			//innerHTML: newChild.content,
			style : newStyle
		});

		//console.log("new child " + newChild.id + " main container width: " + context.width + " height: " + context.height);

		mainContainer.appendChild(newDiv);

		//dojo.attr(newDiv,"innerHTML",newChild.content);
		//newDiv.innerHTML = newChild.content;
	}

	function redisplay() {
		if (cellHeight > 0) {
			cellWidth = Math.floor(canvas.width / children.length);

			drawCanvas();
		}
	}

	function drawCanvas() {
		if (cellHeight > 0) {
			ctx2d.save();
			//ctx2d.fillStyle = "rgb(255,255,255)";
			//ctx2d.fillRect(0 + 1, 0 + 1, canvas.width - 2, canvas.height - 2)
			var currentRec;
			var uimanager = getCurrentContext().UIProfileManager;
			
			for (var i = 0; i < children.length; i++) {
				currentRec = children[i];
				ctx2d.fillStyle = currentRec.style;
				drawRectangle(ctx2d, i * cellWidth, 0, cellWidth, cellHeight);
				ctx2d.fillStyle = "rgb(0,0,0)";
				ctx2d.fillText(uimanager.getString(currentRec.name), i * cellWidth + 10, 10);
			}

			ctx2d.restore();
		}
	}

	function internalStartTab(tabId) {
		var nextTab;
		var previousTab;

		for (var i = 0; i < children.length; i++) {
			if (children[i].started) {
				previousTab = children[i];
			}

			if (children[i].id == tabId) {
				nextTab = children[i];
			}
		}

		if (previousTab) {
			previousTab.started = false;
			context.stopChild(previousTab);
		}

		if (nextTab) {
			if (!nextTab.initialized) {
				nextTab.initialized = true;
				context.initializeChild(nextTab);
				nextTab.started = true;

				/*var de = new dojo.Deferred();
				
				var doLater = new function(){
				    nextTab.started = true;
				    context.applicationContext.startChild(nextTab);
				}
				
				de.then(doLater);*/
			} else {
				if (nextTab.autoStart && !nextTab.started) {
					//console.log("auto start tab: " + nextTab.id);
					nextTab.started = true;
					context.startChild(nextTab);

				}
			}
			//getCurrentContext().purgeNextActions();
		}
	}

	function selectChild(childId) {
		console.log("select child tab: " + childId + " selected index: "
				+ selectedChildIdx);

		if (selectedChildIdx > -1
				&& cContext.dom.byId(children[selectedChildIdx].id)) {
			cContext.domStyle.set(cContext.dom
					.byId(children[selectedChildIdx].id), {
				left : "0px",
				top : "0px",
				visibility : "hidden",
				display : "none"
			});
		}
		selectedChildIdx = findTabIndex({
			id : childId
		});

		if (cContext.dom.byId(children[selectedChildIdx].id)) {
			cContext.domStyle.set(cContext.dom
					.byId(children[selectedChildIdx].id), {
				left : "0px",
				top : "0px",
				visibility : "visible",
				display : "inline"
			});
		}

		internalStartTab(childId);
	}

	function handleClick(evt) {
		//console.log('click ' + evt);

		var position = getMousePosition(evt);

		var dataIndex = findEntryOffset(position);

		if (dataIndex > -1) {
			//console.log('tab index is ' + dataIndex + ' selected index is ' + selectedChildIdx);

			if (selectedChildIdx > -1) {
				cContext.domStyle.set(cContext.dom
						.byId(children[selectedChildIdx].id), {
					left : "0px",
					top : "0px",
					visibility : "hidden",
					display : "none"
				});
			}
			selectedChildIdx = dataIndex;

			cContext.domStyle.set(cContext.dom.byId(children[dataIndex].id), {
				left : "0px",
				top : "0px",
				visibility : "visible",
				display : "inline"
			});

			var eventData = children[dataIndex];

			eventData.position = position;

			context.clicklistener(eventData);
		}
	}

	function findTabIndex(tabToFind) {

		var result = -1;

		var items = children;

		for (var i = 0; i < items.length; i++) {
			if (items[i].id == tabToFind.id) {
				result = i;
				break;
			}
		}

		return (result);
	}
	function findEntryOffset(position) {
		var result = -1;
		var items = children;
		var currentX = 0;
		//console.log("position: x: " + position.x + " y: " + position.y);
		for (var i = 0; i < items.length; i++) {
			if (position.y <= cellHeight && position.x >= currentX
					&& position.x <= (currentX + cellWidth)) {
				result = i;

				break;
			}

			currentX += cellWidth;
		}

		return (result);
	}

	function getMousePosition(evt) {
		var result = {
			x : 0,
			y : 0
		};

		if (cellHeight > 0) {
			result.x = evt.clientX - canvas.offsetLeft
					+ document.body.scrollLeft;
			result.y = evt.clientY - canvas.offsetTop + document.body.scrollTop;
		}

		return result;
	}

	return (mainContainer);
}

/**
 * drawing utils
 */
function drawRectangle(context, x, y, w, h) {
	context.beginPath();
	context.rect(x, y, w, h);
	context.closePath();
	context.stroke();
}

/** bus tools
 * */
function removePanelChangeListener(listener) {
	if (opener) {
		if (opener.getCurrentContext().panelChangeListeners) {
			var listeners = opener.getCurrentContext().panelChangeListeners;

			for (var i = 0; i < listeners.length; i++) {
				if (listeners[i].id == listener.id) {
					listeners.splice(i, 1);
					break;
				}
			}
		}
	} else {
		if (getCurrentContext().panelChangeListeners) {
			var listeners = getCurrentContext().panelChangeListeners;

			for (var i = 0; i < listeners.length; i++) {
				if (listeners[i].id == listener.id) {
					listeners.splice(i, 1);
					break;
				}
			}
		}
	}
}

function addPanelChangeListener(listener) {
	if (opener) {
		if (!opener.getCurrentContext().panelChangeListeners)
			opener.getCurrentContext().panelChangeListeners = new Array();

		opener.getCurrentContext().panelChangeListeners.push(listener);
	} else {
		if (!getCurrentContext().panelChangeListeners)
			getCurrentContext().panelChangeListeners = new Array();

		getCurrentContext().panelChangeListeners.push(listener);
	}

}

function firePanelChangeEvent(event) {
	if (opener) {
		if (opener.getCurrentContext().panelChangeListeners) {
			var listeners = opener.getCurrentContext().panelChangeListeners;

			for (var i = 0; i < listeners.length; i++) {
				if (listeners[i].panelChanged)
					listeners[i].panelChanged(event);
			}
		}
	} else {
		if (getCurrentContext().panelChangeListeners) {
			var listeners = getCurrentContext().panelChangeListeners;

			for (var i = 0; i < listeners.length; i++) {
				if (listeners[i].panelChanged)
					listeners[i].panelChanged(event);
			}
		}
	}

}

function addDefaultLifecycle(seedFrame, key) {
	var lifecycle = seedFrame;

	if (!lifecycle.resizeDisplay) {
		lifecycle.resizeDisplay = function() {
			//console.log("default resize do nothing " + key);
		}
	}
	if (!lifecycle.initChild) {
		lifecycle.initChild = function() {
			//console.log("init " + key);
		}
	}
	if (!lifecycle.startChild) {
		lifecycle.startChild = function() {
			//console.log("start " + key);
		}
	}
	if (!lifecycle.stopChild) {
		lifecycle.stopChild = function() {
			//console.log("stop " + key);
		}
	}

	if (!lifecycle.destroyChild) {
		lifecycle.destroyChild = function() {
			//console.log("destroy " + key);

			for (var i = 0; i < connectorList.length; i++) {
				deregisterEventHandler(connectorList[i]);
			}

			for (var i = 0; i < registeredWidgetList.length; i++) {
				var tChild = anyWidgetById(registeredWidgetList[i].id);
				//console.log("destroy child of " + key + " panel: " + tChild);
				if (tChild && tChild.lifecycle && tChild.lifecycle.destroyChild)
					tChild.lifecycle.destroyChild();
				deregisterDijitWidgetSimple(registeredWidgetList[i]);
			}

		}
	}
}

function addFormLifecycle(seedFrame, key) {
	if (!lifecycle.readForm) {
		lifecycle.readForm = function() {
			//console.log("read the form general");
			var formData = {
				hasViewList : true,
				type : rendererType
			};

			for (var i = 0; i < registeredWidgetList.length; i++) {
				if (registeredWidgetList[i].key) {
					var tValue = anyWidgetById(registeredWidgetList[i].id).get(
							registeredWidgetList[i].access);

					if (tValue)
						formData[registeredWidgetList[i].key] = tValue;
				}
			}

			//console.log("completed read of the form general");
			return (formData);
		}
	}

	if (!lifecycle.loadForm) {
		lifecycle.loadForm = function(formData) {
			//console.log("load the form");

			for (var i = 0; i < registeredWidgetList.length; i++) {
				if (registeredWidgetList[i].key
						&& formData[registeredWidgetList[i].key]) {
					anyWidgetById(registeredWidgetList[i].id).set(
							registeredWidgetList[i].access,
							formData[registeredWidgetList[i].key]);
				}
			}
		}
	}
}