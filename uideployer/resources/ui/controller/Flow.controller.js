jQuery.sap.require("sap.iot.ain.lib.reusable.utilities.AssociatedObjectsHandler");
jQuery.sap.require("sap.iot.ain.lib.reusable.utilities.ApplicationNavigator");

sap.ui.define([
	"sap/iot/ain/lib/reusable/view/SectionBaseController",
	'sap/m/MessageToast',
	'sap/ui/core/Fragment',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/odata/v2/ODataModel',
	"sap/m/MessageBox"
], function (SectionBaseController, MessageToast, Fragment, Filter, FilterOperator, Controller, JSONModel, ODataModel, MessageBox) {
	"use strict";
	var oldId;
	var thatInterval;
	var CheckID;
	let props_to_remove = ["__metadata", "ExternalNumber", "StartPoint", "EndPoint", "ClassNumber", "LinearLength", "LinearUnit", "atfor"]
	let props_to_remove_num = ["__metadata"]
	return SectionBaseController.extend("my.company.simmflocext.controller.Flow", {
		formatter: {
			linear_unit: function (sValue) {
				return sValue.toLowerCase()
			}
		},
		current_displayed_class: "",
		save_busy_dialog: new sap.m.BusyDialog({
			text: "Salvataggio in corso..."
		}),
		loadata_busy_dialog: new sap.m.BusyDialog({
			text: "Caricamento dati in corso..."
		}),
		onInit: function (oEvent) {
			// set explored app's demo model on this sample
			var sModuleName = jQuery.sap.getModulePath("my/company/simmflocext");
			var oModel = new ODataModel(sModuleName + "/sap/opu/odata/sap/ZCREA_ST_SRV/");
			oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.getView().setModel(oModel);
			var oElement = "/C_PurchaseReqnItemText(Language='IT',DocumentText='B01',TechnicalObjectType='EBAN',ArchObjectNumber='001010530300010',DraftUUID=guid'00000000-0000-0000-0000-000000000000',IsActiveEntity=true)";
			this.getView().bindElement(oElement);
			this._formFragments = {};
			// Set the initial form to be the display one
			this.headerInfoModelData;


			sPreviousKey: null
			sPreviousValue: null
			sCounter: null
			// this.getOwnerComponent().getRouter("RouteStep1").attachPatternMatched(this._onObjectMatched, this);


			this.tempArray = []
			this._previousComboBoxKey = null;
			this._oGlobalFilter = null;
			/* implementazione controlli tabella */
			/*  var oTable = this.getView().byId("TabellaPrincipale");
			 oTable.attachBrowserEvent("mouseover", this.onMouseOverTable.bind(this)); */
			this.areanotefragment = this.loadFragment({
				name: "my.company.simmflocext.view.TextAreaNote"
			})
			const controller = this;
			this.loadFragment({
				name: "my.company.simmflocext.view.fragment.value_help_strada"
			}).then((o_dialog) => {
				controller["value_help_strada"] = o_dialog;
				controller.getView().addDependent(controller["value_help_strada"]);

			})

		},

		onAfterRendering: function () {
			let oController = this
			var OLDIDLOCAL = localStorage.setItem("OLDID", "");
			const oTable = oController.getView().byId("TabellaPrincipale")
			const FlowModel = this.getView().getModel("FlowModel")

			setInterval(async () => {
				oController.currentID = this.getView().getModel("HeaderInfoModel")?.oData?.internalId
				if (oController.oldId !== oController.currentID && oController.currentID) {
					oController.oldId = oController.currentID
					FlowModel.setProperty("/TableVisibility", false)
					await oController.readData()
				}
			}, 3000)
		},

		OnRowChange: function (oEvent) {
			this.SelectedRow = oEvent.getParameter("rowContext")?.getObject()
		},

		syncResults: function () {
			const stepModel = this.getView().getModel("stepModel")
			const oDataResults = stepModel.getProperty("/data")
			const all_values = stepModel.getProperty("/all_values")
			const all_classes = Object.keys(all_values);
			for (const s_class of all_classes) {

				const values = all_values[s_class]?.values;
				let data = []

				for (const start_end_point of oDataResults.StartEndPointSet.results) {
					const class_filter_results = start_end_point.CharStartEndPointValueSet.results.filter(item => item.ClassNumber === s_class)
					if (class_filter_results.length > 0)
						data.push(class_filter_results)
				}
				data = data.flat()

				if (values) {
					for (const value of values) {
						for (const key of Object.keys(value).filter(k => !["StartPoint", "EndPoint", "LinearLength", "LinearUnit", "ID"].includes(k))) {
							const record = data.find(d => d.Charact === key && d.StartPoint === value.StartPoint && d.EndPoint === value.EndPoint && d.ID === value.ID)
							if (record) record.ValueChar = value[key] // questa assegnazione mi modifica anche quello che ho in oData
						}
					}
				}






			}
			stepModel.setProperty("/data", oDataResults)

			return oDataResults
		},

		onOpenCapisaldiDialog: function () {
			var oModel = this.getView().getModel("ModelloFragment");
			var oView = this.getView();
			if (!this._cValueHelpDialog) {
				this._cValueHelpDialog = Fragment.load({
					name: "my.company.simmflocext.view.fragment.CapisaldiDialog",
					controller: this
				}).then(function (cValueHelpDialog) {
					oView.addDependent(cValueHelpDialog);
					return cValueHelpDialog;
				});
			}

			this._cValueHelpDialog.then(function (cValueHelpDialog) {
				cValueHelpDialog.open();
			}.bind(this));
		},

		onOpenPlantPlantDialog: function () {
			var oModel = this.getView().getModel("ModelloFragment");
			var oView = this.getView();
			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = Fragment.load({
					name: "my.company.simmflocext.view.fragment.PlantPlantDialog",
					controller: this
				}).then(function (oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					oValueHelpDialog.setModel(oModel, "ModelloFragment");
					return oValueHelpDialog;
				});
			}

			this._pValueHelpDialog.then(function (oValueHelpDialog) {
				oValueHelpDialog.open();
			}.bind(this));
		},

		onMouseOverTable: function () {
			var oTable = this.getView().byId("TabellaPrincipale");
			var aRows = oTable.getRows();

			for (var i = 0; i < aRows.length; i++) {
				var oRow = aRows[i];
				var aCells = oRow.getCells();

				for (var j = 0; j < aCells.length; j++) {
					var oCell = aCells[j];

					if (oCell instanceof sap.m.Input && oCell.getValueState() === sap.ui.core.ValueState.Error) {
						oCell.setValueState(sap.ui.core.ValueState.None);
					}
				}
			}
		},
		onConfigrmPlantPlant: function (oEvent) {
			let selectedValue = oEvent.getParameter("selectedItem").getCells()[0].getText().split(' - ')[0]
			let selectedDescrpit = oEvent.getParameter("selectedItem").getCells()[0].getText().split(' - ')[1]
			this.getView().getModel("stepModel").setProperty("/data/DataGeneral/Planplant", selectedValue)
			this.getView().getModel("stepModel").setProperty("/data/DataGeneral/descrdiv", selectedDescrpit)

		},
		onSave: async function (oEvent) {
			const tempCheck = this.getView().getModel("stepModel").getProperty("/tempCheck")
			const stepModel = this.getView().getModel("stepModel")
			if (tempCheck) {
				new sap.m.MessageBox.alert("Compilare le celle obbligatorie");
				return
			}
			this.onCheckMandatoryCells(stepModel, tempCheck)
			// let inputPlanplant = this.getView().byId("inputPlanplant")
			// let latIniziale = this.getView().byId("latIniziale")
			// let latFinale = this.getView().byId("latFinale")
			// let lonIniziale = this.getView().byId("lonIniziale")
			// let lonFinale = this.getView().byId("lonFinale")
			// let QuotaInizio = this.getView().byId("QuotaInizio")
			// let QuotaFine = this.getView().byId("QuotaFine")

			// let category = this.getView().getModel("ModelloFragment").oData.DataSpecific.Category
			// if (inputPlanplant.mProperties.value === "" && category === "O") {
			// 	inputPlanplant.setValueState(sap.ui.core.ValueState.Error)
			// 	new sap.m.MessageBox.alert("Compila tutti i campi")
			// 	return
			// }

			// if (latIniziale.mProperties.value === ""  && category === "O") {
			// 	latIniziale.setValueState(sap.ui.core.ValueState.Error)
			// 	new sap.m.MessageBox.alert("Compila tutti i campi")
			// 	return
			// }

			// if (latFinale.mProperties.value === ""  && category === "O") {
			// 	latFinale.setValueState(sap.ui.core.ValueState.Error)
			// 	new sap.m.MessageBox.alert("Compila tutti i campi")
			// 	return
			// }

			// if (lonIniziale.mProperties.value === ""  && category === "O") {
			// 	lonIniziale.setValueState(sap.ui.core.ValueState.Error)
			// 	new sap.m.MessageBox.alert("Compila tutti i campi")
			// 	return
			// }

			// if (lonFinale.mProperties.value === ""  && category === "O") {
			// 	lonFinale.setValueState(sap.ui.core.ValueState.Error)
			// 	new sap.m.MessageBox.alert("Compila tutti i campi")
			// 	return
			// }



			// if (QuotaInizio.mProperties.value === ""  && category === "O") {
			// 	QuotaInizio.setValueState(sap.ui.core.ValueState.Error)
			// 	new sap.m.MessageBox.alert("Compila tutti i campi")
			// 	return
			// }

			// if (QuotaFine.mProperties.value === ""  && category === "O") {
			// 	QuotaFine.setValueState(sap.ui.core.ValueState.Error)
			// 	new sap.m.MessageBox.alert("Compila tutti i campi")
			// 	return
			// }


			let inputs = [
				this.getView().byId("inputPlanplant"),
				this.getView().byId("latIniziale"),
				this.getView().byId("latFinale"),
				this.getView().byId("lonIniziale"),
				this.getView().byId("lonFinale"),
				this.getView().byId("QuotaInizio"),
				this.getView().byId("QuotaFine")
			];
			let category = this.getView().getModel("ModelloFragment").oData.DataSpecific.Category
			let isEmpty = false;
			for (let input of inputs) {
				if (input.mProperties.value === "" && category === "O") {
					input.setValueState(sap.ui.core.ValueState.Error);
					isEmpty = true;
				}
			}

			if (isEmpty) {
				new sap.m.MessageBox.alert("Compila tutti i campi");
				return;
			}


			const oController = this;
			oController.save_busy_dialog.open();
			// this.busy_dialog.setText("Salvataggio in corso...")
			// this.busy_dialog.open()


			const oDataResults = this.syncResults()

			var SplittedNote = this.getView().getModel("ModelloFragment").oData.DataGeneral.capisaldi.split("\n", 10)


			oDataResults.DataGeneral.capisaldi1 = SplittedNote[0]
			oDataResults.DataGeneral.capisaldi2 = SplittedNote[1]
			oDataResults.DataGeneral.capisaldi3 = SplittedNote[2]
			oDataResults.DataGeneral.capisaldi4 = SplittedNote[3]
			oDataResults.DataGeneral.capisaldi5 = SplittedNote[4]
			oDataResults.DataGeneral.capisaldi6 = SplittedNote[5]
			oDataResults.DataGeneral.capisaldi7 = SplittedNote[6]
			oDataResults.DataGeneral.capisaldi8 = SplittedNote[7]
			oDataResults.DataGeneral.capisaldi9 = SplittedNote[8]
			oDataResults.DataGeneral.capisaldi10 = SplittedNote[9]

			let oModel = this.getView().getModel()
			await new Promise(resolve => {
				oModel.create("/sedeSet", oDataResults,
					{
						success: function (oData, oRes) {
							var msg2 = oRes.data.Return.Message;
							new sap.m.MessageBox.information(msg2);
							resolve()
							if (oRes.data.Return.Type !== "E") {
								// setTimeout(() => {
								//     location.reload();
								// }, 2500);
							}
						},
						error: function (oErr) {
							if (oErr.responseText.includes("capisaldi")) {
								var index = oErr.responseText.match("capisaldi").index
								index = index + 10
								var dato = oErr.responseText.substring(index - 1, index + 1)
								if (dato.includes("'")) {
									dato = dato.replaceAll("'", "")
								}
								var errorMsg = "Inserire un testo di lunghezza massima pari a 255 caratteri nella riga numero " + dato + " nel campo Note."
								new sap.m.MessageBox.error(errorMsg);
							}
							console.log("error")
							resolve()
						}
					}
				)
			})

			oController.save_busy_dialog.close();

			// this.busy_dialog.close()
		},
		clearSelection: function (oEvent) {
			var table = this.getView().byId("TabellaPrincipale")
			const selected_indices = table.getSelectedIndices()
			if (selected_indices.length > 0) {
				let sText = "Vuoi cancellare questa tratta?"
				let sTitle = "Cancella Tratta"
				const stepModel = this.getView().getModel("stepModel")
				const table = this.getView().byId("TabellaPrincipale")
				const external_number = this.getView().getModel("ModelloFragment").oData.ExternalNumber
				const oController = this

				var oDialog = new sap.m.Dialog({
					title: sTitle,
					type: 'Message',
					content: new sap.m.Text({ text: sText }),
					beginButton: new sap.m.Button({
						text: 'Ok',
						press: function () {
							const aSelectedObjects = [oController.SelectedRow]
							// cancello dallo stepModel values
							const values = stepModel.getProperty(`/all_values/${oController.class_name.key}/values`)
							const new_values = values.filter(v => !aSelectedObjects.includes(v))
							stepModel.setProperty(`/all_values/${oController.class_name.key}/values`, new_values)

							// cancello dal modello che mi torna dall'oData
							const oDataResults = stepModel.getProperty("/data")
							for (const selectedObject of aSelectedObjects) {
								const start_end_point = oDataResults.StartEndPointSet.results.find(item => item.StartPoint.trim() === selectedObject.StartPoint.trim() && item.EndPoint.trim() === selectedObject.EndPoint.trim() && item.ExternalNumber === external_number)
								var removed_tratta = start_end_point.CharStartEndPointValueSet.results.filter(item => !(item.ID === selectedObject.ID && item.ClassNumber === stepModel.oData.filters.class.key))
								// removed_tratta = removed_tratta.filter(item => !(item.ClassNumber === oController.class_name.key))
								start_end_point.CharStartEndPointValueSet.results = removed_tratta
							}

							stepModel.setProperty("/data", oDataResults)
							oDialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: 'Chiudi',
						press: function () {
							oDialog.close();
						}
					}),
					afterClose: function () {
						oDialog.destroy();
					}
				});

				oDialog.open();
			} else {
				new sap.m.MessageBox.error("Per rimuovere una tratta, selezionare prima una tratta")
			}
		},

		//Tutte le funzunzioni che sono comprese nel fragment 
		//-------------------------------------------------##
		AggiungiRiga: function () {
			this.clear_input_model()
			var oView = this.getView();
			if (!this._tValueHelpDialog) {
				this._tValueHelpDialog = Fragment.load({
					name: "my.company.simmflocext.view.Create",
					controller: this
				}).then(function (oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				});
			}
			const controller = this
			this._tValueHelpDialog.then(function (oValueHelpDialog) {
				oValueHelpDialog.open();
				controller.AggiungiTrattaValueDialog = oValueHelpDialog
			}.bind(this));
		},

		// resetAggiungiTrattaModel: function(){
		// 	this.getView().getModel("InputModel").setProperty("/StartPoint", "")
		// 	this.getView().getModel("InputModel").setProperty("/EndPoint", "")
		// 	this.getView().getModel("InputModel").setProperty("/LinearLength", "")
		// },

		ChiudiFragment: function (oEvent) {
			oEvent.getSource().getParent().close();
		},
		clear_input_model: function () {
			const controller = this;
			const input_model = controller.getView().getModel("InputModel");
			input_model.setProperty("/StartPoint", 0)
			input_model.setProperty("/EndPoint", 0)
			input_model.setProperty("/strada", "")
		},
		///Copia tratta per classe TRATTA + CARATTERISTICHE
		OnCopiaTratta: function (oEvent) {
			var oView = this.getView();
			var table = this.getView().byId("TabellaPrincipale")
			this.clear_input_model()
			const selected_indices = table.getSelectedIndices()
			if (selected_indices.length > 0) {
				if (!this._sValueHelpDialog) {
					this._sValueHelpDialog = Fragment.load({
						name: "my.company.simmflocext.view.CopiaTratta",
						controller: this
					}).then(function (oValueHelpDialog) {
						oView.addDependent(oValueHelpDialog);
						return oValueHelpDialog;
					});
				}
				const controller = this
				this._sValueHelpDialog.then(function (oValueHelpDialog) {
					oValueHelpDialog.open();
					controller.CopiaValueDialog = oValueHelpDialog
					this.CalcoloLunghezzaCopy()
				}.bind(this));
			} else {
				new sap.m.MessageBox.error("Per copiare una tratta, selezionare prima una tratta")
			}
		},
		///COpia tratta per classe TRATTA + CARATTERISTICHE



		RefreshData: function (oModel) {
			sap.ui.core.BusyIndicator.show()
			var that = this;
			var oTable = that.byId("TabellaPrincipale");
			var aColumns = oTable.getColumns();
			aColumns.forEach(function (oColumn) {
				oTable.removeColumn(oColumn);
				oColumn.destroy();
			});
			oTable.destroyItems();
			that.readData()
		},

		oDataRead: function (sEntitySet, oModel) {
			return new Promise(function (resolve, reject) {
				oModel.read(sEntitySet, {
					urlParameters: {
						"$expand": "sedetochar,sedetolin,StartEndPointSet,sedetochar/chartochar,sedetochar/chartocurr,sedetochar/chartonum,sedetolin/sedetolinchar,sedetolin/sedetolincurr,sedetolin/sedetolinnum,StartEndPointSet/CharStartEndPointValueSet",
					},
					method: "GET",
					success: function (oData) {
						resolve(oData);
					},
					error: function (error) {
						reject(error);
					}
				});
			});
		},
		float_to_sap_string: function (f_value) {
			let s_value = f_value
			// Aggiungi una virgola come separatore delle migliaia
			s_value = s_value.toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
			// Aggiungi tre zeri dopo la virgola per rappresentare i decimali
			s_value.replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
			return s_value
		},
		onCloseControlloTratte: function (oEvent) {
			this.closecontrollotratte = oEvent
		},

		SalvaWithClose: async function (oEvent) {
			const controller = this
			let input_model = this.getView().getModel("InputModel")
			let inputModel = input_model.oData
			const modello_input = this.getView().getModel("ModelloInput")
			inputModel.ExternalNumber = this.getView().getModel("ModelloFragment").oData.ExternalNumber
			const stepModel = this.getView().getModel("stepModel")
			// Funzione per convertire stringa in formato europeo a float
			function convertToFloat(euroNumber) {
				// Se ci sono più di un punto, è un numero grande con separatori delle migliaia
				if ((euroNumber.match(/\./g) || []).length > 1) {
					// Rimuove tutti i punti (separatore delle migliaia)
					let numberWithoutDots = euroNumber.replace(/\./g, "");
					// Sostituisce la virgola decimale con un punto
					let numberWithDot = numberWithoutDots.replace(",", ".");
					// Converte la stringa risultante in un numero float
					return parseFloat(numberWithDot);
				} else {
					// Per numeri senza separatori delle migliaia
					return parseFloat(euroNumber.replace(".", "").replace(",", "."));
				}
			}

			const tratta_start_point = convertToFloat(modello_input.getProperty("/DataGeneral/StartPoint"));
			const tratta_end_point = convertToFloat(modello_input.getProperty("/DataGeneral/EndPoint"));
			let start_point = input_model.getProperty("/StartPoint")
			let end_point = input_model.getProperty("/EndPoint")
			const modello_fragment = controller.getView().getModel("ModelloFragment");
			const category = modello_fragment.getProperty("/DataSpecific/Category");
			const manserno = modello_fragment.getProperty("/DataGeneral/Manserno");
			const IWERK = modello_input.getProperty("/DataGeneral/Planplant")
			const Strada = input_model.getProperty("/strada")
			const ClassNumber = input_model.getProperty("/ClassNumber")
			if (category === "O" && (manserno === "1" || manserno === 1) && (inputModel.strada === "" || inputModel.strada === undefined || inputModel.strada === null)) {
				sap.m.MessageBox.error("Valorizzare il campo Strada.");
				return;
			}
			let ctrl_tratta_set_key = oModel.createKey("ctrl_trattaSet", { StartPoint: controller.float_to_sap_string(start_point), EndPoint: controller.float_to_sap_string(end_point), ExternalNumber: Strada, Iwerk: IWERK, IdPonte: inputModel.ExternalNumber })			// const body_ctrl_tratta = { StartPoint: start_point, EndPoint: end_point, ExternalNumber: inputModel.ExternalNumber, Message: "" };
			// let ctrl_tratta_set_key_final = ctrl_tratta_set_key.replace(/(Iwerk='.+?')(?=\))/, "$1,Class= "+"'"+ this.class_name.key+"'");
			// ctrl_tratta_set_key_final = ctrl_tratta_set_key_final.replace("null", "'" + ClassNumber + "'")
			// ctrl_tratta_set_key_final = ctrl_tratta_set_key_final.replaceAll(",Class= 'Z_OPERE_LAM'", "")
			ctrl_tratta_set_key = ctrl_tratta_set_key.replaceAll("Class=null,", "Class=" + "'" + ClassNumber + "'" + ",")
			const p_ctrl_tratta = new Promise((resolve, reject) => {
				oModel.read("/" + ctrl_tratta_set_key, {
					// filters: filters,
					success: function (oData, oResponse) {
						resolve(oResponse)
					},
					error: function (oError) {
						reject(oError)
					}
				});
			})
			let r_ctrl_tratta;
			try {
				r_ctrl_tratta = await p_ctrl_tratta;
			} catch (error) {
				MessageBox.error(`Errore durante la lettura dell'entity ctrl_trattaSet:\n${error.message}`);
				return;
			}

			const onCloseControlloTratte = async (oEventControllo) => {
				if (!(oEventControllo === "OK")) {
					return;
				}
				inputModel.LinearLength = controller.float_to_string(end_point - start_point);
				const values = stepModel.getProperty(`/all_values/${this.class_name.key}/values`)
				const data = stepModel.getProperty("/data")
				var max = 0
				var entrata = false
				start_point = controller.float_to_sap_string(start_point)
				end_point = controller.float_to_sap_string(end_point)



				const found =
					values
						?.filter(x => x.StartPoint.trim() === start_point.replace(".", "") && x.EndPoint.trim() === end_point.replace(".", ""))
						?.map(x => x.ID)
						?.sort((a, b) => {
							// Converte le stringhe in numeri interi e confronta
							const numA = parseInt(a, 10);
							const numB = parseInt(b, 10);
							if (numA < numB) {
								return 1; // Cambia in -1 per l'ordine crescente
							} else if (numA > numB) {
								return -1; // Cambia in 1 per l'ordine crescente
							} else {
								return 0;
							}
						});  // searching for tratta with same end point and start point
				if (found && Array.isArray(found) && found.length > 0) {
					try {
						max = parseInt(found[0]) + 1;
					} catch (error) {
						sap.m.MessageBox.error(`Errore nella creazione dell'ID:\n${error.message}`)
					}
				}



				const headers = stepModel.getProperty(`/all_values/${this.class_name.key}/headers`)
				props_to_remove = ["StartPoint", "EndPoint", "LinearLength", "LinearUnit"]
				const charactheristics = headers.filter(header => !props_to_remove.includes(header.key))
				var new_value = {
					StartPoint: start_point,
					EndPoint: end_point,
					LinearLength: inputModel.LinearLength,
					ID: String(max),
					LinearUnit: inputModel.LinearUnit,
					ClassNumber: inputModel.ClassNumber
				}
				if (category === "O" && (manserno === "1" || manserno === 1)) {
					if (controller.class_name.key === "Z_OPERE_LAM")
						new_value["Z_STRADA1_SU_OPERA"] = inputModel.strada;
					if (controller.class_name.key === "Z_SOVRAPPASSI")
						new_value["Z_STRADA"] = inputModel.strada;
					if (controller.class_name.key === "Z_O_03_OPERELAM")
						new_value["Z_SP_STRADA1_SU_OPERA"] = inputModel.strada;
				}
				let se_value_set = []

				for (const c of charactheristics) {
					new_value[c.key] = new_value[c.key] ? new_value[c.key] : "";
					if (c.key === "Z_T_CENTRI_ABITATI_LATO") {
						new_value[c.key] = "ENTRAMBI I LATI"
					}
					if (c.key === "Z_T_VARIANTEOTRAVERSA") {
						new_value[c.key] = "TRAVERSA"
					}
					se_value_set.push({
						ExternalNumber: this.getView().getModel("ModelloFragment").oData.ExternalNumber,
						ClassNumber: inputModel.ClassNumber,
						StartPoint: start_point,
						EndPoint: end_point,
						LinearLength: inputModel.LinearLength,
						LinearUnit: inputModel.LinearUnit,
						ValueChar: new_value[c.key],
						ID: String(max),
						Charact: c.key,
						CharactDescr: c.descr,
						atfor: c.atfor
					})
				}

				data.StartEndPointSet.results.push({
					ExternalNumber: this.getView().getModel("ModelloFragment").oData.ExternalNumber,
					StartPoint: start_point,
					EndPoint: end_point,
					ClassNumber: inputModel.ClassNumber,
					LinearLength: inputModel.LinearLength,
					LinearUnit: inputModel.LinearUnit,
					CharStartEndPointValueSet: {
						results: se_value_set
					}
				})

				values.push(new_value)

				// Ordina l'array di valori in base a StartPoint
				values.sort(function (a, b) {
					const numA = parseFloat(a.StartPoint.trim());
					const numB = parseFloat(b.StartPoint.trim());
					return numA - numB;
				});

				stepModel.setProperty(`/all_values/${this.class_name.key}/values`, values)

				this._tValueHelpDialog.then(function (oDialog) {
					oDialog.close();
				});

				stepModel.setProperty("/data", data)
				window.dataid = values
			}
			if (category === "O" && (manserno === "1" || manserno === 1) && !(r_ctrl_tratta.data.Message.toUpperCase() === "OK")) {
				sap.m.MessageBox.error(r_ctrl_tratta.data.Message, { actions: [sap.m.MessageBox.Action.CANCEL], onClose: onCloseControlloTratte })
				return;
			}
			if (!controller.is_in_interval(tratta_start_point, tratta_end_point, start_point, end_point) && stepModel.getData().data.DataSpecific.Category === "S") {
				sap.m.MessageBox.error("Tratta inserita non coerente con dati di testata.", { actions: [sap.m.MessageBox.Action.CANCEL], onClose: onCloseControlloTratte })
				return;
			}
			await onCloseControlloTratte("OK");
		},

		LoadClasses: async function () {
			var oFilterZlivello = new sap.ui.model.Filter("Zlivello", sap.ui.model.FilterOperator.EQ, this.getView().getModel("ModelloFragment").oData.DataGeneral.Manserno);
			var oFilterFltyp = new sap.ui.model.Filter("Fltyp", sap.ui.model.FilterOperator.EQ, this.getView().getModel("ModelloFragment").oData.DataSpecific.Category);
			var oFilterClass = new sap.ui.model.Filter("Class", sap.ui.model.FilterOperator.NE, "");
			var oFilterZtipoattribsap = new sap.ui.model.Filter("Ztipoattribsap", sap.ui.model.FilterOperator.EQ, "Classificazione LAM");
			var oFilterRemoveDuplicates = new sap.ui.model.Filter("RemoveDuplicates", sap.ui.model.FilterOperator.EQ, "Class", "ExternalNumber");
			var oFilterExternalNumber = new sap.ui.model.Filter("ExternalNumber", sap.ui.model.FilterOperator.EQ, this.getView().getModel("ModelloInput").oData.ExternalNumber);
			var filters = [oFilterFltyp, oFilterClass, oFilterZtipoattribsap, oFilterRemoveDuplicates, oFilterExternalNumber];
			const oModel = this.getView().getModel()
			try {
				const all_classes = await new Promise((resolve, reject) => {
					oModel.read("/ZPMTDATASTAPPSet", {
						filters: filters,
						sorter: new sap.ui.model.Sorter({
							path: 'Class'
						}),
						success: function (oData, oRes) {
							resolve(oData.results)
						},

						error: function (oErr) {
							reject(oErr)
						}
					})
				})
				this.getView().getModel("stepModel").setProperty("/filters/allclasses", all_classes)
			} catch (error) {
				MessageBox.error(error.message)
			}
		},
		onChange: function (oEvent) {
			if (oEvent === undefined) {
				this.PrendiChiave2 = this.getView().getModel("stepModel").oData.filters.class.key
				let Modello = this.getView().getModel("InputModel").oData
				Modello.ClassNumber = this.PrendiChiave2
			}
			else {

				this.PrendiChiave = oEvent.getParameters().selectedItem.mProperties.key
				let Modello = this.getView().getModel("InputModel").oData
				Modello.ClassNumber = this.PrendiChiave

			}

		},
		onChangeCharact: function (oEvent) {
			var nOpere = this.getView().getModel().getProperty("/");
			var valoreInput = oEvent.getParameters().selectedItem.getProperty("text");
			let Modello = this.getView().getModel("InputModel").oData

			let foundObjects = [];
			for (let key in nOpere) {
				let obj = nOpere[key];
				for (let prop in obj) {
					if (obj[prop] === valoreInput) {
						foundObjects.push(obj);
						Modello.atfor = foundObjects[0].atfor
						break;
					}
				}
			}

			this.PrendiChiave = oEvent.getParameters().selectedItem.mProperties.key
			this.PrendiTesto = oEvent.getParameters().selectedItem.mProperties.text
			Modello.CharactDescr = this.PrendiChiave
			Modello.Charact = this.PrendiTesto
		},
		onComboBoxSelectionChange: function (oEvent) {
			const oComboBox = this.byId("classe2");
			oComboBox.bindProperty("selectedKey", {
				path: "stepModel>/filters/class/key"
			});
		},

		onCheckMandatoryCells: function (oEvent, stepModel, tempCheck) {
			const oComboBox = this.byId("classe2");
			oComboBox.bindProperty("selectedKey", {
				path: "stepModel>/filters/class/key"
			});
			const oTable = this.byId("TabellaPrincipale");
			const rows = oTable.getRows();


			let bMandatoryEmptyFound = false;
			this.sPreviousValue = oComboBox.getSelectedKey();

			for (let row of rows) {
				const cells = row.getCells();

				if (tempCheck) {
					bMandatoryEmptyFound = false
					stepModel.setProperty("/tempCheck", false)
					for (let cell of cells) {
						if (cells[0].mProperties.text.trim() !== "" && cells[1].mProperties.text.trim() !== "") {
							if (cell instanceof sap.m.Input) {
								const isMandatory = cell.data("mandatory");
								const inputValueState = cell.getValueState();

								if (isMandatory && inputValueState === sap.ui.core.ValueState.Error) {
									const value = cell.getValue();
									if (value.trim() === "") {
										bMandatoryEmptyFound = true;
									} else {
										cell.setValueState(sap.ui.core.ValueState.None);
									}
								}
							}
						}
					}
				} else {
					for (let cell of cells) {
						if (cells[0].mProperties.text.trim() !== "" && cells[1].mProperties.text.trim() !== "") {
							if (cell instanceof sap.m.Input) {
								cell.setValueState(sap.ui.core.ValueState.None)
								const isMandatory = cell.data("mandatory");
								if (isMandatory) {
									const value = cell.getValue();
									if (value.trim() === "") {
										cell.setValueState(sap.ui.core.ValueState.Error);
										bMandatoryEmptyFound = true;
									} else {
										cell.setValueState(sap.ui.core.ValueState.None);
									}
								}
							}
						}
					}
				}
			}

			if (bMandatoryEmptyFound) {
				new sap.m.MessageBox.error("Compilare le celle obbligatorie");
				stepModel.setProperty("/tempCheck", true)
				const oldValue = oComboBox.mEventRegistry.selectionChange[0].oListener.PrendiChiave2
				// Reimposta il valore del ComboBox al valore precedente utilizzando sPreviousKey
				oComboBox.setSelectedKey(oldValue);
				stepModel.setProperty("/filters/class/key", oldValue)
				this.onComboBoxSelectionChange()
				return;
			}
		},
		onChangeClassMain: async function (oEvent) {
			// this.getView().byId("TabellaPrincipale").getBinding().aFilters = null
			// this.getView().byId("TabellaPrincipale").getBinding().oCombinedFilter = null
			const main_tab = this.getView().byId("TabellaPrincipale")
			main_tab.unbindColumns();
			main_tab.unbindRows();
			// window.bottonesalva = this.getView().byId("Salva")
			// if (window.bottonesalva.getEnabled() === false) {
			// 	window.bottonesalva.setEnabled(true)
			// }
			const stepModel = this.getView().getModel("stepModel")
			const tempCheck = stepModel.getProperty("/tempCheck")


			this.onCheckMandatoryCells(stepModel, tempCheck)



			const class_obj = oEvent.getParameters().selectedItem.getBindingContext("stepModel").getObject()
			this.class_name = { key: class_obj.Class, text: class_obj.Kschl }
			const all_values = stepModel.getProperty("/all_values");
			const searched_value = all_values[this.class_name.key]
			if (searched_value) {
				main_tab.bindColumns({
					path: `/all_values/${this.class_name.key}/headers`,
					factory: this.onColumnFactory.bind(this),
					model: "stepModel"
				});
				main_tab.bindRows({
					path: `/all_values/${this.class_name.key}/values`,
					sorter: { path: 'StartPoint', descending: false },
					model: "stepModel"
				});
				var aStepModelValues = searched_value.values
				this.disableAddAndRemove(aStepModelValues)
			}



			stepModel.setProperty("/filters/class", this.class_name)
			// const oDataResults = stepModel.getProperty("/data")
			const oDataResults = this.syncResults()
			this.current_displayed_class = Object.assign({}, this.class_name)
			let data = []
			for (var start_end_point of oDataResults.StartEndPointSet.results) {

				for (let i = 0; i < start_end_point.CharStartEndPointValueSet.results.length; i++) {

					let keys = Object.keys(start_end_point.CharStartEndPointValueSet.results[0]);
					let LinearUnitSetKeys = keys.filter(function (key) {
						return key.startsWith("LinearUnit"); // Restituisce true solo per le chiavi che iniziano con "LinearUnit"
					});
					let LinearUnitValueSetKeys = LinearUnitSetKeys.map(function (key) {
						return start_end_point[key]; // Prende il valore della proprietà corrispondente alla chiave
					});
					start_end_point.CharStartEndPointValueSet.results[0].LinearUnit = LinearUnitValueSetKeys.toString().toLowerCase()
					const class_filter_results = start_end_point.CharStartEndPointValueSet.results.filter(item => item.ClassNumber === this.class_name.key)
					if (class_filter_results.length > 0)
						data.push(class_filter_results)

				}
			}
			data = data.flat()

			// Colonna fissa Z_T_CTRABITATO (Ancora non deployabile)


			if (this.current_displayed_class.key === "Z_CENTRI") {
				this.data_model = {
					columns: [

						{
							key: "StartPoint",
							descr: "Prog. ini. (m)"
						},
						{
							key: "EndPoint",
							descr: "Prog. fin. (m)"
						},
						{
							key: "Z_T_CTRABITATO",
							descr: "Centro Abitato 1"
						},
						{
							key: "LinearLength",
							descr: "Lunghezza nominale (m)"
						}
					],
					data: {},
					values: [],
				}
			} else if (this.current_displayed_class.key !== "Z_CENTRI") {
				this.data_model = {
					columns: [
						{
							key: "StartPoint",
							descr: "Prog. ini. (m)"
						},
						{
							key: "EndPoint",
							descr: "Prog. fin. (m)"
						},
						// {
						//     key: "LinearUnit",
						//     descr: "Linear Unit"
						// },
						{
							key: "LinearLength",
							descr: "Lunghezza nominale (m)"
						}
					],
					data: {},
					values: [],
				}
			}



			let oModel = this.getView().getModel()
			window.data_model = this.data_model
			if (data.length === 0) {

				await new Promise((resolve) => {
					oModel.read("/ZPMTDATASTAPPSet", {
						filters: [
							// new sap.ui.model.Filter("Zlivello", sap.ui.model.FilterOperator.EQ, oDataResults.DataGeneral.Manserno),
							new sap.ui.model.Filter("Class", sap.ui.model.FilterOperator.EQ, this.class_name.key),
							new sap.ui.model.Filter("Fltyp", sap.ui.model.FilterOperator.EQ, oDataResults.DataSpecific.Category),
							new sap.ui.model.Filter("RemoveDuplicates", sap.ui.model.FilterOperator.EQ, "Zattribsap")
						],
						success: function (oData) {
							for (const res of oData.results) {
								const columnExists = window.data_model.columns.some(column => column.key === res.Zattribsap);
								if (!columnExists) {
									window.data_model.columns.push({
										key: res.Zattribsap,
										descr: res.Atbez,
										atfor: res.atfor,
										noout: res.noout,
										colnoout: res.colnoout,
										NO_DISPLAY: res.NO_DISPLAY,
									});
								}
							}
							resolve();
						},
						error: function (oErr) {
							resolve()
						}
					})

				})

			} else {
				window.dataid = data
				var aData = []
				for (let i = 0; i < data.length; i++) {
					aData.push(data[i].ID)
				}

				for (const d of data) {
					if (!window.data_model.data[`${d.StartPoint}${d.EndPoint}${d.ID}`]) window.data_model.data[`${d.StartPoint}${d.EndPoint}${d.ID}`] = []
					window.data_model.data[`${d.StartPoint}${d.EndPoint}${d.ID}`].push(d)
					if (!window.data_model.columns.find(column => column.key === d.Charact)) window.data_model.columns.push({ key: d.Charact, descr: d.CharactDescr, atfor: d.atfor, noout: d.noout, colnoout: d.colnoout, ID: d.ID })
					const existing_column = window.data_model?.columns.find(column => column.key === d.Charact);
					if (existing_column) existing_column.atfor = d.atfor

				}
			}
			for (const key of Object.keys(window.data_model.data)) {
				let entry = {
					StartPoint: window.data_model.data[key][0].StartPoint,
					EndPoint: window.data_model.data[key][0].EndPoint,
					LinearLength: window.data_model.data[key][0].LinearLength,
					ID: window.data_model.data[key][0].ID,
					LinearUnit: window.data_model.data[key][0].LinearUnit,
					Unauthorized: window.data_model.data[key][0].Unauthorized,
				}
				for (const characteristic of window.data_model.data[key]) {
					let found = window.data_model.data[key].find((e) => e.Charact === characteristic.Charact)
					entry[characteristic.Charact] = found.ValueChar
				}
				window.data_model.values.push(entry)
			}
			const values = window.data_model.values.map(v => {
				let e = {
					StartPoint: v.StartPoint,
					EndPoint: v.EndPoint,
					LinearLength: v.LinearLength,
					ID: v.ID,
					LinearUnit: v.LinearUnit.toLowerCase(),
					Unauthorized: v.Unauthorized
				}

				for (const col of window.data_model.columns) {
					e[col.key] = v[col.key] ? v[col.key] : ""
				}
				return e
			})
			stepModel.setProperty("/headers", window.data_model.columns)
			const oController = this
			const FormattedValue = values.map(value => {
				let newValueFormatted = value
				const ValueKeys = Object.keys(value)
				if (oController.CampiNote) {
					for (const Nota of oController.CampiNote) {
						if (ValueKeys.includes(Nota)) {
							newValueFormatted[Nota] = newValueFormatted[Nota].replaceAll("??", "\n")
						}

					}
				}
				return newValueFormatted
			})

			all_values[this.class_name.key] = { headers: window.data_model.columns, values: FormattedValue };
			// stepModel.setProperty("/values", FormattedValue)
			stepModel.setProperty("/all_values", all_values)
			main_tab.bindColumns({
				path: `/all_values/${this.class_name.key}/headers`,
				factory: this.onColumnFactory.bind(this),
				model: "stepModel"
			});
			main_tab.bindRows({
				path: `/all_values/${this.class_name.key}/values`,
				sorter: { path: 'StartPoint', descending: false },
				model: "stepModel"
			});
			this.onChange();
			var aStepModelValues = FormattedValue
			this.disableAddAndRemove(aStepModelValues)
			const FlowModel = this.getView().getModel("FlowModel")
			FlowModel.setProperty("/TableVisibility", true)

		},
		CheckStato: function (key) {
			var oTable = this.getView().byId("TabellaPrincipale");
			const RowsTab = oTable.getRows()
			const Row = RowsTab[this.PathValue]
			if (key === "DISATTIVO") {
				Row.addStyleClass("redBackground")
			} else {
				Row.removeStyleClass("redBackground")
			}

		},
		convertToDateFormat: function (oEvent) {
			var oInput = oEvent.getSource();
			var sValue = oInput.getValue();

			// Controllo per verificare se l'input contiene lettere
			if (/[a-zA-Z]/.test(sValue)) {
				oInput.setValue("");
				oInput.setValueState(sap.ui.core.ValueState.Error);
				new sap.m.MessageBox.alert("Inserisci un formato data valido");
				return; // Esce dalla funzione
			}

			// Estrai le parti della data in base alla lunghezza della stringa
			var sDay, sMonth, sYear;

			// Gestione del formato corretto
			if (sValue.includes(".")) {
				var aParts = sValue.split(".");
				sDay = aParts[0].padStart(2, '0');
				sMonth = aParts[1].padStart(2, '0');
				sYear = aParts[2].length === 2 ? (parseInt(aParts[2], 10) <= new Date().getFullYear() % 100 ? "20" + aParts[2] : "19" + aParts[2]) : aParts[2];
			}
			// gestiamo il formato con le barre "/"
			else if (sValue.includes("/")) {
				var aParts = sValue.split("/");
				sDay = aParts[0].padStart(2, '0');
				sMonth = aParts[1].padStart(2, '0');
				sYear = aParts[2].length === 2 ? (parseInt(aParts[2], 10) <= new Date().getFullYear() % 100 ? "20" + aParts[2] : "19" + aParts[2]) : aParts[2];
			} else {
				switch (sValue.length) {
					case 6: // Es. data tutta unita (191089)
						sDay = sValue.substring(0, 2);
						sMonth = sValue.substring(2, 4);
						sYear = sValue.substring(4, 6).length === 2 ? (parseInt(sValue.substring(4, 6), 10) <= new Date().getFullYear() % 100 ? "20" + sValue.substring(4, 6) : "19" + sValue.substring(4, 6)) : sValue.substring(4, 6);
						break;
					case 4: // Es. anno mancante (1722)
						sDay = sValue.substring(0, 2);
						sMonth = sValue.substring(2, 4);
						sYear = new Date().getFullYear().toString(); // Anno corrente
						break;
					default:
						oInput.setValue("");
						oInput.setValueState(sap.ui.core.ValueState.Error);
						new sap.m.MessageBox.alert("Inserisci un formato data valido");
						return; // Se non corrisponde a nessuno dei formati attesi, Imposta come errore
				}
			}

			var sFormattedValue = sDay + "." + sMonth + "." + sYear;
			oInput.setValue(sFormattedValue);
			oInput.setValueState(sap.ui.core.ValueState.None); // Resetta lo stato dell'input
		},
		disableAddAndRemove: function (values) {
			//Se tutti values hanno Unauthorized true disabilito i bottoni aggiungi tratta e rimuovi tratta
			let sZKiException = this.getView().getModel("ModelloInput").oData.DataGeneral.Abcindic
			let sSelectedClass = this.getView().getModel("stepModel").oData.filters.class.key

			let disableButtons = values.every((item) => {
				return item.Unauthorized === true;
			});

			this.byId("Rimuovi").setEnabled(!disableButtons)
			this.byId("Riga").setEnabled(!disableButtons)
			this.byId("CopiaTratta").setEnabled(!disableButtons)

			if (sSelectedClass === 'Z_CENTROMAN') {
				this.byId("Rimuovi").setEnabled(false)
				this.byId("Riga").setEnabled(false)
				this.byId("Salva").setEnabled(false)
				this.byId("CopiaTratta").setEnabled(false)
				return
			}
			if (sSelectedClass === 'Z_ESTESE_GRAFO') {
				this.byId("Rimuovi").setEnabled(false)
				this.byId("Riga").setEnabled(false)
				this.byId("Salva").setEnabled(false)
				this.byId("CopiaTratta").setEnabled(false)
				return
			}

			if (sZKiException === "X") {
				if (sSelectedClass === 'Z_KI') {
					this.byId("Rimuovi").setEnabled(false)
					this.byId("Riga").setEnabled(false)
					this.byId("Salva").setEnabled(false)
					this.byId("CopiaTratta").setEnabled(false)
				} else {
					this.byId("Rimuovi").setEnabled(true)
					this.byId("Riga").setEnabled(true)
					this.byId("Salva").setEnabled(true)
					this.byId("CopiaTratta").setEnabled(true)
				}
			} else if (sZKiException === "") {
				if (sSelectedClass === 'Z_KI') {
					this.byId("Rimuovi").setEnabled(true)
					this.byId("Riga").setEnabled(true)
					this.byId("Salva").setEnabled(true)
					this.byId("CopiaTratta").setEnabled(true)
				} else {
					this.byId("Rimuovi").setEnabled(false)
					this.byId("Riga").setEnabled(false)
					this.byId("Salva").setEnabled(false)
					this.byId("CopiaTratta").setEnabled(false)
				}
			} else if (sZKiException === "A") {
				this.byId("Rimuovi").setEnabled(true)
				this.byId("Riga").setEnabled(true)
				this.byId("Salva").setEnabled(true)
				this.byId("CopiaTratta").setEnabled(true)
			} else if (sZKiException === "C") {
				this.byId("Rimuovi").setEnabled(false)
				this.byId("Riga").setEnabled(false)
				this.byId("Salva").setEnabled(false)
				this.byId("CopiaTratta").setEnabled(false)
			}
			if (this.getView().getModel("ModelloInput").oData.DataSpecific.Category === "O" && sZKiException === "C") {
				this.byId("Rimuovi").setEnabled(false)
				this.byId("Riga").setEnabled(false)
				this.byId("Salva").setEnabled(false)
				this.byId("CopiaTratta").setEnabled(false)
			} else if (this.getView().getModel("ModelloInput").oData.DataSpecific.Category === "O" && sZKiException === "") {
				this.byId("Rimuovi").setEnabled(true)
				this.byId("Riga").setEnabled(true)
				this.byId("Salva").setEnabled(true)
				this.byId("CopiaTratta").setEnabled(true)
			}
		},
		onColumnFactory: function (sId, oContext) {
			window.oModel = this.getView().getModel()
			let mandatoryClass = this.getView().getModel("stepModel").getProperty("/MandatoryClass/results")
			let selectedClass = this.getView().getModel("stepModel").getProperty("/filters/class/key")
			let mandatoryProp = mandatoryClass.filter(item => item.CLASSE === selectedClass).map(function (item) {
				return item.ATNAM;
			});

			const column = oContext.getObject()
			var columnFilter = structuredClone[column.key]

			var MasernoIF = this.getView().getModel("stepModel").oData.data.DataGeneral.Manserno
			var CategoryIF = this.getView().getModel("stepModel").oData.data.DataSpecific.Category
			if (oContext.getObject().key === "Z_STRADA1_SU_OPERA" || oContext.getObject().key === "Z_STRADA" && MasernoIF == "1" && CategoryIF == "O" && selectedClass == "Z_OPERE_LAM" || oContext.getObject().key === "Z_STRADA" && MasernoIF == "1" && CategoryIF == "O" && selectedClass === "Z_SOVRAPPASSI") {
				//Codice nel caso sia Z_STRADA1_SU_OPERA 
				window.CheckColumn = oContext.getObject()
				const nonEditableClassNames = ["Z_EST_CENTRO_MAN", "Z_EST_NUCLEO", "Z_EST_SQUADRA", "Z_EST_SORVEGLIANZA", "StartPoint", "EndPoint", "LinearLength", "LinearUnit",];
				const formattingClassNames = ["DATA_AGG", "DATA_FATT_SOSP", "Z_VET_DATADELIBERA_T_1", "Z_VET_DATAPRATICA_T_1", "Z_TVT_DATAVERBALE_T_1", "Z_ESM_VALIDADAL", "Z_ESM_VALIDAAL", "Z_TRT_DATACOMP_KI_1", "Z_DATADELIBERA_T_1", "Z_DATAPRATICA_T_1", "Z_DATAVERBALE_T_1", "Z_ESI_DATAPROTCOMP_I_1", "Z_ESTESE_VALIDAAL", "Z_ESTESE_VALIDADAL", "Z_EST_VALIDAAL", "Z_EST_VALIDADAL", "Z_I_ESI_DATAPROTCOMP", "Z_KI_DATACOMP", "Z_T_DATADELIBERA", "Z_T_DATAPRATICA", "Z_T_DATAVERBALE", "Z_DT", "Z_KI_DATACOMP_PROVV", "Z_STD_DATAVERBALE", "Z_DATA_ODS"]
				const editableColumn = column.colnoout
				const isNonEditableColumn = nonEditableClassNames.includes(column.key);
				const shouldBeFormatted = formattingClassNames.includes(column.key)
				const isMandatory = mandatoryProp.includes(column.key)
				return new sap.ui.table.Column({
					filterProperty: columnFilter,
					width: "13em",
					visible: !(column.noout && column.noout === "X" || column.NO_DISPLAY === "X"),
					label: new sap.m.Text({
						text: column.descr,
						design: "bold"
					}),
					tooltip: column.key,
					template: (editableColumn || isNonEditableColumn) ? new sap.m.Text({
						text: {
							parts: [{ path: `stepModel>${column.key}` }],
							formatter: function (value) {
								if (column.key === "LinearUnit") {
									return value ? value.toLowerCase() : '';
								} else if (column.key) {
									return this.formatNumberWithThousandSeparator(value);
								}
								return value;
							}.bind(this)
						}
					}) : new sap.m.Input({
						value: `{stepModel>${column.key}}`,
						valueHelpOnly: true,
						showValueHelp: true,
						liveChange: function (oEvent) { oEvent.getSource().setValueState(sap.ui.core.ValueState.None) },
						valueHelpRequest: this.openValueHelp_SU_OPERA1.bind(this, column),
						change: this.onStradaChange,
						maxLength: 30,
						customData: [
							new sap.ui.core.CustomData({
								key: "mandatory",
								value: isMandatory
							})
						],
						editable: "{= !${stepModel>Unauthorized}}",
					}).addStyleClass("without-border")
				})

				//Codice nel caso sia Z_STRADA1_SU_OPERA 
			}
			///Codice Nuovo 06/09  Z_SP_STRADA1_SU_OPERA
			if (oContext.getObject().key === "Z_SP_STRADA1_SU_OPERA" && MasernoIF == "1" && CategoryIF == "O" && selectedClass === "Z_O_03_OPERELAM") {
				//Codice nel caso sia Z_SP_STRADA1_SU_OPERA 
				window.CheckColumn = oContext.getObject()
				const nonEditableClassNames = ["Z_EST_CENTRO_MAN", "Z_EST_NUCLEO", "Z_EST_SQUADRA", "Z_EST_SORVEGLIANZA", "StartPoint", "EndPoint", "LinearLength", "LinearUnit"];
				const formattingClassNames = ["DATA_AGG", "DATA_FATT_SOSP", "Z_VET_DATADELIBERA_T_1", "Z_VET_DATAPRATICA_T_1", "Z_TVT_DATAVERBALE_T_1", "Z_ESM_VALIDADAL", "Z_ESM_VALIDAAL", "Z_TRT_DATACOMP_KI_1", "Z_DATADELIBERA_T_1", "Z_DATAPRATICA_T_1", "Z_DATAVERBALE_T_1", "Z_ESI_DATAPROTCOMP_I_1", "Z_ESTESE_VALIDAAL", "Z_ESTESE_VALIDADAL", "Z_EST_VALIDAAL", "Z_EST_VALIDADAL", "Z_I_ESI_DATAPROTCOMP", "Z_KI_DATACOMP", "Z_T_DATADELIBERA", "Z_T_DATAPRATICA", "Z_T_DATAVERBALE", "Z_DT", "Z_KI_DATACOMP_PROVV", "Z_STD_DATAVERBALE", "Z_DATA_ODS"]
				const editableColumn = column.colnoout
				const isNonEditableColumn = nonEditableClassNames.includes(column.key);
				const shouldBeFormatted = formattingClassNames.includes(column.key)
				const isMandatory = mandatoryProp.includes(column.key)
				return new sap.ui.table.Column({
					filterProperty: columnFilter,
					width: "13em",
					visible: !(column.noout && column.noout === "X" || column.NO_DISPLAY === "X"),
					label: new sap.m.Text({
						text: column.descr,
						design: "bold"
					}),
					tooltip: column.key,
					template: (editableColumn || isNonEditableColumn) ? new sap.m.Text({
						text: {
							parts: [{ path: `stepModel>${column.key}` }],
							formatter: function (value) {
								if (column.key === "LinearUnit") {
									return value ? value.toLowerCase() : '';
								} else if (column.key) {
									return this.formatNumberWithThousandSeparator(value);
								}
								return value;
							}.bind(this)
						}
					}) : new sap.m.Input({
						value: `{stepModel>${column.key}}`,
						valueHelpOnly: true,
						showValueHelp: true,
						liveChange: function (oEvent) { oEvent.getSource().setValueState(sap.ui.core.ValueState.None) },
						valueHelpRequest: this.openValueHelp_SU_OPERA1.bind(this, column),
						change: this.onStradaChange,
						maxLength: 30,
						customData: [
							new sap.ui.core.CustomData({
								key: "mandatory",
								value: isMandatory
							})
						],
						editable: "{= !${stepModel>Unauthorized}}",
					}).addStyleClass("without-border")
				})

				//Codice nel caso sia Z_SP_STRADA1_SU_OPERA 
			}

			///Codice Nuovo 06/09 Z_SP_STRADA1_SU_OPERA

			///////////////////////////Codice nel caso sia disattivo///////////////////////////////////////////////////////////////////////////////////

			// if (oContext.getObject().key === "Z_ST_DISATTIVAZIONE_TRATTA") {
			//     //Codice nel caso sia disattivo
			//     window.CheckColumn = oContext.getObject()
			//     const nonEditableClassNames = ["Z_EST_CENTRO_MAN", "Z_EST_NUCLEO", "Z_EST_SQUADRA", "Z_EST_SORVEGLIANZA", "StartPoint", "EndPoint", "LinearLength", "LinearUnit"];
			//     const formattingClassNames = ["DATA_AGG", "DATA_FATT_SOSP", "Z_VET_DATADELIBERA_T_1", "Z_VET_DATAPRATICA_T_1", "Z_TVT_DATAVERBALE_T_1", "Z_ESM_VALIDADAL", "Z_ESM_VALIDAAL", "Z_TRT_DATACOMP_KI_1", "Z_DATADELIBERA_T_1", "Z_DATAPRATICA_T_1", "Z_DATAVERBALE_T_1", "Z_ESI_DATAPROTCOMP_I_1", "Z_ESTESE_VALIDAAL", "Z_ESTESE_VALIDADAL", "Z_EST_VALIDAAL", "Z_EST_VALIDADAL", "Z_I_ESI_DATAPROTCOMP", "Z_KI_DATACOMP", "Z_T_DATADELIBERA", "Z_T_DATAPRATICA", "Z_T_DATAVERBALE", "Z_DT", "Z_KI_DATACOMP_PROVV", "Z_STD_DATAVERBALE", "Z_DATA_ODS"]
			//     const editableColumn = column.colnoout
			//     const isNonEditableColumn = nonEditableClassNames.includes(column.key);
			//     const shouldBeFormatted = formattingClassNames.includes(column.key)
			//     const isMandatory = mandatoryProp.includes(column.key)
			//     return new sap.ui.table.Column({
			//         // filterProperty:column.key,
			//         width: "13em",
			//         visible: !(column.noout && column.noout === "X"),
			//         label: new sap.m.Text({
			//             text: column.descr,
			//         }),
			//         // tooltip: column.key,
			//         template: (editableColumn || isNonEditableColumn) ? new sap.m.Text({
			//             text: {
			//                 parts: [{ path: `stepModel>${column.key}` }],
			//                 formatter: function (value) {
			//                     if (column.key === "LinearUnit") {
			//                         return value ? value.toLowerCase() : '';
			//                     } else if (column.key) {
			//                         return this.formatNumberWithThousandSeparator(value);
			//                     }
			//                     return value;
			//                 }.bind(this)
			//             }
			//         }) : new sap.m.Input({
			//             value: `{stepModel>${column.key}}`,

			//             valueHelpOnly: true,
			//             showValueHelp: true,
			//             valueHelpRequest: this.openValueHelp.bind(this, column),
			//             // change: this.CheckStato.bind(this),
			//             maxLength: 30,
			//             customData: [
			//                 new sap.ui.core.CustomData({
			//                     key: "mandatory",
			//                     value: isMandatory
			//                 })
			//             ],
			//             editable: "{= !${stepModel>Unauthorized}}",
			//         }).addStyleClass("without-border")
			//     })

			//     // Codice nel caso sia disattivo
			// }
			///////////////////////////////////////////////////////////////////////////////////////////




			//--------------------------------------Codice campo note dinamico


			//Prendo il modello
			var stepModel = this.getView().getModel("stepModel")
			//Prendo il campo dove mi invia i campi note "stepModel.oData.data.DataGeneral.Inventory"

			var CampiNote = stepModel.oData.data.DataGeneral.caratteristiche.replaceAll("#", "\n")
			//Splitto in modo da crearmi un campo con questi array 
			CampiNote = CampiNote.split("\n")
			this.CampiNote = CampiNote



			//Se il campo note include il oContext.getObject().key che potrebbe es. Z_EST_NOTA_PROPRIETA
			if (CampiNote.includes(oContext.getObject().key)) {
				//Torna True entra qui
				window.CheckColumn = oContext.getObject()
				const nonEditableClassNames = ["Z_EST_CENTRO_MAN", "Z_EST_NUCLEO", "Z_EST_SQUADRA", "Z_EST_SORVEGLIANZA", "StartPoint", "EndPoint", "LinearLength", "LinearUnit"];
				const formattingClassNames = ["DATA_AGG", "DATA_FATT_SOSP", "Z_VET_DATADELIBERA_T_1", "Z_VET_DATAPRATICA_T_1", "Z_TVT_DATAVERBALE_T_1", "Z_ESM_VALIDADAL", "Z_ESM_VALIDAAL", "Z_TRT_DATACOMP_KI_1", "Z_DATADELIBERA_T_1", "Z_DATAPRATICA_T_1", "Z_DATAVERBALE_T_1", "Z_ESI_DATAPROTCOMP_I_1", "Z_ESTESE_VALIDAAL", "Z_ESTESE_VALIDADAL", "Z_EST_VALIDAAL", "Z_EST_VALIDADAL", "Z_I_ESI_DATAPROTCOMP", "Z_KI_DATACOMP", "Z_T_DATADELIBERA", "Z_T_DATAPRATICA", "Z_T_DATAVERBALE", "Z_DT", "Z_KI_DATACOMP_PROVV", "Z_STD_DATAVERBALE", "Z_DATA_ODS"]
				const editableColumn = column.colnoout
				const isNonEditableColumn = nonEditableClassNames.includes(column.key);
				const shouldBeFormatted = formattingClassNames.includes(column.key)
				const isMandatory = mandatoryProp.includes(column.key)
				return new sap.ui.table.Column({
					width: "13em",
					visible: !(column.noout && column.noout === "X" || column.NO_DISPLAY === "X"),
					label: new sap.m.Text({
						text: column.descr,
					}),
					tooltip: column.key,
					template: (editableColumn || isNonEditableColumn) ? new sap.m.Text({
						text: {
							parts: [{ path: `stepModel>${column.key}` }],
							formatter: function (value) {
								if (column.key === "LinearUnit") {
									return value ? value.toLowerCase() : '';
								} else if (column.key) {
									return this.formatNumberWithThousandSeparator(value);
								}
								return value;
							}.bind(this)
						}
						//Crea il bottone dove aprira' il campo note 
					}) : new sap.m.Button({
						text: "Testo",
						type: sap.m.ButtonType.Default,
						press: this.onOpenNote.bind({ oController: this, column_key: column.key })
					}).addStyleClass("without-border")
				})

			}
			//--------------------------------------Codice campo note dinamico
			const nonEditableClassNames = ["Z_EST_CENTRO_MAN", "Z_EST_NUCLEO", "Z_EST_SQUADRA", "Z_EST_SORVEGLIANZA", "StartPoint", "EndPoint", "LinearLength", "LinearUnit"];
			const formattingClassNames = ["DATA_AGG", "DATA_FATT_SOSP", "Z_VET_DATADELIBERA_T_1", "Z_VET_DATAPRATICA_T_1", "Z_TVT_DATAVERBALE_T_1", "Z_ESM_VALIDADAL", "Z_ESM_VALIDAAL", "Z_TRT_DATACOMP_KI_1", "Z_DATADELIBERA_T_1", "Z_DATAPRATICA_T_1", "Z_DATAVERBALE_T_1", "Z_ESI_DATAPROTCOMP_I_1", "Z_ESTESE_VALIDAAL", "Z_ESTESE_VALIDADAL", "Z_EST_VALIDAAL", "Z_EST_VALIDADAL", "Z_I_ESI_DATAPROTCOMP", "Z_T_DATADELIBERA", "Z_T_DATAPRATICA", "Z_T_DATAVERBALE", "Z_DT", "Z_KI_DATACOMP", "Z_KI_DATACOMP_PROVV", "Z_STD_DATAVERBALE", "Z_DATA_ODS"]
			const editableColumn = column.colnoout
			const isNonEditableColumn = nonEditableClassNames.includes(column.key);
			const shouldBeFormatted = formattingClassNames.includes(column.key)
			const isMandatory = mandatoryProp.includes(column.key)

			return new sap.ui.table.Column({
				filterProperty: column.key,
				width: "13em",
				visible: !(column.noout && column.noout === "X" || column.NO_DISPLAY === "X"),
				label: new sap.m.Text({
					text: column.descr,

				}),
				tooltip: column.key,
				template: (editableColumn || isNonEditableColumn) ? new sap.m.Text({
					text: {
						parts: [{ path: `stepModel>${column.key}` }],
						formatter: function (value) {
							if (column.key === "Z_KI_DATACOMP") {
								return value; // Nessuna formattazione applicata
							}
							if (column.key === "LinearUnit") {
								return value ? value.toLowerCase() : '';
							} else if (column.key) {
								return this.formatNumberWithThousandSeparator(value);
							}
							return value;
						}.bind(this)
					}
				}) : new sap.m.Input({
					value: `{stepModel>${column.key}}`,
					valueHelpOnly: false,
					showValueHelp: true,
					liveChange: function (oEvent) { oEvent.getSource().setValueState(sap.ui.core.ValueState.None) },
					valueHelpRequest: this.openValueHelp.bind(this, column),
					change: shouldBeFormatted ? this.convertToDateFormat.bind(this) : function (oEvent) { oEvent.getSource().setValueState(sap.ui.core.ValueState.None) },
					maxLength: 30,
					customData: [
						new sap.ui.core.CustomData({
							key: "mandatory",
							value: isMandatory
						})
					],
					editable: "{= !${stepModel>Unauthorized}}",
				}).addStyleClass("without-border")

			})

		},
		onStradaChange: function (oEvent) {
			var oModel = window.oModel
			var sValue = oEvent.mParameters.value
			var filter = new sap.ui.model.Filter("TPLNR", sap.ui.model.FilterOperator.EQ, sValue);
			var that = this
			window.id = oEvent.mParameters.id
			window.DialogControllo = new sap.m.BusyDialog({
				text: "Sto controllando la strada inserita..."

			})

			window.DialogControllo.open()
			setTimeout(() => {
				oModel.read("/DescriptSet", {
					filters: [filter],
					success: function (oData, response) {
						if (oData.results[0].PLTXT === "") {
							window.bottonesalva.setEnabled(false)
							setTimeout(() => {
								sap.ui.getCore().byId(window.id).setValueState("Error")
								sap.ui.getCore().byId(window.id).setValue("")
								sap.ui.getCore().byId()
								window.DialogControllo.close()
							}, 2000),

								setTimeout(() => {
									new sap.m.MessageBox.alert("Strada non trovata!")
								}, 2000)

						} else {
							sap.ui.getCore().byId(window.id).setValueState("None")
							window.bottonesalva.setEnabled(true)
							window.DialogControllo.close()
						}
					},
					error: function (response) {
						console.log(response)
					}
				});
			}, 2000)
		},
		onOpenNote: function (oEvent) {
			var path = oEvent.getSource().getBindingContext("stepModel").getPath()
			var oTextArea = new sap.m.TextArea({
				editable: "{= !${stepModel>Unauthorized}}",
				// value: `{path:'stepModel>${this.column_key}', formatter: '.onNoteReplace'}`,
				wrapping: sap.ui.core.Wrapping.Soft,
				width: "100rem",
				height: "15rem"
			});
			oTextArea.bindValue({
				path: `${this.column_key}`,
				model: "stepModel",
				mode: sap.ui.model.BindingMode.TwoWay
			})
			this.oController.areanotefragment.then(function (oDialog) {
				oDialog.removeAllContent()
				oDialog.bindElement({ path: path, model: "stepModel" })
				oDialog.addContent(oTextArea)
				oDialog.open()
			})

		},
		openValueHelp: function (column, oEvent) {
			this.PathValue = oEvent.getSource().getBindingContext("stepModel").getPath().split("/").pop()
			oEvent.getSource().setValueState(sap.ui.core.ValueState.None)
			const stepModel = this.getView().getModel("stepModel")
			const selected_charac = oEvent.getSource().getBindingContext("stepModel").getPath()
			stepModel.setProperty("/selected_charac", { characteristic: column.key, path: selected_charac })
			stepModel.setProperty("/value_help/name", column.descr)
			const oModel = this.getView().getModel()

			const aFilters = [
				new sap.ui.model.Filter("ExternalNumber", sap.ui.model.FilterOperator.EQ, this.getView().getModel("ModelloInput").oData.ExternalNumber),
				new sap.ui.model.Filter("ClassNumber", sap.ui.model.FilterOperator.EQ, stepModel.getProperty("/filters/class/key")),
				new sap.ui.model.Filter("Charact", sap.ui.model.FilterOperator.EQ, column.key),
			]
			var combineFilter = new Filter({
				filters: aFilters,
				and: true
			})
			const oController = this
			oController.loadata_busy_dialog.open()
			oModel.read("/matchcodecharSet", {
				filters: [combineFilter],
				success: function (oData, oRes) {
					oController.loadata_busy_dialog.close()
					stepModel.setProperty("/value_help/items", oData.results.flat().map(item => {
						return {
							title: item.ValueChar,
							description: item.ValueChar
						}
					}))
				},
				error: function (oErr) {
					oController.loadata_busy_dialog.close()
				}
			})
			const fragment = this.loadFragment({
				name: "my.company.simmflocext.view.fragment.char_value_help"
			})

			fragment.then(function (oDialog) {
				oDialog.open()
			})
			// console.log("value help opened")
		},

		is_strada_visible(category, manserno) {
			return category === "O" && (manserno === "1" || manserno === 1) ? true : false;
		},



		openValueHelp_SU_OPERA1: function (column, oEvent) {
			oEvent.getSource().setValueState(sap.ui.core.ValueState.None)
			const stepModel = this.getView().getModel("stepModel")
			const selected_charac = oEvent.getSource().getBindingContext("stepModel").getPath()
			stepModel.setProperty("/selected_charac", { characteristic: column.key, path: selected_charac })
			stepModel.setProperty("/value_help/name", column.descr)
			const oModel = this.getView().getModel()
			const controller = this
			const modello_fragment = controller.getView().getModel("ModelloFragment");
			const modello_input = controller.getView().getModel("ModelloInput")
			const numero_sede_tecnica = modello_fragment.getProperty("/ExternalNumber");
			const iwerk = modello_input.getProperty("/DataGeneral/Planplant")
			const aFilters = [
				new sap.ui.model.Filter("FLTYP", sap.ui.model.FilterOperator.EQ, "S"),
				new Filter("TPLNR", FilterOperator.Contains, numero_sede_tecnica),
				new Filter("IWERK", FilterOperator.EQ, iwerk)
			]


			oModel.read("/DatiIflotSet", {
				filters: [aFilters],
				success: function (oData, oRes) {
					stepModel.setProperty("/value_help/items", oData.results.flat().map(item => {
						return {
							title: item.TPLNR,
							description: item.PLTXT
						}
					}))
					if (window.bottonesalva.getEnabled() === false) {
						window.bottonesalva.setEnabled(true)
					}
				},
				error: function (oErr) {
					new sap.m.MessageBox.error("Dati IFLOT non raggiungibili")
				}
			})
			const fragment = this.loadFragment({
				name: "my.company.simmflocext.view.fragment.char_value_help"
			})

			fragment.then(function (oDialog) {
				oDialog.open()
			})
		},




		onSearch: function (oEvent) {
			const sQuery = oEvent.getSource().getValue();
			const oList = oEvent.getSource().getParent().getContent()[1]
			const oBinding = oList.getBinding("items");

			if (sQuery && sQuery.length > 0) {
				const oFilter = new sap.ui.model.Filter("title", sap.ui.model.FilterOperator.Contains, sQuery);
				oBinding.filter([oFilter]);
			} else {
				oBinding.filter([]);
			}
		},
		onValueHelpConfirm: function (oEvent) {
			const stepModel = this.getView().getModel("stepModel");
			const selected_charac = stepModel.getProperty("/selected_charac");

			// Ottenere l'elemento selezionato dalla lista
			const oSelectedItem = oEvent.getParameter("listItem");
			const key = oSelectedItem.getBindingContext("stepModel").getObject().title;
			// selected_charac.characteristic === "Z_ST_DISATTIVAZIONE_TRATTA" ? this.CheckStato(key) : undefined

			stepModel.setProperty(`${selected_charac.path}/${selected_charac.characteristic}`, key);

			// Chiudere il dialogo dopo la selezione
			var oDialog = oEvent.getSource().getParent();
			oDialog.close();
		},
		onDialogClose: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			oDialog.close();
		},
		Sleep: function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		},
		CalcoloLunghezza: function (oEvent) {
			var progIni = sap.ui.getCore().byId("pInizale").getValue();
			var progFin = sap.ui.getCore().byId("pFinale").getValue();
			var parts = (1234.5).toLocaleString("en").match(/(\D+)/g);

			progIni = progIni.replace(".", "");
			progIni = progIni.replace(",", ".");

			progIni = Number(progIni);

			progFin = progFin.replace(".", "");
			progFin = progFin.replace(",", ".");

			progFin = Number(progFin);

			var progLength = progFin - progIni

			var formattedLength = progLength
			formattedLength = formattedLength.toLocaleString("de-DE")

			if (formattedLength.split(parts[0])[1] === undefined) {
				formattedLength = formattedLength + ",000"
			} else {
				var difference = 3 - formattedLength.split(parts[0])[1].length
				var power = Math.pow(10, difference)
				var decimals = Number(formattedLength.split(parts[0])[1]) * power
				decimals = decimals.toLocaleString("de-DE")
				formattedLength = formattedLength.split(parts[0])[0] + "," + decimals
			}

			sap.ui.getCore().byId("Lunghezza").setValue(formattedLength);




		},
		CalcoloLunghezzaMain: function () {
			var progIni = this.getView().byId("pIniz").getValue();
			var progFin = this.getView().byId("pFin").getValue();
			var parts = (1234.5).toLocaleString("en").match(/(\D+)/g);

			progIni = progIni.replace(".", "");
			progIni = progIni.replace(",", ".");

			progIni = Number(progIni);

			progFin = progFin.replace(".", "");
			progFin = progFin.replace(",", ".");

			progFin = Number(progFin);

			var progLength = progFin - progIni

			var formattedLength = progLength
			formattedLength = formattedLength.toLocaleString("de-DE")

			if (formattedLength.split(parts[0])[1] === undefined) {
				formattedLength = formattedLength + ",000"
			} else {
				var difference = 3 - formattedLength.split(parts[0])[1].length
				var power = Math.pow(10, difference)
				var decimals = Number(formattedLength.split(parts[0])[1]) * power
				decimals = decimals.toLocaleString("de-DE")
				formattedLength = formattedLength.split(parts[0])[0] + "," + decimals
			}
			this.getView().byId("lung").setValue(formattedLength);
			this.updateLinearLung()
		},
		CalcoloLunghezzaCopy: function (oEvent) {
			var progIni = sap.ui.getCore().byId("pInizaleCopy1").getValue();
			var progFin = sap.ui.getCore().byId("pFinaleCopy1").getValue();
			var parts = (1234.5).toLocaleString("en").match(/(\D+)/g);

			progIni = progIni.replace(".", "");
			progIni = progIni.replace(",", ".");

			progIni = Number(progIni);

			progFin = progFin.replace(".", "");
			progFin = progFin.replace(",", ".");

			progFin = Number(progFin);

			var progLength = progFin - progIni

			var formattedLength = progLength
			formattedLength = formattedLength.toLocaleString("de-DE")

			if (formattedLength.split(parts[0])[1] === undefined) {
				formattedLength = formattedLength + ",000"
			} else {
				var difference = 3 - formattedLength.split(parts[0])[1].length
				var power = Math.pow(10, difference)
				var decimals = Number(formattedLength.split(parts[0])[1]) * power
				decimals = decimals.toLocaleString("de-DE")
				formattedLength = formattedLength.split(parts[0])[0] + "," + decimals
			}

			sap.ui.getCore().byId("LunghezzaCopy1").setValue(formattedLength);




		},
		formatTextFin: function (oEvent) { // da rimuovere
			var id = oEvent.getSource().getId()


			// var formattedFin = this.getView().byId(id).getValue();
			var formattedFin = sap.ui.getCore().byId(id).getValue();
			var parts = (1234.5).toLocaleString("en").match(/(\D+)/g);

			if (formattedFin.split(parts[1])[1] && formattedFin.split(parts[1])[1].length < 3) {
				formattedFin = Number(formattedFin);
			} else {
				formattedFin = formattedFin.replace(".", "");
				formattedFin = formattedFin.replace(",", ".");
				formattedFin = Number(formattedFin);
			}

			formattedFin = formattedFin.toLocaleString("de-DE")

			if (formattedFin.split(parts[0])[1] === undefined) {
				formattedFin = formattedFin + ",000"
			} else {
				var zeroes = "000"
				var difference = 3 - formattedFin.split(parts[0])[1].length
				formattedFin = formattedFin.split(parts[0])[0] + "," + formattedFin.split(parts[0])[1] + zeroes.substring(0, difference)
			}

			sap.ui.getCore().byId(id).setValue(formattedFin);
		},

		formatTextIni: function (oEvent) { // da rimuovere
			var id = oEvent.getSource().getId()
			var formattedIni = sap.ui.getCore().byId(id).getValue();
			var parts = (1234.5).toLocaleString("en").match(/(\D+)/g);

			if (formattedIni.split(parts[1])[1] && formattedIni.split(parts[1])[1].length < 3) {
				formattedIni = Number(formattedIni);
			} else {
				formattedIni = formattedIni.replace(".", "");
				formattedIni = formattedIni.replace(",", ".");
				formattedIni = Number(formattedIni);
			}

			formattedIni = formattedIni.toLocaleString("de-DE")

			if (formattedIni.split(parts[0])[1] === undefined) {
				formattedIni = formattedIni + ",000"
			} else {
				var zeroes = "000"
				var difference = 3 - formattedIni.split(parts[0])[1].length
				formattedIni = formattedIni.split(parts[0])[0] + "," + formattedIni.split(parts[0])[1] + zeroes.substring(0, difference)
			}

			sap.ui.getCore().byId(id).setValue(formattedIni);
		},

		////////////////////////////////////////////////Da non portare ancora
		formatTextIniAdd: function (oEvent) {
			if (this.getView().getModel("stepModel").getData().data.DataSpecific.Category !== "S") {
				this.formatTextIni(oEvent)
				return
			}
			if (this.getView().getModel("stepModel").getData().data.DataSpecific.Category === "S") {
				var id = oEvent.getSource().getId()
				var formattedIni = sap.ui.getCore().byId(id).getValue();
				var parts = (1234.5).toLocaleString("en").match(/(\D+)/g);

				if (formattedIni.split(parts[1])[1] && formattedIni.split(parts[1])[1].length < 3) {
					formattedIni = Number(formattedIni);
				} else {
					formattedIni = formattedIni.replace(".", "");
					formattedIni = formattedIni.replace(",", ".");
					formattedIni = Number(formattedIni);
				}

				formattedIni = formattedIni.toLocaleString("de-DE")

				if (formattedIni.split(parts[0])[1] === undefined) {
					formattedIni = formattedIni + ",000"
				} else {
					var zeroes = "000"
					var difference = 3 - formattedIni.split(parts[0])[1].length
					formattedIni = formattedIni.split(parts[0])[0] + "," + formattedIni.split(parts[0])[1] + zeroes.substring(0, difference)
				}

				var iniX = formattedIni
				var StartPointtMain = this.getView().getModel("ModelloInput").oData.DataGeneral.StartPoint
				var EndPointMain = this.getView().getModel("ModelloInput").oData.DataGeneral.EndPoint
				iniX = iniX.replaceAll(",", "").replaceAll(".", "");
				EndPointMain = EndPointMain.replaceAll(",", "").replaceAll(".", "");
				StartPointtMain = StartPointtMain.replaceAll(",", "").replaceAll(".", "");

				if (Number(iniX) < Number(StartPointtMain) || Number(iniX) > Number(EndPointMain)) {
					new sap.m.MessageBox.error("Controllare la tratta")
					sap.ui.getCore().byId("pInizale").setValueState("Error");
					sap.ui.getCore().byId("Save").setEnabled(false)
					sap.ui.getCore().byId(id).setValue(formattedIni);
				} else {
					sap.ui.getCore().byId(id).setValue(formattedIni);
					sap.ui.getCore().byId("pInizale").setValueState("Success");
					sap.ui.getCore().byId("Save").setEnabled(true)
				}
			}
		},
		formatTextFinAdd: function (oEvent) {
			if (this.getView().getModel("stepModel").getData().data.DataSpecific.Category !== "S") {
				this.formatTextFin(oEvent)
				return
			}
			if (this.getView().getModel("stepModel").getData().data.DataSpecific.Category === "S") {
				var id = oEvent.getSource().getId()
				if (id === 'container-modifichesedetecniche---Step1--pFin') this.checkMessage()

				var formattedFin = sap.ui.getCore().byId(id).getValue();
				var parts = (1234.5).toLocaleString("en").match(/(\D+)/g);

				if (formattedFin.split(parts[1])[1] && formattedFin.split(parts[1])[1].length < 3) {
					formattedFin = Number(formattedFin);
				} else {
					formattedFin = formattedFin.replace(".", "");
					formattedFin = formattedFin.replace(",", ".");
					formattedFin = Number(formattedFin);
				}

				formattedFin = formattedFin.toLocaleString("de-DE")

				if (formattedFin.split(parts[0])[1] === undefined) {
					formattedFin = formattedFin + ",000"
				} else {
					var zeroes = "000"
					var difference = 3 - formattedFin.split(parts[0])[1].length
					formattedFin = formattedFin.split(parts[0])[0] + "," + formattedFin.split(parts[0])[1] + zeroes.substring(0, difference)
				}
				var FinX = formattedFin
				var EndPointMain = this.getView().getModel("ModelloInput").oData.DataGeneral.EndPoint
				var StartPointtMain = this.getView().getModel("ModelloInput").oData.DataGeneral.StartPoint
				StartPointtMain = StartPointtMain.replaceAll(",", "").replaceAll(".", "");
				FinX = FinX.replaceAll(",", "").replaceAll(".", "");

				EndPointMain = EndPointMain.replaceAll(",", "").replaceAll(".", "");

				if (Number(FinX) > Number(EndPointMain) || Number(FinX) < Number(StartPointtMain)) {
					new sap.m.MessageBox.error("Controllare la tratta")
					sap.ui.getCore().byId("pFinale").setValueState("Error");
					sap.ui.getCore().byId("Save").setEnabled(false)
					sap.ui.getCore().byId(id).setValue(formattedFin);
				} else {
					sap.ui.getCore().byId(id).setValue(formattedFin);
					sap.ui.getCore().byId("pFinale").setValueState("Success");
					sap.ui.getCore().byId("Save").setEnabled(true)
				}
			}
		},
		////////////////////////////////////////////////Da non portare ancora
		Aggiungi: function () {
			var oView = this.getView();
			if (!this._rValueHelpDialog) {
				this._rValueHelpDialog = Fragment.load({
					name: "project1.view.ModaleRow",
					controller: this
				}).then(function (oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				});
			}
			this._rValueHelpDialog.then(function (oValueHelpDialog) {
				oValueHelpDialog.open();
			}.bind(this));
		},
		formatNumberWithThousandSeparator: function (value) {
			if (value) {
				let newValue = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
				return newValue
			} else {
				return value;
			}
		},
		updateLinearLung: function (oEvent) {
			let newValue;
			if (!oEvent) {
				newValue = this.getView().byId("lung").mProperties.value
				this.getView().getModel("ModelloInput").setProperty("/DataGeneral/LinearLength", newValue)
				return
			}
			newValue = oEvent.mParameters.newValue
			this.getView().getModel("ModelloInput").setProperty("/DataGeneral/LinearLength", newValue)
			console.log(oEvent)
		},
		is_in_interval: function (tratta_start, tratta_end, start, end) {
			return start >= tratta_start && start <= tratta_end && end <= tratta_end && end >= tratta_start
		},
		get_length: function (f_start, f_end) {
			let f_lunghezza = this.string_to_float(f_end) - this.string_to_float(f_start);
			let s_lunghezza = f_lunghezza.toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
			s_lunghezza = s_lunghezza.replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
			return s_lunghezza;
		},

		FormatRight: function (oEvent) {
			let id = oEvent.mParameters.id
			var resultArray = oEvent.mParameters.newValue.split(/[.,]/).map(function (item) {
				// Remove excess digits if length exceeds 3
				return item.slice(0, 3);
			});
			let JoinNumber = resultArray.join("")
			if (Number(JoinNumber <= 999)) {
				let FormattedNumber = parseFloat(JoinNumber).toLocaleString('en-US')
				if (sap.ui.getCore().byId(id).mBindingInfos.value.binding.sPath === "/StartPoint" || sap.ui.getCore().byId(id).mBindingInfos.value.binding.sPath === "/EndPoint") {
					sap.ui.getCore().byId(id).setValue(FormattedNumber)
				}
			} else {
				let num = parseInt(resultArray.join("")).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 3 })
				let lastIndex = num.lastIndexOf('.');
				let FormattedNumber = num.substring(0, lastIndex) + ',' + num.substring(lastIndex + 1);
				if (sap.ui.getCore().byId(id).mBindingInfos.value.binding.sPath === "/StartPoint" || sap.ui.getCore().byId(id).mBindingInfos.value.binding.sPath === "/EndPoint") {
					sap.ui.getCore().byId(id).setValue(FormattedNumber)
				}
			}

		},

		string_to_float: function (s_value) {
			try {
				const new_value = parseFloat(s_value.replace(".", "").replace(",", "."));
				return new_value
			} catch (error) {
				sap.m.MessageBox.error(error.message)
			}
		},

		float_to_string: function (f_value) {
			let s_value = String(f_value);

			if (s_value.length > 7) {
				s_value = parseFloat(s_value).toFixed(3);
				s_value = s_value.replace(".", ",");
				return s_value;
			} else {
				// Format as thousands separator and three zeros after the decimal point
				s_value = parseFloat(s_value).toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
				return s_value;
			}
		},
		///COpia tratta per classe TRATTA + CARATTERISTICHE
		///COpia tratta per classe TRATTA + CARATTERISTICHE
		OnCopia: function (oEvent) {
			const controller = this;
			const stepModel = this.getView().getModel("stepModel")
			var inputModel = this.getView().getModel("InputModel")
			var modello_input = this.getView().getModel("ModelloInput")
			var table = this.getView().byId("TabellaPrincipale")
			const aSelectedObjects = [this.SelectedRow]
			inputModel.ExternalNumber = this.getView().getModel("ModelloFragment").oData.ExternalNumber
			const modello_fragment = controller.getView().getModel("ModelloFragment");
			const category = modello_fragment.getProperty("/DataSpecific/Category");
			const manserno = modello_fragment.getProperty("/DataGeneral/Manserno");
			const strada = inputModel.getProperty("/strada");
			if (category === "O" && (manserno === "1" || manserno === 1) && (strada === "" || strada === undefined || strada === null)) {
				sap.m.MessageBox.error("Valorizzare il campo Strada.");
				return;
			}
			try {
				const tratta_start_point = parseFloat(modello_input.getProperty("/DataGeneral/StartPoint").replace(".", "").replace(",", "."))
				const tratta_end_point = parseFloat(modello_input.getProperty("/DataGeneral/EndPoint").replace(".", "").replace(",", "."))
				let start_point = inputModel.getProperty("/StartPoint")
				let end_point = inputModel.getProperty("/EndPoint")
				const onCloseControlloTratte = (oEventControllo) => {
					if (!(oEventControllo === "OK")) {
						return;
					}

					var LinearLength = controller.float_to_string(end_point - start_point);
					var LinearUnit = inputModel.getProperty("/LinearUnit")
					// const values = stepModel.getProperty("/values")
					const values = stepModel.getProperty(`/all_values/${this.class_name.key}/values`)
					const data = stepModel.getProperty("/data")
					start_point = controller.float_to_sap_string(start_point)
					end_point = controller.float_to_sap_string(end_point)

					for (let i = 0; i < aSelectedObjects.length; i++) {
						var max = 0
						var entrata = false
						const found =
							values?.filter(x =>
								(x.StartPoint.trim() === start_point.replace(".", "") && x.EndPoint.trim() === end_point.replace(".", "")) ||
								(x.StartPoint.trim() === start_point && x.EndPoint.trim() === end_point)
							)?.map(x => x.ID)?.sort((a, b) => {
									// Converte le stringhe in numeri interi e confronta
									const numA = parseInt(a, 10);
									const numB = parseInt(b, 10);
									if (numA < numB) {
										return 1; // Cambia in -1 per l'ordine crescente
									} else if (numA > numB) {
										return -1; // Cambia in 1 per l'ordine crescente
									} else {
										return 0;
									}
								});  // searching for tratta with same end point and start point
						if (found && Array.isArray(found) && found.length > 0) {
							try {
								max = parseInt(found[0]) + 1;
							} catch (error) {
								sap.m.MessageBox.error(`Errore nella creazione dell'ID:\n${error.message}`)
							}
						}

						const headers = stepModel.getProperty(`/all_values/${this.class_name.key}/headers`)
						props_to_remove = ["StartPoint", "EndPoint", "LinearLength", "LinearUnit"]
						const charactheristics = headers.filter(header => !props_to_remove.includes(header.key))

						var new_value = {
							StartPoint: start_point,
							EndPoint: end_point,
							LinearLength: LinearLength,
							ID: String(max),
							LinearUnit: LinearUnit,
							ClassNumber: stepModel.oData.filters.class.key
						}

						let se_value_set = []

						for (const c of charactheristics) {
							new_value[c.key] = aSelectedObjects[i][c.key]
							se_value_set.push({
								ExternalNumber: this.getView().getModel("ModelloFragment").oData.ExternalNumber,
								ClassNumber: stepModel.oData.filters.class.key,
								StartPoint: start_point,
								EndPoint: end_point,
								LinearLength: LinearLength,
								LinearUnit: LinearUnit,
								ValueChar: new_value[c.key],
								ID: String(max),
								Charact: c.key,
								CharactDescr: c.descr,
								atfor: c.atfor
							})
						}


						data.StartEndPointSet.results.push({
							ExternalNumber: this.getView().getModel("ModelloFragment").oData.ExternalNumber,
							StartPoint: start_point,
							EndPoint: end_point,
							ClassNumber: stepModel.oData.filters.class.key,
							LinearLength: LinearLength,
							LinearUnit: LinearUnit,
							/*     Unauthorized: false, */
							CharStartEndPointValueSet: {
								results: se_value_set
							}
						})

						if (category === "O" && (manserno === "1" || manserno === 1)) {
							if (controller.class_name.key === "Z_OPERE_LAM")
								new_value["Z_STRADA1_SU_OPERA"] = strada;
							if (controller.class_name.key === "Z_SOVRAPPASSI")
								new_value["Z_STRADA"] = strada;
							if (controller.class_name.key === "Z_O_03_OPERELAM")
								new_value["Z_SP_STRADA1_SU_OPERA"] = strada;
						}

						values.push(new_value)

						//     // Ordina l'array di valori in base a StartPoint

						//     // Aggiorna il binding
						// var oTable = this.getView().byId("TabellaPrincipale");
						// oTable.unbindRows();
						// oTable.bindRows({
						//     path: 'stepModel>/values',
						//     sorter: { path: 'StartPoint', descending: false }
						// });


					}
					values.sort(function (a, b) {
						const numA = parseFloat(a.StartPoint.trim());
						const numB = parseFloat(b.StartPoint.trim());
						return numA - numB;
					});
					stepModel.setProperty(`/all_values/${this.class_name.key}/values`, values)
					stepModel.setProperty("/data", data)
					this.getView().getModel("InputModel").setProperty("/StartPoint", "")
					this.getView().getModel("InputModel").setProperty("/EndPoint", "")
					this.getView().getModel("InputModel").setProperty("/LinearLength", "")
					window.dataid = values
					this.CopiaValueDialog.close()
				}

				if (!controller.is_in_interval(tratta_start_point, tratta_end_point, start_point, end_point) && stepModel.getData().data.DataSpecific.Category === "S") {
					sap.m.MessageBox.warning("Tratta inserita non coerente con dati di testata.", { actions: [sap.m.MessageBox.Action.CANCEL, sap.m.MessageBox.Action.OK], onClose: onCloseControlloTratte })
					return;
				}
				onCloseControlloTratte("OK")


			} catch (error) {
				sap.m.MessageBox.error(error.message)
			}
		},
		///COpia tratta per classe TRATTA + CARATTERISTICHE

		on_value_help_strada: function (oEvent) {
			const controller = this;
			oEvent.getSource().setValueState(sap.ui.core.ValueState.None)
			const stepModel = this.getView().getModel("stepModel")
			const oModel = this.getView().getModel()
			const modello_fragment = controller.getView().getModel("ModelloFragment");
			const modello_input = controller.getView().getModel("ModelloInput")
			const numero_sede_tecnica = modello_fragment.getProperty("/ExternalNumber");
			const iwerk = modello_input.getProperty("/DataGeneral/Planplant")
			const aFilters = [
				new sap.ui.model.Filter("FLTYP", sap.ui.model.FilterOperator.EQ, "S"),
				new Filter("TPLNR", FilterOperator.Contains, numero_sede_tecnica),
				new Filter("IWERK", FilterOperator.EQ, iwerk),
			]
			oModel.read("/DatiIflotSet", {
				filters: [aFilters],
				success: function (oData, oRes) {
					stepModel.setProperty("/value_help/items", oData.results.flat().map(item => {
						return {
							title: item.TPLNR,
							description: item.PLTXT
						}
					}))
					controller["value_help_strada"].open();

				},
				error: function (oErr) {
					new sap.m.MessageBox.error(oErr.message)
				}
			})
		},
		on_close_value_help_strada: function (oEvent) {
			const controller = this;
			controller["value_help_strada"].close();
		},
		pick_strada: function (o_event) {
			const controller = this;
			try {
				const id_strada = o_event.getParameter("listItem").getBindingContext("stepModel").getObject().title;
				const input_model = controller.getView().getModel("InputModel");
				input_model.setProperty("/strada", id_strada);
			} catch (error) {
				sap.m.MessageBox.error(`Si è verificato il seguente errore nella scelta della strada:\n${error.message}`)
			} finally {
				controller["value_help_strada"].close();
			}
		},


		//##-------------------------------------------------

		//Funzione Principale per le leggere la sede tecnica scelta 

		//-------------------------------------------------##
		readData: async function () {
			var oModel = this.getView().getModel();
			var that = this;
			var ExternalNumber = that.currentID
			this.loadata_busy_dialog.open()
			const readSedeSetPromise = new Promise((resolve, reject) => {

				oModel.read("/sedeSet(" + "'" + ExternalNumber + "'" + ")", {
					urlParameters: {
						"$expand": "sedetochar,sedetolin,StartEndPointSet,sedetochar/chartochar,sedetochar/chartocurr,sedetochar/chartonum,sedetolin/sedetolinchar,sedetolin/sedetolincurr,sedetolin/sedetolinnum,StartEndPointSet/CharStartEndPointValueSet",
					},
					method: "GET",
					success: async function (oData) {
						// Create Json Model for table
						var oODataJSONModel = new sap.ui.model.json.JSONModel();
						// create JSON model for label input 
						var ModelloInputModel = new sap.ui.model.json.JSONModel();
						ModelloInputModel.setData(oData);
						that.getView().setModel(ModelloInputModel, "ModelloInput");
						//Setto la M minuscola 
						if (that.getView().getModel("ModelloInput").oData.DataGeneral.LinearUnit === "") {
							that.getView().getModel("ModelloInput").oData.DataGeneral.LinearUnit = "m"
							that.getView().byId("um").setValue(that.getView().getModel("ModelloInput").oData.DataGeneral.LinearUnit)
						}
						let sZKiException = that.getView().getModel("ModelloInput").oData.DataGeneral.Abcindic
						let Consttype = that.getView().getModel("ModelloInput").oData.DataGeneral.Consttype
						let Manserno = that.getView().getModel("ModelloInput").oData.DataGeneral.Manserno
						let Objecttype = that.getView().getModel("ModelloInput").oData.DataGeneral.Objecttype
						if (sZKiException === "C") {
							that.getView().byId("Descrizione").setEditable(false)
							that.getView().byId("pIniz").setEditable(false)
							that.getView().byId("pFin").setEditable(false)
							that.getView().byId("Salva").setEnabled(false)
							that.getView().byId("CopiaTratta").setEnabled(false)
							that.getView().byId("latIniziale").setEditable(false)
							that.getView().byId("latFinale").setEditable(false)
							that.getView().byId("lonIniziale").setEditable(false)
							that.getView().byId("lonFinale").setEditable(false)
							that.getView().byId("QuotaInizio").setEditable(false)
							that.getView().byId("QuotaFine").setEditable(false)
							that.getView().byId("lonCentrale").setEditable(false)
							that.getView().byId("QuotaCentrale").setEditable(false)
							that.getView().byId("latCentrale").setEditable(false)
							that.getView().byId("inputPlanplant").setEditable(false)
						} else if (sZKiException === "A" || sZKiException === "" || sZKiException === "X") {
							that.getView().byId("Descrizione").setEditable(true)
							that.getView().byId("pIniz").setEditable(true)
							that.getView().byId("pFin").setEditable(true)
							that.getView().byId("Salva").setEnabled(true)
							that.getView().byId("inputPlanplant").setEditable(true)
							that.getView().byId("CopiaTratta").setEnabled(true)
							that.getView().byId("latIniziale").setEditable(true)
							that.getView().byId("latFinale").setEditable(true)
							that.getView().byId("lonIniziale").setEditable(true)
							that.getView().byId("lonFinale").setEditable(true)
							that.getView().byId("QuotaInizio").setEditable(true)
							that.getView().byId("QuotaFine").setEditable(true)
							that.getView().byId("lonCentrale").setEditable(true)
							that.getView().byId("QuotaCentrale").setEditable(true)
							that.getView().byId("latCentrale").setEditable(true)
						}
						if (Consttype === "K") {
							that.getView().byId("Descrizione").setEditable(false)
							that.getView().byId("pIniz").setEditable(false)
							that.getView().byId("pFin").setEditable(false)
							that.getView().byId("Salva").setEnabled(false)
							that.getView().byId("latIniziale").setEditable(false)
							that.getView().byId("latFinale").setEditable(false)
							that.getView().byId("lonIniziale").setEditable(false)
							that.getView().byId("lonFinale").setEditable(false)
							that.getView().byId("QuotaInizio").setEditable(false)
							that.getView().byId("QuotaFine").setEditable(false)
							that.getView().byId("lonCentrale").setEditable(false)
							that.getView().byId("QuotaCentrale").setEditable(false)
							that.getView().byId("latCentrale").setEditable(false)
						}
						if ((Objecttype === "OA01" && (Manserno === "2" || Manserno === "3"))) {
							that.getView().byId("Descrizione").setEditable(false);
							that.getView().byId("pIniz").setEditable(false);
							that.getView().byId("pFin").setEditable(false);
							that.getView().byId("inputPlanplant").setEditable(false);
							that.getView().byId("Salva").setEnabled(false);
							that.getView().byId("CopiaTratta").setEnabled(false);
							that.getView().byId("latIniziale").setEditable(false);
							that.getView().byId("latFinale").setEditable(false);
							that.getView().byId("lonIniziale").setEditable(false);
							that.getView().byId("lonFinale").setEditable(false);
							that.getView().byId("QuotaInizio").setEditable(false);
							that.getView().byId("QuotaFine").setEditable(false);
							that.getView().byId("lonCentrale").setEditable(false);
							that.getView().byId("QuotaCentrale").setEditable(false);
							that.getView().byId("latCentrale").setEditable(false);
						} else if ((Objecttype === "OA03" && (Manserno === "2" || Manserno === "3"))) {
							that.getView().byId("Descrizione").setEditable(true);
							that.getView().byId("pIniz").setEditable(false);
							that.getView().byId("pFin").setEditable(false);
							that.getView().byId("Salva").setEnabled(false);
							that.getView().byId("inputPlanplant").setEditable(false);
							that.getView().byId("CopiaTratta").setEnabled(false);
							that.getView().byId("latIniziale").setEditable(false);
							that.getView().byId("latFinale").setEditable(false);
							that.getView().byId("lonIniziale").setEditable(false);
							that.getView().byId("lonFinale").setEditable(false);
							that.getView().byId("QuotaInizio").setEditable(false);
							that.getView().byId("QuotaFine").setEditable(false);
							that.getView().byId("lonCentrale").setEditable(false);
							that.getView().byId("QuotaCentrale").setEditable(false);
							that.getView().byId("latCentrale").setEditable(false);
						}
						//-------------------------------------------------------------------------------------------------
						// create JSON model for label input 
						var ModelloInputModelFragment = new sap.ui.model.json.JSONModel();
						ModelloInputModelFragment.setData(oData);
						that.getView().setModel(ModelloInputModelFragment, "ModelloFragment");
						if (that.getView().getModel("ModelloFragment").oData.DataGeneral.capisaldi !== "") {
							that.getView().getModel("ModelloFragment").oData.DataGeneral.capisaldi = that.getView().getModel("ModelloFragment").oData.DataGeneral.capisaldi.replaceAll("#", "\n")
							const Capisaldi = that.getView().getModel("ModelloFragment").oData.DataGeneral.capisaldi
							that.getView().getModel("ModelloFragment").setProperty("/DataGeneral/capisaldi", Capisaldi)
						} else {
							const Capisaldi = that.getView().getModel("ModelloFragment").oData.DataGeneral.capisaldi
							that.getView().getModel("ModelloFragment").setProperty("/DataGeneral/capisaldi", Capisaldi)
						}
						that.getView().getModel("stepModel").setProperty("/data", oData)
						// Parte per il traversa di default
						// for (let i = 0; i < that.getView().getModel("stepModel").oData.data.StartEndPointSet.results.length; i++) {
						// 	var ClassFound = that.getView().getModel("stepModel").oData.data.StartEndPointSet.results[i].CharStartEndPointValueSet.results.filter((e) => e.ClassNumber === "Z_CENTRI")
						// 	var CharactFound = ClassFound.filter((e) => e.Charact === "Z_T_VET_VARIANTEDI")
						// 	if (ClassFound.length !== 0) {
						// 		if (CharactFound[0].ValueChar === "TRAVERSA" || CharactFound[0].ValueChar === "V") {

						// 		} else {
						// 			CharactFound[0].ValueChar = "TRAVERSA"
						// 		}
						// 	}


						// }
						//-------------------------------------------------------------------------------------------------

						that.getView().getModel("stepModel").setProperty("/all_values", {});
						that.getView().byId("classe2").setSelectedItem(null)
						await that.LoadClasses()
						resolve();

					},
					error: function (e) {
						reject(e)
					},
				});

			})

			const readCatarabboSetPromise = new Promise((resolve, reject) => {
				oModel.read("/CarattobbSet", {
					success: function (oData, oResponse) {
						console.log(oData);
						that.getView().getModel("stepModel").setProperty("/MandatoryClass", oData);
						resolve()
					},
					error: function (oError) {
						// new sap.m.MessageBox.error("Errore nella chiamata a CarattobbSet:", oError);
						reject(oError)
					}
				});
				//

			})

			try {
				await readSedeSetPromise;
				await readCatarabboSetPromise;
			} catch (error) {
				sap.m.MessageBox.error(`Errore nella funzione di read dei dati. Non è stato possibile reperire i dati relativi alla sede tecnica.\nMESSAGGIO:${error.message}\nSTACK:${error.stack}`)
			} finally {
				this.loadata_busy_dialog.close()
			}


		},














		_toggleButtonsAndView: function (bEdit) {
			var oView = this.getView();

			// Show the appropriate action buttons
			oView.byId("edit").setVisible(!bEdit);
			oView.byId("save").setVisible(bEdit);
			oView.byId("cancel").setVisible(bEdit);

			// Set the right form type
			// this._showFormFragment(bEdit ? "Change" : "Display");  // FC 20230710
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
			var that = this;
			oPage.removeAllContent();
			this._getFormFragment(sFragmentName).then(function (oVBox) {
				if (that.getView().getModel("HeaderInfoModel")) {
					that.headerInfoModelData = that.getView().getModel("HeaderInfoModel").getData();
					// that.readData(that.headerInfoModelData); FC 20230710
				}
				else {
					that.headerInfoModelData = undefined;
				}

				oPage.insertContent(oVBox);
			});
		}
	});

});