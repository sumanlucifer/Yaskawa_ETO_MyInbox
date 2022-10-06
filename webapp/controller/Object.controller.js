sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"../model/formatter",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/Device"
], function (BaseController, JSONModel, History, formatter, MessageBox, Fragment, Device) {
	"use strict";
	var drawingTypes = [];
	var lineItems = [];
	return BaseController.extend("com.yaskawa.ETOMyInbox.controller.Object", {

		formatter: formatter,

		onInit: function () {

			this.createInitialModel();
			this._createHeaderDetailsModel();
			this._orderDetailsModel();
			this._attachmentsModel();
			this.logDetailsModel();
			this.notesDetailsModel();
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.getOwnerComponent().getService("ShellUIService").then(function (oShellService) {
				oShellService.setBackNavigation(function () {
					this.onNavBack();
				}.bind(this));
			}.bind(this));

		},
		createInitialModel: function () {
			var oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "objectViewModel");
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

		_orderDetailsModel: function () {
			var oModel = new JSONModel({
				ETOItemListSet: []

			});
			this.setModel(oModel, "OrderDetailsModel");
		},
		_attachmentsModel: function () {
			var oModel = new JSONModel({
				ETOAttachmentSet: []

			});
			this.setModel(oModel, "AttachmentsModel");
		},
		logDetailsModel: function () {
			var oModel = new JSONModel({
				ETOAttachmentSet: []

			});
			this.setModel(oModel, "logDetailsModel");
		},
		notesDetailsModel: function () {
			var oModel = new JSONModel({
				ETOAttachmentSet: []

			});
			this.setModel(oModel, "notesDetailsModel");
		},
		onUploadPress: function (oEvent) {
			var that = this;
			var sSaleOrderNo = this.sSaleOrderNo;

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
				this.onGetSODetails();
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
			oFileUploader.removeAllHeaderParameters();
			oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
				name: "slug",
				value: Filecontent + "|" + Input + "|" + Filename + "|" + Filetype + "|" + Filesize

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
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},

		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.sSaleOrderNo = sObjectId;
			this.byId("ObjectPageLayout").setSelectedSection(this.byId("idItemSubSection"));
			this.onGetSODetails();
			this.ordEnggChkBoxesShowHide();
			this.orderEngDetailsGet(sObjectId);
			this.paSubmittalDetailsGet(sObjectId);
			this.getAttachmentDetails();
			this.getETOItemDetails();
			// 			this.drawingTypeGet();
			// 			this.SOItemsGet(sObjectId);
		},

		_bindView: function (sObjectPath) {
			var objectViewModel = this.getViewModel("objectViewModel"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oDataModel.metadataLoaded().then(function () {

							objectViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function () {
						objectViewModel.setProperty("/busy", false);
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
		onPressSynch: function () {
			this.SyncAction = 90;

			this.callItemPopupService(this.sSaleOrderNo);

		},

		callItemPopupService: function (sSaleOrderNo) {
			var sVBlenFilter = new sap.ui.model.Filter({
				path: "Vbeln",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSaleOrderNo
			});
			var filter = [];
			filter.push(sVBlenFilter);
			this.getOwnerComponent().getModel().read("/ETOLineItemSOSet", {
				filters: [filter],
				success: function (oData, oResponse) {

					this.openPopFragment(oData.results);

				}.bind(this),
				error: function (oError) {
					this.getModel("objectViewModel").setProperty("/busy", false);

				}.bind(this),
			});
		},

		openPopFragment: function (response) {

			this.getModel("HeaderDetailsModel").setProperty("/POPItemDataModel", response);
			if (!this._oItemPopupDialog) {
				this._oItemPopupDialog = sap.ui.xmlfragment(
					"com.yaskawa.ETOMyInbox.view.fragments.ItemPopup", this);
				this.getView().addDependent(this._oItemPopupDialog);
			}
			if (Device.system.desktop) {
				this._oItemPopupDialog.addStyleClass("sapUiSizeCompact");
			}
			this._oItemPopupDialog.open();
		},

		onSelectAllItems: function (oEvent) {
			var bState = oEvent.getSource().getSelected();

			var ItemData = this.getModel("HeaderDetailsModel").getProperty("/POPItemDataModel");
			ItemData.forEach(item => {
				item.Selected = bState;

			});

			this.getModel("HeaderDetailsModel").refresh();
		},
		onPressConfirmPopupItems: function (oEvent) {
			var aItemData = this.getModel("HeaderDetailsModel").getProperty("/POPItemDataModel");
			for (var i = 0; i < aItemData.length; i++) {
				if (!aItemData[i].Selected) {
					aItemData.splice(i, 1);
					i--;
				}
			}

			this.SelectedPOPupItemNo = Array.prototype.map.call(aItemData, function (item) {
				return item.ItemNo;
			}).join(",");
			this.onGetSODetails();
			this._oItemPopupDialog.close();
		},
		onCancelItemPopup: function () {
			this._oItemPopupDialog.close();
		},
		onGetSODetails: function () {

			this.getModel("objectViewModel").setProperty("/busy", true);
			var Filter = this.getFilters(this.sSaleOrderNo);

			this.getModel("objectViewModel").setProperty("/busy", true);
			Promise.allSettled([this.readChecklistEntity("/ETOHeaderDetailSet", Filter.SOfilterHDS),
				this.readChecklistEntity("/ETO_ITEM_HEADERSet", Filter.SOfilter),
				this.readChecklistEntity("/ETOItemListSet", Filter.aETOItemListSetFilter),
				this.readChecklistEntity("/ETOAttachmentSet", Filter.attachFilter),
				this.readChecklistEntity("/ETOLogDetailsSet", Filter.logFilter),
				this.readChecklistEntity("/ETONotesSet", Filter.notesFilter)

			]).then(this.buildChecklist.bind(this)).catch(function (error) {}.bind(this));

		},
		getFilters: function (sSaleOrderNo) {
			var sSaleOrderNoFilter = new sap.ui.model.Filter({
				path: "SONumber",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSaleOrderNo
			});
			var SOfilter = [];
			SOfilter.push(sSaleOrderNoFilter);

			var sETOItemListSetFilter1 = new sap.ui.model.Filter({
				path: "SONumber",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSaleOrderNo
			});
			var sETOItemListSetFilter2 = new sap.ui.model.Filter({
				path: "Action",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.SyncAction
			});
			var sETOItemListSetFilter3 = new sap.ui.model.Filter({
				path: "Items",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.SelectedPOPupItemNo
			});
			var aETOItemListSetFilter = [];
			aETOItemListSetFilter.push(sETOItemListSetFilter1, sETOItemListSetFilter2, sETOItemListSetFilter3);

			var sSaleOrderNoFilterHDS = new sap.ui.model.Filter({
				path: "Vbeln",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSaleOrderNo
			});
			var sIndicatorFilter = new sap.ui.model.Filter({
				path: "Indicator",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: "M"
			});
			var SOfilterHDS = [];
			SOfilterHDS.push(sSaleOrderNoFilterHDS, sIndicatorFilter);

			var sattachFilter = new sap.ui.model.Filter({
				path: "Input",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSaleOrderNo
			});
			var sattachFilter1 = new sap.ui.model.Filter({
				path: "ItemNr",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: "000000"
			});
			var attachFilter = [];
			attachFilter.push(sattachFilter, sattachFilter1);

			var sLogFilter = new sap.ui.model.Filter({
				path: "Vbeln",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSaleOrderNo
					// value1: "0000097046"
			});
			var logFilter = [];
			logFilter.push(sLogFilter);

			var sNotesFilter = new sap.ui.model.Filter({
				path: "Vbeln",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSaleOrderNo
					// value1: "0000097046"
			});
			var notesFilter = [];
			notesFilter.push(sNotesFilter);

			var filerValue = {
				SOfilter: SOfilter,
				aETOItemListSetFilter: aETOItemListSetFilter,
				SOfilterHDS: SOfilterHDS,
				attachFilter: attachFilter,
				logFilter: logFilter,
				notesFilter: notesFilter
			};

			return filerValue;
		},
		readChecklistEntity: function (path, filter) {

			return new Promise(
				function (resolve, reject) {
					this.getOwnerComponent().getModel().read(path, {
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
			this.SyncAction = "";
			this.getModel("objectViewModel").setProperty("/busy", false);
			var aETOHeaderSet = values[0].status === "rejected" ? null : values[0].value.results;
			var aETOItemHeaderSet = values[1].status === "rejected" ? null : values[1].value.results;
			var aETOItemListSet = values[2].status === "rejected" ? null : values[2].value.results;
			var aETOAttachmentSet = values[3].status === "rejected" ? null : values[3].value.results;
			var aETOLogDetailsSet = values[4].status === "rejected" ? null : values[4].value.results;
			var aETONotesDetailsSet = values[5].status === "rejected" ? null : values[5].value.results;
			this.getModel("HeaderDetailsModel").setSizeLimit(1000);
			this.databuilding(aETOHeaderSet[0]);
			aETOItemListSet[0].Message === "" ? null : sap.m.MessageBox.error(aETOItemListSet[0].Message);
			aETOItemHeaderSet[0].NoDisplay === "" ? this.getModel("HeaderDetailsModel").setProperty("/VisibilityFields", true) : this.getModel(
				"HeaderDetailsModel").setProperty("/VisibilityFields", false);
			this.getModel("HeaderDetailsModel").setProperty("/ETOItemHeaderSet", aETOItemHeaderSet[0]);
			this.getModel("OrderDetailsModel").setProperty("/ETOItemListSet", aETOItemListSet);
			this.getModel("AttachmentsModel").setProperty("/ETOAttachmentSet", aETOAttachmentSet);
			this.getModel("logDetailsModel").setProperty("/ETOLogDetailsSet", aETOLogDetailsSet);
			this.getModel("notesDetailsModel").setProperty("/ETONotesDetailsSet", aETONotesDetailsSet);

		},
		databuilding: function (data) {

			if (data !== null) {
				this.getModel("HeaderDetailsModel").setProperty("/OrderDate", data.OrderDate);
				this.getModel("HeaderDetailsModel").setProperty("/ReqestedBy", data.ReqestedBy);
				this.getModel("HeaderDetailsModel").setProperty("/ShipDate", data.ShipDate);
				this.getModel("HeaderDetailsModel").setProperty("/CustReprsntv", data.CustReprsntv);
				this.getModel("HeaderDetailsModel").setProperty("/CustName", data.CustName);
				this.getModel("HeaderDetailsModel").setProperty("/CustNumber", data.CustNumber);
				this.getModel("HeaderDetailsModel").setProperty("/OrderStatus", data.OrderStatus);
				this.getModel("HeaderDetailsModel").setProperty("/TotalNetValue", data.TotalNetValue);
				this.getModel("HeaderDetailsModel").setProperty("/TypeApp", data.TypeApp);
				this.getModel("HeaderDetailsModel").setProperty("/TypeOrder", data.TypeOrder);
				this.getModel("HeaderDetailsModel").setProperty("/NoSalesOrder", data.NoSalesOrder);
				this.getModel("HeaderDetailsModel").setProperty("/CustPo", data.CustPo);
				this.getModel("HeaderDetailsModel").setProperty("/distributionChannelKey", data.Vtweg);
				this.getModel("HeaderDetailsModel").setProperty("/orderStatusSetKey", data.OrderStatus);
				this.getModel("HeaderDetailsModel").setProperty("/QuotationNo", data.QuotationNo);
			}

		},
		onSelect: function (oEvent) {
			var aPOSNo = [];
			if (oEvent.getParameters().selected) {

				var POSnr = oEvent.getSource().getBindingContext("OrderDetailsModel").getObject().SOItem;
				aPOSNo.push(POSnr);
				this.POSNO = [...new Set(aPOSNo)];

			}

		},
		// 		onPressAccptButton: function (oeve) {
		// 			var Status = "01";
		// 			this.userActionServiceCall(Status);
		// 		},

		onPressHeaderAccept: function () {
			this.userActionServiceCall("09", "", "");

		},

		onPressHeaderReject: function () {
			this.userActionServiceCall("06", "", "");
		},
		userActionServiceCall: function (Status, userName, groupName) {
			var SONo = this.sSaleOrderNo;
			var HeadeItem;

			var POSNo = this.POSNO;

			var ItemData = this.getModel("OrderDetailsModel").getProperty("/ETOItemListSet");
			this.getModel("objectViewModel").setProperty("/busy", true);
			if (!POSNo) {

				HeadeItem = "";
			} else {
				HeadeItem = POSNo.map(
					function (item) {
						return {
							Vbeln: SONo,
							Posnr: item.SOItem,
						};
					}
				);
			}

			if (Status === "01") {
				var oPayload = {
					"Vbeln": SONo,
					"Status": Status,
					"User_group": "",
					"User_name": "",
					"HeadItem": HeadeItem
				};
			} else {
				var oPayload = {
					"Vbeln": SONo,
					"Status": Status,
					"User_group": groupName,
					"User_name": userName,
					"HeadItem": HeadeItem
				};
			}

			this.getOwnerComponent().getModel("UserAction").create("/HeaderSet", oPayload, {

				success: function (oData, oResponse) {
					this.POSNO = [];
					this.byId("idItemsTable").removeSelections();
					this.onGetSODetails();
					this.getModel("objectViewModel").setProperty("/busy", false);
					if (Status === "01") {
						sap.m.MessageBox.success(oData.Message);
					} else {
						sap.m.MessageBox.success(oData.Message);
					}

				}.bind(this),
				error: function (oError) {
					this.POSNO = [];
					this.byId("idItemsTable").removeSelections();
					this.getModel("objectViewModel").setProperty("/busy", false);

				}.bind(this),
			});
		},
		onSelectUserAssignment1: function (oEvent) {

			var sUser = oEvent.getSource().getSelectedKey();

			this.getModel("objectViewModel").setProperty("/busy", true);
			var sUserFilter = new sap.ui.model.Filter({
				path: "Name",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sUser
			});
			var filter = [];
			filter.push(sUserFilter);
			this.getOwnerComponent().getModel().read("/ETOGroupSet", {
				filters: [filter],
				success: function (oData, oResponse) {
					this.getComponentModel("globalModel").setProperty("/userGroupsSet", oData.results);
					this.getModel("objectViewModel").setProperty("/busy", false);

				}.bind(this),
				error: function (oError) {
					this.getModel("objectViewModel").setProperty("/busy", false);

				}.bind(this),
			});
		},
		onSelectGroupAssignment: function (oEvent) {
			//	var sUser = oEvent.getSource().getSelectedKey();

			this.getModel("objectViewModel").setProperty("/busy", true);
			var sUserFilter = new sap.ui.model.Filter({
				path: "Group",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.Group
			});
			var filter = [];
			filter.push(sUserFilter);
			this.getOwnerComponent().getModel().read("/ETOUsersSet", {
				filters: [filter],
				success: function (oData, oResponse) {
					this.getComponentModel("globalModel").setProperty("/userDetailssSet", oData.results);
					this.getModel("objectViewModel").setProperty("/busy", false);

				}.bind(this),
				error: function (oError) {
					this.getModel("objectViewModel").setProperty("/busy", false);

				}.bind(this),
			});
		},
		itemTableSelection: function (oEvent) {
			var sObjectPath = oEvent.getSource().getBindingContext("OrderDetailsModel").getObject().SONumber,
				sObjectPath1 = oEvent.getSource().getBindingContext("OrderDetailsModel").getObject().SOItem,
				sObjectPath2 = oEvent.getSource().getBindingContext("OrderDetailsModel").getObject().TypeApp,
				sObjectPath3 = oEvent.getSource().getBindingContext("OrderDetailsModel").getObject().NoDisplay;
			// 			this.getRouter().navTo("itemView", {
			// 				objectId: sObjectPath,
			// 				objectId1: sObjectPath1,
			// 				objectId2: sObjectPath2
			// 			});
			this.getRouter().navTo("itemView", {},
				true
			);
			this.getModel("globalModel").setProperty("/objectId", sObjectPath);
			this.getModel("globalModel").setProperty("/objectId1", sObjectPath1);
			this.getModel("globalModel").setProperty("/objectId2", sObjectPath2);
			this.getModel("globalModel").setProperty("/visibilityField", sObjectPath3);

			// 			this.getRouter().navTo("itemView");

		},
		onItemSelect: function (oEvent) {
			var bSelected = oEvent.getParameter("selected");
			var bSelectAll = oEvent.getParameter("selectAll");
			var aListItems = oEvent.getParameter("listItems");

			var aSelectedLineItems = this.byId("idItemsTable").getSelectedItems();
			this.Group = aSelectedLineItems[0].getBindingContext("OrderDetailsModel").getObject().GroupName;
			this.getModel("globalModel").setProperty("/groupAssignKey", this.Group);
			this.onSelectGroupAssignment();
			this.POSNO = [];

			for (var i = 0; i < aSelectedLineItems.length; i++) {
				this.POSNO.push(aSelectedLineItems[i].getBindingContext("OrderDetailsModel").getObject());

			}

			var aSelectedGroupName = this.POSNO;
			var aGroupName = aSelectedGroupName.map(function (item) {
				return {
					GroupName: item.GroupDescr
				}

			});
			if (aGroupName.length > 1) {
				for (var i = 0; i < aGroupName.length; i++) {
					var itemfirst = aGroupName[i].GroupName;
					var itemnext = aGroupName[i + 1].GroupName;
					if (itemfirst !== itemnext) {
						sap.m.MessageBox.error("Please select differfent Line item with same group name!");
						this.byId("idItemsTable").removeSelections();
						return false;
					}
				}
				// var isDuplicate = aGroupName.some(function (item, idx) {
				// 	return aGroupName.indexOf(item) != idx
				// });

				// if (!isDuplicate) {
				// 	sap.m.MessageBox.error("Please select differfent Line item with different group name!");
				// 	this.byId("idListServiceTab").removeSelections();
				// 	return false;
				// }
			}

			//this.byId("idItemsTable").removeSelections();

			//	this.setSaveButtonEnabledDisable();
		},

		onNotesPress: function (oeve) {
			if (!this._oDialogNotesSection) {
				this._oDialogNotesSection = sap.ui.xmlfragment("com.yaskawa.ETOMyInbox.view.fragments.Notes", this);
				this.getView().addDependent(this._oDialogNotesSection);

			}
			this._oDialogNotesSection.open();
		},
		onPressOk: function () {
			this.getModel("objectViewModel").setProperty("/busy", true);
			var Note = sap.ui.getCore().byId("TextArea2").getValue();
			var oPayload = {

				"Vbeln": this.sSaleOrderNo,
				"Posnr": "",
				"Note": Note,
				"Message": "Success"

			};
			this.getOwnerComponent().getModel().create("/ETONotesSet", oPayload, {

				success: function (oData, oResponse) {

					this.onGetSODetails();
					this._oDialogNotesSection.close();

					this.getModel("objectViewModel").setProperty("/busy", false);
					sap.ui.getCore().byId("TextArea2").setValue("");
					sap.m.MessageBox.success("Notes Updated Successfully!");
				}.bind(this),
				error: function (oError) {
					this._oDialogNotesSection.close();
					sap.ui.getCore().byId("TextArea2").setValue("");
					this.getModel("objectViewModel").setProperty("/busy", false);
					sap.m.MessageBox.error("HTTP Request Failed");

				}.bind(this),
			});
		},
		onPressCancel: function () {
			sap.ui.getCore().byId("TextArea2").setValue("");
			this._oDialogNotesSection.close();
		},
		onPressDeleteAttchmnt: function (oEvent) {
			var object = oEvent.getSource().getBindingContext("AttachmentsModel").getObject();
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

				"SONumber": this.sSaleOrderNo,
				"Item": object.ItemNr,
				"Index": object.Index,
				"Message": ""

			};
			this.getOwnerComponent().getModel().create("/DeleteAttachmentSet", oPayload, {

				success: function (oData, oResponse) {

					this.getModel("objectViewModel").setProperty("/busy", false);
					this.onGetSODetails();

					sap.m.MessageBox.success(oData.Message);
				}.bind(this),
				error: function (oError) {

					this.getModel("objectViewModel").setProperty("/busy", false);
					sap.m.MessageBox.error("HTTP Request Failed");

				}.bind(this),
			});
		},
		handleSubmitPress: function (oEvent) {
			var _self = this;
			var selSoNumber = this.getView().byId("idZbStdPoNonStock2").getValue();
			MessageBox.success("SO Number" + " " + " " + selSoNumber + " " + "has been submitted successfully", {
				actions: [MessageBox.Action.OK],

				onClose: function (sAction) {
					_self.getRouter().navTo("worklist");
				}
			});

		},
		handleSubmitPress2: function (oEvent) {
			var _self = this;
			_self.getRouter().navTo("worklist");
			// MessageBox.success("Successfully Submitted", {
			// 	actions: [MessageBox.Action.OK],

			// 	onClose: function (sAction) {
			// 		_self.getRouter().navTo("worklist");
			// 	}
			// });

		},
		onReassignButtonPress: function () {
			this.Status = "02";
			this.getModel("globalModel").setProperty("/userAssignKey", "");
			//this.getModel("globalModel").setProperty("/groupAssignKey", "");
			//this.getModel("globalModel").setProperty("/userGroupVisible", false);
			var POSNo = this.POSNO;
			if (!POSNo) {
				sap.m.MessageBox.error("Please select at least one item!");
				return false;
			}
			if (POSNo.length === 0) {
				sap.m.MessageBox.error("Please select at least one item!");
				return false;
			}
			if (!this._oDialogReassignSection1) {
				this._oDialogReassignSection1 = sap.ui.xmlfragment("com.yaskawa.ETOMyInbox.view.fragments.ReassignSection", this);
				this.getView().addDependent(this._oDialogReassignSection1);

			}
			this._oDialogReassignSection1.open();

		},

		onReject: function () {
			this.Status = "03";
			this.getModel("globalModel").setProperty("/userAssignKey", "");
			//this.getModel("globalModel").setProperty("/groupAssignKey", "");
			//this.getModel("globalModel").setProperty("/userGroupVisible", false);
			var POSNo = this.POSNO;
			if (!POSNo) {
				sap.m.MessageBox.error("Please select at least one item!");
				return false;
			}
			if (POSNo.length === 0) {
				sap.m.MessageBox.error("Please select at least one item!");
				return false;
			}
			// 			if (!this._oDialogReassignSection1) {
			// 				this._oDialogReassignSection1 = sap.ui.xmlfragment("com.yaskawa.ETOMyInbox.view.fragments.ReassignSection", this);
			// 				this.getView().addDependent(this._oDialogReassignSection1);

			// 			}
			// 			this._oDialogReassignSection1.open();
			this.userActionServiceCall(this.Status, "", "");

		},
		onAttachmentOk: function () {

			var userName = this.getModel("globalModel").getProperty("/userAssignKey"),
				groupName = this.getModel("globalModel").getProperty("/groupAssignKey");
			this.userActionServiceCall(this.Status, userName, groupName);
			this._oDialogReassignSection1.close();
			this.Status = "";
		},
		onAttachmentCancel: function () {
			this.getModel("globalModel").setProperty("/userAssignKey", "");
			this.getModel("globalModel").setProperty("/groupAssignKey", "");
			this.POSNO = [];
			this._oDialogReassignSection1.close();
			this.byId("idItemsTable").removeSelections();
		},

		onAttachmentTableItemDelete: function (oEvent) {
			var deletedItemTableIndexPath = oEvent.getSource().getBindingContext("attachtsTableModelName").getPath();
			var deletedItemTableIndex = deletedItemTableIndexPath.split("/")[2];
			var deletedTableModel = oEvent.getSource().getModel("attachtsTableModelName");
			var deletedTableModelData = oEvent.getSource().getModel("attachtsTableModelName").getData();

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

		},
		onBack: function () {
			console.log("dwed");
		},
		onExit: function () {
			console.log("onExit() of controller called...");
			alert("onExit function called");
		},
		appEngSecHdrSubmitPresss: function (oEvent) {
			var oView = this.getView();
			// 			var payLoadToSubmit = {
			// 				"ORDER": this.sSaleOrderNo,
			// 				// "SCHD_OUT_DATE": this.formatDate(oView.byId("idScheduledOutDate").getValue()),
			// 				"SCHD_OUT_DATE": oView.byId("idScheduledOutDate").getValue(),
			// 				"SCHD_HOURS": oView.byId("idScheduledHours").getValue(),
			// 				"ACT_ENG_HOURS": oView.byId("idActualEngHours").getValue(),
			// 				// "ACT_OUT_DATE": this.formatDate(oView.byId("idScheduledOutDate").getProperty("dateValue")),
			// 				"ACT_OUT_DATE": oView.byId("idScheduledOutDate").getValue(),
			// 				"ORDER_ENGINEER": oView.byId("idDevLevel").getValue(),
			// 				"OEHPS_ME_DESIGN": oView.byId("idMEDesign").getSelected(),
			// 				"OEHPS_EE_DESIGN": oView.byId("idEEDesign").getSelected(),
			// 				"OEHPS_SYST_ANALYSIS": oView.byId("idSystemAnalysis").getSelected(),
			// 				"OEHPS_APRV_DRAWING": oView.byId("idApprovedDrwnings").getSelected(),
			// 				"OEHPS_XENG_APRV_RCVD": oView.byId("idApprvlRcvd").getSelected(),
			// 				"OEHPS_ZZKICKOFF": oView.byId("idKickoffMeeting").getSelected(),
			// 				"OEHPS_PRE_ORD_BOM": oView.byId("idPreOrdrSAPBomCrtd").getSelected(),
			// 				"OEHPS_SHP_SPLIT_BOM": oView.byId("idShippingSplitBOM").getSelected(),
			// 				"OEHPS_LINEUP_BOM": oView.byId("idLineBOMCreated").getSelected(),
			// 				"OEHPS_BOM_REVIEW": oView.byId("BOMReviewComplete").getSelected(),
			// 				"OEHPS_FINAL_SAP_BOM": oView.byId("idFinalSAPBOM").getSelected(),
			// 				"OEHPS_ROUTINGS_CREATED": oView.byId("idRoutingCreated").getSelected(),
			// 				"OEHPS_ZZPROD_KICKOFF": oView.byId("idZZProdKickoff").getSelected(),
			// 				"B1_STATUS": oView.byId("idB1hasbeenremoved").getSelected(),
			// 				// PA/Submital Tab Fields
			// 				"PaSubmittalType": this.byId("idPASubmitalType").getValue(),
			// 				"PaSubmittalEmail": this.byId("PASubmitalEmail").getValue(),
			// 				"PaSubmittalDueDate": this.byId("idDueDate").getValue(),
			// 				"PaSubmittalContact": this.byId("idContact").getValue(),
			// 				"PaSubmittalName": this.byId("idName").getValue(),
			// 				"PaSubmittalNumber": this.byId("idNumber").getValue(),
			// 				"MESSAGE": "",
			// 				"WFATTACH": attachmentDetails
			// 			};
			// PA/ Submittal Attachments
			var attachmentDetails = this.getModel("etoAttachmentModel").getData().results
			attachmentDetails = attachmentDetails.map(function (item2) {
				return {

					Vbeln: this.sSaleOrderNo,
					Posnr: "000000",
					SeqNo: "",
					AttaType: "",
					Title: "",
					Attachment: "",
					FileName: item2.Filename,
					DrawingType: "",
					LineItems: ""

				};
			}, this);
			for (var atLcvv2 = 0; atLcvv2 < attachmentDetails.length; atLcvv2++) {
				drawingTypes.push(this.getView().byId("idItemsTable233").mAggregations.items[atLcvv2].mAggregations.cells[4].getProperty(
					"selectedKey"));
				lineItems.push(this.getView().byId("idItemsTable233").mAggregations.items[atLcvv2].mAggregations.cells[5].getProperty(
					"selectedKeys").toString());
			}
			for (var atLcvv = 0; atLcvv < attachmentDetails.length; atLcvv++) {
				attachmentDetails[atLcvv].DrawingType = drawingTypes[atLcvv];
				attachmentDetails[atLcvv].LineItems = lineItems[atLcvv];
			}
			var payLoadToSubmit = {
				//  Header fields
				"SalesOrder": this.sSaleOrderNo,
				// "ItemNo": this.Posnr,
				"Action": "S",
				"Quantity": "0.000",
				"NetAmount": "0.000",
				"WfStatus": "",
				//	Options Tab fields
				// "OpOptionType": this.aSelectedOptionsType,
				"OpOptionType": "",
				"OpOption": "",
				// Application Data Tab Fields
				"AppMotorFull": "",
				"AppPanelSscr": "",
				"AppAmbTemp": "",
				"AppEnclosure": "",
				"AppCableEntry": "",
				"AppVenitilation": "",
				"AppAltitude": "",
				// Enclosure Tab Fields
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
				// Product Type Tab Fields
				"ProdType": "",
				"ProdPlant": "",
				"ProdUom": "",
				"ProdOverheadGrp": "",
				"ProdStrGrp": "",
				"ProdMaterial": "",
				// "ProdHierarchy": this.byId("idProdHrchy").getSelectedKey(),
				"ProdHierarchy": "",
				"ProdProcurementType": "",
				"ProdValuationClass": "",
				"ProdSerialNo": "",
				"ProdDesc": "",
				"ProdMatPrcGrp": "",
				"ProdMatGrp1": "",
				"ProdMrpType": "",
				// Materials Details Tab Fields
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
				//HPS Tab Fields
				"HpsMaterial": "",
				"HpsType": "",
				"HpsSccr": "",
				"HpsDrive": "",
				"HpsSimilarModel": "",
				"HpsPlanningMaterial": "",
				"HpsDollar": "",
				"HpsItemNotes": "",
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
				"PASubmitalDrawingDate": this.formatDate(this.byId("idDrwigCmpltnDte").getValue()),
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
				"WFSTEP": [],
				"WFATTACH": attachmentDetails
			};

			// 			if (payLoadToSubmit.OEHPS_ME_DESIGN) {
			// 				payLoadToSubmit.OEHPS_ME_DESIGN = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_ME_DESIGN = " ";
			// 			}
			// 			if (payLoadToSubmit.OEHPS_EE_DESIGN) {
			// 				payLoadToSubmit.OEHPS_EE_DESIGN = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_EE_DESIGN = " ";
			// 			}
			// 			if (payLoadToSubmit.OEHPS_SYST_ANALYSIS) {
			// 				payLoadToSubmit.OEHPS_SYST_ANALYSIS = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_SYST_ANALYSIS = " ";
			// 			}
			// 			if (payLoadToSubmit.OEHPS_APRV_DRAWING) {
			// 				payLoadToSubmit.OEHPS_APRV_DRAWING = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_APRV_DRAWING = " ";
			// 			}
			// 			if (payLoadToSubmit.OEHPS_XENG_APRV_RCVD) {
			// 				payLoadToSubmit.OEHPS_XENG_APRV_RCVD = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_XENG_APRV_RCVD = " ";
			// 			}
			// 			if (payLoadToSubmit.OEHPS_ZZKICKOFF) {
			// 				payLoadToSubmit.OEHPS_ZZKICKOFF = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_ZZKICKOFF = " ";
			// 			}
			// 			if (payLoadToSubmit.OEHPS_PRE_ORD_BOM) {
			// 				payLoadToSubmit.OEHPS_PRE_ORD_BOM = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_PRE_ORD_BOM = " ";
			// 			}
			// 			if (payLoadToSubmit.OEHPS_SHP_SPLIT_BOM) {
			// 				payLoadToSubmit.OEHPS_SHP_SPLIT_BOM = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_SHP_SPLIT_BOM = " ";
			// 			}
			// 			if (payLoadToSubmit.OEHPS_LINEUP_BOM) {
			// 				payLoadToSubmit.OEHPS_LINEUP_BOM = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_LINEUP_BOM = " ";
			// 			}
			// 			if (payLoadToSubmit.OEHPS_BOM_REVIEW) {
			// 				payLoadToSubmit.OEHPS_BOM_REVIEW = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_BOM_REVIEW = " ";
			// 			}
			// 			if (payLoadToSubmit.OEHPS_FINAL_SAP_BOM) {
			// 				payLoadToSubmit.OEHPS_FINAL_SAP_BOM = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_FINAL_SAP_BOM = " ";
			// 			}
			// 			if (payLoadToSubmit.OEHPS_ROUTINGS_CREATED) {
			// 				payLoadToSubmit.OEHPS_ROUTINGS_CREATED = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_ROUTINGS_CREATED = " ";
			// 			}
			// 			if (payLoadToSubmit.OEHPS_ZZPROD_KICKOFF) {
			// 				payLoadToSubmit.OEHPS_ZZPROD_KICKOFF = "X";
			// 			} else {
			// 				payLoadToSubmit.OEHPS_ZZPROD_KICKOFF = " ";
			// 			}
			// 			if (payLoadToSubmit.B1_STATUS) {
			// 				payLoadToSubmit.B1_STATUS = "X";
			// 			} else {
			// 				payLoadToSubmit.B1_STATUS = " ";
			// 			}
			this.getOwnerComponent().getModel("UserAction").create("/ZWF_DETAILSSet", payLoadToSubmit, {
				success: function (oData, oResponse) {
					drawingTypes = [];
					lineItems = [];
					sap.m.MessageBox.success(oData.Message);
				},
				error: function (oError) {
					drawingTypes = [];
					lineItems = [];
					sap.m.MessageBox.error(oError.message);
				}
			});
		},
		ordEnggChkBoxesShowHide: function (oEvent) {
			// 			var selItemDtls = this.getModel("OrderDetailsModel").getProperty("/ETOItemListSet");
			var _self = this;
			var filterBySONumber = new sap.ui.model.Filter({
				path: "SONumber",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.sSaleOrderNo
			});
			var filterByAction = new sap.ui.model.Filter({
				path: "Action",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.SyncAction
			});
			var filterByItems = new sap.ui.model.Filter({
				path: "Items",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.SelectedPOPupItemNo
			});
			var filterBySONumberActionItems = [];
			filterBySONumberActionItems.push(filterBySONumber, filterByAction, filterByItems);

			this.getOwnerComponent().getModel().read("/ETOItemListSet", {
				filters: [filterBySONumberActionItems],
				success: function (oData, response) {
					if (oData.results[0].MVHPS === "X") {
						_self.getView().byId("idOrdEnggChkBoxes").setVisible(true);
					} else {
						_self.getView().byId("idOrdEnggChkBoxes").setVisible(false);
					}
				},
				error: function (response) {}
			})
		},
		orderEngDetailsGet: function (selOrdVal) {
			var _self = this;
			var oView = this.getView();
			var ordEngMdl = this.getOwnerComponent().getModel();
			var sUrl = "/ETOOrderEngineeringSet";
			var filterByORDER = new sap.ui.model.Filter({
				path: "ORDER",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: selOrdVal
			});
			var ordFltrValue = [];
			ordFltrValue.push(filterByORDER);
			ordEngMdl.read(sUrl, {
				filters: [ordFltrValue],
				success: function (oData, response) {
					var ordEnggMdl = new JSONModel(oData);
					if (oData.results[0].B1_STATUS === "X") {
						oData.results[0].B1_STATUS = true;
					} else {
						oData.results[0].B1_STATUS = false;
					}
					_self.setModel(ordEnggMdl, "ordEnggMdlName");

				},
				error: function (response) {

				}
			})
		},
		paSubmittalDetailsGet: function (slOrdrNo) {
			var sself = this;
			var oView = this.getView();
			var sModel = this.getOwnerComponent().getModel("UserAction");
			var sPath = `/ZWF_DETAILSSet(SalesOrder='${slOrdrNo}',ItemNo='0000')`;

			sModel.read(sPath, {
				success: function (data, response) {
					var paSbmttlMdl = new JSONModel(data);
					sself.setModel(paSbmttlMdl, "paSbmttlMdlName");
				},
				error: function (error) {}
			})

		},
		// 		Start of File upload functionality for PA/Submittal Tab.
		onUploadPressPASbmttl: function (oEvent) {
			var that = this;
			var sSaleOrderNo = this.Vbeln;
			this.getModel("objectViewModel").setProperty("/busy", true);
			var file = oEvent.getParameters().files[0];
			var Filename = file.name,
				Filetype = file.type,
				Filesize = file.size;
			that._updateDocumentServicePASubmttl(file, Filename, Filetype, Filesize, this.sSaleOrderNo);
		},
		onCompletePASubmttl: function (oEvent) {
			if (oEvent.getParameter("status") === 500 || oEvent.getParameter("status") === 201) {
				this.getModel("objectViewModel").setProperty("/busy", false);
				sap.m.MessageBox.success("The File has been uploaded successfully!");
				this.getAttachmentDetails();
				this.getView().getModel().refresh();
				// this.callItemDetailDropDownService();
				this.byId("__FILEUPLOAD2").setValue("");
				this.getModel().refresh();
				// this.byId("idUpload").setVisible(false);
			} else {
				this.getModel("objectViewModel").setProperty("/busy", false);
				sap.m.MessageBox.error("The File  upload failed!");
				this.byId("__FILEUPLOAD2").setValue("");
			}
		},
		_updateDocumentServicePASubmttl: function (Filecontent, Filename, Filetype, Filesize, Input) {
			var oFileUploader = this.byId("__FILEUPLOAD2");
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
		onFileNameLengthExceedPASubmttl: function () {
			MessageBox.error("File name length exceeded, Please upload file with name lenght upto 50 characters.");
		},
		onFileSizeExceedPASubmttl: function () {
			MessageBox.error("File size exceeded, Please upload file with size upto 200KB.");
		},
		onAttachmentItemDeletePASubmttl: function (oEvent) {
			var object = oEvent.getSource().getBindingContext("etoAttachmentModel").getObject();
			var selIndex = oEvent.getSource().getBindingContext("etoAttachmentModel").getPath().split("/")[2];
			sap.m.MessageBox.warning("Are you sure to delete this attachment?", {
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				styleClass: "messageBoxError",
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {
						this.deleteServiceCallPASubmttl(object, selIndex);
					}
				}.bind(this),
			});
		},
		deleteServiceCallPASubmttl: function (object, selIndex) {
			this.getModel("objectViewModel").setProperty("/busy", true);
			var oPayload = {
				"SONumber": this.getView().byId("idSONo").getValue(),
				"Item": "",
				"Index": selIndex,
				"FileName": object.Filename + "." + object.Filetype,
				"Message": ""
			};
			this.getOwnerComponent().getModel("UserAction").create("/DeleteAttachmentSet", oPayload, {
				success: function (oData, oResponse) {
					this.getModel("objectViewModel").setProperty("/busy", false);
					// 	this.callItemDetailDropDownService();
					this.getAttachmentDetails();
					this.getView().getModel("etoAttachmentModel").refresh();
					sap.m.MessageBox.success(oData.Message);
				}.bind(this),
				error: function (oError) {
					this.getModel("objectViewModel").setProperty("/busy", false);
					sap.m.MessageBox.error("HTTP Request Failed");
				}.bind(this),
			});
		},
		// 		End of File upload functionality for PA/Submittal Tab.
		getAttachmentDetails: function () {
			var slf = this;
			var filterBySONo = new sap.ui.model.Filter({
				path: "Input",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.sSaleOrderNo
			});
			var filterByITmNo = new sap.ui.model.Filter({
				path: "ItemNr",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: ""
			});
			this.getOwnerComponent().getModel("UserAction").read("/ETOAttachmentSet", {
				filters: [filterBySONo, filterByITmNo],
				success: function (oData) {
					var etoAttachmentModel = new JSONModel(oData);
					slf.setModel(etoAttachmentModel, "etoAttachmentModel");
				},
				error: function (oError) {}
			});
		},
		drawingTypeGet: function (appTyp) {
			var _self = this;
			var oView = this.getView();
			var oDTModel = this.getOwnerComponent().getModel("UserAction");
			var sUrl = "/DrawingTypeSet";
			var filterByTypeApp = new sap.ui.model.Filter({
				path: "Type",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: appTyp
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
		SOItemsGet: function (slOrdrNmbr) {
			var _selff = this;
			var oView = this.getView();
			var SOItemsModel = this.getOwnerComponent().getModel("UserAction");
			var sUrl = "/SOItemsSet";
			var filterByVbeln = new sap.ui.model.Filter({
				path: "VBELN",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: slOrdrNmbr
			});
			var SOItemFltrValue = [];
			SOItemFltrValue.push(filterByVbeln);
			SOItemsModel.read(sUrl, {
				filters: [SOItemFltrValue],
				success: function (oData, response) {
					var SOItemModel = new JSONModel(oData);
					_selff.setModel(SOItemModel, "SOItemModelName");
				},
				error: function (response) {}
			})
		},
		getETOItemDetails: function (oEvent) {
			var _seelff = this;
			var appType = "";
			var slOrdr = "";
			var oView = this.getView();
			var ETOItemDetailsModel = this.getOwnerComponent().getModel();
			var sUrl = "/ETOItemDetailsSet";
			ETOItemDetailsModel.read(sUrl, {
				success: function (oData, response) {
					// 	for (var etLcv = 0; etLcv < oData.results.length; etLcv++) {
					// 		if (_seelff.sSaleOrderNo === oData.results[etLcv].SONumber) {
					// 			appType = oData.results[etLcv].TypeApp;
					// 			slOrdr = oData.results[etLcv].SONumber
					// 			break;
					// 		}
					// 	}
					// 	appType = _seelff.getView().getModel("OrderDetailsModel").getData().ETOItemListSet[0].TypeApp;
					// 	slOrdr = _seelff.getView().getModel("OrderDetailsModel").getData().ETOItemListSet[0].SONumber
					// 	_seelff.checkMVHPSflagValue(slOrdr, appType);
					_seelff.checkMVHPSflagValue();
				},
				error: function (response) {

				}
			})
		},
		checkMVHPSflagValue: function (slsOrdr, appType) {
			// 			var selItemDtls = this.getModel("OrderDetailsModel").getProperty("/ETOItemListSet");
			var _self = this;
			var filterBySONumber = new sap.ui.model.Filter({
				path: "SONumber",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.sSaleOrderNo
			});
			var filterByAction = new sap.ui.model.Filter({
				path: "Action",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: ""
			});
			var filterByItems = new sap.ui.model.Filter({
				path: "Items",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: ""
			});
			var filterBySONumberActionItems = [];
			filterBySONumberActionItems.push(filterBySONumber, filterByAction, filterByItems);

			this.getOwnerComponent().getModel().read("/ETOItemListSet", {
				filters: [filterBySONumberActionItems],
				success: function (oData, response) {
					if (oData.results[0].MVHPS === "X") {
						_self.getView().byId("idPaSubmittal").setVisible(false);
						// 		_self.drawingTypeGet(appType);
						// 		_self.SOItemsGet(slsOrdr);
					} else {
						_self.getView().byId("idPaSubmittal").setVisible(true);
						// 		_self.drawingTypeGet(appType);
						// 		_self.SOItemsGet(slsOrdr);
					}

					_self.drawingTypeGet(oData.results[0].TypeApp);
					_self.SOItemsGet(oData.results[0].SONumber);
				},
				error: function (response) {}
			})

		},
		formatDate: function (dValue) {
			// 			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
			// 				pattern: "YYYY-MM-DD"
			// 			});
			// 			var dateFormatted = dateFormat.format(dValue);
			var dateFormatted = "";
			if (dValue.includes("/")) {
				dateFormatted = dValue.split("/")[2] + "-" + dValue.split("/")[0] + "-" + dValue.split("/")[1];
			} else {
				dateFormatted = dValue;
			}
			return dateFormatted;
		},
	});
});