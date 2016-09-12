var artLocations = [{
    author: "DEAMS - Parry street",
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
    author: "Jumbo - Thorn Street",
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
    author: "Adnate - Wickham",
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
    author: "Adnate - Bolton street",
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


// Create a map and set the centre to Newcastle
function initializeMap() {
    newcastle = new google.maps.LatLng(-32.929927, 151.773169);
    map = new google.maps.Map(document.getElementById('map'), {
        center: newcastle,
        zoom: 15,
        mapTypeControl: false
    });
    ko.applyBindings(new ViewModel());
}

var ViewModel = function() {
    //Make a reference of this in a new variable to avoid its tracking
    var self = this;

    self.searchQuery = ko.observable('');
    self.locations = ko.observableArray(artLocations);
    self.chosenLocations = ko.observableArray();

    //Writes user's search query to input box and console
    self.logToConsole = ko.computed(function() {
      console.log(self.searchQuery());
    });


    // Create infowindow object for a marker to display information, pics etc.
    var largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();

    // Style the markers
    var defaultIconColor = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    var highlightedIconColor = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';


    // Populate markers and infowindows on click of a marker
    function populateFullMap(artLocations) {
    for (var i = 0; i < artLocations.length; i++) {
        var position = artLocations[i].coordinates;
        var author = artLocations[i].author;
        var address = artLocations[i].artworkLocation;
        var origin = artLocations[i].origin;
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

        //Add created location marker to marker array
        markers.push(marker);

        //Make infowindow pop up on click of a marker
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
        });

        //Change marker's color hovering over it and off
        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIconColor);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIconColor);
        });

        //Adjust the boundaries of the map to fit the markers
        bounds.extend(markers[i].position);
    }
    // Extend the boundaries of the map for each marker
    map.fitBounds(bounds);
  }

// Display infowindow and flickr image
function populateInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.setContent('');
        infowindow.marker = marker;
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });
        // Function declaration
        //https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/function
        // Flickr API call to get streetart image
        function getFlickrImage() {
          var API_KEY = 'dd45d7051de5b76009350707895811ae';
          var USER_ID = '144843076%40N03';
          var base_url = 'https://api.flickr.com/services/rest/?';
          var method = 'flickr.photos.search';
          var query =
          marker.author.replace(/ -| &/, '');

          // Flickr API request url
          var url = base_url +
               'method=' + method +
               '&api_key=' + API_KEY +
               '&user_id=' + USER_ID +
               '&text=' + query +
               '&format=json' +
               '&nojsoncallback=1';

            // Flickr API search method url
            /*
            var flickrUrl = 'https://api.flickr.com/services/rest/';
            flickrUrl += '?' + $.param({
                'method': 'flickr.photos.search',
                'api_key': 'dd45d7051de5b76009350707895811ae',
                'user_id': '144843076%40N03',
                'text': title + address,
                'format': 'json',
                'nojsoncallback': 1
            });

            var flickrUrl = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=dd45d7051de5b76009350707895811ae&user_id=144843076%40N03&text=adnate+numskull&format=json&nojsoncallback=1';
            */
            $.getJSON(url, function(data) {
                console.log(data);
                var detail = data.photos.photo[0];
                if (detail) {
                infowindow.setContent('<div>' + marker.author + ', ' + marker.origin + '<br>' + marker.address + '</div><div id="flckr-img"><img class="infowndw-img" src="https://farm' + detail.farm + '.staticflickr.com/' + detail.server + '/' + detail.id + '_' + detail.secret + '_n.jpg"></div>');
              } else {
                infowindow.setContent('<div> Nothing Found </div>');
              }
                /*
                infowindow.setContent('<div>' + marker.title + '</div><div id="flckr-img"><img class="infowndw-img" src="https://farm' + detail.farm + '.staticflickr.com/' + detail.server + '/' + detail.id + '_' + detail.secret + '_n.jpg"></div>');
                var image = document.getElementById('flckr-img');
                */
            }).fail(function() {
                infowindow.setContent('<div>' + marker.author + '</div>' +
                    '<div>No Flickr Image Found</div>');
            });
        };
        //invoking function declaration
        getFlickrImage();
        infowindow.open(map, marker);
    }
  }
}

ko.applyBindings(new ViewModel());
