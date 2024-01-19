sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sap/ui/core/Fragment"
  ], function(ManagedObject, Fragment) {
    return ManagedObject.extend("my.company.simmflocext.view.fragment.PlantPlantDialog", {
      constructor: function(oView) {
        this._oView = oView;
      },
      exit: function() {
        delete this._oView;
      },
      open: function() {
        var oView = this._oView;
        if (!oView.byId("PlantPlantDialog")) {
            var oFragmentController = {
                onCloseDialog: function() {
                    oView.byId("PlantPlantDialog").close();
                },
                onConfigrmPlantPlant: function(oEvent) {
                    let selectedValue = oEvent.getParameter("selectedItem").getCells()[0].getText().split(' - ')[0]
                    let selectedDescrpit = oEvent.getParameter("selectedItem").getCells()[0].getText().split(' - ')[1]
                    oView.getModel("stepModel").setProperty("/data/DataGeneral/Planplant", selectedValue)
                    oView.getModel("stepModel").setProperty("/data/DataGeneral/descrdiv", selectedDescrpit)

                },
            };
            return Fragment.load({
                id: oView.getId(),
                name: "my.company.simmflocext.view.fragment.PlantPlantDialog",
                controller: oFragmentController
            }).then(function(oDialog) {
                oView.addDependent(oDialog);
                oDialog.open();
                return oDialog; 
            });
        } else {
            var oDialog = oView.byId("PlantPlantDialog");
            oDialog.open();
            return Promise.resolve(oDialog);
        }
    }
    });
  });