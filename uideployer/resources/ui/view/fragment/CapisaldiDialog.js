sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sap/ui/core/Fragment"
  ], function(ManagedObject, Fragment) {
    return ManagedObject.extend("my.company.simmflocext.view.fragment.CapisaldiDialog", {
      constructor: function(oView) {
        this._oView = oView;
      },
      exit: function() {
        delete this._oView;
      },
      open: function() {
        var oView = this._oView;
        if (!oView.byId("CapisaldiDialog")) {
            var oFragmentController = {
                onCloseDialog: function() {
                    oView.byId("CapisaldiDialog").close();
                }
            };
            return Fragment.load({
                id: oView.getId(),
                name: "my.company.simmflocext.view.fragment.CapisaldiDialog",
                controller: oFragmentController
            }).then(function(oDialog) {
                oView.addDependent(oDialog);
                oDialog.open();
                return oDialog; 
            });
        } else {
            var oDialog = oView.byId("CapisaldiDialog");
            oDialog.open();
            return Promise.resolve(oDialog);
        }
    }
    });
  });
