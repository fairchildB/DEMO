// Initialize the map
var map1 = L.map('map1').setView([43.5, -120], 5.5);


map1.addControl(new L.Control.Fullscreen({
    title: {
        'false': 'View Fullscreen',
        'true': 'Exit Fullscreen'
    }
}));


var base = L.tileLayer('https://api.mapbox.com/styles/breezy69/clp98r5qx000q01pxf9z10qvj/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYnJlZXp5NjkiLCJhIjoiY2xvaXlwMWxpMHB2cjJxcHFyeTMwNzk0NCJ9.R18DLRCA9p_SNX-6dtZZZg', {
    maxZoom: 20,
}).addTo(map1);

L.control.attribution({
    prefix: '<a href="https://www.mapbox.com/feedback/" target="_blank">Mapbox</a>'
}).addTo(map1);


var bridgeLayer;
fetch('https://cdn.glitch.global/7c0d7a60-99e5-4c3b-a24b-420023a6b8ba/bridges.geojson?v=1701144696721')
    .then(function (response) {
        return response.json();
    })
    .then(function (bridgeData) {

        bridgeLayer = L.geoJSON(bridgeData);
    });


var pavementLayer;
fetch('https://cdn.glitch.global/7c0d7a60-99e5-4c3b-a24b-420023a6b8ba/pavement.geojson?v=1701144700237')
    .then(function (response) {
        return response.json();
    })
    .then(function (pavementData) {
        pavementLayer = L.geoJSON(pavementData);
    });

// ... (previous code)

var countyLayer;
fetch('https://cdn.glitch.global/c4a30576-34c3-46b2-9d07-3d88e9b08d51/CNP.geojson?v=1701227835086')
    .then(function (response) {
        return response.json();
    })
    .then(function (countyData) {
        countyLayer = L.geoJSON(countyData, {
            style: style,
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map1);
    });

function style(feature) {
    var tapesons = feature.properties.TAPERSONS;

    return {
        fillColor: getColor(tapesons),
        weight: 2,
        opacity: 1,
        color: 'black',

        fillOpacity: 0.7
    };
}

function getColor(value) {
    // You can customize the color scale based on your preference
    return value > 100000 ? '#800026' :
           value > 50000 ? '#BD0026' :
           value > 20000 ? '#E31A1C' :
           value > 10000 ? '#FC4E2A' :
           value > 5000 ? '#FD8D3C' :
                        '#FEB24C';
}

// ... (rest of the code)

    

function isPointInPolygon(point, polygon) {
    return pointInPolygon(point, polygon);
}

function isAnyPointInPolygon(points, polygon) {
    for (var i = 0; i < points.length; i++) {
        if (pointInPolygon(points[i], polygon)) {
            return true;
        }
    }
    return false;
}

function pointInPolygon(point, polygon) {
    var x = point.lng,
        y = point.lat;

    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0],
            yi = polygon[i][1];
        var xj = polygon[j][0],
            yj = polygon[j][1];

        var intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div1', 'info');
    this._div.style.color = 'black';
    this.update();
    return this._div;
};

info.update = function (props, bridgesWithinCounty, totalPavementLength) {
    this._div.innerHTML = '<h4>County:</h4>' +
        '<b>' + (props ? props.NAME : 'Hover over a county') + '</b><br />' +
        (props ? 'Population: ' + props.TAPERSONS + '<br />' +
            'Bridges Within County: ' + bridgesWithinCounty : 'No data available');

    if (totalPavementLength > 0) {
        this._div.innerHTML += "<br>Total Pavement Length: " + totalPavementLength + " miles";
    }
};

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#FFFFFF',
        dashArray: '',
        fillOpacity: 0.7
    });

    layer.bringToFront();
    info.update(layer.feature.properties, calculateBridgesWithinCounty(layer), calculateTotalPavementLength(layer));
}

function resetHighlight(e) {
    countyLayer.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map1.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

function calculateBridgesWithinCounty(feature) {
    var bridgesWithinCounty = 0;

    bridgeLayer.eachLayer(function (bridgeLayer) {
        var bridgeLatLng = bridgeLayer.getLatLng();
        if (isPointInPolygon(bridgeLatLng, feature.feature.geometry.coordinates[0])) {
            bridgesWithinCounty += 1;
        }
    });

    return bridgesWithinCounty;
}

function calculateTotalPavementLength(layer) {
    var totalPavementLength = 0;

    pavementLayer.eachLayer(function (pavementLayer) {
        var pavementLatLngs = pavementLayer.getLatLngs();

        if (isAnyPointInPolygon(pavementLatLngs, layer.feature.geometry.coordinates[0])) {
            totalPavementLength += Math.round(pavementLayer.feature.properties.ENDMP - pavementLayer.feature.properties.BEGMP);
        }
    });

    return totalPavementLength;
}


info.addTo(map1);

var legend = L.control({ position: 'bottomleft' });

legend.onAdd = function (map) {
    var div2 = L.DomUtil.create('div', 'info legend'),
        grades = [0, 5000, 10000, 20000, 50000, 100000],
        labels = [0, 5000, 10000, 20000, 50000, 100000];

    for (var i = 0; i < grades.length; i++) {
        div2.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            (i === grades.length - 1 ? labels[i] + '+' : labels[i]) + '<br>';
    }

    return div2;
};

legend.addTo(map1);
