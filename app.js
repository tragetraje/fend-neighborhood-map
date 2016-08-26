function AppViewModel() {
  var self = this;
  var markers = [];
  var newcastle,
      map;


  function initializeMap() {
    newcastle = new google.maps.LatLng(-32.929927, 151.773169);
    map = new google.maps.Map(document.getElementById('map'), {
        center: newcastle,
        zoom: 15,
        mapTypeControl: false
    });
  }
}

//ko.applyBindings(new AppViewModel());
