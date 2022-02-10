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
			this._createTabDetailsModel();
			this.createInitialModel();
			this.getRouter().getRoute("itemView").attachPatternMatched(this._onObjectMatched, this);

		},
		createInitialModel: function () {
			var oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "objectViewModel");
		},
		_createTabDetailsModel: function () {
			var oModel = new JSONModel({
				TabData: [],

			});
			this.setModel(oModel, "TabDetailsModel");
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

		_onObjectMatched: function (oEvent) {

			this.Vbeln = oEvent.getParameter("arguments").objectId;
			this.Posnr = oEvent.getParameter("arguments").objectId1;
			this.AppType = oEvent.getParameter("arguments").objectId2;

			if (this.AppType === "04") {
				this.getView().byId("idOptionTab").setVisible(false);
				this.getView().byId("idApplicationTab").setVisible(false);
				this.getView().byId("idEnclosureTab").setVisible(false);
				this.getView().byId("idProductTab").setVisible(true);
				this.getView().byId("idMaterialDetailsTab").setVisible(true);
				this.getView().byId("idPreOrderItem").setVisible(true);
				this.getView().byId("idHPS").setVisible(true);
				this.getView().byId("idPaSubmittal").setVisible(true);
				this.getView().byId("idOrderEng").setVisible(true);

			} else {
				this.getView().byId("idOptionTab").setVisible(true);
				this.getView().byId("idApplicationTab").setVisible(true);
				this.getView().byId("idEnclosureTab").setVisible(true);
				this.getView().byId("idProductTab").setVisible(true);
				this.getView().byId("idMaterialDetailsTab").setVisible(true);
				this.getView().byId("idPreOrderItem").setVisible(true);
				this.getView().byId("idHPS").setVisible(false);
				this.getView().byId("idPaSubmittal").setVisible(true);
				this.getView().byId("idOrderEng").setVisible(true);
			}

			this.getTabDetials(this.Vbeln, this.Posnr);
			//this.getView().byId("idZbStdPoNonStock2").setValue(sObjectId);

			// this.getModel().metadataLoaded().then( function() {
			// 	var sObjectPath = this.getModel().createKey("POHeaderSet", {
			// 		PONumber :  sObjectId
			// 	});
			// 	this._bindView("/" + sObjectPath);
			// }.bind(this));
		},

		getTabDetials: function (SalesOrder, ItemNo) {

			this.getModel("objectViewModel").setProperty("/busy", true);
			var sSalesOrderFilter = new sap.ui.model.Filter({
				path: "SalesOrder",
				operator: sap.ui.model.FilterOperator.EQ,
				//	value1: SalesOrder
				value1: "0000097046"
			});
			var sItemNoFilter = new sap.ui.model.Filter({
				path: "ItemNo",
				operator: sap.ui.model.FilterOperator.EQ,
				//	value1: ItemNo
				value1: "000010"
			});
			var filter = [];
			filter.push(sSalesOrderFilter, sItemNoFilter);

			this.getOwnerComponent().getModel("UserAction").read(`/ZWF_DETAILSSet(SalesOrder='${SalesOrder}',ItemNo='${ItemNo}')`, {

				success: function (oData, oResponse) {

					this.getModel("objectViewModel").setProperty("/busy", false);
					this.getModel("TabDetailsModel").setProperty("/TabData", oData);

				}.bind(this),
				error: function (oError) {
					this.getModel("objectViewModel").setProperty("/busy", false);

				}.bind(this),
			});
		},
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

			var oSubmit = {
				Vbeln: this.Vbeln,
				Posnr: this.Posnr,
				Message: ""

			};

			this.getOwnerComponent().getModel().create("/SubmitDataSet", oSubmit, {

				success: function (oData, oResponse) {
					sap.m.MessageBox.success(oData.Message);
					this.byId("idWorkFlowStatus").setValue(oData.workflowstatus);

				}.bind(this),
				error: function (oError) {

				}.bind(this),
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