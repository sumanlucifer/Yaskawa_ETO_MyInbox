sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"../model/formatter",
	"sap/m/MessageBox"
], function (BaseController, JSONModel, History, formatter, MessageBox) {
	"use strict";

	return BaseController.extend("com.yaskawa.ETOMyInbox.controller.ItemDetails", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			this._createHeaderDetailsModel();
			var oData = {
				results: [

					{
						"type": "Option Type 1",
						"ex1": "ex1",
						"ex2": "ex2",
						"item": 20
					}, {
						"type": "Option Type 2",
						"ex1": "ex1",
						"ex2": "ex2",
						"item": 30
					}, {
						"type": "Option Type 3",
						"ex1": "ex1",
						"ex2": "ex2",
						"item": 40
					}
				]
			};
			var jsonModel1 = new sap.ui.model.json.JSONModel();
			jsonModel1.setData(oData);
			this.getView().byId("optionTypeId").setModel(jsonModel1);
			this.getView().byId("idZbStdPoNonStock").setModel(jsonModel1);
			this.getView().byId("optionId").setModel(jsonModel1);

			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					delay: 0
				});

			var childItemsEnableDisable = {
				"enabled": false
			};
			var childItemsEnableDisableModel = new JSONModel(childItemsEnableDisable);
			this.setModel(childItemsEnableDisableModel, "childItemsEnableDisableModelName");

			var childItemsEnableDisable2 = {
				"enabled": false
			};
			var childItemsEnableDisableModel2 = new JSONModel(childItemsEnableDisable2);
			this.setModel(childItemsEnableDisableModel2, "childItemsEnableDisableModelName2");

			var childItemsEnableDisable3 = {
				"enabled": false
			};
			var childItemsEnableDisableModel3 = new JSONModel(childItemsEnableDisable3);
			this.setModel(childItemsEnableDisableModel3, "childItemsEnableDisableModelName3");

			var childItemsEnableDisable4 = {
				"enabled": false
			};
			var childItemsEnableDisableModel4 = new JSONModel(childItemsEnableDisable4);
			this.setModel(childItemsEnableDisableModel4, "childItemsEnableDisableModelName4");

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
		},
		_createHeaderDetailsModel: function () {
			var oModel = new JSONModel({
				distributionChannelDD: [],
				distributionChannelKey: "",
				orderTypeSetDD: [],
				typoofApplicationDD: [],
				typoofApplicationKey: "",
				typoofOrderDD: [],
				typoofOrderKey: "",
				ReqestedBy: "",
				QuotationNo: "",
				OrderDate: null,
				ShipDate: null,
				CustReprsntv: null,
				CustName: null,
				CustNumber: null,
				OrderStatus: null,
				OrderType: null,
				TypeApp: null,
				TypeOrder: null,
				TotalNetValue: null,
				NoSalesOrder: null,
				CustPo: null,
				ETOWorkflowSet: [{
					"ETOWorkflowKey": "HVAC",
					"ETOWorkflowValue": "Scheduling"
				}, {
					"ETOWorkflowKey": "Industrial",
					"ETOWorkflowValue": "Supply Planning"
				}, {
					"ETOWorkflowKey": "Scheduler",
					"ETOWorkflowValue": "Mat'l Load"
				}, {
					"ETOWorkflowKey": "LV",
					"ETOWorkflowValue": "Order ENG"
				}]

			});
			this.setModel(oModel, "HeaderDetailsModel");
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.byId("ObjectPageLayout").setSelectedSection(this.byId("idItemSubSection"));
			this.getView().byId("idZbStdPoNonStock2").setValue(sObjectId);
			var itemData = {
				results: [{
					"itemNo": "10",
					"matNo": "KC13842427N",
					"panel": "LKY",
					"itemNotes": "MJGTYBHJG(2R) Schematic start NB15676557-21 Layout Text"
				}, {
					"itemNo": "20",
					"matNo": "NB15842427A",
					"panel": "BIY",
					"itemNotes": "FHYFGi987(2R) Schematic start NB15676557-21 Layout Notes"
				}, {
					"itemNo": "30",
					"matNo": "HN55842467T",
					"panel": "Z1D",
					"itemNotes": "OJMFSWKN86(2R) Schematic start NB15676557-21 Layout Schemes"
				}]
			};
			var itemModel = new JSONModel(itemData);
			this.setModel(itemModel, "itemModelName");
			// this.getView().byId("idClarifyOrder").setVisible(false);
			this.getView().byId("idItemsTable2").setVisible(false);
			this.getView().byId("idRequoteOrder").setVisible(false);
			this.getView().byId("idClarifyButton").setVisible(false);
			this.getView().byId("idRequoteButton").setVisible(false);
			this.getView().byId("idcreatefgmat").setVisible(false);
			this.getView().byId("idOrdStatus").setVisible(true);
			this.getView().byId("idAccAGnmnt22").setVisible(true);

			var childItemsEnableDisable = {
				"enabled": false
			};
			var childItemsEnableDisableModel = new JSONModel(childItemsEnableDisable);
			this.setModel(childItemsEnableDisableModel, "childItemsEnableDisableModelName");

			// this.getModel().metadataLoaded().then( function() {
			// 	var sObjectPath = this.getModel().createKey("POHeaderSet", {
			// 		PONumber :  sObjectId
			// 	});
			// 	this._bindView("/" + sObjectPath);
			// }.bind(this));
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function (sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oDataModel.metadataLoaded().then(function () {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.PONumber,
				sObjectName = oObject.CompanyCode;

			oViewModel.setProperty("/busy", false);

			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},
		itemTableSelectionChange: function (oEvent) {
			this.getView().byId("idItemsTable2").setVisible(true);
			this.getView().byId("idClarifyOrder").setVisible(true);
			this.getView().byId("idRequoteButton").setVisible(true);
			this.getView().byId("idClarifyButton").setVisible(true);
			this.getView().byId("idcreatefgmat").setVisible(true);
			var preOrderItemsData = {
				results: [{
					"ItemNo": "10",
					"Quality": "",
					"Manufacturer": "",
					"PartNo": "",
					"Description": "item 10-UUAN1493 item 20-UUAN1495 item 10/20-UECN1123 item 30-UUAN1498, UECN1112 item 40/50-UUAN1500, UECN1112 ",
				}]
			};
			var preOrderItemModel = new JSONModel(preOrderItemsData);
			this.setModel(preOrderItemModel, "preOrderItemModelName");
		},
		_getRequoteSelectionDialog: function () {
			var _self = this;
			if (!_self._oDialogSelection) {
				_self._oDialogSelection = sap.ui.xmlfragment("com.yaskawa.ETOWorkFlow.fragments.RequoteSelection",
					_self);
				_self.getView().addDependent(_self._oDialogSelection);
			}
			return this._oDialogSelection;
		},
		onRequotePress: function (oEvent) {
			var oView = this.getView();
			// this._getRequoteSelectionDialog().open();
			oView.byId("idRequoteOrder").setVisible(true);
			oView.byId("idClarifyButton").setVisible(false);
			oView.byId("idClarifyOrder").setVisible(false);
			oView.byId("idcreatefgmat").setVisible(false);

		},
		reQuoteSelectionYesNo: function (oEvent) {
			var oView = this.getView();
			if (oEvent.getSource().getProperty("text") === "Yes") {
				oView.byId("idRequoteOrder").setVisible(true);
				oView.byId("idClarifyButton").setVisible(false);
				// oView.byId("idOrdStatus").setVisible(true);
				// oView.byId("idAccAGnmnt22").setVisible(true);
			} else {
				oView.byId("idRequoteOrder").setVisible(false);
				oView.byId("idClarifyButton").setVisible(true);

			}
			// var id = sap.ui.getCore().byId("id_addNewRecordDialog");
			// id.destroy();
			this._getRequoteSelectionDialog().close();
		},
		_getClarifySelectionDialog: function () {
			var _self = this;
			if (!_self._oDialogClarify) {
				_self._oDialogClarify = sap.ui.xmlfragment("com.yaskawa.ETOWorkFlow.fragments.ClarifyOptionSelection",
					_self);
				_self.getView().addDependent(_self._oDialogClarify);
			}
			return this._oDialogClarify;
		},
		onClarifyPress: function (oEvent) {
			// this._getClarifySelectionDialog().open();
			var oView = this.getView();
			// oView.byId("idClarifyOrder").setVisible(true);
			oView.byId("idOrdStatus").setVisible(false);
			oView.byId("idAccAGnmnt22").setVisible(false);
			oView.byId("idcreatefgmat").setVisible(false);

		},
		clarifySelectionYesNo: function (oEvent) {
			var oView = this.getView();
			if (oEvent.getSource().getProperty("text") === "Yes") {
				oView.byId("idClarifyOrder").setVisible(true);
				oView.byId("idOrdStatus").setVisible(false);
				oView.byId("idAccAGnmnt22").setVisible(false);
				oView.byId("idcreatefgmat").setVisible(false);
			} else {
				oView.byId("idClarifyOrder").setVisible(true);
				oView.byId("idcreatefgmat").setVisible(true);
			}
			// var id = sap.ui.getCore().byId("id_addNewRecordDialog");
			// id.destroy();
			this._getClarifySelectionDialog().close();
		},
		requoteClose: function (oEvent) {
			oEvent.getSource().destroy();
		},
		clrifyClose: function (oEvent) {
			oEvent.getSource().destroy();
		},
		handleSubmitPress: function (oEvent) {
			var _self = this;
			MessageBox.success("Successfully Submitted", {
				actions: [MessageBox.Action.OK],

				onClose: function (sAction) {
					_self.getRouter().navTo("worklist");
				}
			});

		},
		handleBackPress: function (oEvent) {
			this.getRouter().navTo("worklist");
		},
		_getAttachmentDialog: function () {
			var _self = this;
			if (!_self._oDialogAttachment) {
				_self._oDialogAttachment = sap.ui.xmlfragment("com.yaskawa.ETOWorkFlow.fragments.AttachmentSection",
					_self);
				_self.getView().addDependent(_self._oDialogAttachment);
			}
			return this._oDialogAttachment;
		},
		onAttchmentPress: function () {
			this._getAttachmentDialog().open();
		},
		onAttachmentOk: function () {
			this._getAttachmentDialog().close();
		},
		onAttachmentCancel: function () {
			this._getAttachmentDialog().close();
		},
		onAddRecordPress: function () {
			var oView = this.getView();
			oView.byId("idAddNewRecord").setVisible(true);
			oView.byId("idPaSubmittal").setVisible(false);
			oView.byId("idRecordType").setValue("");
			oView.byId("idRecordTitle").setValue("");
			oView.byId("UploadCollection").removeAllItems();
			// oView.byId("UploadCollection").getAggregation("items")[0].getProperty("fileName")
			// var newRecord = oView.byId("idItemsTable233").getModel("itemRecordModelName").getData();
			// itemRecordModelName

		},
		onAddNewRecordToTable: function () {
			var oView = this.getView();
			// var newRecord = oView.byId("idItemsTable233");
			var itemRecordData = {
				results: [{
					"type": oView.byId("idRecordType").getValue(),
					"title": oView.byId("idRecordTitle").getValue(),
					"attachments": oView.byId("UploadCollection").getAggregation("items")[0].getProperty("fileName")
				}]
			};
			if (oView.byId("idItemsTable233").getItems().length) {
				oView.byId("idItemsTable233").getModel("itemRecordModelName").getData().results.push(itemRecordData.results[0]);
				oView.byId("idItemsTable233").getModel("itemRecordModelName").refresh();
			} else {
				var itemRecordModel = new JSONModel(itemRecordData);
				this.setModel(itemRecordModel, "itemRecordModelName");
				oView.byId("idItemsTable233").getModel("itemRecordModelName").refresh();
			}

			oView.byId("idAddNewRecord").setVisible(false);
			oView.byId("idPaSubmittal").setVisible(true);
		},
		onAddItemCancel: function () {
			var oView = this.getView();
			oView.byId("idAddNewRecord").setVisible(false);
			oView.byId("idPaSubmittal").setVisible(true);
		},
		addPreOrderItemButtonPress: function () {
			var oView = this.getView();
			oView.byId("idItemsTable2").setVisible(false);
			oView.byId("idFirstVBox222").setVisible(true);
			oView.byId("idRecordType11").setValue("");
			oView.byId("idRecordTitle55").setValue("");
			oView.byId("idRecordTitle2").setValue("");
			oView.byId("idRecordTitle22").setValue("");

		},
		onAddPreOrderItem: function () {
			var oView = this.getView();
			oView.byId("idItemsTable2").setVisible(true);
			oView.byId("idFirstVBox222").setVisible(false);
			var preOredrItemData = {
				results: [{
					"quality": oView.byId("idRecordType11").getValue(),
					"manufacturer": oView.byId("idRecordTitle55").getValue(),
					"partNumber": oView.byId("idRecordTitle2").getValue(),
					"description": oView.byId("idRecordTitle22").getValue()
				}]
			};
			if (oView.byId("idItemsTable2").getItems().length) {
				oView.byId("idItemsTable2").getModel("preOredrmModelName").getData().results.push(preOredrItemData.results[0]);
				oView.byId("idItemsTable2").getModel("preOredrmModelName").refresh();
			} else {
				var preOredrmModel = new JSONModel(preOredrItemData);
				this.setModel(preOredrmModel, "preOredrmModelName");
			}

		},
		onAddPreorderItemCancel: function () {
			var oView = this.getView();
			oView.byId("idItemsTable2").setVisible(true);
			oView.byId("idFirstVBox222").setVisible(false);
		},
		onParentClicked: function (oEvent) {
			if (oEvent.getSource().getSelected()) {
				this.getModel("childItemsEnableDisableModelName").getData().enabled = true;
				this.getModel("childItemsEnableDisableModelName").refresh();
			} else {
				this.getModel("childItemsEnableDisableModelName").getData().enabled = false;
				this.getModel("childItemsEnableDisableModelName").refresh();
			}
		},
		onUL12Clicked: function (oEvent) {
			if (oEvent.getSource().getSelected()) {
				this.getModel("childItemsEnableDisableModelName2").getData().enabled = true;
				this.getModel("childItemsEnableDisableModelName2").refresh();
			} else {
				this.getModel("childItemsEnableDisableModelName2").getData().enabled = false;
				this.getModel("childItemsEnableDisableModelName2").refresh();
			}
		},
		onUL3rClicked: function (oEvent) {
			if (oEvent.getSource().getSelected()) {
				this.getModel("childItemsEnableDisableModelName3").getData().enabled = true;
				this.getModel("childItemsEnableDisableModelName3").refresh();
			} else {
				this.getModel("childItemsEnableDisableModelName3").getData().enabled = false;
				this.getModel("childItemsEnableDisableModelName3").refresh();
			}
		},
		onNEMAClicked: function (oEvent) {
			if (oEvent.getSource().getSelected()) {
				this.getModel("childItemsEnableDisableModelName4").getData().enabled = true;
				this.getModel("childItemsEnableDisableModelName4").refresh();
			} else {
				this.getModel("childItemsEnableDisableModelName4").getData().enabled = false;
				this.getModel("childItemsEnableDisableModelName4").refresh();
			}
		},
		onAttachmentTableItemDelete: function (oEvent) {
			var deletedItemTableIndexPath = oEvent.getSource().getBindingContext("itemRecordModelName").getPath();
			var deletedItemTableIndex = deletedItemTableIndexPath.split("/")[2];
			var deletedTableModel = oEvent.getSource().getModel("itemRecordModelName");
			var deletedTableModelData = oEvent.getSource().getModel("itemRecordModelName").getData();

			sap.m.MessageBox.warning("Are you sure to delete this item?", {
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				styleClass: "messageBoxError",
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {
						deletedTableModelData.results.splice(deletedItemTableIndex, 1);
						deletedTableModel.refresh();
					}
				}
			});
		}

	});

});