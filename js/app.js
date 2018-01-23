// declaring global variables

var map, clientID, clientSecret;

// Location Model 

function LocationMarker (){
    
    var infoWindow = new google.maps.InfoWindow();
    var markerAnim = null;
// Location data constructor
    function Store(data) {
        var self = this;
        this.title = data.title;
        this.latitude = data.location.lat;
        this.longitude = data.location.lng;
        this.fourSquareVenueId = data.fsId;
		
// Foursquare API Client
		
        clientID ="PJYIOIXW5QF2FOGBUNIQGOHYB4KAHWVH12GLCRPARURIFV2Z";
		clientSecret = "KZV2J143Q1ONQZI55B1PN4K0J5A5NZKKIELSJGQDS1DSYOTT";
		
// URL for Foursquare API
		
         var apiUrl = 'https://api.foursquare.com/v2/venues/'+self.fourSquareVenueId+'?&client_id=' + clientID +'&client_secret='+ clientSecret +' &v=20180110';
        // Map Marker 
		
         var defaultIcon = {
					url: "images/grocery.png", // url
					scaledSize: new google.maps.Size(30, 30), // scaled size
					origin: new google.maps.Point(0,0), // origin
					anchor: new google.maps.Point(0, 0) // anchor
					
                    };
		
// Create a "highlighted location" marker 
    
         var highlightedIcon = makeMarkerIcon('FFFF24');
		
// Create a marker per location, and put into markers array

         self.marker = new google.maps.Marker({
            title: self.title,
            position: {lat: self.latitude, lng: self.longitude},
            map: map,
            icon: defaultIcon,
			animation: google.maps.Animation.DROP
        });
        
// This function takes in a COLOR, and then creates a new marker

			function makeMarkerIcon(markerColor) {
				var markerImage = new google.maps.MarkerImage(
					'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
					'|40|_|%E2%80%A2',
					new google.maps.Size(21, 34),
					new google.maps.Point(0, 0),
					new google.maps.Point(10, 34),
					new google.maps.Size(21, 34));
				return markerImage;
			}
       
        self.marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        }); 
       
                
// Create an onclick even to open an infowindow at each marker
       self.marker.addListener('click', function() {
            self.populateInfoWindow(self.marker, infoWindow);
			this.setIcon(highlightedIcon);
            map.panTo(this.getPosition());
			map.panBy(0, -200);
         });
		 
		 
// Pan clicked marker

self.panToLoc = function (){
            map.panTo({lat: self.latitude, lng: self.longitude});
        };
// Populate info window with marker information

       self.populateInfoWindow = function (marker, infoWindow) {
              infoWindow.marker = marker;
			  infoWindow.setContent('');
               marker.setAnimation(google.maps.Animation.BOUNCE);
                 setTimeout((function() {
                    marker.setAnimation(null);
                 }).bind(marker), 1000);
		      var contentString = '<h5 class="iw_subtitle"> '+ self.title + '</h5>';
              infoWindow.setContent(contentString);
              
                            
              // FourSquare API Data
              
              
                  var initialContent = infoWindow.getContent();
                  var loadingMsg =  initialContent + '<div id="foursquarePhotos"><h3>Loading photos...</h3></div>';
                  infoWindow.setContent(loadingMsg);
                  
                      $.getJSON(apiUrl).done(function (data) {
                          infoWindow.setContent(initialContent);
						  var response = data.response.venue.location;
                          var content = initialContent + '<div id="foursquarePhotos">';
                          content += '<h6 class="iw_address_title">Address: </h6>';
						  var street = data.response.venue.location.address;
						  var city  = data.response.venue.location.city;
						  var state = data.response.venue.location.state;
						  var zip  = data.response.venue.location.postalCode;
						  var fsurl= data.response.venue.canonicalUrl;
						  var photos = data.response.venue.photos.groups[0].items;
						  content += '<div>' +'<p class="iw_address">' + street + '</p>' +
                                     '<p class="iw_address">' + city + '</p>' +
                                     '<p class="iw_address">' + state + '</p>' +
                                     '<p class="iw_address">' + zip +'</p>' +'</div>';
                          content += '</div>';
						  for (var i =0; i < 3; i++){
                                content += '<div class="fsphoto"><a target="_blank" href="'+fsurl+'"><img src="' + photos[i].prefix + '40x40' +photos[i].suffix + '"></a></div>';
                          }
                          infoWindow.setContent(content);
                      }).fail(function() {
                // Send alert
                            alert(
                                "There was an issue loading the Foursquare API. Please refresh your page to try again."
                                 );
            });
              
 // Close marker Info Window             
              infoWindow.addListener('closeclick', function() {
                  infoWindow.marker = null;
                  marker.setAnimation(null);
              });

 // Open Info Window
              infoWindow.open(map, marker);

          };
        }
    
    
  

// View Model


    var self = this;
    self.stores = ko.observableArray([]);
    self.searchOption = ko.observable('');
    self.isVisible = ko.observable(false);
	
	// Nav button control
	
	this.isNavClosed = ko.observable(true);
    this.navClick = function () {
	this.isNavClosed(!this.isNavClosed());
	};
    
    
 // Creating Store List
 
    function displayStores(data) {
      
        var store;
        var allStores = [];
        var bounds = new google.maps.LatLngBounds();
        for(var i = 0; i < data.length; i++){
            store = new Store(data[i]);
            allStores.push(store);
            bounds.extend(store.marker.position);
        }
        self.stores(allStores);
        map.fitBounds(bounds);
        google.maps.event.addDomListener(window, 'resize', function() {
            map.fitBounds(bounds);
        }); 
    }
// Filtering Store List

    self.filteredList = ko.computed(function () {
        var matchedStores = [];
        for (var i = 0; i < self.stores().length; i++) {
			var storeLocation = self.stores()[i];
			if(storeLocation.title.toLowerCase().includes(self.searchOption()
				 .toLowerCase())){
					 matchedStores.push(self.stores()[i]);
					 storeLocation.marker.setVisible(true);
				 }
				 else{
					 storeLocation.marker.setVisible(false);
				 }
		}
		return matchedStores;
	},self);

          
    
// Display  Stores

    displayStores(locationData);
    
// Creating click for the list item

    self.onClick = function (store){
        store.panToLoc();
         store.populateInfoWindow(store.marker, infoWindow);
    };
	
//Display toggle
    self.toggleDisplay = function() {
        self.isVisible(!self.isVisible());
    };
}

// Google Maps init

function initMap() {
  var place = {lat: 37.3860517, lng: -122.0838511};
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 14,
    center: place,
    mapTypeControl: false
  });
  
  ko.applyBindings(new LocationMarker());
}
// Handle Map Error

function errorOnLoad() {
    alert('An error occurred with Google Maps!');
}