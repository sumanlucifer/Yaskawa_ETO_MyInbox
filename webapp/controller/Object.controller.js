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
			this.byId("ObjectPageLayout").setSelectedSection(this.byId("HeaderDetailsSection"));
			this.onGetSODetails();

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
			this.onGetSODetails();

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
			var aETOItemListSetFilter = [];
			aETOItemListSetFilter.push(sETOItemListSetFilter1, sETOItemListSetFilter2);

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
		userActionServiceCall: function (Status, userName, groupName) {
			var SONo = this.sSaleOrderNo;

			var POSNo = this.POSNO;
			if (!POSNo) {
				sap.m.MessageBox.error("Please select at least one item!");
				return false;

			}
			if (POSNo.length === 0) {
				sap.m.MessageBox.error("Please select at least one item!");
				return false;
			}
			var ItemData = this.getModel("OrderDetailsModel").getProperty("/ETOItemListSet");
			this.getModel("objectViewModel").setProperty("/busy", true);

			var HeadeItem = POSNo.map(
				function (item) {
					return {
						Vbeln: SONo,
						Posnr: item.SOItem,
					};
				}
			);
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
				sObjectPath2 = oEvent.getSource().getBindingContext("OrderDetailsModel").getObject().TypeApp;
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
		onAttachmentOk: function () {
			var Status = "02",
				userName = this.getModel("globalModel").getProperty("/userAssignKey"),
				groupName = this.getModel("globalModel").getProperty("/groupAssignKey");
			this.userActionServiceCall(Status, userName, groupName);
			this._oDialogReassignSection1.close();
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
		}

	});

});