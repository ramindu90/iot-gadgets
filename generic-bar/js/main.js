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
var bc = bc || {};
bc.chart = null;
bc.polling_task = null;
bc.async_tasks = 0;
bc.data = [];
bc.div = "#chart";
bc.meta = {
    "names": ["type", "count"],
    "types": ["ordinal", "linear"]
};
bc.config = {
    type: "bar",
    x: "type",
    charts: [
        {
            type: "bar",
            y: "count",
            color: "type",
            mode: "group"
        }
    ],
    width: 500,
    height: 250
};

$(document).ready(function () {
    bc.initialize();
});

bc.initialize = function () {
    bc.chart = new vizg(
        [
            {
                "metadata": this.meta,
                "data": bc.data
            }
        ],
        bc.config
    );
    bc.chart.draw("#chart");
    bc.startPolling();
};

bc.startPolling = function () {
    this.polling_task = setInterval(function () {
        bc.update();
    }, gadgetConfig.polling_interval);
};

bc.update = function () {
    bc.fetch(function (data) {
        bc.chart.insert(data);
    });
};

bc.fetch = function (cb) {
    if (bc.async_tasks === 0) {
        bc.async_tasks = gadgetConfig.columns.length;
        bc.data.length = 0;
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
                            bc.data.push([this.key, data.data]);
                            if (bc.data.length === gadgetConfig.columns.length) cb(bc.data);
                        }
                    },
                    complete: function (jqXHR, status) {
                        if (status !== 'success') console.warn("Error accessing source for : " + this.key);
                        bc.async_tasks--;
                    }
                });
            }
        }
    }
};