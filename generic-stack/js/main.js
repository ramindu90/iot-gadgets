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
var sc = sc || {};
sc.chart = null;
sc.polling_task = null;
sc.async_tasks = 0;
sc.sum = 0;
sc.data = [];
sc.filters = {};
sc.force_fetch = false;
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
    sc.chart.draw("#chart", [
        {
            type: "click",
            callback: sc.onclick
        }
    ]);
    sc.startPolling();
};

sc.startPolling = function () {
    sc.update();
    this.polling_task = setInterval(function () {
        sc.update();
    }, gadgetConfig.polling_interval);
};

sc.update = function (force) {
    sc.force_fetch = !sc.force_fetch ? force || false : true;
    sc.fetch(function (data) {
        sc.chart.insert(data);
    });
};

sc.fetch = function (cb) {
    if (sc.async_tasks === 0) {
        sc.async_tasks = gadgetConfig.columns.length;
        sc.data.length = 0;
        sc.sum = 0;
        sc.force_fetch = false;
        for (var i in gadgetConfig.columns) {
            if (gadgetConfig.columns.hasOwnProperty(i)) {
                $.ajax({
                    url: gadgetConfig.columns[i]["source"],
                    method: "get",
                    data: sc.filters,
                    key: gadgetConfig.columns[i]["name"],
                    success: function (data) {
                        data = JSON.parse(data);
                        if (data.status === 200) {
                            sc.sum += data.data;
                            sc.data.push([gadgetConfig.title, this.key, data.data]);
                            if (sc.data.length === gadgetConfig.columns.length) {
                                if (sc.force_fetch) {
                                    sc.update();
                                } else {
                                    for (var j = 0; j < sc.data.length; j++) {
                                        sc.data[j][2] = (sc.data[j][2] / sc.sum) * 100;
                                    }
                                    cb(sc.data);
                                }
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

sc.subscribe = function (callback) {
    gadgets.HubSettings.onConnect = function() {
        gadgets.Hub.subscribe("subscriber", function (topic, data, subscriber) {
            callback(topic, data)
        });
    };
};

sc.publish = function (data) {
    gadgets.Hub.publish("publisher", data);
};

sc.onclick = function (event, item) {
    if (item != null) {
        console.log(JSON.stringify(item.datum.type));
        sc.publish(
            {
                "filter": gadgetConfig.id,
                "selected": item.datum[sc.config.x]
            }
        );
    }
};

sc.subscribe(function (topic, data) {
    var updated = false;
    console.log("data :: " + JSON.stringify(data));
    if (typeof data != "undefined" && data != null) {
        if (typeof data.selected === "undefined" || data.selected == null) {
            if (sc.filters.hasOwnProperty(data.filter)) {
                delete sc.filters[data.filter];
                updated = true;
            }
        } else {
            if (typeof data.filter != "undefined"
                && data.filter != null
                && typeof data.selected != "undefined"
                && data.selected != null) {
                sc.filters[data.filter] = data.selected;
                updated = true;
            }
        }
    }
    if (updated) sc.update(true);
});

$(document).ready(function () {
    sc.initialize();
});