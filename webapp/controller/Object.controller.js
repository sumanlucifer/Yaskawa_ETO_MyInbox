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

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {

			this.createInitialModel();
			this._createHeaderDetailsModel();
			this._orderDetailsModel();
			this._attachmentsModel();
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

			if (oEvent.getParameter("status") === 500) {
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
			oFileUploader.setUseMultipart(false);
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

			var logDetailsData = {
				results: [{
					"changedBy": "G. Reichelt",
					"Date": "21.05.2021",
					"Time": "10:00 a.m",
					"Actionperfomed": "Created",
					"fileName": "xyz.pdf",
					"comments": "This has been approved"
				}, {
					"changedBy": "M. Koehler",
					"Date": "22.05.2021",
					"Time": "11:00 a.m",
					"Actionperfomed": "Requote Pending",
					"fileName": "xyz1.pdf",
					"comments": "Please Requote"
				}, {
					"changedBy": "C. Cerfus",
					"Date": "23.05.2021",
					"Time": "11:30 a.m",
					"Actionperfomed": "Requote Pending",
					"fileName": "xyz2.pdf",
					"comments": "Please clarify"
				}, {
					"changedBy": "M. Sevilla",
					"Date": "24.05.2021",
					"Time": "12:00 a.m",
					"Actionperfomed": "Scheduling",
					"fileName": "xyz3.xls",
					"comments": "Scheduling Completed."
				}, {
					"changedBy": "J. Midday",
					"Date": "25.05.2021",
					"Time": "12:30 p.m",
					"Actionperfomed": "ENG Complete",
					"fileName": "xyz.xls",
					"comments": "Completed"
				}]
			};
			var ilogTableModel = new JSONModel(logDetailsData);
			this.setModel(ilogTableModel, "ilogTableModelName");

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
			this.onGetSODetails();
		},
		onGetSODetails: function () {

			this.getModel("objectViewModel").setProperty("/busy", true);
			var Filter = this.getFilters(this.sSaleOrderNo);

			this.getModel("objectViewModel").setProperty("/busy", true);
			Promise.allSettled([this.readChecklistEntity("/ETOHeaderDetailSet", Filter.SOfilterHDS),
				this.readChecklistEntity("/ETO_ITEM_HEADERSet", Filter.SOfilter),
				this.readChecklistEntity("/ETOItemListSet", Filter.SOfilter),
				this.readChecklistEntity("/ETOAttachmentSet", Filter.attachFilter)

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

			var sSaleOrderNoFilterHDS = new sap.ui.model.Filter({
				path: "Vbeln",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSaleOrderNo
			});
			var SOfilterHDS = [];
			SOfilterHDS.push(sSaleOrderNoFilterHDS);

			var sattachFilter = new sap.ui.model.Filter({
				path: "Input",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSaleOrderNo
			});
			var attachFilter = [];
			attachFilter.push(sattachFilter);

			var filerValue = {
				SOfilter: SOfilter,
				SOfilterHDS: SOfilterHDS,
				attachFilter: attachFilter
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
			this.getModel("objectViewModel").setProperty("/busy", false);
			var aETOHeaderSet = values[0].status === "rejected" ? null : values[0].value.results;
			var aETOItemHeaderSet = values[1].status === "rejected" ? null : values[1].value.results;
			var aETOItemListSet = values[2].status === "rejected" ? null : values[2].value.results;
			var aETOAttachmentSet = values[3].status === "rejected" ? null : values[3].value.results;
			this.getModel("HeaderDetailsModel").setSizeLimit(1000);
			this.databuilding(aETOHeaderSet[0]);
			this.getModel("HeaderDetailsModel").setProperty("/ETOItemHeaderSet", aETOItemHeaderSet[0]);
			this.getModel("OrderDetailsModel").setProperty("/ETOItemListSet", aETOItemListSet);
			this.getModel("AttachmentsModel").setProperty("/ETOAttachmentSet", aETOAttachmentSet);

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
		onSelectUserAssignment: function (oEvent) {

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
			var sUser = oEvent.getSource().getSelectedKey();

			this.getModel("objectViewModel").setProperty("/busy", true);
			var sUserFilter = new sap.ui.model.Filter({
				path: "Group",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sUser
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
				sObjectPath1 = oEvent.getSource().getBindingContext("OrderDetailsModel").getObject().SOItem;
			this.getRouter().navTo("itemView", {
				objectId: sObjectPath,
				objectId1: sObjectPath1
			});

			// 			this.getRouter().navTo("itemView");

		},
		onItemSelect: function (oEvent) {
			var bSelected = oEvent.getParameter("selected");
			var bSelectAll = oEvent.getParameter("selectAll");
			var aListItems = oEvent.getParameter("listItems");

			var aSelectedLineItems = this.byId("idItemsTable").getSelectedItems();
			this.POSNO = [];

			for (var i = 0; i < aSelectedLineItems.length; i++) {
				this.POSNO.push(aSelectedLineItems[i].getBindingContext("OrderDetailsModel").getObject());

			}

			//this.byId("idItemsTable").removeSelections();

			//	this.setSaveButtonEnabledDisable();
		},

		onRequotePress: function (oEvent) {
			var oView = this.getView();
			this._getRequoteSelectionDialog().open();
			// oView.byId("idRequoteArea").setVisible(true);
			oView.byId("idOrderStatus").setValue("Requote Pending");
			oView.byId("idCfStatus").setValue("Complete");
			// oView.byId("idClarifyArea").setVisible(false);
			// oView.byId("idClarifyButtonn").setVisible(false);
			// oView.byId("idCreateFGMatrl").setVisible(false);

		},
		onRequoteSubmit: function (oEvent) {
			var selSoNumber = this.getView().byId("idZbStdPoNonStock2").getValue();
			MessageBox.success("SO Number" + " " + selSoNumber + " " + "successfully requoted.");
			this._getRequoteSelectionDialog().close();
		},

		onRequoteCancel: function (oEvent) {
			this._getRequoteSelectionDialog().close();
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
			this._getClarifySelectionDialog().open();
			var oView = this.getView();
			oView.byId("idOsLbl").setVisible(false);
			oView.byId("idOrderStatus").setVisible(false);
			oView.byId("idCfStatus").setValue("Clarify");

		},
		onClarifySubmit: function (oEvent) {
			var selSoNumber = this.getView().byId("idZbStdPoNonStock2").getValue();
			MessageBox.success("SO Number" + " " + selSoNumber + " " + "has been clarified successfully.");
			this._getClarifySelectionDialog().close();
		},
		onClarifyCancel: function (oEvent) {
			this._getClarifySelectionDialog().close();
		},
		onFGMatPress: function (oEvent) {
			var oView = this.getView();
			oView.byId("idClarifyArea").setVisible(true);
			oView.byId("idRequoteArea").setVisible(false);
			oView.byId("idRequotteButtonn").setVisible(false);
			oView.byId("idClarifyButtonn").setVisible(false);
			oView.byId("idCfsLbl").setVisible(true);
			oView.byId("idCfOs").setVisible(true);
			oView.byId("idCfOs").setValue("Scheduling");
			oView.byId("idCfCs").setValue("Complete");
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
			this.getModel("globalModel").setProperty("/groupAssignKey", "");
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
			sap.ui.getCore().byId("idAppEngUploadCollection").removeAllItems();
		},
		onAttachmentAddToTable: function () {
			var uploadedFileName = sap.ui.getCore().byId("idAppEngUploadCollection").getAggregation("items")[0].getProperty("fileName");
			var attachmentsDetailsDataAfterUpload = {
				results: [{
					"source": "AppEng",
					"fileNmae": uploadedFileName,
					"from": "G. Reichelt",
					"timeStamp": "27-May-2021 08:08:05 AM"
				}]
			};
			// var attachtsTableModel = new JSONModel(attachmentsDetailsDataAfterUpload);
			// this.setModel(attachtsTableModel, "attachtsTableModelName");
			var attachmentTableModel = this.getView().byId("idAttachmentsTable").getModel("attachtsTableModelName");
			attachmentTableModel.getData().results.push(attachmentsDetailsDataAfterUpload.results[0]);
			attachmentTableModel.refresh();
			this._getAttachmentDialog().close();
		},

		// onNotesPress: function(){
		// 	this.getView().byId("TextArea2").setEditable(true);
		// },
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
		onAddNewItemPress: function (oEvent) {
			var newItemToAdd = {
				results: [{
					"itemNo": "",
					"matNo": "",
					"panel": "",
					"itemNotes": ""
				}]
			};
			var newItemModel = new JSONModel(newItemToAdd);
			this.setModel(newItemModel, "newItemModelName");
			var oView = this.getView();
			oView.byId("idItemSubSection").setVisible(false);
			oView.byId("idAddNewItem").setVisible(true);
		},
		onAddNewItemToTable: function (oEvent) {
			var oView = this.getView();
			var itemTable = oView.byId("idItemsTable");
			// var itemNumber = idItemNumber
			// var materialNumber = 
			// var panel=
			// var itemNotes=
			// var newItemToAdd = {results:[{
			// 	"itemNo": "",
			// 		"matNo": "",
			// 		"panel": "",
			// 		"itemNotes": ""
			// }]};
			// var newItemModel = new JSONModel(newItemToAdd);
			// this.setModel(newItemModel, "newItemModelName");
			if (itemTable.getItems().length) {
				var newItemTableData = oView.getModel("newItemModelName").getData().results;
				oView.getModel("itemModelName").getData().results.push(newItemTableData[0]);
				oView.getModel("itemModelName").refresh();
			} else {
				var newItemModel = new JSONModel(oView.getModel("newItemModelName"));
				this.setModel(newItemModel, "newItemModelName");
			}

			oView.byId("idItemSubSection").setVisible(true);
			oView.byId("idAddNewItem").setVisible(false);
		},
		onAddItemCancel: function () {
			var oView = this.getView();
			oView.byId("idItemSubSection").setVisible(true);
			oView.byId("idAddNewItem").setVisible(false);
		},
		tesr: function () {
			debugge
		}

	});

});