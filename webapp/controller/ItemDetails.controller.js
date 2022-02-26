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

		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},

		_onObjectMatched: function (oEvent) {

			this.Vbeln = this.getModel("globalModel").getProperty("/objectId");
			this.Posnr = this.getModel("globalModel").getProperty("/objectId1");
			this.AppType = this.getModel("globalModel").getProperty("/objectId2");
			this.callItemDetailDropDownService();

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

		},
		callItemDetailDropDownService: function () {
			this.getModel("objectViewModel").setProperty("/busy", true);
			var Filter = this.getFilters(this.Vbeln, this.Posnr);
			Promise.allSettled([

				//   Product type drop down data

				this.readChecklistEntity("/MRPTypeSet"),
				this.readChecklistEntity("/MaterialGroup1Set"),
				this.readChecklistEntity("/MaterialPriceSet"),
				this.readChecklistEntity("/OverheadGroupSet"),
				this.readChecklistEntity("/PlantSet"),
				this.readChecklistEntity("/ProcurementTypeSet"),
				this.readChecklistEntity("/ProductHierarchySet"),
				this.readChecklistEntity("/ProductTypeSet"),
				this.readChecklistEntity("/SerialNbrSet"),
				this.readChecklistEntity("/StrategyGroupSet"),
				this.readChecklistEntity("/UnitSet"),
				this.readChecklistEntity("/ValuationClassSet"),

				//   Material Details type drop down data
				this.readChecklistEntity("/MRPControllerSet"),
				this.readChecklistEntity("/MaterialGroupSet"),
				this.readChecklistEntity("/ProductScheProfileSet"),
				this.readChecklistEntity("/RequirementsGroupSet"),

				// option type Drop down
				this.readChecklistEntity("/OptionTypeSet"),

				// Pre Order Item Tab

				this.readChecklistEntity("/ZPRE_ORD_ITEMSet", Filter)

			]).then(this.buildChecklist.bind(this)).catch(function (error) {}.bind(this));

		},

		readChecklistEntity: function (path, filter) {

			return new Promise(
				function (resolve, reject) {
					this.getOwnerComponent().getModel("UserAction").read(path, {
						filters: [filter],
						success: function (oData) {
							resolve(oData);
						},
						error: function (oResult) {
							reject(oResult);

						}
					});
				}.bind(this));
		},

		buildChecklist: function (values) {
			this.getModel("objectViewModel").setProperty("/busy", false);
			// 			product type response
			var MRPTypeSet = values[0].value.results;
			var MaterialGroup1Set = values[1].value.results;
			var MaterialPriceSet = values[2].value.results;
			var OverheadGroupSet = values[3].value.results;
			var PlantSet = values[4].value.results;
			var ProcurementTypeSet = values[5].value.results;
			var ProductHierarchySet = values[6].value.results;
			var ProductTypeSet = values[7].value.results;
			var SerialNbrSet = values[8].value.results;
			var StrategyGroupSet = values[9].value.results;
			var UnitSet = values[10].value.results;
			var ValuationClassSet = values[11].value.results;

			// 			Material details  response
			var MRPControllerSet = values[12].value.results;
			var MaterialGroupSet = values[13].value.results;
			var ProductScheProfileSet = values[14].value.results;
			var RequirementsGroupSet = values[15].value.results;

			// option type response
			var OptionTypeSet = values[16].value.results;

			// pre-order data item response
			var ZPRE_ORD_ITEMSet = values[17].value.results;

			this.getModel("TabDetailsModel").setSizeLimit(1000);

			// Product type data model binding

			this.getModel("TabDetailsModel").setProperty("/MRPTypeSet", MRPTypeSet);
			this.getModel("TabDetailsModel").setProperty("/MaterialGroup1Set", MaterialGroup1Set);
			this.getModel("TabDetailsModel").setProperty("/MaterialPriceSet", MaterialPriceSet);
			this.getModel("TabDetailsModel").setProperty("/OverheadGroupSet", OverheadGroupSet);
			this.getModel("TabDetailsModel").setProperty("/PlantSet", PlantSet);
			this.getModel("TabDetailsModel").setProperty("/ProcurementTypeSet", ProcurementTypeSet);
			this.getModel("TabDetailsModel").setProperty("/ProductHierarchySet", ProductHierarchySet);
			this.getModel("TabDetailsModel").setProperty("/ProductTypeSet", ProductTypeSet);
			this.getModel("TabDetailsModel").setProperty("/SerialNbrSet", SerialNbrSet);
			this.getModel("TabDetailsModel").setProperty("/StrategyGroupSet", StrategyGroupSet);
			this.getModel("TabDetailsModel").setProperty("/UnitSet", UnitSet);
			this.getModel("TabDetailsModel").setProperty("/ValuationClassSet", ValuationClassSet);

			// Materials details data model binding

			this.getModel("TabDetailsModel").setProperty("/MRPControllerSet", MRPControllerSet);
			this.getModel("TabDetailsModel").setProperty("/MaterialGroupSet", MaterialGroupSet);
			this.getModel("TabDetailsModel").setProperty("/ProductScheProfileSet", ProductScheProfileSet);
			this.getModel("TabDetailsModel").setProperty("/RequirementsGroupSet", RequirementsGroupSet);

			// option type data model binding
			this.getModel("TabDetailsModel").setProperty("/OptionTypeSet", OptionTypeSet);

			// pre-order item tab data model binding
			this.getModel("TabDetailsModel").setProperty("/ZPRE_ORD_ITEMSet", ZPRE_ORD_ITEMSet);

			var sLoginID = new sap.ushell.services.UserInfo().getId();
			this.byId("idAssignTo").setSelectedKey(sLoginID);

		},

		getFilters: function (sSaleOrderNo, sPosnumbr) {
			var sSaleOrderNoFilter = new sap.ui.model.Filter({
				path: "Vbeln",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSaleOrderNo
			});

			var sPOSNR = new sap.ui.model.Filter({
				path: "Posnr",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sPosnumbr
			});
			var filter = [];
			filter.push(sSaleOrderNoFilter, sPOSNR);
			return filter;
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
		}

	});

});