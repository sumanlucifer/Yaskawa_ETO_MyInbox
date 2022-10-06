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
				typoofApplicationKey: "",
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
				// this.readChecklistEntity("/ETOCustomerNameSet"),
				this.readChecklistEntity("/ETOOrderStatusSet"),
				this.readChecklistEntity("/ETOTypeOfOrderSet"),
				this.readChecklistEntity("/ETOTypeOfApplSet"),
				this.readChecklistEntity("/ETODistributionChannelSet"),
				this.readChecklistEntity("/ETOUsersSet"),
				this.readChecklistEntity("/ETOGroupSet"),
				this.readChecklistEntity("/ETOAssignedUserSet"),
				this.readChecklistEntity("/ETOSalesOrderSet")
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
			// 			var aETOCustomerNameSet = values[1].value.results;
			var aETOOrderStatusSet = values[1].value.results;
			var aETOOrderTypeSet = values[2].value.results;
			var aETOTypeOfApplSet = values[3].value.results;
			var aETODistributionChannelSet = values[4].value.results;
			var userDetailssSet = values[5].value.results;
			var userGroupsSet = values[6].value.results;
			var userAssignedSet = values[7].value.results;
			var saleOrderNoSet = values[8].value.results;
			this.getComponentModel("globalModel").setSizeLimit(1000);
			this.getComponentModel("globalModel").setProperty("/userDetailssSet", userDetailssSet);
			this.getComponentModel("globalModel").setProperty("/userGroupsSet", userGroupsSet);
			this.getComponentModel("globalModel").setProperty("/ETOOrderTypeSet", aETOOrderTypeSet);
			this.getComponentModel("globalModel").setProperty("/ETOTypeOfApplSet", aETOTypeOfApplSet);

			this.getModel("HeaderDetailsModel").setSizeLimit(1000);
			this.getModel("HeaderDetailsModel").setProperty("/ETOCustomerSet", aETOCustomerSet);
			// 			this.getModel("HeaderDetailsModel").setProperty("/ETOCustomerNameSet", aETOCustomerNameSet);
			this.getModel("HeaderDetailsModel").setProperty("/ETOOrderStatusSet", aETOOrderStatusSet);
			this.getModel("HeaderDetailsModel").setProperty("/ETOOrderTypeSet", aETOOrderTypeSet);
			this.getModel("HeaderDetailsModel").setProperty("/ETOTypeOfApplSet", aETOTypeOfApplSet);
			this.getModel("HeaderDetailsModel").setProperty("/ETODistributionChannelSet", aETODistributionChannelSet);
			this.getModel("HeaderDetailsModel").setProperty("/userDetailssSet", userDetailssSet);
			this.getModel("HeaderDetailsModel").setProperty("/userGroupsSet", userGroupsSet);
			this.getModel("HeaderDetailsModel").setProperty("/userAssignedSet", userAssignedSet);
			this.getModel("HeaderDetailsModel").setProperty("/saleOrderNoSet", saleOrderNoSet);
			var sLoginID = new sap.ushell.services.UserInfo().getId();
			this.byId("idAssignTo").setSelectedKey(sLoginID);

		},

		onSelectUserAssignment1: function (oEvent) {

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
			//	var sUser = oEvent.getSource().getSelectedKey();

			this.getModel("objectViewModel").setProperty("/busy", true);
			var sUserFilter = new sap.ui.model.Filter({
				path: "Group",
				operator: sap.ui.model.FilterOperator.EQ,
				// value1: sUser
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
						path: "CustomerName",
						operator: "Contains",
						value1: sValue.trim()
					})
				],
				false
			);

			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		onLiveChange: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter(
				[
					new Filter({
						path: "Kunnr",
						operator: "Contains",
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
			oViewModel.setProperty("/CustomerName", obj["CustomerName"]);

		},

		onSearch: function () {
			var OrderStatus = this.byId("idOrderStatus").getSelectedKey();
			//	var OrderType = this.byId("idOrderType").getSelectedKey();
			var distChannel = this.byId("idDistChannel").getSelectedKey();
			var appType = this.byId("idAppType").getSelectedKey();
			var customerName = this.byId("idCustName").getValue();
			var customerNo = this.byId("idCustNo").getSelectedKey();
			var group = this.byId("idGRP").getSelectedKey();
			var User = this.byId("idAssignTo").getSelectedKey();
			var OrderDate = this.byId("idOrderDate").getValue();
			var ShipDate = this.byId("idShipDate").getValue();
			var saleOrderNo = this.byId("idSaleOrderNo").getValue();

			this.getView().byId("idListServiceTable").mProperties.enableAutoBinding = true;
			this.byId("idListServiceTable").rebindTable();
			var andFilters = [];
			andFilters.push(new Filter("OrderStatus", FilterOperator.EQ, OrderStatus));
			//	andFilters.push(new Filter("OrderType", FilterOperator.EQ, OrderType));
			andFilters.push(new Filter("Vtweg", FilterOperator.EQ, distChannel));
			andFilters.push(new Filter("TypeApp", FilterOperator.EQ, appType));
			andFilters.push(new Filter("CustName", FilterOperator.EQ, customerName));
			andFilters.push(new Filter("CustNumber", FilterOperator.EQ, customerNo));
			andFilters.push(new Filter("Group", FilterOperator.EQ, group));
			andFilters.push(new Filter("User", FilterOperator.EQ, User));
			andFilters.push(new Filter("SONumber", FilterOperator.EQ, saleOrderNo));

			// 			yet to bind
			andFilters.push(new Filter("OrderDate", FilterOperator.EQ, OrderDate));
			andFilters.push(new Filter("ShipDate", FilterOperator.EQ, ShipDate));

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
			var aSelectedGroupName = this.SONumber;
			var aGroupName = aSelectedGroupName.map(function (item) {
				return {
					GroupName: item.GroupName
				}

			});

			// 			if (aGroupName.length > 1) {
			// for (var i = 0; i < aGroupName.length; i++) {
			// 	var itemfirst = aGroupName[i].GroupName;
			// 	var itemnext = aGroupName[i + 1].GroupName;
			// 	if (itemfirst !== itemnext) {
			// 		sap.m.MessageBox.error("Please select differfent Line item with same group name!");
			// 		this.byId("idListServiceTab").removeSelections();
			// 		return false;
			// 	}
			// }
			// var isDuplicate = aGroupName.some(function (item, idx) {
			// 	return aGroupName.indexOf(item) != idx
			// });

			// if (!isDuplicate) {
			// 	sap.m.MessageBox.error("Please select differfent Line item with different group name!");
			// 	this.byId("idListServiceTab").removeSelections();
			// 	return false;
			// }
			// 			}

			this.Group = aSelectedLineItems[0].getBindingContext().getObject().Group;
			this.getModel("globalModel").setProperty("/groupAssignKey", this.Group);
			this.onSelectGroupAssignment();

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
			//	this.byId("idOrderType").setSelectedKey(null);
			this.byId("idDistChannel").setSelectedKey(null);
			this.byId("idAppType").setSelectedKey(null);
			this.byId("idCustName").setSelectedKey(null);
			this.byId("idCustNo").setSelectedKey(null);
			this.byId("idOrderDate").setValue("");
			this.byId("idShipDate").setValue("");
			this.byId("idGRP").setSelectedKey(null);
			this.byId("idSaleOrderNo").setValue("");
			this.byId("idAssignTo").setSelectedKey(null);

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
						Posnr: item.SOItem,
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
			this.getModel("globalModel").setProperty("/objectID", sObjectPath);

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
			this.getModel("globalModel").setProperty("/groupAssignKey", "");
			this.getModel("globalModel").setProperty("/userAssnVisible", false);
			this.getModel("globalModel").setProperty("/userGroupVisible", true);
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
			// 			
			this.onAttachmentOk();

		},
		onReassignButtonPress: function () {
			this.button = "REJECT";
			this.getModel("globalModel").setProperty("/userAssnVisible", true);
			this.getModel("globalModel").setProperty("/userGroupVisible", true);
			this.getModel("globalModel").setProperty("/userAssignKey", "");
			//	this.getModel("globalModel").setProperty("/groupAssignKey", "");
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
				//	this._oDialogAcceptSection.close();
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
		},
		_getVal: function (evt) {
			return evt.getSource().getValue();
		},
		onWinshuttlePress: function (oEvent) {
			var _that = this;
			var itemsFilter = [];
			if (this.SONumber) {
				for (var itmsLcv = 0; itmsLcv < this.SONumber.length; itmsLcv++) {
					itemsFilter.push(this.SONumber[itmsLcv].SONumber);
				}
				var items = new sap.ui.model.Filter({
					path: "ORDERS",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: itemsFilter.toString()
				});
				this.getOwnerComponent().getModel().read("/ETO_WINSHUTTLESet", {
					filters: [items],
					success: function (wsData, response) {
						_that.winshuttleFormat(wsData)
					},
					error: function (response) {}
				});
			} else {
				sap.m.MessageBox.information("Please select atleast one order.");
			}
		},
		winshuttleFormat: function (wsData) {
			var data = {
				results: []
			};
			for (var wsLcv = 0; wsLcv < wsData.results.length; wsLcv++) {
				data.results.push({
					"1 = Material Number(2)": wsData.results[wsLcv].MATERIAL_NUMBER,
					"2 = Material Type(4)": wsData.results[wsLcv].MATERIAL_TYPE,
					"3 = Desc1(1)": wsData.results[wsLcv].DESC1,
					"4 = Plant(5)": wsData.results[wsLcv].PLANT,
					"5 = Storage Location1(6)": wsData.results[wsLcv].STORAGE_LOCATION1,
					"6 = Sales Organization(12)": wsData.results[wsLcv].SALES_ORGANIZATION,
					"7 = Distribution Channel(13)": wsData.results[wsLcv].DISTRIBUTION_CHANNEL,
					"8 = Uom Code(37)": wsData.results[wsLcv].UOM_CODE,
					"9 = Material Group(39)": wsData.results[wsLcv].MATERIAL_GROUP,
					"10 = Old Mat#(36)": wsData.results[wsLcv].OLD_MAT,
					"11 - Office/ Lab(102)": wsData.results[wsLcv].OFFICE_LAB,
					"12 = Product Hierarchy(46)": wsData.results[wsLcv].PRODUCT_HIERARCHY,
					"13 = GICG(38)": wsData.results[wsLcv].GICG,
					"14 = Gross Weight(87)": wsData.results[wsLcv].GROSS_WEIGHT,
					"15 = Weight Unit(89)": wsData.results[wsLcv].WEIGHT_UNIT,
					"16 = Net Weight(88)": wsData.results[wsLcv].NET_WEIGHT,
					"17 Industry Std Desc": wsData.results[wsLcv].INDUSTRY_STD_DESC,
					"18 Basic Material": wsData.results[wsLcv].BASIC_MATERIAL,
					"19 Document Nbr": wsData.results[wsLcv].DOCUMENT_NBR,
					"20 Document Version": wsData.results[wsLcv].DOCUMENT_VERSION,
					"21 = X Dist Chain Status(43)": wsData.results[wsLcv].DIST_CHAIN_STATUS,
					"22 X Dist Chain Date": wsData.results[wsLcv].DIST_CHAIN_DATE,
					"23 - Delivering Plant": wsData.results[wsLcv].DELIVERING_PLANT,
					"24 = Mat.Statistics Grp(47)": wsData.results[wsLcv].MAT_STATISTICS_GRP,
					"25 = Mat.Pricing Group(48)": wsData.results[wsLcv].MAT_PRICING_GROUP,
					"26 - Item Cat Grp": wsData.results[wsLcv].ITEM_CAT_GRP,
					"27 = Product Hierarchy(46)": wsData.results[wsLcv].PRODUCT_HIERARCHY1,
					"28 = Material Group1(49)": wsData.results[wsLcv].MATERIAL_GROUP1,
					"29 = Material Group2": wsData.results[wsLcv].MATERIAL_GROUP2,
					"30 = Material Group3": wsData.results[wsLcv].MATERIAL_GROUP3,
					"31 = Material Group4": wsData.results[wsLcv].MATERIAL_GROUP4,
					"32 = Material Group5": wsData.results[wsLcv].MATERIAL_GROUP5,
					"33 - Mat Freight Group": wsData.results[wsLcv].MAT_FREIGHT_GROUP,
					"34 = Availability Check(75)": wsData.results[wsLcv].AVAILABILITY_CHECK,
					"35 - Loading Group": wsData.results[wsLcv].LOADING_GROUP,
					"36 = Profit Center(50)": wsData.results[wsLcv].PROFIT_CENTER,
					"37 = Serial Nbr Profile(51)": wsData.results[wsLcv].SERIAL_NBR_PROFILE,
					"38 - Purch Ord UOM": wsData.results[wsLcv].PURCH_ORD_UOM,
					"39 = Purchasing Grp(52)": wsData.results[wsLcv].PURCHASING_GRP,
					"40 = Purchasing Value Key(53)": wsData.results[wsLcv].PURCHASING_VALUE_KEY,
					"41 - Mfg Part Nbr(136)": wsData.results[wsLcv].MFG_PART_NBR,
					"42 - Mfg(137)": wsData.results[wsLcv].MFG,
					"43 - Den Base Unit": wsData.results[wsLcv].DEN_BASE_UNIT,
					"44 - Num Base Unit": wsData.results[wsLcv].NUM_BASE_UNIT,
					"45 - Country of Origin": wsData.results[wsLcv].COUNTRY_OF_ORIGIN,
					"46- Export ctl Class": wsData.results[wsLcv].EXPORT_CTL_CLASS,
					"47 - Grp Legal ctl": wsData.results[wsLcv].GRP_LEGAL_CTL,
					"48 - Ind. Maint. Leg ctl": wsData.results[wsLcv].IND_MAINT_LEG_CTL,
					"49 = MRP Profile": wsData.results[wsLcv].MRP_PROFILE,
					"50 = MRP Group(55)": wsData.results[wsLcv].MRP_GROUP,
					"51 - Plant Spec Mat Stat(139)": wsData.results[wsLcv].PLANT_SPEC_MAT_STAT,
					"52 - PSMS Valid from date": wsData.results[wsLcv].PSMS_VALID_FROM_DATE,
					"53 = MRP Type(56)": wsData.results[wsLcv].MRP_TYPE,
					"54 = Reorder Point(57)": wsData.results[wsLcv].REORDER_POINT,
					"55 = Plan Time Fence(60)": wsData.results[wsLcv].PLAN_TIME_FENCE,
					"56 = MRP Controller(70)": wsData.results[wsLcv].MRP_CONTROLLER,
					"57 = Lot Size key(76)": wsData.results[wsLcv].LOT_SIZE_KEY,
					"58 = Min Lot Size(58)": wsData.results[wsLcv].MIN_LOT_SIZE,
					"59 = Max Lot Size(59)": wsData.results[wsLcv].MAX_LOT_SIZE,
					"60 = Fixed Lot Size(79)": wsData.results[wsLcv].FIXED_LOT_SIZE,
					"61 - Max Stk Lvl": wsData.results[wsLcv].MAX_STK_LVL,
					"62 - Ass.scrap %": wsData.results[wsLcv].ASS_SCRAP,
					"63 PO Round Val": wsData.results[wsLcv].PO_ROUND_VAL,
					"64 = Procurement Type(61)": wsData.results[wsLcv].PROCUREMENT_TYPE,
					"65 = Special Procurement Type(62)": wsData.results[wsLcv].SPECIAL_PROCUREMENT_TYPE,
					"66 = Issue Location(63)": wsData.results[wsLcv].ISSUE_LOCATION,
					"67 = Backflush": wsData.results[wsLcv].BACKFLUSH,
					"68 = Storage Location for EP(64)": wsData.results[wsLcv].STORAGE_LOCATION_FOR_EP,
					"69 - Bulk Material Ind(140)": wsData.results[wsLcv].BULK_MATERIAL_IND,
					"70 = In-house prod time(65)": wsData.results[wsLcv].IN_HOUSE_PROD_TIME,
					"71 = Planned DelivyTime(66)": wsData.results[wsLcv].PLANNED_DELIVYTIME,
					"72 - PPC Plan Cal": wsData.results[wsLcv].PPC_PLAN_CAL,
					"73 = Sched Margin Key(67)": wsData.results[wsLcv].SCHED_MARGIN_KEY,
					"74 = Safety Stock(68)": wsData.results[wsLcv].SAFETY_STOCK,
					"75 - Service Level": wsData.results[wsLcv].SERVICE_LEVEL,
					"76 - Min Safety Stk": wsData.results[wsLcv].MIN_SAFETY_STK,
					"77- Coverage Profile": wsData.results[wsLcv].COVERAGE_PROFILE,
					"78 - Safety Time Ind": wsData.results[wsLcv].SAFETY_TIME_IND,
					"79 - Safety Time": wsData.results[wsLcv].SAFETY_TIME,
					"80 - Period Ind": wsData.results[wsLcv].PERIOD_IND,
					"81 - Fisc Yr Variant": wsData.results[wsLcv].FISC_YR_VARIANT,
					"82 - Splitting Indicator": wsData.results[wsLcv].SPLITTING_INDICATOR,
					"83 = Strategy Group(71)": wsData.results[wsLcv].STRATEGY_GROUP,
					"84 = Consumption Mode(72)": wsData.results[wsLcv].CONSUMPTION_MODE,
					"85 = Backward Consumption(73)": wsData.results[wsLcv].BACKWARD_CONSUMPTION,
					"86 = Forward Consumption(74)": wsData.results[wsLcv].FORWARD_CONSUMPTION,
					"87 - MRP Mixed Ind(141)": wsData.results[wsLcv].MRP_MIXED_IND,
					"88 - Planning Material": wsData.results[wsLcv].PLANNING_MATERIAL,
					"89 - Planning Plant": wsData.results[wsLcv].PLANNING_PLANT,
					"90 = Conversion Factor": wsData.results[wsLcv].CONVERSION_FACTOR,
					"91 = Availability Check": wsData.results[wsLcv].AVAILABILITY_CHECK1,
					"92 = Total Replendish Leadtime(69)": wsData.results[wsLcv].TOTAL_REPLENDISH_LEADTIME,
					"93 = Ind. coll ind(77)": wsData.results[wsLcv].IND_COLL_IND,
					"94 = Reqmts Grp(78)": wsData.results[wsLcv].REQMTS_GRP,
					"95 = Prod Schedule(80)": wsData.results[wsLcv].PROD_SCHEDULE,
					"96 = Prod Sched Profile": wsData.results[wsLcv].PROD_SCHED_PROFILE,
					"97 = Crit Part Ind": wsData.results[wsLcv].CRIT_PART_IND,
					"98 = Storage Bin (82)": wsData.results[wsLcv].STORAGE_BIN,
					"99 = CC Physical INV(81)": wsData.results[wsLcv].CC_PHYSICAL_INV,
					"100 - Fixed Ind": wsData.results[wsLcv].FIXED_IND,
					"101 = Distrib Profile": wsData.results[wsLcv].DISTRIB_PROFILE,
					"102 = Warehouse Nbr": wsData.results[wsLcv].WAREHOUSE_NBR,
					"103 = Storage Type(15)": wsData.results[wsLcv].STORAGE_TYPE,
					"104 = Stor Type Removal": wsData.results[wsLcv].STOR_TYPE_REMOVAL,
					"105 = Stor Type Placement": wsData.results[wsLcv].STOR_TYPE_PLACEMENT,
					"106 = Storage Section Ind.": wsData.results[wsLcv].STORAGE_SECTION_IND,
					"107 = Special Mov MGMT": wsData.results[wsLcv].SPECIAL_MOV_MGMT,
					"108 - Post Insp Stock(103)": wsData.results[wsLcv].POST_INSP_STOCK,
					"109 = Goods rec proc time": wsData.results[wsLcv].GOODS_REC_PROC_TIME,
					"110 = Inspect Interval": wsData.results[wsLcv].INSPECT_INTERVAL,
					"111 = Control Key QM": wsData.results[wsLcv].CONTROL_KEY_QM,
					"112 = Inspect Type": wsData.results[wsLcv].INSPECT_TYPE,
					"113 = 100% Inspect": wsData.results[wsLcv].INSPECT,
					"114 = Avg Inspect Dur": wsData.results[wsLcv].AVG_INSPECT_DUR,
					"115 = Inspect Mat spec": wsData.results[wsLcv].INSPECT_MAT_SPEC,
					"116 = Inspect Task List": wsData.results[wsLcv].INSPECT_TASK_LIST,
					"117 = Ctl Inspect Creation": wsData.results[wsLcv].CTL_INSPECT_CREATION,
					"118 = Auto Spec Assign": wsData.results[wsLcv].AUTO_SPEC_ASSIGN,
					"119 = Inspect Characteristics": wsData.results[wsLcv].INSPECT_CHARACTERISTICS,
					"120 = Preferred Inspect Type": wsData.results[wsLcv].PREFERRED_INSPECT_TYPE,
					"121 = Inspect Type Act Mat combo": wsData.results[wsLcv].INSPECT_TYPE_ACT_MAT_COMBO,
					"122 = Value Class(93)": wsData.results[wsLcv].VALUE_CLASS,
					"123 = Price Control(94)": wsData.results[wsLcv].PRICE_CONTROL,
					"124 = Price Unit(95)": wsData.results[wsLcv].PRICE_UNIT,
					"125 = Standard Price(96)": wsData.results[wsLcv].STANDARD_PRICE,
					"126 = w/Qty Structure(97)": wsData.results[wsLcv].W_QTY_STRUCTURE,
					"127 = Overhead Group(98)": wsData.results[wsLcv].OVERHEAD_GROUP,
					"128 = Variance Key(99)": wsData.results[wsLcv].VARIANCE_KEY,
					"129 = BOM Usage(100)": wsData.results[wsLcv].BOM_USAGE,
					"130 = Group Counter": wsData.results[wsLcv].GROUP_COUNTER,
					"131 = Costing Lot Size(101)": wsData.results[wsLcv].COSTING_LOT_SIZE
				});
			}
			//here we are crating a vertual html page using JavaScript whih can not be show in the body of our page.
			var html = document.createElement('html');
			var head = document.createElement('head');
			html.appendChild(head);
			var body = document.createElement('body');
			html.appendChild(body);
			var div = document.createElement('div');
			body.appendChild(div);
			var table = document.createElement('table');
			table.id = "excelDataTable";
			table.border = "1";
			table.cellSpacing = "0"
			div.appendChild(table);
			//Styling the Table 
			var style = document.createElement('style');
			head.appendChild(style);

			style.type = "text/css";
			//you can change the style of the excel header and body rows here.
			//var styleText =
			//	'.innerTableData { background-color:rgb(91,155,213);color:rgb(255,255,255);font-weight: bold;  mso-number-format:"\@"; } td { background-color:rgb(221,235,247); }';
			var styleText =
				"table{color:Black;background-color:White;border-color:#CCCCCC;border-width:1px;border-style:None;width:100%;border-collapse:collapse;font-size:8pt;text-align:left;} .innerTableData { background-color:rgb(91,155,213);color:rgb(255,255,255);font-weight: bold; } td { background-color:rgb(221,235,247); width:auto;border-collapse:collapse;font-size:10pt;text-align:left; }";
			style.innerHTML = styleText;
			document.body.appendChild(html);
			//this for loop will create the header data for the html table from the given json data key.
			var columns = [];
			var headerTr$ = $('<tr/>');
			for (var i = 0; i < data.results.length; i++) {
				var rowHash = data.results[i];
				for (var key in rowHash) {
					if ($.inArray(key, columns) == -1) {
						columns.push(key);
						headerTr$.append($('<td class = "innerTableData"/>').html(key));
					}
				}
			}
			$("#excelDataTable").append(headerTr$);
			//this for loop will create the row data for the html table from the given json data.
			for (var i = 0; i < data.results.length; i++) {
				var row$ = $('<tr/>');
				for (var colIndex = 0; colIndex < columns.length; colIndex++) {
					var cellValue = data.results[i][columns[colIndex]];
					if (cellValue == null) {
						cellValue = "";
					}
					row$.append($('<td/>').html(cellValue));
				}
				$("#excelDataTable").append(row$);
			}
			//here we are adding the html file of the table and get the values then convert it to ms-excel formate.
			let file = new Blob([html.outerHTML], {
				type: "application/vnd.ms-excel"
			});
			let url = URL.createObjectURL(file);
			//this is the file name after downloading the excel file.
			//you can change the text which is here "downloadedfile" 
			//Note one thing dont remove the second part of this string ".xls" 
			//other wise the file downloaded can not work.
			var filename = "Winshuttle" + ".xls"
				//here we are creating HTML <a> Tag which can be trigger to download the excel file.
			var a = document.createElement('a');
			a.id = "export";
			document.body.appendChild(a);
			//here we are checking if the bwoswer is IE or not if IE then we use window.navigator.msSaveBlob function otherwise 
			//Go with Simple Blob file.
			if (window.navigator && window.navigator.msSaveBlob) {
				window.navigator.msSaveBlob(file, filename);
				a.click();
				document.body.removeChild(a);
				document.body.removeChild(html);
			} else {
				a.download = filename;
				a.href = url;
				a.click();
				document.body.removeChild(a);
				document.body.removeChild(html);
			}
		}

	});
});