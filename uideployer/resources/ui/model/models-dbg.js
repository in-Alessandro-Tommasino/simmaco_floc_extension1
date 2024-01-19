sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    /**
     * provide app-view type models (as in the first "V" in MVVC)
     * 
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.Device} Device
     * 
     * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
     */
    function (JSONModel, Device) {
        "use strict";

        return {
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
        },

        Modelloperleinput: function () {
        return new JSONModel({
        "ExternalNumber": "",
        "StartPoint": "",
        "EndPoint": "",
        "FiltroCella": "",
        "ID": "000000",
        "ClassNumber": "",
        "LinearLength": "",
        "LinearUnit": "m",
        "CharactDescr": "",
        "ValueChar": "",
        "Charact": "",
        "Unauthorized": false,
        "atfor": "",
        "MandatoryClass":""
        }, true);
        },

        NoteArea: function () {
            return new JSONModel({
            "Note": ""}, true);
            },

            createStepModel: function(){
                return new JSONModel(
                    {
                        filters: {
                            class: {
                                key: "",
                                text: "",
                            }
                        },
                        data: "",
                        headers: [],
                        // values: [],
                        all_values: {},
                        value_help: {
                            items: [],
                            name: ""
                        },
                        selected_charac: "",
                        disableButtons:false,
                    }
                )
            }
        
    };
    });