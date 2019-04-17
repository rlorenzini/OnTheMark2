let storedCoordinates = [] //holds coordinate data
let overlayMaps = {};
//mymap = the actual map; initializing the map

//=========== TESTING HARDCODED MULTI LAYER / MARKERS =============
var pothole = L.marker([29.8895, -95.4792]).bindPopup('This is a pothole.'),
    signal = L.marker([29.8442,-95.2429]).bindPopup('This is a signal.');
// console.log(pothole)
// console.log("DO I EVEN EXIST?!")
// var complaints = L.layerGroup([pothole,signal]);
//
// var overlayMaps = {
//   "Complaints":complaints
// }

var mymap = L.map('mapid').on('load', function(){
  fetch('https://agile-mesa-12521.herokuapp.com/api')
    .then(function(response) {
      return response.json();
    }).then(function(complaintJson){
      let lMarkerArray = complaintJson.map((complaint) => {
        return L.marker([complaint.lat, complaint.long])
      })
      let overlayMaps = { "Complaints": L.layerGroup(lMarkerArray)}
      let streetView = {"Street View": L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
          attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          minZoom: 10,
          id: 'mapbox.streets',
          accessToken: 'pk.eyJ1IjoicmxvcmVuemluaSIsImEiOiJjanR5Z3R2bjQxNjlxM3lvNTV4ZnMxOXAyIn0.xxNzHRkLduHYsYIMoCvGCA'
      }).addTo(mymap)}
      L.control.layers(streetView, overlayMaps).addTo(mymap)
    })
})
// var mymap = L.map('mapid',{layers:onloadmap,baseLayers,overlays}).on('load',postData)
//set max map boundaries
mymap.fitBounds([
    [30.16412, -95.81726],
    [29.42524, -94.95758]
]);
mymap.setMaxBounds([
    [30.16412, -95.81726],
    [29.42524, -94.95758]
]);
//end of max
function onMapClick(e){
  document.getElementById('latInput').value = e.latlng.lat
  document.getElementById('longInput').value = e.latlng.lng
}
mymap.on('click',onMapClick)

// only one marker at a time; doesn't remove GPS marker
var theMarker = {};

mymap.on('click',function(e){
    lat = e.latlng.lat;
    lng = e.latlng.lng;
    // console.log("You clicked the map at LAT: "+ lat+" and LONG: "+lng );
        //Clear existing marker,
        if (theMarker != undefined) {
              mymap.removeLayer(theMarker);
        };
    //Add a marker to show where you clicked.
     theMarker = L.marker([lat,lng]).addTo(mymap);
});
//end of marker removal

//GPS
L.control.locate().addTo(mymap);
function onLocationFound(e) {
  lat = e.latlng.lat;
  lng = e.latlng.lng;
  if (theMarker != undefined) {
        mymap.removeLayer(theMarker);
  };
theMarker = L.marker([lat,lng]).addTo(mymap);
    // var radius = e.accuracy / 2;
    // L.marker(e.latlng).addTo(mymap)
        // .bindPopup("You are here").openPopup();
    // L.circle(e.latlng, radius).addTo(mymap);
    storedCoordinates.splice(0)
    storedCoordinates.push(e)
    pullAndSaveCoordinates()
    document.getElementById('latInput').value = e.latlng.lat
    document.getElementById('longInput').value = e.latlng.lng
}
function onLocationError(e) { //error message
    alert(e.message);
}
mymap.on('locationerror', onLocationError); //runs errors
mymap.on('locationfound', onLocationFound); //runs GPS
//end

//EXPLANATION:
//the on('click') define the marker for a single click
//if theMarker exists, remove it
//if theMarker does not esist, create it
// L = layer, which is a display on top of the map; you are adding and removing a layer from the map
//GPS currently removes the marker but not the location bubble
//also, keeps checking for GPS location on a loop





//set map conditions
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    minZoom: 10,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoicmxvcmVuemluaSIsImEiOiJjanR5Z3R2bjQxNjlxM3lvNTV4ZnMxOXAyIn0.xxNzHRkLduHYsYIMoCvGCA'
}).addTo(mymap);
//end

//start of mouse click coordinates
//can this be inside a ./model?
// "use strict";

/**
 * author Michal Zimmermann <zimmicz@gmail.com>
 * Displays coordinates of mouseclick.
 * @param object options:
 *        position: bottomleft, bottomright etc. (just as you are used to it with Leaflet)
 *        latitudeText: description of latitude value (defaults to lat.)
 *        longitudeText: description of latitude value (defaults to lon.)
 *        promptText: text displayed when user clicks the control
 *        precision: number of decimals to be displayed
 */
L.Control.Coordinates = L.Control.extend({
	options: {
		position: 'bottomleft',
		latitudeText: 'lat.',
		longitudeText: 'lon.',
		promptText: 'Press Ctrl+C to copy coordinates',
		precision: 4
	},

	initialize: function(options)
	{
		L.Control.prototype.initialize.call(this, options);
	},

	onAdd: function(map)
	{
		var className = 'leaflet-control-coordinates',
			that = this,
			container = this._container = L.DomUtil.create('div', className);
		this.visible = false;

			L.DomUtil.addClass(container, 'hidden');


		L.DomEvent.disableClickPropagation(container);

		this._addText(container, map);

		L.DomEvent.addListener(container, 'click', function() {
			var lat = L.DomUtil.get(that._lat),
				lng = L.DomUtil.get(that._lng),
				latTextLen = this.options.latitudeText.length + 1,
				lngTextLen = this.options.longitudeText.length + 1,
				latTextIndex = lat.textContent.indexOf(this.options.latitudeText) + latTextLen,
				lngTextIndex = lng.textContent.indexOf(this.options.longitudeText) + lngTextLen,
				latCoordinate = lat.textContent.substr(latTextIndex),
				lngCoordinate = lng.textContent.substr(lngTextIndex);

			window.prompt(this.options.promptText, latCoordinate + ' ' + lngCoordinate);
    	}, this);

		return container;
	},

	_addText: function(container, context)
	{
		this._lat = L.DomUtil.create('span', 'leaflet-control-coordinates-lat' , container),
		this._lng = L.DomUtil.create('span', 'leaflet-control-coordinates-lng' , container);

		return container;
	},

	/**
	 * This method should be called when user clicks the map.
	 * @param event object
	 */
	setCoordinates: function(obj)
	{
		if (!this.visible) {
			L.DomUtil.removeClass(this._container, 'hidden');
		}

		if (obj.latlng) {
			L.DomUtil.get(this._lat).innerHTML = '<strong>' + this.options.latitudeText + ':</strong> ' + obj.latlng.lat.toFixed(this.options.precision).toString();
			L.DomUtil.get(this._lng).innerHTML = '<strong>' + this.options.longitudeText + ':</strong> ' + obj.latlng.lng.toFixed(this.options.precision).toString();
		}
	}
});
//end of mouse click coordinates
//can this be inside a ./model?


//calling mouse click coordinates

var c = new L.Control.Coordinates(); // you can send options to the constructor if you want to, otherwise default values are used

c.addTo(mymap);


mymap.on('click', function(e) {
	c.setCoordinates(e);
  storedCoordinates.splice(0)
  storedCoordinates.push(e)
  pullAndSaveCoordinates()
});
//end of call


//saving mouse click coordinates
function pullAndSaveCoordinates(){
  for(var i in storedCoordinates){
    console.log(storedCoordinates[i.length-1].latlng) //storing all clicks. Need to only store LAST click.
    let latitude = storedCoordinates[i].latlng.lat
    let longitude = storedCoordinates[i].latlng.lng
    // document.getElementById("coordinatesDisplay").innerHTML = latitude + ', ' + longitude
    // console.log(storedCoordinates[i].latlng.lat)
    // console.log(storedCoordinates[i].latlng.lng)

}
} //end



// NOTES: Turn latlng into Class Coordinates?
