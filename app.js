var artLocations = [
  {
    author: "DEAMS, Melbourne",
    artworkLocation: "61 Parry Street, Newcastle West",
    coordinates: {"lat": -32.927980, "lng": 151.759358}
  },{
    author: "WBYK, Sydney",
    artworkLocation: "81 Parry Street, Newcastle West",
    coordinates: {"lat": -32.927392, "lng": 151.758489}
  },{
    author: "Alex Lehours, Sydney",
    artworkLocation: "590 Hunter Street, Newcastle West",
    coordinates: {"lat": -32.926667, "lng": 151.766173}
  },{
    author: "TWOONE, Melbourne",
    artworkLocation: "426 King Street, Newcastle West",
    coordinates: {"lat": -32.927487, "lng": 151.765223}
  },{
    author: "Numskull & Adnate",
    artworkLocation: "291 King St, Newcastle",
    coordinates: {"lat": -32.928587, "lng": 151.768000}
  },{
    author: "Thomas Jackson, Sydney",
    artworkLocation: "44 Laman street, Cooks Hill",
    coordinates: {"lat": -32.929034, "lng": 151.769969}
  },{
    author: "Dan Prestage",
    artworkLocation: "500 Hunter street, Newcastle",
    coordinates: {"lat": -32.926760, "lng": 151.769852}
  },{
    author: "BMD, NZ",
    artworkLocation: "24 Dawson street, Cooks Hill",
    coordinates: {"lat": -32.930269, "lng": 151.770939}
  },{
    author: "Shannon Crees, Sydney",
    artworkLocation: "85 Darby Street, Cooks Hill",
    coordinates: {"lat": -32.930275, "lng": 151.772649}
  },{
    author: "Nico, Sydney",
    artworkLocation: "70 Darby Street, Cooks Hill",
    coordinates: {"lat": -32.929708, "lng": 151.772818}
  },{
    author: "Tristan Eaton, USA",
    artworkLocation: "113-125 Darby Street, Cooks Hill",
    coordinates: {"lat": -32.931212, "lng": 151.772216}
  },{
    author: "Jumbo & Bafcat",
    artworkLocation: "Thorn Street, Newcastle",
    coordinates: {"lat": -32.927170, "lng": 151.780403}
  },{
    author: "Jumbo, Sydney",
    artworkLocation: "223 King Street, Newcastle",
    coordinates: {"lat": -32.927992, "lng": 151.770814}
  },{
    author: "Askew, Auckland",
    artworkLocation: "Crowne Plaza, Honeysuckle",
    coordinates: {"lat": -32.925622, "lng": 151.773055}
  },{
    author: "Adnate, Melbourne",
    artworkLocation: "2 Bishopsgate Street, Wickham",
    coordinates: {"lat": -32.922804, "lng": 151.760176}
  },{
    author: "Tyrsa, France",
    artworkLocation: "707 Hunter Street, Newcastle",
    coordinates: {"lat": -32.926248, "lng": 151.761640}
  },{
    author: "Slicer & Lucy Lucy & Deams",
    artworkLocation: "286 Maitland Rd, Mayfield",
    coordinates: {"lat": -32.896806, "lng": 151.735608}
  },{
    author: "Chehehe, Melbourne",
    artworkLocation: "180 Maitland Road, Mayfield",
    coordinates: {"lat": -32.900497, "lng": 151.740542}
  },{
    author: "Ox King & SMC3",
    artworkLocation: "156 Maitland Rd, Mayfield",
    coordinates: {"lat": -32.901225, "lng": 151.741271}
  },{
    author: "Grizzle & Skulk",
    artworkLocation: "9 Albert Street, Wickham",
    coordinates: {"lat": -32.918106, "lng": 151.758055}
  },{
    author: "Adnate, Melbourne",
    artworkLocation: "Bolton street, Newcastle",
    coordinates: {"lat": -32.929286, "lng": 151.782625}
  }
];

  var newcastle,
      map;
  var markers = [];


  // Create a map and set the centre to Newcastle
  function initializeMap() {
    newcastle = new google.maps.LatLng(-32.929927, 151.773169);
    map = new google.maps.Map(document.getElementById('map'), {
        center: newcastle,
        zoom: 15,
        mapTypeControl: false
    });

  // Create infowindow object for a marker to display information, pics etc.
  var largeInfowindow = new google.maps.InfoWindow();
  var bounds = new google.maps.LatLngBounds();

  // Style the markers
  var defaultIconColor = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
  var highlightedIconColor = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';


  // Populate markers and infowindows on click of a marker
    for (var i = 0; i < artLocations.length; i++) {
      var position = artLocations[i].coordinates;
      var title = artLocations[i].author;
      var marker = new google.maps.Marker({
        map: map,
        position: position,
        title: title,
        icon: defaultIconColor,
        animation: google.maps.Animation.DROP,
        id: i
      });
      markers.push(marker);
      marker.addListener('click', function() {
        populateInfoWindow(this, largeInfowindow);
      });
      marker.addListener('mouseover', function() {
        this.setIcon(highlightedIconColor);
      });
      marker.addListener('mouseout', function() {
        this.setIcon(defaultIconColor);
      });

      bounds.extend(markers[i].position);
  }
  // Extend the boundaries of the map for each marker
  map.fitBounds(bounds);
}

  // Flickr call
  var url = 'https://api.flickr.com/services/rest/?method=flickr.people.getPhotos&api_key=d66ea8106f3d02452b74363e4900bcd1&user_id=144843076%40N03&format=json&nojsoncallback=1';



  // Display infowindow and street view object
  function populateInfoWindow(marker, infowindow) {
  if (infowindow.marker != marker) {
    infowindow.setContent('');
    infowindow.marker = marker;
    infowindow.addListener('closeclick', function() {
      infowindow.marker =null;
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 100;
    function getStreetView(data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);
          infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
          var panoramaOptions = {
            position: nearStreetViewLocation,
            pov: {
              heading: heading,
              pitch: 15
            }
          };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), panoramaOptions);
      } else {
        infowindow.setContent('<div>' + marker.title + '</div>' +
          '<div>No Street View Found</div>');
      }
    }
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    infowindow.open(map, marker);
  }
}
