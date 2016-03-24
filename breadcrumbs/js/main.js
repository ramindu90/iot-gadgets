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
bc.polling_task = null;
bc.filter_prefix = "g_";
bc.filters_meta = {};
bc.filters = [];
bc.breadcrumbs = {};
bc.force_fetch = false;
bc.data = {
    'filteredCount': 0,
    'totalCount': 0
};
bc.devices_template = '' +
    '<span class="deviceCount">{{filteredCount}}</span>' +
    '<br />' +
    'out of <span class="totalDevices">{{totalCount}}</span>';
bc.breadcrumb_template = '' +
    '<span id="{{id}}" class="breadcrumb label label-primary">' +
    '<span>{{label}}</span>' +
    '<a><i class="remove fw fw-uncheck fw-white"></i></a>' +
    '</span>';

bc.initialize = function () {
    $("div#breadcrumbs").on('click', 'i.remove', function () {
        var filter = $(this).closest('.breadcrumb').attr('id').split('_');
        if (filter.length === 2) {
            bc.removeBreadcrumb(filter[0], filter[1]);
        }
    });
    bc.loadFiltersFromURL();
    bc.startPolling();
};

bc.loadFiltersFromURL = function () {
    var params = getURLParams();
    for (var filter in params) {
        if (params.hasOwnProperty(filter)
            && filter.lastIndexOf(bc.filter_prefix, 0) === 0) {
            var filter_key = filter.substring(bc.filter_prefix.length);
            bc.updateBreadcrumbs({
                filter: filter_key,
                selections: params[filter]
            });
        }
    }
};

bc.startPolling = function () {
    bc.updateDeviceCount();
    this.polling_task = setInterval(function () {
        bc.updateDeviceCount();
    }, gadgetConfig.polling_interval);
};

bc.updateDeviceCount = function (force) {
    bc.force_fetch = !bc.force_fetch ? force || false : true;
    bc.fetch(function (data) {
        var html = Mustache.to_html(bc.devices_template, data);
        $('#devices').html(html);
    });
};

bc.fetch = function (cb) {
    bc.force_fetch = false;
    $.ajax({
        url: gadgetConfig.source,
        method: "POST",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(bc.filters),
        success: function (response) {
            var data = response["data"];
            if (data) {
                bc.data.filteredCount = data["filteredCount"] ? data["filteredCount"] : bc.data.filteredCount;
                bc.data.totalCount = data["totalCount"] ? data["totalCount"] : bc.data.totalCount;
                if (bc.force_fetch) {
                    bc.updateDeviceCount();
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

bc.updateURL = function (filterKey, selectedFilters) {
    updateURLParam(bc.filter_prefix + filterKey, selectedFilters);
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

bc.addBreadcrumb = function (filterKey, selectedFilters) {
    for (var i = 0; i < selectedFilters.length; i++) {
        var breadcrumbKey = filterKey + '_' + selectedFilters[i];
        var breadcrumbLable = filterKey.split(/(?=[A-Z])/).join(' ') + ':' + selectedFilters[i].split(/(?=[A-Z])/).join(' ');
        breadcrumbLable = breadcrumbLable.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
        if (Object.prototype.toString.call(bc.breadcrumbs[filterKey]) !== '[object Array]') bc.breadcrumbs[filterKey] = [];
        var index = bc.breadcrumbs[filterKey].indexOf(selectedFilters[i]);
        if (index === -1) {
            bc.breadcrumbs[filterKey].push(selectedFilters[i]);
            var html = Mustache.to_html(bc.breadcrumb_template, {'id': breadcrumbKey, 'label': breadcrumbLable});
            $('#breadcrumbs').append(html);
        }
    }
};

bc.removeBreadcrumb = function (filterKey, filterSelection) {
    console.log("ff");
    var breadcrumbId = filterKey + '_' + filterSelection;
    var currentFilters = bc.filters_meta[filterKey]['selections'];
    if (currentFilters) {
        var fIndex = currentFilters.indexOf(filterSelection);
        if (fIndex !== -1) {
            currentFilters.splice(fIndex, 1);
            if (Object.prototype.toString.call(bc.breadcrumbs[filterKey]) === '[object Array]') {
                var bIndex = bc.breadcrumbs[filterKey].indexOf(filterSelection);
                if (bIndex !== -1) {
                    bc.breadcrumbs[filterKey].splice(bIndex, 1);
                    bc.publish({
                        "filter": filterKey,
                        "selections": currentFilters
                    });
                    $("span#" + breadcrumbId).remove();
                    bc.updateURL(filterKey, currentFilters);
                    bc.updateBreadcrumbs(null, true);
                }
            }
        }
    }
};

bc.updateBreadcrumbs = function (data, force_update) {
    var updated = false;
    if (data) {
        if (!data.selections
            || Object.prototype.toString.call(data.selections) !== '[object Array]'
            || data.selections.length === 0) {
            if (bc.filters_meta.hasOwnProperty(data.filter)) {
                var cs = bc.filters_meta[data.filter]['selections'];
                for (var i = 0; i < cs.length; i++) {
                    bc.removeBreadcrumb(data.filter, cs[i]);
                }
                delete bc.filters_meta[data.filter];
                updated = true;
            }
        } else if (data.filter
            && data.selections
            && Object.prototype.toString.call(data.selections) === '[object Array]'
            && data.selections.length > 0) {
            if (!bc.filters_meta[data.filter] ||
                bc.filters_meta[data.filter]['selections'].length < data['selections'].length) {
                bc.filters_meta[data.filter] = data;
                bc.addBreadcrumb(data.filter, data.selections);
            }
            if (Object.prototype.toString.call(bc.breadcrumbs[data.filter]) === '[object Array]') {
                for (var j = 0; j < bc.breadcrumbs[data.filter].length; j++) {
                    var index = data.selections.indexOf(bc.breadcrumbs[data.filter][j]);
                    if (index === -1) {
                        bc.removeBreadcrumb(data.filter, bc.breadcrumbs[data.filter][j]);
                    }
                }
            }
            updated = true;
        }
    }
    if (updated || force_update) {
        bc.filters.length = 0;
        for (var k in bc.filters_meta) {
            if (bc.filters_meta.hasOwnProperty(k)) {
                bc.filters.push(bc.filters_meta[k]);
            }
        }
        bc.updateDeviceCount(true);
    }
};

bc.subscribe(function (topic, data) {
    bc.updateBreadcrumbs({
        filter: data.filter,
        selections: data.selections.slice()
    });
});

$(document).ready(function () {
    bc.initialize();
});