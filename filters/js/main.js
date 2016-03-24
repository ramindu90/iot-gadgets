/*
 * Copyright (c)  2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var callbackmethod;
var spec;

function drawChart() {
    spec = {
        width: $(window).width() * 0.95,
        height: $(window).width() * 0.65 > $(window).height() ? $(window).height() : $(window).width() * 0.65,
        "padding": {"top": 10, "left": 30, "bottom": 70, "right": 10},
        "data": [
            {
                "name": "table",
                "values": [
                    {"x": "platform", "y": 28, "c": "iOS"}, {"x": "platform", "y": 72, "c": "Android"},
                    {"x": "group", "y": 43, "c": "COPE"}, {"x": "group", "y": 57, "c": "BYOD"},
                    {"x": "user", "y": 61, "c": "Sales"}, {"x": "user", "y": 19, "c": "Marketing"}, {
                        "x": "user",
                        "y": 20,
                        "c": "Engineering"
                    }
                ]
            },
            {
                "name": "stats",
                "source": "table",
                "transform": [
                    {
                        "type": "aggregate",
                        "groupby": ["x"],
                        "summarize": [{"field": "y", "ops": ["sum"]}]
                    }
                ]
            },
            {
                "name": "selectedPoints",
                "modify": [
                    {"type": "clear", "test": "!multi"},
                    {"type": "toggle", "signal": "clickedPoint", "field": "id"}
                ]
            }
        ],
        "scales": [
            {
                "name": "x",
                "type": "ordinal",
                "range": "width",
                "domain": {"data": "table", "field": "x"}
            },
            {
                "name": "y",
                "type": "linear",
                "range": "height",
                "nice": true,
                "domain": {"data": "stats", "field": "sum_y"}
            },
            {
                "name": "color",
                "type": "ordinal",
                "range": "category20c",
                "domain": {"data": "table", "field": "c"}
            }
        ],
        "axes": [
            {"type": "x", "scale": "x"}
        ],

        "signals": [
            {
                "name": "clickedPoint",
                "init": 0,
                "verbose": true,
                "streams": [{"type": "click", "expr": "datum._id"}]
            },
            {
                "name": "multi",
                "init": false,
                "verbose": true,
                "streams": [{"type": "click", "expr": "datum._id"}]
            }
        ],
        "marks": [
            {
                "type": "text",
                "from": {
                    "data": "table",
                    "transform": [
                        {"type": "stack", "groupby": ["x"], "sortby": ["c"], "field": "y"}
                    ]
                },
                "properties": {
                    "enter": {
                        "x": {"scale": "x", "field": "x", "offset": 10},
                        "y": {"scale": "y", "field": "layout_start", "offset": -10},
                        "baseline": {"value": "middle"},
                        "fill": {"value": "#000"},
                        "text": {"field": "c"},
                        "font": {"value": "Helvetica Neue"},
                        "fontSize": {"value": 13}
                    }
                }
            },
            {
                "type": "rect",
                "from": {
                    "data": "table",
                    "transform": [
                        {"type": "stack", "groupby": ["x"], "sortby": ["c"], "field": "y"}
                    ]
                },
                "properties": {
                    "enter": {
                        "x": {"scale": "x", "field": "x"},
                        "width": {"scale": "x", "band": true, "offset": -5},
                        "y": {"scale": "y", "field": "layout_start"},
                        "y2": {"scale": "y", "field": "layout_end"},
                        "fill": {"scale": "color", "field": "c"},
                        "fillOpacity": {"value": 0.5}
                    },
                    "update": {
                        "fill": [
                            {
                                "test": "indata('selectedPoints', datum._id, 'id')",
                                "value": "grey"
                            }, {"scale": "color", "field": "c"}
                        ]
                    }
                }
            }
        ]
    };

    callbackmethod = function (event, item) {
        var div = document.getElementById("details");
        if (item != null) {

            div.innerHTML += item.datum.c + "</br>";
        } else {
            div.innerHTML = "";
        }
    };

    vg.parse.spec(spec, function (error, chart) {
        var view = chart({el: "#dChart"}).update();
        view.on("click", callbackmethod);
    });

}


drawChart();