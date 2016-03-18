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
bc.filters = {};
bc.selected_filters = [];
bc.force_fetch = false;
bc.div = "#chart";
bc.meta = {
    "names": ["id", "name", "count"],
    "types": ["ordinal", "ordinal", "linear"]
};
bc.config = {
    type: "bar",
    x: "id",
    charts: [
        {
            type: "bar",
            y: "count",
            color: "name",
            xTitle: "",
            yTitle: "",
            mode: "group"
        }
    ],
    width: 500,
    height: 250
};

bc.initialize = function () {
    bc.chart = new vizg(
        [
            {
                "metadata": bc.meta,
                "data": bc.data
            }
        ],
        bc.config
    );
    bc.chart.draw("#chart", [
        {
            type: "click",
            callback: bc.onclick
        }
    ]);
    bc.startPolling();
};

bc.startPolling = function () {
    setTimeout(function () {bc.update();}, 500);
    this.polling_task = setInterval(function () {
        bc.update();
    }, gadgetConfig.polling_interval);
};

bc.update = function (force) {
    bc.force_fetch = !bc.force_fetch ? force || false : true;
    bc.fetch(function (data) {
        bc.chart.insert(data);
    });
};

bc.fetch = function (cb) {
    bc.data.length = 0;
    bc.force_fetch = false;
    $.ajax({
        url: gadgetConfig.source,
        method: "get",
        data: bc.filters,
        success: function (response) {
            if (response.status === "success") {
                var data = response.data[gadgetConfig.data_property];
                if (data && data.length > 0) {
                    for (var i = 0; i < data.length; i++) {
                        bc.data.push(
                            [data[i]["id"], data[i]["name"], data[i]["count"]]
                        );
                    }
                    if (bc.force_fetch) {
                        bc.update();
                    } else {
                        cb(bc.data);
                    }
                }
            }
        },
        complete: function (jqXHR, status) {
            if (status !== "success") console.warn("Error accessing source for : " + gadgetConfig.id);
        }
    });
};

bc.updateURL = function () {
    updateURLParam(gadgetConfig.id, bc.selected_filters);
};

bc.subscribe = function (callback) {
    gadgets.HubSettings.onConnect = function () {
        gadgets.Hub.subscribe("subscriber", function (topic, data, subscriber) {
            callback(topic, data)
        });
    };
};

bc.publish = function (data) {
    gadgets.Hub.publish("publisher", data);
};

bc.onclick = function (event, item) {
    if (item != null) {
        var filter = item.datum[bc.config.x];
        var index = bc.selected_filters.indexOf(filter);
        if (index !== -1) {
            bc.selected_filters.splice(index, 1);
        } else {
            bc.selected_filters.push(filter);
        }
        console.log(JSON.stringify(bc.selected_filters));
        bc.publish(
            {
                "filter": gadgetConfig.id,
                "selected": bc.selected_filters
            }
        );
        bc.updateURL();
    }
};

bc.subscribe(function (topic, data) {
    var updated = false;
    console.log("data :: " + JSON.stringify(data));
    if (typeof data != "undefined" && data != null) {
        if (typeof data.selected === "undefined"
            || data.selected == null
            || Object.prototype.toString.call( data.selected ) !== '[object Array]') {
            if (bc.filters.hasOwnProperty(data.filter)) {
                delete bc.filters[data.filter];
                updated = true;
            }
        } else {
            if (typeof data.filter != "undefined"
                && data.filter != null
                && typeof data.selected != "undefined"
                && data.selected != null
                && Object.prototype.toString.call(data.selected) === '[object Array]') {
                bc.filters[data.filter] = data.selected;
                updated = true;
            }
        }
    }
    if (updated) bc.update(true);
});

$(document).ready(function () {
    bc.initialize();
});