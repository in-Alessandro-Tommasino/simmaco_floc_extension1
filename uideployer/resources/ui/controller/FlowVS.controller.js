jQuery.sap.require("sap.iot.ain.lib.reusable.utilities.AssociatedObjectsHandler");
jQuery.sap.require("sap.iot.ain.lib.reusable.utilities.ApplicationNavigator");

sap.ui.define([
	"sap/iot/ain/lib/reusable/view/SectionBaseController",
	'sap/m/MessageToast',
	'sap/ui/core/Fragment',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/odata/v2/ODataModel'
], function (SectionBaseController, MessageToast, Fragment, Controller, JSONModel, ODataModel) {
	"use strict";
	return SectionBaseController.extend("my.company.simmflocext.controller.FlowVS", {

		onInit: function (oEvent) {
			// set explored app's demo model on this sample
			var sModuleName = jQuery.sap.getModulePath("my/company/simmflocext");
			var oModel = new ODataModel(sModuleName + "/sap/opu/odata/sap/ZCREA_ST_SRV/");
			oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);

			oModel.attachRequestCompleted(function() {
				this.byId('edit').setEnabled(true);
			}.bind(this));

			this.getView().setModel(oModel);

			//var oElement = "/C_PurchaseReqnItem(PurchaseRequisition='10105300',PurchaseRequisitionItem='00010',DraftUUID=guid'00000000-0000-0000-0000-000000000000',IsActiveEntity=true";
			var oElement = "/C_PurchaseReqnItemText(Language='IT',DocumentText='B01',TechnicalObjectType='EBAN',ArchObjectNumber='001010530300010',DraftUUID=guid'00000000-0000-0000-0000-000000000000',IsActiveEntity=true)";
			
			this.getView().bindElement(oElement);

			this._formFragments = {};

			// Set the initial form to be the display one
			this._showFormFragment("Visualizzazione");

			
		},

		handleEditPress : function () {
			//Clone the data
			console.log(this.getView().getModel().getData("/"));
			this._oPR = Object.assign({}, this.getView().getModel().getData("/"));
			this._toggleButtonsAndView(true);

		},

		handleCancelPress : function () {
			//Restore the data
			var oModel = this.getView().getModel();
			oModel.setData(this._oPR);
			this._toggleButtonsAndView(false);
		},

		handleSavePress : function () {
			this.getView().getModel().submitChanges();
			this._toggleButtonsAndView(false);
		},

		_toggleButtonsAndView : function (bEdit) {
			var oView = this.getView();

			// Show the appropriate action buttons
			oView.byId("edit").setVisible(!bEdit);
			oView.byId("save").setVisible(bEdit);
			oView.byId("cancel").setVisible(bEdit);

			// Set the right form type
			this._showFormFragment(bEdit ? "Change" : "Display");
		},

		_getFormFragment: function (sFragmentName) {
			var pFormFragment = this._formFragments[sFragmentName],
				oView = this.getView();

			if (!pFormFragment) {
				pFormFragment = Fragment.load({
					id: oView.getId(),
					name: "my.company.simmflocext.view." + sFragmentName
				});
				this._formFragments[sFragmentName] = pFormFragment;
			}

			return pFormFragment;
		},

		_showFormFragment: function (sFragmentName) {
			var oPage = this.byId("page");

			oPage.removeAllContent();
			this._getFormFragment(sFragmentName).then(function (oVBox) {
				oPage.insertContent(oVBox);
			});
		}
	});

});