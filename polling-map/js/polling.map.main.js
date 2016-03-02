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
var pm = pm || {};
pm.util = pm.util || {};
pm.layers = pm.layers || {};
pm.cluster_groups = pm.cluster_groups || {};
pm.markers = pm.markers || {};
pm.map = null;
pm.polling_task = null;
pm.selected_marker = null;
pm.freeze = false;

pm.initialize = function () {
    this.initLayers();
    this.initMap();
    this.startPolling();
};

pm.initLayers = function () {
    // Add default layer.
    pm.layers["default"] = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: config.map.maxZoom,
        attribution: '© <a href="http://www.openstreetmap.org/copyright" target="_blank">' +
        'OpenStreetMap</a>'
    });

    if (config.single_marker_mode) {
        pm.layers["marker_layer"] = L.tileLayer("", {
            maxZoom: config.map.maxZoom
        });
    } else {
        // Add other layers from config.
        for (var i = 0; i < config.sources.length; i++) {
            var source = config.sources[i];
            pm.cluster_groups[source.id] = new L.MarkerClusterGroup(config.markercluster);

            pm.cluster_groups[source.id].on('clustermouseover', function (a) {
                pm.freeze = true;
            });

            pm.cluster_groups[source.id].on('clustermouseout', function (a) {
                pm.freeze = false;
            });
        }
    }
};

pm.initMap = function () {
    if (pm.map != null && typeof(pm.map) !== 'undefined') {
        pm.map.remove();
    }
    pm.map = L.map("map", {
        zoom: config.map.zoom,
        center: config.map.center,
        layers: this.getLayers(),
        zoomControl: false,
        attributionControl: config.map.attributionControl,
        maxZoom: config.map.maxZoom,
        maxNativeZoom: config.map.maxNativeZoom
    });
    new L.Control.Zoom({position: 'bottomright'}).addTo(pm.map);    // Add zoom controller
    if (!config.single_marker_mode) {
        L.control.layers(null, pm.cluster_groups).addTo(pm.map);    // Add layer controller
        for (var i in this.cluster_groups) {                        // Add sub marker groups
            if (this.cluster_groups.hasOwnProperty(i)) {
                this.cluster_groups[i].addTo(this.map);
            }
        }

        // Zoom callbacks.
        pm.map.on('zoomend', function () {
            if (pm.map.getZoom() < config.markercluster.disableClusteringAtZoom) {
                if (pm.selected_marker) {
                    pm.clearFocus();
                }
            }
        });

        // Marker popup open callback.
        pm.map.on('popupopen', function (e) {
            if (pm.selected_marker) {
                pm.clearFocus();
            }
            pm.selected_marker = e.popup._source.feature.id;
        });
    }

    // Map click callbacks.
    pm.map.on('click', function (e) {
        if (pm.selected_marker) {
            pm.clearFocus();
        }
    });
};

pm.getLayers = function () {
    var layers = [];
    for (var i in this.layers) {
        if (this.layers.hasOwnProperty(i)) {
            layers.push(this.layers[i]);
        }
    }
    return layers;
};

// TODO : Uncomment
pm.startPolling = function () {
    //this.polling_task = setInterval(function () {
    //    if (config.single_marker_mode) {
    //        pm.poll(config.sources[0]);
    //    } else {
    //        if (!pm.freeze) {
    //            for (var i = 0; i < config.sources.length; i++) {
    //                pm.poll(config.sources[i]);
    //            }
    //        }
    //    }
    //}, config.constants.POLLING_INTERVAL);
    pm.poll();
};

// TODO : Uncomment
//pm.poll = function (source) {
//    $.getJSON(source.url, function (data) {
//        $.each(data, function (key, val) {
//            pm.processPointMessage({
//                "id": val.ID,
//                "sourceId": source.id,
//                "type": "Feature",
//                "properties": {
//                    "name": val.NAME,
//                    "state": "",
//                    "information": "",
//                    "speed": 0.0,
//                    "heading": 0.0
//                },
//                "geometry": {
//                    "type": "Point",
//                    "coordinates": [val.LONGITUDE, val.LATITUDE]
//                }
//            });
//        });
//    });
//};

function StubMarker(seed) {
    this.ids = ["Device_01", "Device_02", "Device_03", "Device_04", "Device_05", "Device_06", "Device_07", "Device_08", "Device_09"];
    this.layers = ["Category 1", "Category 2"];
    this.source = this.layers[seed % 2];
    this.move = seed % 2 == 0;
    this.lng = -0.09029;
    this.lat = 51.51318;
    this.id = this.ids[seed % 9];
    return this;
}
StubMarker.prototype.update = function () {
    if (this.move) {
        var rand = Math.floor(Math.random() * (4 - 1 + 1)) + 1;
        switch (rand) {
            case 1:
                this.lng += 0.00003 * rand;
                this.lat += 0.00003 * rand;
                break;
            case 2:
                this.lng -= 0.00002 * rand;
                this.lat -= 0.00002 * rand;
                break;
            case 3:
                this.lng += 0.00001 * rand;
                this.lat -= 0.00001 * rand;
                break;
            case 4:
                this.lng -= 0.00004 * rand;
                this.lat += 0.00004 * rand;
                break;
        }
    }
    return {
        "id": this.id,
        "sourceId": this.source,
        "type": "Feature",
        "properties": {
            "name": this.id,
            "state": "",
            "information": "Device Information",
            "speed": 0.0,
            "heading": 0.0
        },
        "geometry": {
            "type": "Point",
            "coordinates": [this.lng, this.lat]
        }
    };
};


// TODO : Replace this stub with real data.
pm.markers = [
    new StubMarker(8),
    new StubMarker(1),
    new StubMarker(2),
    new StubMarker(3),
    new StubMarker(4),
    new StubMarker(5),
    new StubMarker(6),
    new StubMarker(7),
    new StubMarker(9)
];
pm.poll = function () {
    setInterval(function () {
        if (config.single_marker_mode) {
            pm.processPointMessage(pm.markers[0].update());
        } else {
            for (var i = 0; i < pm.markers.length; i++) {
                if (!pm.freeze) {
                    pm.processPointMessage(pm.markers[i].update());
                }
            }
        }
    }, 500);
};

pm.processPointMessage = function (geoJson) {
    if (geoJson.id in pm.markers) {
        var existingObject = pm.markers[geoJson.id];
        existingObject.update(geoJson);
    } else {
        var receivedObject = (config.single_marker_mode) ?
            new GeoMarker(geoJson, pm.map) :
            new GeoMarker(geoJson, pm.cluster_groups[geoJson.sourceId]);
        receivedObject.update(geoJson);
        pm.markers[geoJson.id] = receivedObject;
        pm.markers[geoJson.id].addToLayer();
    }
    if (config.single_marker_mode) {
        pm.selected_marker = geoJson.id;
    }
};

pm.focusOnMarker = function () {
    var spatialObject = pm.markers[pm.selected_marker];
    if (!spatialObject) {
        console.log("marker with id : " + pm.selected_marker + " not in map");
        return false;
    }
    pm.clearFocus();
    pm.map.setView(spatialObject.marker.getLatLng(), pm.map.getZoom(), {animate: true});
    spatialObject.marker.openPopup();
    spatialObject.drawPath();
};

pm.clearFocus = function () {
    if (this.selected_marker) {
        var spatialObject = pm.markers[pm.selected_marker];
        spatialObject.removeFromMap();
        if (!config.single_marker_mode) {
            this.selected_marker = null;
        }
    }
};

pm.util.getModuleBase = function () {
    if (window.__moduleBase) return window.__moduleBase;
    if (_args) {
        var moduleBase = _args()['url'];
        moduleBase = moduleBase.substring(0, moduleBase.lastIndexOf('/') + 1);
        window.__moduleBase = moduleBase;
        return window.__moduleBase;
    }
    console.error('Can not find module base. Gadget may not work properly.');
    return '';
};

pm.util.rebaseRelativeUrl = function (relativeUrl, cached) {
    var moduleBase = pm.util.getModuleBase();
    var absUrl = moduleBase + relativeUrl;
    if (cached && _IG_GetCachedUrl) {
        absUrl = _IG_GetCachedUrl(absUrl);
    }
    return absUrl;
};

$(document).ready(function () {
    pm.initialize();
});

$(window).on('beforeunload', function () {
    if (pm.polling_task != null) {
        clearInterval(pm.polling_task);
    }
});