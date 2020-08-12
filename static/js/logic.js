// Initialize an object containing icons for each layer group
const icons = { 
  NORMAL: L.ExtraMarkers.icon({
    icon: "ion-minus-circled",
    iconColor: "white",
    markerColor: "black",
    shape: "star",
    svg: true
  })
};

// grey tones
//const colors = ["#CFD8DC","#B0BEC5","#90A4AE","#78909C","#607D8B","#455A64"];
// color tones
const colors = ["slategrey","#FFC300","#FF5733","#C70039","#900C3F","#581845"];
const MajorEarthquakeLimit = 4.6;
const lineGroup = [];

function createMap(quakes, markers, lines) {

  // Create the tile layer that will be the background of our map
  var satelliteMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    minZoom: 2,
    id: "satellite-v9",
    accessToken: API_KEY
  });
  var darkMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    minZoom: 2,
    id: "dark-v10",
    accessToken: API_KEY
  });
  var lightMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    minZoom: 2,
    id: "light-v10",
    accessToken: API_KEY
  });
  var outdoorMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    minZoom: 2,
    id: "outdoors-v11",
    accessToken: API_KEY
  });

  // Create a baseMaps object to hold the lightmap layer
  var baseMaps = {
    "Dark Map": darkMap,
    "Light Map": lightMap,
    "Outdoor Map": outdoorMap,
    "Satellite Map": satelliteMap
  };

  // Create an overlayMaps object to hold the quakes layer
  var overlayMaps = {
    "Earthquakes": quakes,
    "Major Earthquakes": markers,
    "Fault Lines": lines
  };

  // Create the map object with options
  var map = L.map("map-id", {
    center: [36.7783, -119.4179],
    zoom: 6,
    layers: [darkMap, quakes, markers, lines]
  });

  // Create a layer control, pass in the baseMaps and overlayMaps. Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: true
  }).addTo(map);

  // Set up the legend
  var legend = L.control({ position: "bottomright" });
  legend.onAdd = function() {
    var div = L.DomUtil.create("div", "info legend");
    var limits = ["0~1","1~2","2~3","3~4","4~5","5+"];
    var labels = [];
    var legendInfo = "<h3>Earthquake Magnitude</h3>";
    div.innerHTML = legendInfo;
    limits.forEach(function(limit, index) {
      labels.push("<li style=\"background-color: " + colors[index] + "\">" + limit + "</li>");
    });

    div.innerHTML += "<ul>" + labels.join("") + "</ul>";
    return div;
  };

  // Adding legend to the map
  legend.addTo(map);
}

function createLayers(response) {
  
  // Pull the quakes features off of response.features geojson
  var incidents = response.features;

  // Initialize an array to hold circle incident object
  var circleGroup = [];
  var markerGroup = [];
  //var lineGroup = [];
  var dateObject = new Date();

  // Loop through the incidents array
  for (var index = 0; index < incidents.length; index++) {
    var incident = incidents[index];
    dateObject = new Date(incident.properties.time);
    
    var marker = L.marker([incident.geometry.coordinates[1], incident.geometry.coordinates[0]], { icon: icons["NORMAL"]});
    // For each quake, create a circle and bind a popup with the quake's location, magnitude and datetime 
    var circle = L.circle([incident.geometry.coordinates[1], incident.geometry.coordinates[0]], {
      color: colors[Math.floor(incident.properties.mag)],
      fillColor: colors[Math.floor(incident.properties.mag)],
      //(mag)^2 to scale up/down disparity between the circles and (*1000) scale the circle group as a whole
      radius: (incident.properties.mag * incident.properties.mag ) * 2000,
      fillOpacity: 0.6,
      stroke: false  
    });
    circle.bindPopup("<h3>Location: &nbsp; " + incident.properties.place + "</h3><h3>Magnitude: &nbsp; " + incident.properties.mag + 
                     " @ (" + incident.geometry.coordinates[1] + ", " + incident.geometry.coordinates[0] + ")</h3>" + 
                     "<h3>Date,Time: &nbsp; " + dateObject.toLocaleString() + "</h3>");

    // Add the marker to the circleGroup array
    circleGroup.push(circle);
    if ( incident.properties.mag >= MajorEarthquakeLimit ) {
      markerGroup.push(marker.bindPopup("<h3>Location: &nbsp; " + incident.properties.place + "</h3><h3>Magnitude: &nbsp; " + incident.properties.mag + 
      " @ (" + incident.geometry.coordinates[1] + ", " + incident.geometry.coordinates[0] + ")</h3>" + 
      "<h3>Date,Time: &nbsp; " + dateObject.toLocaleString() + "</h3>"));
    }
  } // end for()

  // Create a layer group made from the quake circles array, pass it into the createMap function
  createMap(L.layerGroup(circleGroup), L.layerGroup(markerGroup), L.layerGroup(lineGroup));
}

d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json", function(faultLineJson) {
    var faultLines = faultLineJson.features;

    faultLines.forEach( (line, index) => {
      var coordinates = [];
      coordinates = line.geometry.coordinates;
      // create a red polyline from an array of coordinates points
      //var latlngs = [ [ -0.437900, -54.851800 ], [ -0.038826, -54.677200 ], [ 0.443182, -54.451200 ], [ 0.964534, -54.832200 ], [ 1.694810, -54.399000 ], [ 2.359750, -54.037400 ], [ 3.025420, -53.650700 ], [ 3.368940, -53.834100 ], [ 3.956380, -54.126700 ], [ 4.414580, -54.430300 ], [ 4.826610, -54.161600 ], [ 5.083720, -54.309300 ], [ 5.494690, -54.542900 ], [ 6.183730, -54.114500 ], [ 6.625400, -53.814200 ], [ 7.237290, -54.101200 ], [ 7.772350, -54.396000 ] ];
      var polyline = L.polyline(coordinates, {color: 'red'});
      //var polyline = L.geoJson(coordinates, { color : "orange"});
      lineGroup.push(polyline);
    });

  });

// Perform an API call to the USGS API to get live earth quake info. Call createLayers when complete
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson", createLayers);
