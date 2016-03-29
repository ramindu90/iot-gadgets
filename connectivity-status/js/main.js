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
bc.data = [];
bc.filter_context = null;
bc.filters_meta = {};
bc.filters = [];
bc.filter_prefix = "g_";
bc.selected_filter_groups = [];
bc.force_fetch = false;
bc.freeze = false;
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
            mode: "group",
            colorScale: ["#2ecc71", "#e74c3c", "#f39c12"],
            colorDomain: ["Active", "Blocked", "Inactive"]
        }
    ],
    width: $(window).width() * 0.95,
    height: $(window).width() * 0.65 > $(window).height() ? $(window).height() : $(window).width() * 0.65,
    padding: {"top": 18, "left": 30, "bottom": 22, "right": 70}
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
    bc.loadFiltersFromURL();
    bc.startPolling();
};

bc.loadFiltersFromURL = function () {
    bc.filter_context = $.ajax({
        url: gadgetConfig.source,
        method: "POST",
        data: JSON.stringify({}),
        async: false
    }).responseJSON[0].context;
    var params = getURLParams();
    for (var filter in params) {
        if (params.hasOwnProperty(filter)
            && filter.lastIndexOf(bc.filter_prefix, 0) === 0) {
            var filter_context = filter.substring(bc.filter_prefix.length);
            if (bc.filter_context === filter_context) {
                bc.selected_filter_groups = params[filter];
            } else {
                bc.updateFilters({
                    filteringContext: filter_context,
                    filteringGroups: params[filter]
                });
            }
        }
    }
    // TODO : update selected bars (UI)
};

bc.startPolling = function () {
    setTimeout(function () {
        bc.update();
        bc.freeze = bc.selected_filter_groups.length > 0;
    }, 500);
    this.polling_task = setInterval(function () {
        bc.update();
    }, gadgetConfig.polling_interval);
};

bc.update = function (force) {
    bc.force_fetch = !bc.force_fetch ? force || false : true;
    if (!bc.freeze) {
        bc.fetch(function (data) {
            bc.chart.insert(data);
        });
    }
};

bc.fetch = function (cb) {
    bc.data.length = 0;
    bc.force_fetch = false;
    $.ajax({
        url: gadgetConfig.source,
        method: "POST",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(bc.filters),
        success: function (response) {
            if (Object.prototype.toString.call(response) === '[object Array]' && response.length === 1) {
                bc.filter_context = response[0]["context"];
                var data = response[0]["data"];
                if (data && data.length > 0) {
                    for (var i = 0; i < data.length; i++) {
                        bc.data.push(
                            [data[i]["group"], data[i]["label"], data[i]["count"]]
                        );
                    }
                    if (bc.force_fetch) {
                        bc.update();
                    } else {
                        cb(bc.data);
                    }
                }
            } else {
                console.error("Invalid response structure found: " + JSON.stringify(response));
            }
        },
        complete: function (jqXHR, status) {
            if (status !== "success") console.warn("Error accessing source for : " + gadgetConfig.id);
        }
    });
};

bc.updateURL = function () {
    updateURLParam(bc.filter_prefix + bc.filter_context, bc.selected_filter_groups);
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
        var filteringGroup = item.datum[bc.config.x];
        var index = bc.selected_filter_groups.indexOf(filteringGroup);
        if (index !== -1) {
            bc.selected_filter_groups.splice(index, 1);
        } else {
            bc.selected_filter_groups.push(filteringGroup);
        }
        bc.publish({
            "filteringContext": bc.filter_context,
            "filteringGroups": bc.selected_filter_groups
        });
        bc.freeze = bc.selected_filter_groups.length > 0;
        bc.updateURL();
        bc.update(true);
    }
};

bc.updateFilters = function (data) {
    var reload = false;
    var update = false;
    if (data) {
        if (data.filteringContext
            && data.filteringGroups
            && Object.prototype.toString.call(data.filteringGroups) === '[object Array]'
            && data.filteringContext === bc.filter_context) {
            bc.selected_filter_groups = data.filteringGroups.slice();
            bc.freeze = bc.selected_filter_groups.length > 0;
            // TODO : update selected bars (UI)
            reload = true;
        } else if (!data.filteringGroups
            || Object.prototype.toString.call(data.filteringGroups) !== '[object Array]'
            || data.filteringGroups.length === 0) {
            if (bc.filters_meta.hasOwnProperty(data.filteringContext)) {
                delete bc.filters_meta[data.filteringContext];
                reload = true;
                update = true;
            }
        } else if (data.filteringContext
            && data.filteringGroups
            && Object.prototype.toString.call(data.filteringGroups) === '[object Array]'
            && data.filteringGroups.length > 0) {
            bc.filters_meta[data.filteringContext] = data;
            reload = true;
            update = true;
        }
    }
    if (update) {
        bc.filters.length = 0;
        for (var i in bc.filters_meta) {
            if (bc.filters_meta.hasOwnProperty(i)) {
                bc.filters.push(bc.filters_meta[i]);
            }
        }
    }
    if (reload) bc.update(true);
};

bc.subscribe(function (topic, data) {
    bc.updateFilters(data);
});

$(document).ready(function () {
    bc.initialize();
});