jQuery.sap.declare("my.company.simmflocext.view.blocks.Flow");
jQuery.sap.require("sap.uxap.BlockBase");
sap.uxap.BlockBase.extend("my.company.simmflocext.view.blocks.Flow", {
	metadata: {
		views: {
			Expanded: {
				viewName: "my.company.simmflocext.view.Flow",
				type: "XML"
			},
			Collapsed: {
				viewName: "my.company.simmflocext.view.Flow",
				type: "XML"
			}
		}
	}
});