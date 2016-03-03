var gadgetConfig = {
	"id": "abc",
	"title": "abc",
	"datasource": "country:1.0.0",
	"type": "realtime",
	"columns": [{
		"name": "TIMESTAMP",
		"type": "time"
	}, {
		"name": "name",
		"type": "string"
	}, {
		"name": "gdp",
		"type": "int"
	}],
	"chartConfig": {
		"x": "gdp",
		"maxLength": "",
		"padding": {
			"top": 30,
			"left": 45,
			"bottom": 38,
			"right": 55
		},
		"charts": [{
			"type": "number",
			"title": "test number"
		}]
	},
	"domain": "carbon.super"
};
