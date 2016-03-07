/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
var bc = bc || {};
bc.chart = null;
bc.polling_task = null;
bc.data = [];
bc.div = "#chart";
bc.meta = {
    "names": ["type", "count"],
    "types": ["ordinal", "linear"]
};
bc.config = {
    type: "bar",
    x: "type",
    charts: [{type: "bar", y: "count", color: "type", mode: "group"}],
    width: 500,
    height: 250
};

bc.initialize = function () {
    bc.fetch();
    bc.chart = new vizg({
        "metadata": this.meta,
        "data": bc.data
    }, bc.config);
    barChartGroup.draw("#chart");
};

pm.startPolling = function () {
    this.polling_task = setInterval(function () {
        // TODO : Here goes the polling task
    }, gadgetConfig.polling_interval);
};

bc.update = function() {
    bc.fetch();
    barChartGroup.insert(bc.data);
};

bc.fetch = function(cb) {
    bc.data.length = 0;
    for (var i in gadgetConfig.columns) {
        if (gadgetConfig.columns.hasOwnProperty(i)) {
            $.get(gadgetConfig.columns[i]["source"], function (data) {
                data = JSON.parse(data);
                if (data.status == 200) {
                    bc.data.push([gadgetConfig.columns[i]["name"], data.data]); // TODO : This / That Issue
                }
            });
        }
    }
};

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


/*var iterations = 1000;
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
})(iterations);*/