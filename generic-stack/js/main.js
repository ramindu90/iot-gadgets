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
var sc = sc || {};
sc.chart = null;
sc.polling_task = null;
sc.async_tasks = 0;
sc.sum = 0;
sc.data = [];
sc.div = "#chart";
sc.meta = {
    "names": ["title", "type", "count"],
    "types": ["ordinal", "ordinal", "linear"]
};
sc.config = {
    type: "bar",
    x: "title",
    charts: [
        {
            type: "bar",
            y: "count",
            color: "type",
            mode: "stack",
            xTitle: "",
            tooltip: {
                "enabled":true,
                "color":"#e5f2ff",
                "type":"symbol",
                "content":["type","count"],
                "label":true
            }
        }
    ],
    width: 500,
    height: 250
};

$(document).ready(function () {
    sc.initialize();
});

sc.initialize = function () {
    sc.chart = new vizg(
        [
            {
                "metadata": this.meta,
                "data": sc.data
            }
        ],
        sc.config
    );
    sc.chart.draw("#chart");
    sc.startPolling();
};

sc.startPolling = function () {
    this.polling_task = setInterval(function () {
        sc.update();
    }, gadgetConfig.polling_interval);
};

sc.update = function () {
    sc.fetch(function (data) {
        sc.chart.insert(data);
    });
};

sc.fetch = function (cb) {
    if (sc.async_tasks === 0) {
        sc.async_tasks = gadgetConfig.columns.length;
        sc.data.length = 0;
        sc.sum = 0;
        for (var i in gadgetConfig.columns) {
            if (gadgetConfig.columns.hasOwnProperty(i)) {
                $.ajax({
                    url: gadgetConfig.columns[i]["source"],
                    method: "get",
                    data: {},
                    key: gadgetConfig.columns[i]["name"],
                    success: function (data) {
                        data = JSON.parse(data);
                        if (data.status === 200) {
                            sc.sum += data.data;
                            sc.data.push([gadgetConfig.title, this.key, data.data]);
                            if (sc.data.length === gadgetConfig.columns.length) {
                                for (var j = 0; j < sc.data.length; j++) {
                                    sc.data[j][2] = (sc.data[j][2] / sc.sum) * 100;
                                }
                                cb(sc.data);
                            }
                        }
                    },
                    complete: function (jqXHR, status) {
                        if (status !== 'success') console.warn("Error accessing source for : " + this.key);
                        sc.async_tasks--;
                    }
                });
            }
        }
    }
};


/*
 var iterations = 0;
 (function insertLoop(i, n) {
 setTimeout(function () {
 var d = [
 ["non-compliant", i],
 ["unmonitored", i],
 ["no-passcode", i],
 ["no-encryption", i]
 ];
 console.log(JSON.stringify(d));

 barChartGroup.insert(data);
 if (n === "+") {
 i++;
 if (i < 10) insertLoop(i, "+");
 else insertLoop(i, "-");
 } else {
 i--;
 if (i > 0) insertLoop(i, "-");
 }
 }, 1000)
 })(iterations, "+");
 */


/*
 var iterations = 1000;
 (function insertLoop(i) {
 setTimeout(function () {
 console.log("drawing");
 barChartGroup.insert([
 ["non-compliant", Number((Math.random() * 100).toFixed(0)) % 15],
 ["unmonitored", Number((Math.random() * 100).toFixed(0)) % 15],
 ["no-passcode", Number((Math.random() * 100).toFixed(0)) % 15],
 ["no-encryption", Number((Math.random() * 100).toFixed(0)) % 15]
 ]);
 if (--i) insertLoop(i);
 }, 1000)
 })(iterations);
 */