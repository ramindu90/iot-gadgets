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
bc.table = null;
bc.polling_task = null;
bc.data = [];
bc.filter_key = null;
bc.filters_meta = {};
bc.filters = [];
bc.filter_prefix = "g_";
bc.selected_filters = [];
bc.force_fetch = false;
bc.freeze = false;
bc.div = "#table";
bc.meta = {
    "names": ["deviceID", "deviceName", "status", "platform", "model", "actions"],
    "types": ["ordinal", "ordinal", "ordinal", "ordinal", "ordinal", "ordinal"]
};
bc.config = {
    key: "deviceID",
    title:"deviceTable",
    charts: [{
        type: "table",
        columns: ["deviceID", "deviceName", "status", "platform", "model", "actions"],
        columnTitles: ["Id", "Device", "Status", "Platform", "Model", "Actions"]
    }],
    width: 400,
    height: 300
};

bc.initialize = function () {
    bc.table = new vizg(
        [
            {
                "metadata": bc.meta,
                "data": bc.data
            }
        ],
        bc.config
    );
    bc.table.draw(bc.div);
    setTimeout(function () {
        $("#deviceTable").DataTable();
    }, 1000);
    bc.loadFiltersFromURL();
    bc.startPolling();
};

bc.loadFiltersFromURL = function () {
    var params = getURLParams();
    for (var filter in params) {
        if (params.hasOwnProperty(filter)
            && filter.lastIndexOf(bc.filter_prefix, 0) === 0) {
            var filter_key = filter.substring(bc.filter_prefix.length);
            bc.updateFilters({
                filter: filter_key,
                selections: params[filter]
            });
        }
    }
};

bc.startPolling = function () {
    setTimeout(function () {
        bc.update();
    }, 500);
    this.polling_task = setInterval(function () {
        bc.update();
    }, gadgetConfig.polling_interval);
};

bc.update = function (force) {
    bc.force_fetch = !bc.force_fetch ? force || false : true;
    if (!bc.freeze) {
        bc.fetch(function (data) {
            bc.table.insert(data);
        });
    }
};

bc.fetch = function (cb) {
    bc.data.length = 0;
    bc.force_fetch = false;
    console.log("fetch");
    $.ajax({
        url: gadgetConfig.source,
        method: "POST",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(bc.filters),
        success: function (response) {
            bc.filter_key = response["filteredBy"];
            var data = response["data"];
            if (data && data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    bc.data.push(
                        [data[i]["id"], data[i]["label"], data[i]["status"], data[i]["platform"], data[i]["model"], data[i]["actions"]]
                    );
                }
                if (bc.force_fetch) {
                    bc.update();
                } else {
                    cb(bc.data);
                }
            }
        },
        complete: function (jqXHR, status) {
            if (status !== "success") console.warn("Error accessing source for : " + gadgetConfig.id);
        }
    });
};

bc.subscribe = function (callback) {
    gadgets.HubSettings.onConnect = function () {
        gadgets.Hub.subscribe("subscriber", function (topic, data, subscriber) {
            callback(topic, data)
        });
    };
};

bc.onclick = function (event, item) {
    // TODO
    alert("onclick");
};

bc.updateFilters = function (data) {
    var updated = false;
    if (typeof data != "undefined" && data != null) {
        if (typeof data.selections === "undefined"
            || data.selections === null
            || Object.prototype.toString.call(data.selections) !== '[object Array]'
            || data.selections.length === 0) {
            if (bc.filters_meta.hasOwnProperty(data.filter)) {
                delete bc.filters_meta[data.filter];
                updated = true;
            }
        } else {
            if (typeof data.filter != "undefined"
                && data.filter != null
                && typeof data.selections != "undefined"
                && data.selections != null
                && Object.prototype.toString.call(data.selections) === '[object Array]'
                && data.selections.length > 0) {
                bc.filters_meta[data.filter] = data;
                updated = true;
            }
        }
    }
    if (updated) {
        bc.filters.length = 0;
        for (var i in bc.filters_meta) {
            if (bc.filters_meta.hasOwnProperty(i)) {
                bc.filters.push(bc.filters_meta[i]);
            }
        }
        bc.update(true);
    }
};

bc.subscribe(function (topic, data) {
    bc.updateFilters(data);
});

$(document).ready(function () {
    bc.initialize();
});