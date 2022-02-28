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
				PreOrderItemTableData: []

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

				this.readChecklistEntity("/ZPRE_ORD_ITEMSet", Filter.Sofilter),

				// PA Submital Tab 
				this.readChecklistEntity("/ETOAttachmentSet", Filter.attachFilter)

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
			this.getModel("TabDetailsModel").setProperty("/PreOrderItemTableData", ZPRE_ORD_ITEMSet);

			// PA Submital Tab  data model binding
			this.getModel("TabDetailsModel").setProperty("/ETOAttachmentSet", aETOAttachmentSet);

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
			var filerValue = {

				attachFilter: attachFilter,
				Sofilter: Sofilter

			};

			return filerValue;
		},
		getTabDetials: function (SalesOrder, ItemNo) {

			this.getModel("objectViewModel").setProperty("/busy", true);
			var sSalesOrderFilter = new sap.ui.model.Filter({
				path: "SalesOrder",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: SalesOrder

			});
			var sItemNoFilter = new sap.ui.model.Filter({
				path: "ItemNo",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: ItemNo

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
		addPreOrderItemPress: function () {
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
			var iRowNumberToDelete = parseInt(oEvent.getSource().getBindingContext("TabDetailsModel").getPath().slice("/".length).slice(22, 23));
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

			var oSubmit = {
				"SalesOrder": this.Vbeln,
				"ItemNo": this.Posnr,
				"Action": "C",
				"Quantity": "50",
				"NetAmount": "5.00",
				"WfStatus": "",
				"OpOptionType": "",
				"OpOption": "",
				"AppMotorFull": "",
				"AppPanelSscr": "",
				"AppAmbTemp": "",
				"AppEnclosure": "",
				"AppCableEntry": "",
				"AppVenitilation": "",
				"AppAltitude": "",
				"EnclUlType1": "",
				"EnclUlType1Min": "",
				"EnclUlType1NoHole": "",
				"EnclUlType1Gasketed": "",
				"EnclUlType1Type12": "",
				"EnclUlType1Other": "",
				"EnclUlType12": "",
				"EnclUlType12AcUnit": "",
				"EnclUlType12HeatAir": "",
				"EnclUlType12HeatWater": "",
				"EnclUlType12Other": "",
				"EnclUlType3r": "",
				"EnclUlType3rAcUnit": "",
				"EnclUlType3rHeatWater": "",
				"EnclUlType3rOther": "",
				"EnclNemaType": "",
				"EnclNemaTypeNema12": "",
				"EnclNemaTypeNema4": "",
				"EnclNemaTypeNema4x": "",
				"EnclNemaTypeOther": "",
				"EnclItemNotes": "",
				"ProdType": "",
				"ProdPlant": "",
				"ProdUom": "",
				"ProdOverheadGrp": "",
				"ProdStrGrp": "",
				"ProdMaterial": "",
				"ProdHierarchy": "",
				"ProdProcurementType": "",
				"ProdValuationClass": "",
				"ProdSerialNo": "",
				"ProdDesc": "",
				"ProdMatPrcGrp": "",
				"ProdMatGrp1": "",
				"ProdMrpType": "",
				"MaterialGroup": "",
				"MaterialLoadTime": "",
				"MaterialGrTime": "",
				"MaterialRequirementGrp": "",
				"MaterialProdSupervisor": "",
				"MaterialDelLead": "",
				"MaterialTimeFence": "",
				"MaterialLotSize": "",
				"MaterialProdTime": "",
				"MaterialProdProfile": "",
				"MaterialMrpControl": "",
				"MaterialFixedLotSize": "",
				"HpsMaterial": "",
				"HpsType": "",
				"HpsSccr": "",
				"HpsDrive": "",
				"HpsSimilarModel": "",
				"HpsPlanningMaterial": "",
				"HpsDollar": "",
				"HpsItemNotes": "",
				"PaSubmittalType": "",
				"PaSubmittalEmail": "",
				"PaSubmittalDueDate": "",
				"PaSubmittalContact": "",
				"PaSubmittalName": "",
				"PaSubmittalNumber": "",
				"PaSubmittalDocType": "",
				"PaSubmittalDrawings": "",
				"PaSubmittalSubmitted": "",
				"PaSubmittalSentToCustomer": "",
				"OehpsPriority": "",
				"OehpsDevtLevel": "",
				"OehpsSchedEngHrs": "",
				"OehpsActualEngHrs": "",
				"OehpsMeDesign": "",
				"OehpsEeDesign": "",
				"OehpsSystAnalysis": "",
				"OehpsAprvDrawing": "",
				"OehpsXengAprvRcvd": "",
				"OehpsZzkickoff": "",
				"OehpsPreOrdBom": "",
				"OehpsShpSplitBom": "",
				"OehpsLineupBom": "",
				"OehpsBomReview": "",
				"OehpsFinalSapBom": "",
				"OehpsRoutingsCreated": "",
				"OehpsZ7StatusRemoved": "",
				"OehpsZzprodKickoff": "",
				"Message": "",
				"WFSTEP": aPreOrderItemData
			};

			this.getOwnerComponent().getModel("UserAction").create("/ZWF_DETAILSSet", oSubmit, {

				success: function (oData, oResponse) {
					sap.m.MessageBox.success(oData.Message);
					// 	this.byId("idWorkFlowStatus").setValue(oData.workflowstatus);

				}.bind(this),
				error: function (oError) {

				}.bind(this),
			});

		},
		handleBackPress: function (oEvent) {
			this.getRouter().navTo("worklist");
		},
		onUploadPress: function (oEvent) {
			var that = this;
			var sSaleOrderNo = this.Vbeln;

			this.getModel("objectViewModel").setProperty("/busy", true);
			var file = this.byId("__FILEUPLOAD").getFocusDomRef().files[0];

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
				value: Filecontent + "|" + Input + "|" + Filename + "|" + Filetype + "|" + Filesize + "|" + itemNo

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