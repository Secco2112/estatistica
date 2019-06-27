class Statistic {

	constructor(options) {
		this.rawdata = {}
		this.type = null;
		this.parsedData = null;
		this.parsedRawData = null;
		this.frequencyTable = null;
		this.tableAmplitude = null;
		this.tableClassesNumber = null;
		this.tableClassesInterval = null;
		this.totalData = null;

		this.decimalPlaces = 1;

		for(var option in options) {
			if(this.hasOwnProperty(option)) {
				this[option] = options[option];
			}
		}
	}

	setRawData(rawdata) {
		this.rawdata = rawdata;
		return this;
	}

	getRawData() {
		return this.rawdata;
	}

	setType(type) {
		this.type = type;
		return this;
	}

	getType() {
		return this.type;
	}

	setParsedData(parsedData) {
		this.parsedData = parsedData;
		return this;
	}

	getParsedData() {
		return this.parsedData;
	}

	getValueFrequency(value, group) {
		var fqc = 0;
		$.each(group, function(i, el) {
			if(value == el) fqc++;
		});
		return fqc;
	}

	sortData() {
		var data = this.getParsedData();
		data.sort(function(a, b) {
			if(a.value > b.value) return 1;
			else if(a.value < b.value) return -1;
			return 0;
		});
		return this.setParsedData(data);
	}

	parseData() {
		var parsedData = [],
			closed = [],
			object = this,
			parsedRawData = [];

		if(this.getType() == "all") {
			var data = this.getRawData(),
				formattedData = data.trim().split(",").map(function(str, i) {
					return str.trim();
				});
			
			$.each(formattedData, function(i, el) {
				if($.inArray(el, closed) === -1) {
					parsedData.push({
						"value": parseInt(el),
						"frequency": parseInt(object.getValueFrequency(el, formattedData))
					});

					closed.push(el);
				}

				parsedRawData.push(el);
			});

			closed = [];

			this.setParsedData(parsedData);
		} else if(this.getType() == "qty") {
			var data = this.getRawData();

			$.each(data, function(i, el) {
				if($.inArray(el.value, closed) === -1) {
					parsedData.push({
						"value": parseInt(el.value),
						"frequency": parseInt(el.qty)
					});

					closed.push(el.value);

					for(var i=0; i<el.qty; i++) { parsedRawData.push(el.value); }
				} else {
					var indexToIncrement;
					for(var j=0; j<parsedData.length; j++) {
						if(parsedData[j].value == el.value) { 
							indexToIncrement = j;
							break;
						}
					}

					parsedData[indexToIncrement].frequency += el.qty;

					for(var i=0; i<el.qty; i++) { parsedRawData.push(el.value); }
				}
			});

			closed = [];

			this.setParsedData(parsedData);
		}

		this.parsedRawData = parsedRawData;

		// Get total of inputed items
		var total = 0;
		$.each(this.getParsedData(), function(i, el) {
			total += el.frequency;
		});
		this.totalData = total;

		return this;
	}

	minimum() {
		return this.getParsedData().reduce((min, p) => p.value < min ? p.value : min, this.getParsedData()[0].value);
	}

	maximum() {
		return this.getParsedData().reduce((max, p) => p.value > max ? p.value : max, this.getParsedData()[0].value);
	}

	setImportantValues() {
		var data = this.getParsedData(),
			amplitude = null;

		// Calculate amplitude
		var max_value = this.maximum();
		var min_value = this.minimum();
		amplitude = max_value - min_value;
		this.tableAmplitude = amplitude;

		// Calculate number of classes
		var classes_number = 1 + 3.22 * (Math.log(this.totalData) / Math.LN10);
		classes_number = Math.round(classes_number);
		this.tableClassesNumber = classes_number;

		// Calculate classes interval
		var classes_interval = this.tableAmplitude / this.tableClassesNumber;
		classes_interval = parseInt(classes_interval) + 1;
		this.tableClassesInterval = classes_interval;

		return this;
	}

	mountTable() {
		var it = 0,
			min = this.minimum(),
			max = this.maximum(),
			current_freq = min,
			parsedData = this.getParsedData(),
			frequenciesTable = [],
			fac = 0,
			fac_percent = 0;

		while(current_freq <= max) {
			frequenciesTable[it] = {};
			frequenciesTable[it].min = current_freq;
			frequenciesTable[it].max = current_freq + this.tableClassesInterval;
			current_freq += this.tableClassesInterval;

			var counter_for_interval = 0;
			for(var i=0; i<parsedData.length; i++) {
				if(parsedData[i].value >= frequenciesTable[it].min && parsedData[i].value < frequenciesTable[it].max) {
					counter_for_interval += parsedData[i].frequency;
				}
			}
			frequenciesTable[it].fi = counter_for_interval;

			var xi = (frequenciesTable[it].min + frequenciesTable[it].max) / 2.0;
			frequenciesTable[it].xi = xi;

			fac += counter_for_interval;
			frequenciesTable[it].fac = fac;

			var fi_percent = (counter_for_interval * 100.0) / this.totalData;
			frequenciesTable[it].fi_percent = fi_percent;

			fac_percent += fi_percent;
			frequenciesTable[it].fac_percent = fac_percent;

			it++;
		}

		this.frequencyTable = frequenciesTable;

		return frequenciesTable;
	}

	format(number, dp) {
		return !isNaN(+number)? ((+number).toFixed(dp || this.decimalPlaces) * 1).toString(): number;
	}

	simpleArithmeticalAverage() {
		var parsedRawData = this.parsedRawData,
			sum = 0;

		$.each(parsedRawData, function(i, el) {
			sum += parseInt(el);
		});

		return sum / parsedRawData.length;
	}

	weightedArithmeticalAverage() {
		var table = this.frequencyTable,
			sum_xifi = 0;

		$.each(table, function(i, el) {
			sum_xifi += (el.xi * el.fi);
		});

		return sum_xifi / this.totalData;
	}

	geometricAverage() {
		var table = this.frequencyTable,
			mult_xi = 1;

		$.each(table, function(i, el) {
			mult_xi *= parseInt(el.xi);
		});

		return Math.pow(mult_xi, 1 / this.tableClassesNumber);
	}

	moda() {
		var data = this.getParsedData().sort(function(a, b) {
			if(a.frequency > b.frequency) return 1;
			else if(a.frequency < b.frequency) return -1;
			return 0;
		}),
			amodal = false,
			moda = [];

		var first = data[0], check = 1;
		for(var i=1; i<data.length; i++) {
			if(first.frequency == data[i].frequency) check++;
		}
		if(check == data.length) amodal = true;


		if(amodal) {
			return ["Amodal"];
		} else {
			var i = data.length - 1, first = data[data.length - 1];

			while(data[i].frequency == first.frequency) {
				moda.push(data[i].value);
				i--;
			}

			return moda.sort();
		}
	}

	median() {
		var rawdata = this.getParsedData().sort(function(a, b) {
			if(a.value > b.value) return 1;
			else if(a.value < b.value) return -1;
			return 0;
		}), data = [];

		for(var i=0; i<rawdata.length; i++) {
			for(var j=0; j<rawdata[i].frequency; j++) {
				data.push(rawdata[i].value);
			}
		}

		var half = parseInt(data.length) / 2 - 1;
		if(data.length % 2 == 0) {
			var middle1 = data[half],
				middle2  = data[half + 1];

			return (middle1 + middle2) / 2;
		} else {
			return data[parseInt(data.length / 2)];
		}
	}

	sumd2() {
		var raw_data = this.parsedRawData,
			media = this.simpleArithmeticalAverage(),
			sum_values = 0;
		
		for(var i=0; i<raw_data.length; i++) {
			sum_values += Math.pow(Math.abs(raw_data[i] - media), 2);
		}

		return sum_values;
	}

	sampleVariance() {
		var sumd2 = this.sumd2();
		return sumd2 / this.totalData;
	}

	standardDeviation() {
		return Math.sqrt(this.sampleVariance());
	}

	populationStandardDeviation() {
		var sumd2 = this.sumd2();
		return sumd2 / (this.totalData - 1);
	}

	populationVariance() {
		return Math.sqrt(this.populationStandardDeviation());
	}

	sampleVarianceCoefficient() {
		return (100 * this.populationVariance()) / this.simpleArithmeticalAverage();
	}

}