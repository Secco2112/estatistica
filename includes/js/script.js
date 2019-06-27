"use strict";


$(document).ready(function() {

	const statistic = new Statistic({
		decimalPlaces: 1
	});

	$(".tabs-wrapper").tabs();
	$(".results-tabs").tabs();


	$(document).on("click", ".form-column .input i", function(e) {
		var current_input_length = $("#value-column .input").length;
		if(current_input_length == 1) return;
		var index = $(this).parent().index();
		$("#value-column .input").eq(index - 1).remove();
		$("#qty-column .input").eq(index - 1).remove();
	});


	$(".add-frequency").on("click", function(e) {
		e.preventDefault();

		var current_input_length = $("#value-column .input").length;

		var opts = ["value", "qty"];
		$.each(opts, function(i, el) {
			var html = "<li class='input'>";
				html += "<input type='text' name='frequency_"+el+"'>";
				if(i == 1) html += "<i class='fa fa-times'></i>";
			html += "</li>";
			$("#"+el+"-column").append(html);
		});
	});


	$(".calculate").on("click", function(e) {
		e.preventDefault();

		$(".results-wrapper").show();

		var current_option = $(this).closest("form").find("input[name=frequency-option]").val();
		statistic.setType(current_option);

		if(current_option == "all") {
			var values = $("textarea[name=frequency-values]").val();
			statistic.setRawData(values);
		} else if(current_option == "qty") {
			var data = [];
			$("#value-column .input").each(function(i, el) {
				var value = $(el).find("input").val(),
					qty = $("#qty-column .input").eq(i).find("input").val();

				if(value && qty) {
					data.push({
						"value": value,
						"qty": parseInt(qty)
					});
				}

				statistic.setRawData(data);
			});
		}

		statistic.parseData().setImportantValues().sortData();

		var frequecyTable = statistic.mountTable();

		if(frequecyTable.length > 0) {
			// Tab 1
			$(".results-wrapper .frequency-table tbody").empty();

			$.each(frequecyTable, function(i, el) {
				var tr = "<tr>";
				tr += "<td>" + el.min + " ├ " + el.max + "</td>";
				tr += "<td>" + el.fi + "</td>";
				tr += "<td>" + el.xi + "</td>";
				tr += "<td>" + el.fac + "</td>";
				tr += "<td>" + statistic.format(el.fi_percent) + "</td>";
				tr += "<td>" + statistic.format(el.fac_percent) + "</td>";
				tr += "</tr>";

				$(".results-wrapper .frequency-table tbody").append(tr);
			});

			$(".results-wrapper .frequency-table tfoot tr td:nth-child(2)").text(statistic.totalData);
			$(".results-wrapper .frequency-table tfoot tr td:nth-child(5)").text(statistic.format(frequecyTable[frequecyTable.length-1].fac_percent));


			// Tab 2
			var table_2 = $("table.trend_measures");

			table_2.find("#simple_arithmetical_average td:nth-child(2)").text(statistic.format(statistic.simpleArithmeticalAverage()));
			table_2.find("#weighted_arithmetical_average td:nth-child(2)").text(statistic.format(statistic.weightedArithmeticalAverage()));
			table_2.find("#geometric_average td:nth-child(2)").text(statistic.format(statistic.geometricAverage()));
			if(statistic.moda().length > 1) {
				table_2.find("#moda td:nth-child(2)").text("Amodal");
			} else {
				table_2.find("#moda td:nth-child(2)").text(statistic.moda()[0]);
			}
			table_2.find("#median td:nth-child(2)").text(statistic.median());
			table_2.find("#standard_deviation td:nth-child(2)").text(statistic.format(statistic.standardDeviation()));
			table_2.find("#sample_variance td:nth-child(2)").text(statistic.format(statistic.sampleVariance()));
			table_2.find("#population_standard_deviation td:nth-child(2)").text(statistic.format(statistic.populationStandardDeviation()));
			table_2.find("#population_variance td:nth-child(2)").text(statistic.format(statistic.populationVariance()));
			table_2.find("#sample_variance_coefficient td:nth-child(2)").text(statistic.format(statistic.sampleVarianceCoefficient()));


			// Tab 3
			google.charts.load("current", {packages:["corechart"]});
			google.charts.setOnLoadCallback(drawHistogramChart);

			// Histograma
			function drawHistogramChart() {
				var frequecyTable = statistic.frequencyTable, rowData = [], hTicks = [];
				rowData.push([
					'Ponto médio', 'Frequência absoluta'
				])
				$.each(frequecyTable, function(i, el) {
					rowData.push([
						el.fi.toString(),
						el.xi
					]);

					hTicks.push(el.xi);
				});

				var data = google.visualization.arrayToDataTable(rowData);

				var options = {
					title: 'Histograma',
					legend: { position: 'none' },
					hAxis: {
						ticks: hTicks
					},
					histogram: {
						bucketSize: 3	
					}
				};
	
				var chart = new google.visualization.Histogram(document.getElementById('histogram_graph'));
				chart.draw(data, options);
			}


			// Polígonos
			google.charts.setOnLoadCallback(drawFrequencyPolygonChart);

			function drawFrequencyPolygonChart() {
				var frequecyTable = statistic.frequencyTable, rowData = [];
				rowData.push([
					'Ponto médio', 'Frequência'
				]);

				if(frequecyTable[0].xi - statistic.tableClassesInterval >= 0) {
					rowData.push([
						(frequecyTable[0].xi - statistic.tableClassesInterval).toString(),
						0
					]);
				} else {
					rowData.push([
						"0",
						0
					]);
				}
				$.each(frequecyTable, function(i, el) {
					rowData.push([
						el.xi.toString(),
						el.fi
					]);
				});
				rowData.push([
					(frequecyTable[frequecyTable.length-1].xi + statistic.tableClassesInterval).toString(),
					0
				]);

				var data = google.visualization.arrayToDataTable(rowData);
		
				var options = {
					title: 'Polígono de frequências',
					legend: { position: 'none' },
					hAxis: {
						title: 'Ponto médio'
					},
					vAxis: {
						title: 'Frequência'
					},
					pointSize: 5
				};
		
				var chart = new google.visualization.LineChart(document.getElementById('frequency_polygon_graph'));
		
				chart.draw(data, options);
			}

			// Ogiva
			google.charts.setOnLoadCallback(drawOgivaChart);

			function drawOgivaChart() {
				var frequecyTable = statistic.frequencyTable, rowData = [];
				rowData.push([
					'Ponto médio', 'Frequência Acumulada'
				]);

				$.each(frequecyTable, function(i, el) {
					rowData.push([
						el.xi.toString(),
						el.fac
					]);
				});

				var data = google.visualization.arrayToDataTable(rowData);
		
				var options = {
					title: 'Ogiva',
					legend: { position: 'none' },
					hAxis: {
						title: 'Ponto médio'
					},
					vAxis: {
						title: 'Frequência Acumulada'
					},
					pointSize: 5
				};
		
				var chart = new google.visualization.LineChart(document.getElementById('ogiva_graph'));
		
				chart.draw(data, options);
			}
		}
	});


	var final_transcript = '';
	var recognizing = false;
	var ignore_onend;
	var start_timestamp;
	$(".microphone > i").on("click", function() {
		if (window.hasOwnProperty('webkitSpeechRecognition')) {	  
			var voice = new webkitSpeechRecognition();
	  
			voice.continuous = true;
			voice.interimResults = true;
	  
			voice.lang = "pt-BR";
			voice.start();
			
			voice.onresult = function(event) {
				var interim_transcript = '';
				for (var i = event.resultIndex; i < event.results.length; ++i) {
					if (event.results[i].isFinal) {
						final_transcript += event.results[i][0].transcript;
					} else {
						interim_transcript += event.results[i][0].transcript;
					}
				}
				console.log(interim_transcript);
			};
			
			voice.onaudiostart = function(e) {
				recognizing = true;
			}
	  
			voice.onaudioend = function(e) {
				recognizing = false;
				if (ignore_onend) {
					return;
				}
			}
	  
			// handler de erro
			voice.onerror = function(e) {
			  	var error;
	  
			  	switch (e.error) {
					case 'no-speech':
						error = 'Nenhuma fala foi detectada.';
						ignore_onend = true;
						break;
					case 'aborted':
						error = 'A entrada de fala foi abortada.';
						ignore_onend = true;
						break;
					case 'audio-capture':
						error = 'A captura de áudio falhou.';
						ignore_onend = true;
						break;
					case 'network':
						error = 'Comunicações de rede falharam.';
						ignore_onend = true;
						break;
					case 'not-allowed':
						error = 'Sem permissão de entrada de fala.';
						ignore_onend = true;
						break;
					case 'service-not-allowed':
						error = 'Sem permissão do serviço de fala solicitado na web.';
						ignore_onend = true;
						break;
					case 'bad-grammar':
						error = 'Erro na gramática de reconhecimento de fala.';
						ignore_onend = true;
						break;
					case 'language-not-supported':
						error = 'Idioma não suportado.';
						ignore_onend = true;
						break;
					default:
						break;
			  }
	  
			  voice.stop();
			}
	  
		  } else {
			$('#form_busca > img').hide();
		  }
	});
});
