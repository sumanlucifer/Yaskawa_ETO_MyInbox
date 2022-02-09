sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/ui/Device",
	"sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Fragment, Device, MessageBox) {
	"use strict";

	return BaseController.extend("com.yaskawa.ETOMyInbox.controller.Worklist", {

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
			this.callDropDownService();
			this.getComponentModel("globalModel").setData({
				userDetailssSet: [],
				userGroupsSet: []

			});

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
				orderTypeSetKey: "",
				typoofApplicationDD: [],
				typoofApplicationKey: "02",
				typoofOrderDD: [],
				typoofOrderKey: "01",
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
				CustPo: null

			});
			this.setModel(oModel, "HeaderDetailsModel");
		},

		callDropDownService: function () {
			this.getModel("objectViewModel").setProperty("/busy", true);
			Promise.allSettled([this.readChecklistEntity("/ETOCustomerSet"),
				this.readChecklistEntity("/ETOCustomerNameSet"),
				this.readChecklistEntity("/ETOOrderStatusSet"),
				this.readChecklistEntity("/ETOOrderTypeSet"),
				this.readChecklistEntity("/ETOTypeOfApplSet"),
				this.readChecklistEntity("/ETODistributionChannelSet"),
				this.readChecklistEntity("/ETOUsersSet"),
				this.readChecklistEntity("/ETOGroupSet"),
				this.readChecklistEntity("/ETOAssignedUserSet"),
			]).then(this.buildChecklist.bind(this)).catch(function (error) {}.bind(this));

		},

		readChecklistEntity: function (path) {

			return new Promise(
				function (resolve, reject) {
					this.getOwnerComponent().getModel().read(path, {
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
			var aETOCustomerSet = values[0].value.results;
			var aETOCustomerNameSet = values[1].value.results;
			var aETOOrderStatusSet = values[2].value.results;
			var aETOOrderTypeSet = values[3].value.results;
			var aETOTypeOfApplSet = values[4].value.results;
			var aETODistributionChannelSet = values[5].value.results;
			var userDetailssSet = values[6].value.results;
			var userGroupsSet = values[7].value.results;
			var userAssignedSet = values[8].value.results;
			this.getComponentModel("globalModel").setSizeLimit(1000);
			this.getComponentModel("globalModel").setProperty("/userDetailssSet", userDetailssSet);
			this.getComponentModel("globalModel").setProperty("/userGroupsSet", userGroupsSet);
			this.getComponentModel("globalModel").setProperty("/ETOOrderTypeSet", aETOOrderTypeSet);
			this.getComponentModel("globalModel").setProperty("/ETOTypeOfApplSet", aETOTypeOfApplSet);

			this.getModel("HeaderDetailsModel").setSizeLimit(1000);
			this.getModel("HeaderDetailsModel").setProperty("/ETOCustomerSet", aETOCustomerSet);
			this.getModel("HeaderDetailsModel").setProperty("/ETOCustomerNameSet", aETOCustomerNameSet);
			this.getModel("HeaderDetailsModel").setProperty("/ETOOrderStatusSet", aETOOrderStatusSet);
			this.getModel("HeaderDetailsModel").setProperty("/ETOOrderTypeSet", aETOOrderTypeSet);
			this.getModel("HeaderDetailsModel").setProperty("/ETOTypeOfApplSet", aETOTypeOfApplSet);
			this.getModel("HeaderDetailsModel").setProperty("/ETODistributionChannelSet", aETODistributionChannelSet);
			this.getModel("HeaderDetailsModel").setProperty("/userDetailssSet", userDetailssSet);
			this.getModel("HeaderDetailsModel").setProperty("/userGroupsSet", userGroupsSet);
			this.getModel("HeaderDetailsModel").setProperty("/userAssignedSet", userAssignedSet);

		},

		onSelectUserAssignment: function (oEvent) {

			var sUser = oEvent.getSource().getValue();

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

		handleChecklistError: function (reason) {
			//handle errors			
		},

		onValueHelpRequest: function (oEvent) {

			var oView = this.getView();

			if (!this._pDialog) {
				this._pDialog = Fragment.load({
					id: oView.getId(),
					name: "com.yaskawa.ETOMyInbox.view.fragments.ValueHelpDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					if (Device.system.desktop) {
						oDialog.addStyleClass("sapUiSizeCompact");
					}
					return oDialog;
				});
			}

			this._pDialog.then(function (oDialog) {

				oDialog.open();
			}.bind(this));
		},
		onValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter(
				[
					new Filter({
						path: "Kunnr",
						operator: "EQ",
						value1: sValue.trim()
					})
				],
				false
			);

			oEvent.getSource().getBinding("items").filter([oFilter]);
		},
		onValueHelpClose: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			oEvent.getSource().getBinding("items").filter([]);
			var oViewModel = this.getModel("HeaderDetailsModel");
			if (!oSelectedItem) {
				return;
			}
			var obj = oSelectedItem.getBindingContext().getObject();

			//  debugger;
			oViewModel.setProperty("/CustomerName", obj["Mcod1"]);

		},

		onSearch: function (sGoodsReciepientValue) {
			var OrderStatus = this.byId("idOrderStatus").getSelectedKey();
			var OrderType = this.byId("idOrderType").getSelectedKey();
			var distChannel = this.byId("idDistChannel").getSelectedKey();
			var appType = this.byId("idAppType").getSelectedKey();
			var customerName = this.byId("idCustName").getValue();
			var customerNo = this.byId("idCustNo").getSelectedKey();
			var group = this.byId("idGRP").getSelectedKey();
			var User = this.byId("idAssignTo").getSelectedKey();
			var OrderDate = this.byId("idOrderDate").getValue();
			var ShipDate = this.byId("idShipDate").getValue();

			this.getView().byId("idListServiceTable").mProperties.enableAutoBinding = true;
			this.byId("idListServiceTable").rebindTable();
			var andFilters = [];
			andFilters.push(new Filter("OrderStatus", FilterOperator.EQ, OrderStatus));
			andFilters.push(new Filter("OrderType", FilterOperator.EQ, OrderType));
			andFilters.push(new Filter("Vtweg", FilterOperator.EQ, distChannel));
			andFilters.push(new Filter("TypeApp", FilterOperator.EQ, appType));
			andFilters.push(new Filter("CustName", FilterOperator.EQ, customerName));
			andFilters.push(new Filter("CustNumber", FilterOperator.EQ, customerNo));
			andFilters.push(new Filter("Group", FilterOperator.EQ, group));
			andFilters.push(new Filter("User", FilterOperator.EQ, User));

			// 			yet to bind
			andFilters.push(new Filter("OrderDate", FilterOperator.EQ, ""));
			andFilters.push(new Filter("ShipDate", FilterOperator.EQ, ""));

			var idTableBinding = this.getView().byId("idListServiceTable").getTable().getBinding("items");
			if (andFilters.length > 0) {
				idTableBinding.filter(new Filter(andFilters, true));

			}

		},

		onSelectionChange: function (oEvent) {
			var bSelected = oEvent.getParameter("selected");
			var bSelectAll = oEvent.getParameter("selectAll");
			var aListItems = oEvent.getParameter("listItems");

			var aSelectedLineItems = this.byId("idListServiceTab").getSelectedItems();
			this.SONumber = [];

			for (var i = 0; i < aSelectedLineItems.length; i++) {
				this.SONumber.push(aSelectedLineItems[i].getBindingContext().getObject());

			}

			//this.byId("idListServiceTab").removeSelections();

			//	this.setSaveButtonEnabledDisable();
		},
		onRefresh: function () {
			this.byId("idListServiceTable").rebindTable();
			this.byId("idListServiceTab").removeSelections();
		},
		onBeforeRebindSaleTable: function (oEvent) {
			// 			var mBindingParams = oEvent.getParameter("bindingParams");
			// 			mBindingParams.filters.push(new Filter("OrderStatus", sap.ui.model.FilterOperator.EQ, "123"));
			//	mBindingParams.sorter.push(new sap.ui.model.Sorter("CreatedAt", true));

		},

		onListTableUpdateFinished: function (oEvent) {
			//Setting the header context for a property binding to $count
			//	this.setIconTabCount(oEvent, oEvent.getParameter("total"), "/totalCount");
		},
		onReset: function () {
			this.byId("idOrderStatus").setSelectedKey(null);
			this.byId("idOrderType").setSelectedKey(null);
			this.byId("idDistChannel").setSelectedKey(null);
			this.byId("idAppType").setSelectedKey(null);
			this.byId("idCustName").setSelectedKey(null);
			this.byId("idCustNo").setSelectedKey(null);

		},

		userActionServiceCall: function (Status, userName, groupName) {
			var SONo = this.SONumber;
			if (!SONo) {
				sap.m.MessageBox.error("Please select at least one Sales Order!");
				return false;
			}
			if (SONo.length === 0) {
				sap.m.MessageBox.error("Please select at least one Sales Order!");
				return false;
			}
			this.getModel("objectViewModel").setProperty("/busy", true);

			var HeadeItem = SONo.map(
				function (item) {
					return {
						Vbeln: item.SONumber,
						Posnr: "",
					};
				}
			);

			var oPayload = {
				"Vbeln": "",
				"Status": Status,
				"User_group": groupName,
				"User_name": userName,
				"HeadItem": HeadeItem
			};

			this.getOwnerComponent().getModel("UserAction").create("/HeaderSet", oPayload, {

				success: function (oData, oResponse) {
					this.onRefresh();
					this.SONumber = [];
					this.getModel("objectViewModel").setProperty("/busy", false);
					this.byId("idListServiceTab").removeSelections();
					if (Status === "01") {
						sap.m.MessageBox.success(oData.Message);
					} else {
						sap.m.MessageBox.success(oData.Message);
					}

				}.bind(this),
				error: function (oError) {
					this.SONumber = [];
					this.byId("idListServiceTab").removeSelections();
					this.getModel("objectViewModel").setProperty("/busy", false);
					sap.m.MessageBox.error("HTTP Request Failed");

				}.bind(this),
			});
		},
		onSelect: function (oEvent) {
			var aSONo = [];
			if (oEvent.getParameters().selected) {

				var SONumber = oEvent.getSource().getBindingContext().getObject().SONumber;
				aSONo.push(SONumber);
				this.SONumber = [...new Set(aSONo)];

			}

		},

		onPress: function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		onNavBack: function () {
			// eslint-disable-next-line sap-no-history-manipulation
			history.go(-1);
		},

		onListTablePress: function (oEvent) {
			var sObjectPath = oEvent.getSource().getBindingContext().getObject().SONumber;
			this.getRouter().navTo("object", {
				objectId: sObjectPath
			});
		},

		itemTableSelectionChange: function (oEvent) {
			var selectedRowIndex = oEvent.getSource().getSelectedContextPaths()[0].split("/")[2];
			// var oItem = oEvent.getSource();
			// var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var selItemNumber = this.getView().getModel("orderlineitemmodelName").getData().results[selectedRowIndex].sono;
			this.getRouter().navTo("object", {
				objectId: selItemNumber
			});
		},
		onPressAcceptButton: function (oeve) {
			this.getModel("globalModel").setProperty("/userAssignKey", "");
			this.getModel("globalModel").setProperty("/groupAssignKey", "null");
			this.getModel("globalModel").setProperty("/userAssnVisible", false);
			var SONo = this.SONumber;
			this.button = "ACCEPT";
			if (!SONo) {
				sap.m.MessageBox.error("Please select at least one Sales Order!");
				return false;
			}
			if (SONo.length === 0) {
				sap.m.MessageBox.error("Please select at least one Sales Order!");
				return false;
			}
			if (!this._oDialogAcceptSection) {
				this._oDialogAcceptSection = sap.ui.xmlfragment("com.yaskawa.ETOMyInbox.view.fragments.ReassignSection", this);
				this.getView().addDependent(this._oDialogAcceptSection);

			}
			this._oDialogAcceptSection.open();

		},
		onReassignButtonPress: function () {
			this.button = "REJECT";
			this.getModel("globalModel").setProperty("/userAssignKey", "");
			this.getModel("globalModel").setProperty("/groupAssignKey", "");
			var SONo = this.SONumber;
			if (!SONo) {
				sap.m.MessageBox.error("Please select at least one Sales Order!");
				return false;
			}
			if (SONo.length === 0) {
				sap.m.MessageBox.error("Please select at least one Sales Order!");
				return false;
			}
			if (!this._oDialogReassignSection) {
				this._oDialogReassignSection = sap.ui.xmlfragment("com.yaskawa.ETOMyInbox.view.fragments.ReassignSection", this);
				this.getView().addDependent(this._oDialogReassignSection);

			}
			this._oDialogReassignSection.open();

		},
		onAttachmentOk: function () {
			var sBtn = this.button;
			if (sBtn === "ACCEPT") {
				var Status = "01";
				this._oDialogAcceptSection.close();
				this.getModel("globalModel").setProperty("/userAssnVisible", true);
			} else {
				this._oDialogReassignSection.close();
				var Status = "02";

			}

			var userName = this.getModel("globalModel").getProperty("/userAssignKey"),
				groupName = this.getModel("globalModel").getProperty("/groupAssignKey");
			this.userActionServiceCall(Status, userName, groupName);
		},
		onAttachmentCancel: function () {
			this.byId("idListServiceTab").removeSelections();
			this.SONumber = [];
			this.getModel("globalModel").setProperty("/userAssignKey", "");
			this.getModel("globalModel").setProperty("/groupAssignKey", "");
			var sBtn = this.button;
			if (sBtn === "ACCEPT") {
				this.getModel("globalModel").setProperty("/userAssnVisible", true);
				this._oDialogAcceptSection.close();
			} else {
				this._oDialogReassignSection.close();

			}
		}

	});
});