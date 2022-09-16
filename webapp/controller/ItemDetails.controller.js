sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"../model/formatter",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], function (BaseController, JSONModel, History, formatter, MessageBox, Filter, FilterOperator) {
	"use strict";
	var partNumbers = [];
	var selOptnsTabObject = {
		results: []
	};

	return BaseController.extend("com.yaskawa.ETOMyInbox.controller.ItemDetails", {

		formatter: formatter,

		onInit: function () {
			this._createTabDetailsModel();
			this.createInitialModel();
			this.getRouter().getRoute("itemView").attachPatternMatched(this._onObjectMatched, this);
			this.getOwnerComponent().getService("ShellUIService").then(function (oShellService) {
				oShellService.setBackNavigation(function () {
					this.handleBackPress();
				}.bind(this));
			}.bind(this));
			// 			this.getView().byId("__FILEUPLOAD").setVisible(false);
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
				PreOrderItemTableData: []

			});
			this.setModel(oModel, "TabDetailsModel");
		},

		onNavBack: function () {
			// 			history.go(-1);
			var sObj = this.getModel("globalModel").getProperty("/objectID");
			this.getRouter().navTo("object", {
				objectId: sObj
			});

		},

		_onObjectMatched: function (oEvent) {
			var _self = this;
			this.Vbeln = this.getModel("globalModel").getProperty("/objectId");
			this.Posnr = this.getModel("globalModel").getProperty("/objectId1");
			this.AppType = this.getModel("globalModel").getProperty("/objectId2");
			this.callItemDetailDropDownService();
			// 			this.getView().byId("idOptions").setVisibleRowCount(this.getView().byId("idOptions").getModel("TabDetailsModel").getData().OptionTypeSet
			// 				.length);

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
				this.getView().byId("idPaSubmittal").setVisible(true);
				this.getView().byId("idHPS").setVisible(false);
				// this.getView().byId("idOrderEng").setVisible(true);
			}
			this.checkMVHPSflagValue();
			this.drawingTypeGet();
		},
		callItemDetailDropDownService: function () {
			this.getModel("objectViewModel").setProperty("/busy", true);
			var Filter = this.getFilters(this.Vbeln, this.Posnr, this.AppType);
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
				this.readChecklistEntity("/OptionTypeSet", Filter.AppFilter),

				// Pre Order Item Tab

				this.readChecklistEntity("/ZPRE_ORD_ITEMSet", Filter.Sofilter),

				// PA Submital Tab 
				this.readChecklistEntity("/ETOAttachmentSet", Filter.attachFilter),

				// All Tab Details Response
				this.readChecklistEntity(`/ZWF_DETAILSSet(SalesOrder='${this.Vbeln}',ItemNo='${this.Posnr}')`),

				// HPS tab
				this.readChecklistEntity("/ModelnoSet")

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

			// PA Submital Tab  item response
			var aETOAttachmentSet = values[18].status === "rejected" ? null : values[18].value.results;

			// All Tab Details Response
			var aAlltabDetailsSet = values[19].status === "rejected" ? null : values[19].value;

			//HPS Tab data response
			var aModelnoSetSet = values[20].status === "rejected" ? null : values[20].value.results;

			this.getModel("TabDetailsModel").setSizeLimit(5000);

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
			this.getModel("TabDetailsModel").setProperty("/PreOrderItemTableData", ZPRE_ORD_ITEMSet);

			// PA Submital Tab  data model binding
			this.getModel("TabDetailsModel").setProperty("/ETOAttachmentSet", aETOAttachmentSet);

			// HPS Tab  data model binding
			this.getModel("TabDetailsModel").setProperty("/aModelnoSetSet", aModelnoSetSet);

			// All Tab data model binding
			this.getModel("TabDetailsModel").setProperty("/TabData", aAlltabDetailsSet);

			var aOptionData = aAlltabDetailsSet.OpOptionType.split(",");
			this.getModel("TabDetailsModel").setProperty("/aSelectedOptionTypeSet", aOptionData);
			var sLoginID = new sap.ushell.services.UserInfo().getId();
			this.byId("idAssignTo").setSelectedKey(sLoginID);

		},

		getFilters: function (sSaleOrderNo, sPosnumbr, sAppType) {
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
			var Sofilter = [];
			Sofilter.push(sSaleOrderNoFilter, sPOSNR);

			var sattachFilter = new sap.ui.model.Filter({
				path: "Input",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSaleOrderNo
			});
			var sattachFilter1 = new sap.ui.model.Filter({
				path: "ItemNr",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sPosnumbr
			});
			var attachFilter = [];
			attachFilter.push(sattachFilter, sattachFilter1);

			var sTabDetailsFilter = new sap.ui.model.Filter({
				path: "SalesOrder",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSaleOrderNo
			});
			var sTabDetailsFilter1 = new sap.ui.model.Filter({
				path: "ItemNr",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sPosnumbr
			});
			var TabsFilter = [];
			TabsFilter.push(sTabDetailsFilter, sTabDetailsFilter1);

			var sAppTypeFilter = new sap.ui.model.Filter({
				path: "AppType",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sAppType
			});

			var AppFilter = [];
			AppFilter.push(sAppTypeFilter);
			var filerValue = {

				attachFilter: attachFilter,
				Sofilter: Sofilter,
				TabsFilter: TabsFilter,
				AppFilter: AppFilter

			};

			return filerValue;
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
		addPreOrderItemPress: function () {
			partNumbers = [];
			var oModel = this.getModel("TabDetailsModel").getProperty("/PreOrderItemTableData");
			var oItems = oModel.map(function (oItem) {
				return Object.assign({}, oItem);
			});
			oItems.push({
				"Vbeln": "",
				"Posnr": "",
				"SeqNo": "",
				"Quantity": "",
				"Manufaturer": "",
				"PartNumber": "",
				"Description": "",
				"EditMode": true

			});
			this.getModel("TabDetailsModel").setProperty("/PreOrderItemTableData", oItems);
		},
		onEditPreOrderItem: function (oEvent) {
			var iRowNumberToEdit = parseInt(oEvent.getSource().getBindingContext("TabDetailsModel").getPath().slice("/".length).slice(22, 23));
			var aTableData = this.getModel("TabDetailsModel").getProperty("/PreOrderItemTableData");
			this.getModel("TabDetailsModel").setProperty(`/PreOrderItemTableData/${iRowNumberToEdit}/EditMode/`, true);

		},
		onDeletePreOrderItem: function (oEvent) {
			var iRowNumberToDelete = parseInt(oEvent.getSource().getBindingContext("TabDetailsModel").getPath().slice("/".length).slice(22,
				23));
			var aTableData = this.getModel("TabDetailsModel").getProperty("/PreOrderItemTableData");
			aTableData.splice(iRowNumberToDelete, 1);
			this.getView().getModel("TabDetailsModel").refresh();
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

		handleSaveasDraft: function () {

			sap.m.MessageBox.warning("Are you sure you want to save as a draft?", {
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				styleClass: "messageBoxError",
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {
						var Action = "D";
						this.handleSubmitCall(Action);

					}

				}.bind(this),
			});

		},

		handleSubmitPress: function () {

			sap.m.MessageBox.warning("Are you sure to submit this details?", {
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				styleClass: "messageBoxError",
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {
						var Action = "S";
						this.handleSubmitCall(Action);

					}

				}.bind(this),
			});

		},

		// 		onSelectionFinish: function (oEvent) {
		// 			const aSelectedItems = oEvent.getParameter("selectedItems");
		// 			const aSelectedTexts = aSelectedItems.map(oItem => oItem.getKey());
		// 			this.aSelectedOptionsType = aSelectedTexts.toString().replace(/,/g, '');
		// 		},
		handleSubmitCall: function (Action) {
			this.getModel("objectViewModel").setProperty("/busy", true);

			// Pre-Order Items Data Payload
			var aPreOrderItemData = this.getModel("TabDetailsModel").getProperty("/PreOrderItemTableData"),

				aPreOrderItemData = aPreOrderItemData.map(function (item) {
					return {

						Vbeln: this.Vbeln,
						Posnr: this.Posnr,
						SeqNo: item.SeqNo,
						Quantity: item.Quantity,
						Manufaturer: item.Manufaturer,
						PartNumber: item.PartNumber,
						Description: item.Description

					};
				}, this);
			// 			var oOptionType = this.byId("idOptionType").getSelectedKeys();
			var slOptnsKey = [];
			var selOptnsItms = this.getView().byId("idSeltdOptnslist").getItems();
			for (var sopLcv = 0; sopLcv < selOptnsItms.length; sopLcv++) {
				slOptnsKey.push((selOptnsItms[sopLcv].getProperty("title")).split("-")[0])
			}
			this.aSelectedOptionsType = slOptnsKey.toString().replace(/,/g, '');
			var oSubmit = {

				//  Header fields
				"SalesOrder": this.Vbeln,
				"ItemNo": this.Posnr,
				"Action": Action,
				"Quantity": this.byId("idorderItemDetailHeaderQty").getValue(),
				"NetAmount": this.byId("idorderItemDetailHeaderNetAmt").getValue(),
				"WfStatus": this.byId("idorderItemDetailHeaderWFStatus").getValue(),
				//	Options Tab fields
				// "OpOptionType": this.aSelectedOptionsType,
				"OpOptionType": this.aSelectedOptionsType,
				"OpOption": this.byId("idOption").getValue(),
				// Application Data Tab Fields
				"AppMotorFull": this.byId("idAppMotorFullLoad").getValue(),
				"AppPanelSscr": this.byId("idAppPanelScr").getValue(),
				"AppAmbTemp": this.byId("idAppAmbTemp").getValue(),
				"AppEnclosure": this.byId("idAppEnclosure").getValue(),
				"AppCableEntry": this.byId("idAppCableEntry").getValue(),
				"AppVenitilation": this.byId("idAppVentilation").getValue(),
				"AppAltitude": this.byId("idAppAltitude").getValue(),
				// Enclosure Tab Fields
				"EnclUlType1": this.byId("idEnclUlType1").getSelected() ? "X" : "",
				"EnclUlType1Min": this.byId("idMinimum1").getSelected() ? "X" : "",
				"EnclUlType1NoHole": this.byId("idNoHolePanel").getSelected() ? "X" : "",
				"EnclUlType1Gasketed": this.byId("idGasketDoor").getSelected() ? "X" : "",
				"EnclUlType1Type12": this.byId("idTypeFans").getSelected() ? "X" : "",
				"EnclUlType1Other": this.byId("idULTypeOther").getSelected() ? "X" : "",
				"EnclUlType12": this.byId("idULTYPE12").getSelected() ? "X" : "",
				"EnclUlType12AcUnit": this.byId("idACUnits").getSelected() ? "X" : "",
				"EnclUlType12HeatAir": this.byId("idHeatexchanger").getSelected() ? "X" : "",
				"EnclUlType12HeatWater": this.byId("idHeatairtoWater").getSelected() ? "X" : "",
				"EnclUlType12Other": this.byId("idULTYPE12Other").getSelected() ? "X" : "",
				"EnclUlType3r": this.byId("idULType3R").getSelected() ? "X" : "",
				"EnclUlType3rAcUnit": this.byId("idULTYPE3RacUnits").getSelected() ? "X" : "",
				"EnclUlType3rHeatWater": this.byId("idHeatExchanger").getSelected() ? "X" : "",
				"EnclUlType3rOther": this.byId("idULTYp3ReOther").getSelected() ? "X" : "",
				"EnclNemaType": this.byId("idNEMATypeRating").getSelected() ? "X" : "",
				"EnclNemaTypeNema12": this.byId("idNema12").getSelected() ? "X" : "",
				"EnclNemaTypeNema4": this.byId("Nema4").getSelected() ? "X" : "",
				"EnclNemaTypeNema4x": this.byId("idNema4x").getSelected() ? "X" : "",
				"EnclNemaTypeOther": this.byId("idNemaOther").getSelected() ? "X" : "",
				"EnclItemNotes": this.byId("idItemNotes").getValue(),
				// Product Type Tab Fields
				"ProdType": this.byId("idProductType").getSelectedKey(),
				"ProdPlant": this.byId("idPrimaryPlant").getSelectedKey(),
				"ProdUom": this.byId("idBaseUOM").getSelectedKey(),
				"ProdOverheadGrp": this.byId("idOvrHdGrp").getSelectedKey(),
				"ProdStrGrp": this.byId("idStrategyGrp").getSelectedKey(),
				"ProdMaterial": this.byId("idMaterialNumber").getValue(),
				// "ProdHierarchy": this.byId("idProdHrchy").getSelectedKey(),
				"ProdHierarchy": this.byId("idProdHrchy").getValue().split("-")[0],
				"ProdProcurementType": this.byId("idprocurementType").getSelectedKey(),
				"ProdValuationClass": this.byId("idValClass").getSelectedKey(),
				"ProdSerialNo": this.byId("idSerialNBR").getSelectedKey(),
				"ProdDesc": this.byId("idDecription").getValue(),
				"ProdMatPrcGrp": this.byId("idMatrlPricing").getSelectedKey(),
				"ProdMatGrp1": this.byId("idMatGrp1").getSelectedKey(),
				"ProdMrpType": this.byId("idMRPType").getSelectedKey(),
				// Materials Details Tab Fields
				"MaterialGroup": this.byId("idMatGrp").getSelectedKey(),
				"MaterialLoadTime": "",
				"MaterialGrTime": this.byId("idGRProcessTime").getValue(),
				"MaterialRequirementGrp": this.byId("idReqGrp").getSelectedKey(),
				"MaterialProdSupervisor": this.byId("idProdSupervisior").getValue(),
				"MaterialDelLead": this.byId("idPalnnedDelLead").getValue(),
				"MaterialTimeFence": this.byId("idPlannTimeFence").getValue(),
				"MaterialLotSize": this.byId("idLotSize").getValue(),
				"MaterialProdTime": this.byId("idinHouseProdTime").getValue(),
				"MaterialProdProfile": this.byId("idProdSchePrfl").getSelectedKey(),
				"MaterialMrpControl": this.byId("idMatCntrl").getSelectedKey(),
				"MaterialFixedLotSize": this.byId("idFixedLotSize").getValue(),
				//HPS Tab Fields
				"HpsMaterial": this.byId("idMatl").getValue(),
				"HpsType": this.byId("idHPSType").getValue(),
				"HpsSccr": this.byId("idHPSSCCR").getValue(),
				"HpsDrive": this.byId("idHPSDrive").getValue(),
				"HpsSimilarModel": this.byId("idSimilarModel").getSelectedKey(),
				"HpsPlanningMaterial": this.byId("idPlanningMaterial").getValue(),
				"HpsDollar": this.byId("idEA").getValue(),
				"HpsItemNotes": this.byId("idHPSItemNotes").getValue(),
				// PA/Submital Tab Fields
				"PaSubmittalType": this.byId("idPASubmitalType").getValue(),
				"PaSubmittalEmail": this.byId("PASubmitalEmail").getValue(),
				"PaSubmittalDueDate": this.byId("idDueDate").getValue(),
				"PaSubmittalContact": this.byId("idContact").getValue(),
				"PaSubmittalName": this.byId("idName").getValue(),
				"PaSubmittalNumber": this.byId("idNumber").getValue(),
				// "PaSubmittalDocType": this.byId("idDocTypeid").getSelected() ? "X" : "",
				// "PaSubmittalDrawings": this.byId("idDrawingComplete").getSelected() ? "X" : "",
				// "PaSubmittalSubmitted": this.byId("idSubmitted").getSelected() ? "X" : "",
				// "PaSubmittalSentToCustomer": this.byId("idSenttoCustomer").getSelected() ? "X" : "",
				"PASubmitalDrawingDate": this.byId("idDrwigCmpltnDte").getValue(),
				// Order Engineering Tab Fields
				// "OehpsPriority": this.byId("idPriority").getValue(),
				// "OehpsDevtLevel": this.byId("idDevLevel").getValue(),
				// "OehpsSchedEngHrs": this.byId("idSchedleEngHrs").getValue(),
				// "OehpsActualEngHrs": this.byId("idActEngHrs").getValue(),
				// "OehpsMeDesign": this.byId("idMEDesign").getSelected() ? "X" : "",
				// "OehpsEeDesign": this.byId("idEEDesign").getSelected() ? "X" : "",
				// "OehpsSystAnalysis": this.byId("idSystemAnalysis").getSelected() ? "X" : "",
				// "OehpsAprvDrawing": this.byId("idApprovedDrwnings").getSelected() ? "X" : "",
				// "OehpsXengAprvRcvd": this.byId("idApprvlRcvd").getSelected() ? "X" : "",
				// "OehpsZzkickoff": this.byId("idKickoffMeeting").getSelected() ? "X" : "",
				// "OehpsPreOrdBom": this.byId("idPreOrdrSAPBomCrtd").getSelected() ? "X" : "",
				// "OehpsShpSplitBom": this.byId("idShippingSplitBOM").getSelected() ? "X" : "",
				// "OehpsLineupBom": this.byId("idLineBOMCreated").getSelected() ? "X" : "",
				// "OehpsBomReview": this.byId("BOMReviewComplete").getSelected() ? "X" : "",
				// "OehpsFinalSapBom": this.byId("idFinalSAPBOM").getSelected() ? "X" : "",
				// "OehpsRoutingsCreated": this.byId("idRoutingCreated").getSelected() ? "X" : "",
				// "OehpsZ7StatusRemoved": this.byId("idStatusRmoved").getSelected() ? "X" : "",
				// "OehpsZzprodKickoff": this.byId("idZZProdKickoff").getSelected() ? "X" : "",
				"Message": "",
				"WFSTEP": aPreOrderItemData
			};

			this.getOwnerComponent().getModel("UserAction").create("/ZWF_DETAILSSet", oSubmit, {

				success: function (oData, oResponse) {

					sap.m.MessageBox.success(oData.Message, {
						actions: [sap.m.MessageBox.Action.OK],
						styleClass: "messageBoxError",
						onClose: function (oAction) {
							if (oAction === sap.m.MessageBox.Action.OK) {
								this.onNavBack();

							}

						}.bind(this),
					});
					this.getModel("objectViewModel").setProperty("/busy", false);

					// 	sap.m.MessageBox.success(oData.Message);
					// 	this.getModel("objectViewModel").setProperty("/busy", false);
					// 	this.onNavBack();

				}.bind(this),
				error: function (oError) {
					this.getModel("objectViewModel").setProperty("/busy", false);

				}.bind(this),
			});

		},
		handleBackPress: function (oEvent) {

			sap.m.MessageBox.warning("Unsaved data will be lost! are you sure to exit?", {
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				styleClass: "messageBoxError",
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {
						this.onNavBack();

					}

				}.bind(this),
			});

		},
		onUploadPress: function (oEvent) {
			var that = this;
			var sSaleOrderNo = this.Vbeln;

			this.getModel("objectViewModel").setProperty("/busy", true);
			// 			var file = this.byId("__FILEUPLOAD").getFocusDomRef().files[0];
			var file = oEvent.getParameters().files[0];

			//Input = "458076",
			var Filename = file.name,
				Filetype = file.type,
				Filesize = file.size;

			//code for byte array 
			// 			this._getImageData(URL.createObjectURL(file), function (Filecontent) {
			// 				that._updateDocumentService(Filecontent, Filename, Filetype, Filesize, sSaleOrderNo);
			// 			});

			that._updateDocumentService(file, Filename, Filetype, Filesize, sSaleOrderNo);

		},
		onComplete: function (oEvent) {

			if (oEvent.getParameter("status") === 500 || oEvent.getParameter("status") === 201) {
				this.getModel("objectViewModel").setProperty("/busy", false);
				sap.m.MessageBox.success("The File has been uploaded successfully!");
				this.getView().getModel().refresh();
				this.callItemDetailDropDownService();
				this.byId("__FILEUPLOAD").setValue("");
				this.getModel().refresh();
                this.byId("idUpload").setVisible(false);
			} else {
				this.getModel("objectViewModel").setProperty("/busy", false);
				sap.m.MessageBox.error("The File  upload failed!");
				this.byId("__FILEUPLOAD").setValue("");
			}
		},
		_updateDocumentService: function (Filecontent, Filename, Filetype, Filesize, Input) {

			var oFileUploader = this.byId("__FILEUPLOAD");
			Filecontent = null;
			var itemNo = this.Posnr;
			oFileUploader.removeAllHeaderParameters();
			oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
				name: "slug",
				// value: Filecontent + "|" + Input + "|" + Filename + "|" + Filetype + "|" + Filesize + "|" + itemNo + "|" + this.drawingTypeValue
				value: Filecontent + "|" + Input + "|" + Filename + "|" + Filetype + "|" + Filesize + "|" + itemNo + "|" + this.drawingTypeValue
			}));
			oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
				name: "x-csrf-token",
				value: this.getModel().getSecurityToken()
			}));
			var sUrl = this.getModel().sServiceUrl + "/ETOAttachmentSet";
			oFileUploader.setUploadUrl(sUrl);
			oFileUploader.setSendXHR(true);
			oFileUploader.setUseMultipart(true);
			oFileUploader.upload();
		},
		onFileNameLengthExceed: function () {
			MessageBox.error("File name length exceeded, Please upload file with name lenght upto 50 characters.");
		},

		onFileSizeExceed: function () {
			MessageBox.error("File size exceeded, Please upload file with size upto 200KB.");
		},
		onAttachmentItemDelete: function (oEvent) {
			var object = oEvent.getSource().getBindingContext("TabDetailsModel").getObject();
			sap.m.MessageBox.warning("Are you sure to delete this attachment?", {
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				styleClass: "messageBoxError",
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {
						this.deleteServiceCall(object);

					}

				}.bind(this),
			});
		},
		deleteServiceCall: function (object) {
			this.getModel("objectViewModel").setProperty("/busy", true);

			var oPayload = {

				"SONumber": this.Vbeln,
				"Item": this.Posnr,
				"Index": object.Index,
				"Message": ""

			};
			this.getOwnerComponent().getModel("UserAction").create("/DeleteAttachmentSet", oPayload, {

				success: function (oData, oResponse) {

					this.getModel("objectViewModel").setProperty("/busy", false);
					this.callItemDetailDropDownService();

					sap.m.MessageBox.success(oData.Message);
				}.bind(this),
				error: function (oError) {

					this.getModel("objectViewModel").setProperty("/busy", false);
					sap.m.MessageBox.error("HTTP Request Failed");

				}.bind(this),
			});
		},

		onReqouteClarifyPress: function (oeve) {

			this.Action = oeve.getParameters().id.split("-")[8] === "Requote" ? "R" : "C";

			if (!this._oDialogRequoteClarifySection) {
				this._oDialogRequoteClarifySection = sap.ui.xmlfragment("com.yaskawa.ETOMyInbox.view.fragments.RequoteClarify", this);
				this.getView().addDependent(this._oDialogRequoteClarifySection);

			}
			this._oDialogRequoteClarifySection.open();
		},
		onPressReqClarifyOk: function () {
			this.getModel("objectViewModel").setProperty("/busy", true);
			var Note = sap.ui.getCore().byId("idRequoteClarify").getValue();
			var oPayload = {
				"Vbeln": this.Vbeln,
				"Posnr": this.Posnr,
				"Action": this.Action,
				"Note": Note,
				"Message": ""
			};
			this.getOwnerComponent().getModel("UserAction").create("/ClarifyRequoteSet", oPayload, {

				success: function (oData, oResponse) {

					this._oDialogRequoteClarifySection.close();

					this.getModel("objectViewModel").setProperty("/busy", false);
					sap.ui.getCore().byId("idRequoteClarify").setValue("");
					sap.m.MessageBox.success("Notes Updated Successfully!");
				}.bind(this),
				error: function (oError) {
					this._oDialogRequoteClarifySection.close();
					sap.ui.getCore().byId("idRequoteClarify").setValue("");
					this.getModel("objectViewModel").setProperty("/busy", false);
					sap.m.MessageBox.error("HTTP Request Failed");

				}.bind(this),
			});
		},
		onPressReqClarifyCancel: function () {
			sap.ui.getCore().byId("idRequoteClarify").setValue("");
			this._oDialogRequoteClarifySection.close();
		},
		partNumberSelectionChange: function (oEvent) {
			var _that = this;
			var resourceBundle = this.getResourceBundle();
			var sQuery = "";
			sQuery = oEvent.getSource().getValue();
			// 			if (sQuery.length > 2) {
			var oFilter = new Filter({
				filters: [
					new Filter({
						path: 'PartNo',
						operator: sap.ui.model.FilterOperator.EQ,
						value1: sQuery
					})
				],
				and: false
			});
			this.getOwnerComponent().getModel("UserAction").read("/PartNumberSet", {
				filters: [oFilter],
				success: function (data, response) {
					var partNumberModel = new JSONModel(data);
					partNumbers = [];
					partNumbers = jQuery.extend(true, {}, data);
					_that.setModel(partNumberModel, "partNumberModelName");
				},
				error: function (response) {}
			});
			// 			}
		},
		onpartNumberValueHelpRequest: function (oEvent) {
			var oView = this.getView();
			var pnTableModel = oView.getModel("TabDetailsModel").getData().PreOrderItemTableData;
			for (var pnLcv = 0; pnLcv < partNumbers.results.length; pnLcv++) {
				if (partNumbers.results[pnLcv].PartNo.includes(oEvent.getSource().getSelectedText())) {
					for (var pnLcv2 = 0; pnLcv2 < pnTableModel.length; pnLcv2++) {
						pnTableModel[(pnTableModel.length) - 1].Description = partNumbers.results[pnLcv].PartDesc;
					}
				}
			}
			oView.byId("idItemsTable2").getModel("TabDetailsModel").refresh();
		},
		ProdHrchySelectionChange: function (oEvent) {
			var _that = this;
			var resourceBundle = this.getResourceBundle();
			var sQuery = "";
			sQuery = oEvent.getSource().getValue();
			// 			if (sQuery.length > 2) {
			var oFilter = new Filter({
				filters: [
					new Filter({
						path: 'PRODH',
						operator: sap.ui.model.FilterOperator.EQ,
						value1: sQuery
					})
				],
				and: false
			});
			this.getOwnerComponent().getModel("UserAction").read("/ProductHierarchySet", {
				filters: [oFilter],
				success: function (data, response) {
					var productHierarchyModel = new JSONModel(data);
					// 	partNumbers = [];
					// 	partNumbers = jQuery.extend(true, {}, data);
					_that.setModel(productHierarchyModel, "productHierarchyModelName");
				},
				error: function (response) {}
			});
			// 			}
		},
		optionsCheck: function (oEvent) {
			var oView = this.getView();
			var tabRowCheck = oEvent.getSource().getSelected();
			var resourceModel = this.getResourceBundle();
			// 			var oModel = this.getOwnerComponent().getModel();
			if (tabRowCheck) {
				var tabColText = oEvent.getSource().getParent().getCells()[1].getText();
				var selOptn = {};
				selOptn.slOptn = tabColText;
				selOptnsTabObject.results.push(selOptn);
				// selOptn.push(selOptnsTabObject);
				var selOptnsTabModel = new JSONModel(selOptnsTabObject);
				this.setModel(selOptnsTabModel, "selOptnsTabModelName");
				var optinTableRecords = oView.byId("idOptions").getModel("TabDetailsModel").getData().OptionTypeSet;
				for (var optnLcv = 0; optnLcv < optinTableRecords.length; optnLcv++) {
					if (tabColText.split("-")[0] === optinTableRecords[optnLcv].OptionCode) {
						optinTableRecords.splice(optnLcv, 1);
					}
				}
				oView.byId("idOptions").getModel("TabDetailsModel").refresh();
				oView.byId("idOptions").setVisibleRowCount(optinTableRecords.length);
				oEvent.getSource().setSelected(false);
				// selOptn = [];
				// selOptnsTabObject = {};
			}
		},
		handleSelectedOptionDelete: function (oEvent) {
			var oView = this.getView();
			oView.byId("idOptions").setVisible(true);
			// 			oView.byId("idFirstCol").setSelected(false);
			var deletedItem = oEvent.getParameter("listItem").getProperty("title");
			var selTabData = oView.byId("idSeltdOptnslist").getModel("selOptnsTabModelName").getData().results;
			for (var delLcv = 0; delLcv < selTabData.length; delLcv++) {
				if (deletedItem.split("-")[0] === (selTabData[delLcv].slOptn).split("-")[0]) {
					oView.byId("idSeltdOptnslist").getModel("selOptnsTabModelName").getData().results.splice(delLcv, 1);
				}
			}
			oView.byId("idSeltdOptnslist").getModel("selOptnsTabModelName").refresh();
			var delItem = {};
			delItem.AppType = "";
			delItem.OptionCode = deletedItem.split("-")[0];
			delItem.OptionCodeDesc = deletedItem.split("-")[1];
			oView.byId("idOptions").getModel("TabDetailsModel").getData().OptionTypeSet.unshift(delItem);
			oView.byId("idOptions").getModel("TabDetailsModel").refresh();
		},
		selectAll: function (oEvent) {
			var oView = this.getView();
			var otab = oView.byId("idOptions");
			var bSelected = oEvent.getParameter('selected');
			var headerText = "";
			var resourceModel = this.getResourceBundle();
			var selOptnsArr = {
				results: []
			}
			if (bSelected) {
				otab.getRows().forEach(function (item) {
					var oCheckBoxCell = item.getCells()[0];
					oCheckBoxCell.setSelected(bSelected);
				})
				var avlOptnsTabModel = oView.byId("idOptions").getModel("TabDetailsModel").getData().OptionTypeSet;
				for (var chLcv = 0; chLcv < avlOptnsTabModel.length; chLcv++) {
					selOptnsArr.results.push(avlOptnsTabModel[chLcv]);
					selOptnsArr.results[chLcv].slOptn = (avlOptnsTabModel[chLcv].OptionCode + "-" + avlOptnsTabModel[chLcv].OptionCodeDesc);
				}
				var selOptnsMdl = new JSONModel(selOptnsArr);
				this.setModel(selOptnsMdl, "selOptnsTabModelName");
				oView.byId("idSeltdOptnslist").getModel("selOptnsTabModelName").refresh();
				oView.byId("idOptions").getModel("TabDetailsModel").getData().OptionTypeSet = [];
				oView.byId("idOptions").getModel("TabDetailsModel").refresh();
				// oEvent.getSource().setSelected(false);
				oView.byId("idOptions").setVisible(false);
			} else {
				otab.getRows().forEach(function (item) {
					var oCheckBoxCell = item.getCells()[0];
					oCheckBoxCell.setSelected(false);
				})
			}

		},

		// File upload event handelers //		
		// 		onChange: function (oEvent) {
		// 			var _ofileUpload = sap.ui.getCore().byId("idFileUploadCollection");
		// 			var _oFileUploderLength = _ofileUpload.getItems().length;
		// 			this.fileContent = oEvent.getParameters().files[0];
		// 			this.fileName = oEvent.getParameters().files[0].name;
		// 			this.fileType = oEvent.getParameters().files[0].type;
		// 			this.fileSize = oEvent.getParameters().files[0].size;

		// 			if (_oFileUploderLength > 9) {
		// 				sap.m.MessageBox.alert(
		// 					"You can not upload more than 10 files. ", {
		// 						actions: [sap.m.MessageBox.Action.OK],
		// 						onClose: function (oAction) {
		// 							if (oAction === "OK") {}
		// 						}

		// 					});

		// 				jQuery.sap.delayedCall(0, this, function () {

		// 					_ofileUpload.removeItem(_ofileUpload.getItems()[0]);

		// 				});
		// 			} else {
		// 				var oModel = this.getOwnerComponent().getModel();
		// 				var oUploadCollection = oEvent.getSource();
		// 				var sectoken = oModel.getSecurityToken();
		// 				var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
		// 					name: "x-csrf-token",
		// 					value: sectoken
		// 				});
		// 				oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
		// 			}

		// 		},
		// 		onTypeMissmatch: function (oEvent) {
		// 			var _oFileTypeExt = oEvent.getParameters().files[0].fileType;
		// 			sap.m.MessageBox.alert(
		// 				"You can not upload " + _oFileTypeExt + " file type", {
		// 					actions: [sap.m.MessageBox.Action.OK],
		// 					onClose: function (oAction) {
		// 						if (oAction === "OK") {}
		// 					}

		// 				});

		// 			//sap.m.MessageToast.show("You can not upload " + _oFileTypeExt + " file type");
		// 		},
		// 		onFileSizeExceed: function (oEvent) {
		// 			var oUploadCollection = this.getView().byId("idFileUploadCollection");
		// 			var fileSize = oEvent.getParameter("fileSize"),
		// 				fileName = oEvent.getParameter("fileName");
		// 			/*sap.m.MessageToast.show("The chosen file '" + fileName + "' is " + fileSize + " MB big, this exceeds the maximum filesize of " +
		// 				oUploadCollection.getMaximumFileSize() + " MB.");*/
		// 			sap.m.MessageBox.alert(
		// 				"The chosen file '" + fileName + "' is " + fileSize + " MB big, this exceeds the maximum filesize of " +
		// 				oUploadCollection.getMaximumFileSize() + " MB.", {
		// 					actions: [sap.m.MessageBox.Action.OK],
		// 					onClose: function (oAction) {
		// 						if (oAction === "OK") {}
		// 					}

		// 				});

		// 		},

		// 		onStartUpload: function (oEvent) {
		// 			var oUploadCollection = sap.ui.getCore().byId("idFileUploadCollection");
		// 			var cFiles = oUploadCollection.getItems().length;
		// 			this._allItems = oUploadCollection.getItems();
		// 			this._responseReceivedCnt = 0;
		// 			if (cFiles > 10) {
		// 				sap.ui.core.BusyIndicator.hide();
		// 				sap.m.MessageBox.error("Maximum file count per interaction is 10");
		// 			} else {
		// 				var uploadInfo = "";
		// 				oUploadCollection.upload();
		// 				uploadInfo = cFiles + " file(s)";
		// 			}
		// 		},

		// 		onFilenameLengthExceed: function (oEvent) {
		// 			/*	var fileNameLengthExceedErrorMsg = this.getView().getModel("i18n").getResourceBundle().getText("fileNameLengthExceedErrorMsg");

		// 				sap.m.MessageToast.show(fileNameLengthExceedErrorMsg);*/

		// 			sap.m.MessageBox.alert(
		// 				"File name can't be exceed 55 characters.", {
		// 					actions: [sap.m.MessageBox.Action.OK],
		// 					onClose: function (oAction) {
		// 						if (oAction === "OK") {}
		// 					}

		// 				});
		// 		},

		// 		onBeforeUploadStarts: function (oEvent) {
		// 			var _self = this;
		// 			var fileContent = "";
		// 			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
		// 				name: "slug",
		// 				// value: oEvent.getParameter("fileName") + "|" + _self._oMessageId
		// 				value: this.fileContent + "|" + this.Vbeln + "|" + this.fileName + "|" + this.fileType + "|" + this.fileSize
		// 			});

		// 			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
		// 			setTimeout(function () {}, 40000);
		// 		},
		// 		onUploadComplete: function (oEvent) {
		// 			var _that = this;
		// 			var oUploadCollection;
		// 			oUploadCollection = sap.ui.getCore().byId("idFileUploadCollection");
		// 			var sUploadedFileName = "";
		// 			var uploadError = "";
		// 			var _responseReceivedlen = "";
		// 			for (var j = 0; j < oEvent.getParameter("files").length; j++) {
		// 				sUploadedFileName = oEvent.getParameter("files")[j].fileName;
		// 				for (var i = 0; i < this._allItems.length; i++) {
		// 					if (this._allItems[i].getFileName() === sUploadedFileName) {
		// 						_responseReceivedlen = oEvent.getParameter("files").length;
		// 						this._responseReceivedCnt = 0 + this._responseReceivedCnt + _responseReceivedlen;
		// 						if (oEvent.getParameter("files")[j].status === 201) {
		// 							oUploadCollection.removeItem(this._allItems[i]);
		// 							_that.getView().byId("idItemsTable233").getModel("TabDetailsModel").refresh();
		// 						} else {
		// 							// 			var responceFile = oEvent.getParameter("files")[j].reponse;
		// 							// 			var slpliteString = responceFile.split("/");
		// 							// 			uploadError = slpliteString[1].slice(3);
		// 							// 			this._uploadErrorOccured = true;
		// 							// 			sap.m.MessageBox.show(uploadError, sap.m.MessageBox.Icon.ERROR);
		// 							sap.ui.core.BusyIndicator.hide();
		// 							break;
		// 						}
		// 					}

		// 				}

		// 			}

		// 			if (this._responseReceivedCnt === this._allItems.length) {
		// 				var _self = this;
		// 			}

		// 		},
		// 		onAttachmentsPess: function () {
		// 			this._getAddAttachments().open();
		// 		},
		// 		_getAddAttachments: function () {
		// 			var _self = this;
		// 			if (!_self._oDialogSelection2) {
		// 				_self._oDialogSelection2 = sap.ui.xmlfragment("com.yaskawa.ETOMyInbox.view.fragments.AddAttachments", _self);
		// 				_self.getView().addDependent(_self._oDialogSelection2);
		// 			}
		// 			return _self._oDialogSelection2;
		// 		},
		// 		onCloseAddAttachDialog: function () {
		// 			this._getAddAttachments().close();
		// 		},
		checkMVHPSflagValue: function (oEvent) {
			// 			var selItemDtls = this.getModel("OrderDetailsModel").getProperty("/ETOItemListSet");
			var _self = this;
			var filterBySONumber = new sap.ui.model.Filter({
				path: "SONumber",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.Vbeln
			});
			var filterByAction = new sap.ui.model.Filter({
				path: "Action",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: ""
			});
			var filterByItems = new sap.ui.model.Filter({
				path: "Items",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.Posnr
			});
			var filterBySONumberActionItems = [];
			filterBySONumberActionItems.push(filterBySONumber, filterByAction, filterByItems);

			this.getOwnerComponent().getModel().read("/ETOItemListSet", {
				filters: [filterBySONumberActionItems],
				success: function (oData, response) {
					if (oData.results[0].MVHPS === "X") {
						_self.getView().byId("idPaSubmittal").setVisible(true);
					} else {
						_self.getView().byId("idPaSubmittal").setVisible(false);
					}
				},
				error: function (response) {}
			})

		},
		formatDate: function (dValue) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY/MM/DD"
			});
			var dateFormatted = dateFormat.format(dValue);
			return dateFormatted;
		},
		addPASubmittalDocumentPress: function () {
			this.getView().byId("idUpload").setVisible(true);
			this.getModel("TabDetailsModel").getData().ETOAttachmentSet.push({
				"Source": "",
				"Filename": "",
				"Url": "",
				"User": "",
				"Date": "",
				"Time": ""
			});
			this.getModel("TabDetailsModel").refresh();
		},
		drawingTypeGet: function (oEvent) {
			var _self = this;
			var oView = this.getView();
			var oDTModel = this.getOwnerComponent().getModel("UserAction");
			var sUrl = "/DrawingTypeSet";
			var filterByTypeApp = new sap.ui.model.Filter({
				path: "Type",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.AppType
			});
			var oDFltrValue = [];
			oDFltrValue.push(filterByTypeApp);
			oDTModel.read(sUrl, {
				filters: [oDFltrValue],
				success: function (oData, response) {
					var drawingTypeModel = new JSONModel(oData);
					_self.setModel(drawingTypeModel, "drawingTypeModelName");
				},
				error: function (response) {}
			})
		},
		drawingTypeSelectionChange: function (oEvent) {
			this.drawingTypeValue = oEvent.getSource().getSelectedKey();
		}

	});

});