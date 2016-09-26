// Array of art objects to list and show on the map
var artLocations = [{
    author: "Deams on Parry street",
    origin: "Melbourne",
    artworkLocation: "61 Parry Street, Newcastle West",
    coordinates: {
        "lat": -32.927980,
        "lng": 151.759358
    }
}, {
    author: "Beastman & Phibs",
    artworkLocation: "593 Hunter St, Newcastle",
    coordinates: {
        "lat": -32.927039,
        "lng": 151.765485
    },
    web: ["www.beastman.com.au", "http://phibs.com"]
}, {
    author: "Alex Lehours",
    origin: "Sydney",
    artworkLocation: "590 Hunter Street, Newcastle West",
    coordinates: {
        "lat": -32.926667,
        "lng": 151.766173
    },
    web: ["www.alexlehours.com"]
}, {
    author: "TWOONE",
    origin: "Melbourne",
    artworkLocation: "426 King Street, Newcastle West",
    coordinates: {
        "lat": -32.927487,
        "lng": 151.765223
    }
}, {
    author: "Numskull & Adnate",
    artworkLocation: "291 King St, Newcastle",
    coordinates: {
        "lat": -32.928587,
        "lng": 151.768000
    },
    web: ["www.funskull.com", "http://adnate.com.au"]
}, {
    author: "Thomas Jackson",
    origin: "Sydney",
    artworkLocation: "44 Laman street, Cooks Hill",
    coordinates: {
        "lat": -32.929034,
        "lng": 151.769969
    },
    web: ["www.thomasjackson.com.au"]
}, {
    author: "Dan Prestage",
    origin: "Newcastle",
    artworkLocation: "500 Hunter street, Newcastle",
    coordinates: {
        "lat": -32.926760,
        "lng": 151.769852
    }
}, {
    author: "BMD",
    origin: "NZ",
    artworkLocation: "24 Dawson street, Cooks Hill",
    coordinates: {
        "lat": -32.930269,
        "lng": 151.770939
    }
}, {
    author: "Shannon Crees",
    origin: "Sydney",
    artworkLocation: "85 Darby Street, Cooks Hill",
    coordinates: {
        "lat": -32.930275,
        "lng": 151.772649
    }
}, {
    author: "Nico",
    origin: "Sydney",
    artworkLocation: "70 Darby Street, Cooks Hill",
    coordinates: {
        "lat": -32.929708,
        "lng": 151.772818
    },
    web: ["www.artofnico.com"]
}, {
    author: "Tristan Eaton",
    origin: "USA",
    artworkLocation: "113-125 Darby Street, Cooks Hill",
    coordinates: {
        "lat": -32.931212,
        "lng": 151.772216
    },
    web: ["http://tristaneaton.com"]
}, {
    author: "Jumbo on Thorn Street",
    artworkLocation: "Thorn Street, Newcastle",
    coordinates: {
        "lat": -32.927170,
        "lng": 151.780403
    }
}, {
    author: "Bafcat & Jumbo",
    origin: "Sydney",
    artworkLocation: "223 King Street, Newcastle",
    coordinates: {
        "lat": -32.927992,
        "lng": 151.770814
    }
}, {
    author: "Askew",
    origin: "Auckland",
    artworkLocation: "Crowne Plaza, Honeysuckle",
    coordinates: {
        "lat": -32.925622,
        "lng": 151.773055
    },
    web: ["http://www.askew1.com/"]
}, {
    author: "Adnate in Wickham",
    origin: "Melbourne",
    artworkLocation: "2 Bishopsgate Street, Wickham",
    coordinates: {
        "lat": -32.922804,
        "lng": 151.760176
    }
}, {
    author: "Tyrsa",
    origin: "France",
    artworkLocation: "707 Hunter Street, Newcastle",
    coordinates: {
        "lat": -32.926248,
        "lng": 151.761640
    },
    web: ["www.tyrsa.fr"]
}, {
    author: "Slicer & LucyLucy & Deams",
    origin: "Melbourne",
    artworkLocation: "286 Maitland Rd, Mayfield",
    coordinates: {
        "lat": -32.896806,
        "lng": 151.735608
    },
    web: ["https://theworkofslicer.carbonmade.com", "https://lucylucy.carbonmade.com/"]
}, {
    author: "Chehehe",
    origin: "Melbourne",
    artworkLocation: "180 Maitland Road, Mayfield",
    coordinates: {
        "lat": -32.900497,
        "lng": 151.740542
    },
    web: ["www.stayingcreative.com.au"]
}, {
    author: "Ox King & SMC3",
    artworkLocation: "156 Maitland Rd, Mayfield",
    coordinates: {
        "lat": -32.901225,
        "lng": 151.741271
    },
    web: ["http://smc3.net/", ""]
}, {
    author: "Grizzle & Skulk",
    artworkLocation: "9 Albert Street, Wickham",
    coordinates: {
        "lat": -32.918106,
        "lng": 151.758055
    },
    web: ["www.iamskulk.com", ""]
}, {
    author: "Adnate on Bolton street",
    origin: "Melbourne",
    artworkLocation: "Bolton street, Newcastle",
    coordinates: {
        "lat": -32.929286,
        "lng": 151.782625
    }
}];

var map,
    newcastle;
var markers = [];


// Creates a map and set the centre to Newcastle
function initializeMap() {
    newcastle = new google.maps.LatLng(-32.929927, 151.773169);
    map = new google.maps.Map(document.getElementById('map'), {
        center: newcastle,
        zoom: 15,
        mapTypeControl: false,
        styles: [{
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{
                "color": "#e9e9e9"
            }, {
                "lightness": 17
            }]
        }, {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f5f5f5"
            }, {
                "lightness": 20
            }]
        }, {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 17
            }]
        }, {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 29
            }, {
                "weight": 0.2
            }]
        }, {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 18
            }]
        }, {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 16
            }]
        }, {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f5f5f5"
            }, {
                "lightness": 21
            }]
        }, {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{
                "color": "#dedede"
            }, {
                "lightness": 21
            }]
        }, {
            "elementType": "labels.text.stroke",
            "stylers": [{
                "visibility": "on"
            }, {
                "color": "#ffffff"
            }, {
                "lightness": 16
            }]
        }, {
            "elementType": "labels.text.fill",
            "stylers": [{
                "saturation": 36
            }, {
                "color": "#333333"
            }, {
                "lightness": 40
            }]
        }, {
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
            }]
        }, {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f2f2f2"
            }, {
                "lightness": 19
            }]
        }, {
            "featureType": "administrative",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#fefefe"
            }, {
                "lightness": 20
            }]
        }, {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#fefefe"
            }, {
                "lightness": 17
            }, {
                "weight": 1.2
            }]
        }]
    });
    ko.applyBindings(new ViewModel());
}

// My ViewModel
var ViewModel = function() {
    // Makes a reference of this in a new variable to avoid its tracking
    var self = this;

    self.searchQuery = ko.observable('');
    self.locations = ko.observableArray(artLocations);

    // Creates infowindow object for a marker to display information, pics etc.
    var largeInfoWindow = new google.maps.InfoWindow();

    // Limits the map to display all the locations on the screen
    var bounds = new google.maps.LatLngBounds();

    // Styles the markers
    var defaultIconColor = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    var highlightedIconColor = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

    // Handles the list of locations/chosen locations
    self.selectLocations = ko.computed(function() {
        var queryString = self.searchQuery().toLowerCase();
        //console.log(queryString);

        if (queryString === "") {
            //console.count();
            return self.locations();
        } else {
            return ko.utils.arrayFilter(self.locations(), function(location) {
                var author = location.author.toLowerCase();
                //console.log(author);
                return author.indexOf(queryString) !== -1;
            });
        }
    });

    // Handles the population of full map with markers or searched locations/authors only
    self.populateMap = ko.computed(function() {
        var queryString = self.searchQuery().toLowerCase();

        if (!queryString) {
            populateMap(queryString);
          } else {
            removeMarkers();
            populateMap(queryString);
        }
    });

    // Displays infowindow and flickr image
    function populateInfoWindow(marker, infowindow) {
        if (infowindow.marker != marker) {
            infowindow.setContent('');
            infowindow.marker = marker;
            // Flickr API call to get streetart image
            function getFlickrImage() {
                var base_url = 'https://api.flickr.com/services/rest/?';
                var API_KEY = 'dd45d7051de5b76009350707895811ae';
                var USER_ID = '144843076%40N03';
                var method = 'flickr.photos.search';
                var query =
                    marker.author.replace(/ on| in| &/, '');

                // Flickr API request url
                var url = base_url +
                    'method=' + method +
                    '&api_key=' + API_KEY +
                    '&user_id=' + USER_ID +
                    '&text=' + query +
                    '&format=json' +
                    '&nojsoncallback=1';

                $.getJSON(url, function(data) {
                    //console.log(data);
                    var detail = data.photos.photo[0];
                    if (detail) {
                        infowindow.setContent('<div><strong>' + marker.author + '</strong><br>' + marker.address + '</div><div id="flckr-img"><img class="infowndw-img" src="https://farm' + detail.farm + '.staticflickr.com/' + detail.server + '/' + detail.id + '_' + detail.secret + '_n.jpg"></div>');
                    } else {
                        infowindow.setContent('<div> Nothing Found </div>');
                    }
                    // Fallback for failed request to get an image
                }).fail(function() {
                    infowindow.setContent('<div>No Flickr Image Found for ' + marker.author + '</div>');
                });
            }
            // Invokes function declaration
            getFlickrImage();
            infowindow.open(map, marker);


            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
                marker.setIcon(defaultIconColor);
            });
        }
    }

    // Opens the marker when listed location is clicked
    self.listLocationSelected = function(data) {
        //console.log(data.marker);
        populateInfoWindow(data.marker, largeInfoWindow);
        data.marker.setIcon(highlightedIconColor);
    };

    // Filters the map to searched results only and place its markers
    function populateMap(queryString) {
        for (var i = 0, len = self.locations().length; i < len; i++) {
            var position = self.locations()[i].coordinates;
            var author = self.locations()[i].author;
            var address = self.locations()[i].artworkLocation;
            var origin = self.locations()[i].origin;
            var searchArtistName = self.locations()[i].author.toLowerCase();
            var searchSuburbName = self.locations()[i].artworkLocation.toLowerCase();

            if (queryString === "") {
              var marker = new google.maps.Marker({
                  map: map,
                  position: position,
                  author: author,
                  origin: origin,
                  address: address,
                  icon: defaultIconColor,
                  animation: google.maps.Animation.DROP,
                  id: i
              });
              // Adds created location marker to marker array
                      markers.push(marker);

              //         // Makes infowindow pop up on click of a marker
                      marker.addListener('click', function() {
                           populateInfoWindow(this, largeInfoWindow);
                           this.setIcon(highlightedIconColor);
                       });

                       self.locations()[i].marker = marker;
                       //console.log(marker);

                       // Adjust the boundaries of the map to fit the markers
                       bounds.extend(markers[i].position);

            } else {
              if ((searchArtistName.indexOf(queryString) !== -1) || (searchSuburbName.indexOf(queryString) !== -1)) {
                var marker = new google.maps.Marker({
                    map: map,
                    position: position,
                    author: author,
                    origin: origin,
                    address: address,
                    icon: defaultIconColor,
                    animation: google.maps.Animation.DROP,
                    id: i
                });


                  // Adds created location marker to marker array
                  markers.push(marker);

                  // Makes infowindow pop up on click of a marker
                  marker.addListener('click', function() {
                      populateInfoWindow(this, largeInfoWindow);
                      this.setIcon(highlightedIconColor);
                  });

                  self.locations()[i].marker = marker;

                  // Adjust the boundaries of the map to fit the markers
                  //bounds.extend(markers[i].position);
                  //console.log(markers);
              }
            }


        }
        // Extend the boundaries of the map for each marker
             map.fitBounds(bounds);
    }

    // Remove markers from the map
    //https://developers.google.com/maps/documentation/javascript/examples/marker-remove
    // Sets the map on all markers in the array
    function setMapOnAll(map) {
        for (var i = 0; i < markers.length; i++) {
            //markers[i].setMap(map);
            markers[i].setVisible(false);
        }
    }

    // Deletes all markers in the array by removing references to them
    function removeMarkers() {
        setMapOnAll(null);
        markers = [];
    }
};

var mapsInitError = function() {
  alert("Google Maps failed to load");
};
