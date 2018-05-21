let restaurants, neighborhoods, cuisines;
var map;
var markers = [];

// register service worker
if (navigator.serviceWorker) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').then(
			(registration) => {
				// Registration was successful
				console.log('ServiceWorker registration successful with scope: ', registration.scope);
			},
			(err) => {
				// registration failed :(
				console.log('ServiceWorker registration failed: ', err);
			}
		);

		navigator.serviceWorker.ready.then(function(swRegistration) {
			return swRegistration.sync.register('syncOfflineComments');
		});
	});
}

updateOnlineStatus = (event) => {
	const condition = navigator.onLine ? 'online' : 'offline';
	let status = document.getElementById('connection-status');

	status.innerHTML = `Currently ${condition}`;
};

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

openDB = () => {
	if (!window.indexedDB) {
		window.alert(
			"Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available."
		);
	}

	let request = window.indexedDB.open('restaurant-review-db', 1);

	request.onupgradeneeded = function(event) {
		// The database did not previously exist, so create object stores and indexes.
		var db = event.target.result;
		var keyValStore = db.createObjectStore('keyval');
		console.log('created object store in openDB');
	};

	request.onerror = function(event) {
		console.log('failed to open indexedDB openDB');
	};
};

addLazyLoadingImages = () => {
	var lazyImages = [].slice.call(document.querySelectorAll('#lazy-img'));

	if ('IntersectionObserver' in window) {
		let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
			entries.forEach(function(entry) {
				if (entry.isIntersecting) {
					let lazyImage = entry.target;
					lazyImage.src = lazyImage.dataset.src;
					lazyImage.removeAttribute('id');
					lazyImageObserver.unobserve(lazyImage);
				}
			});
		});

		lazyImages.forEach(function(lazyImage) {
			lazyImageObserver.observe(lazyImage);
		});
	} else {
		// Possibly fall back to a more compatible method here
	}
};

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
	updateOnlineStatus();
	openDB();
	fetchNeighborhoods();
	fetchCuisines();
	// addLazyLoadingImages();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
	DBHelper.fetchNeighborhoods((error, neighborhoods) => {
		if (error) {
			// Got an error
			console.error(error);
		} else {
			self.neighborhoods = neighborhoods;
			fillNeighborhoodsHTML();
		}
	});
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	neighborhoods.forEach((neighborhood) => {
		const option = document.createElement('option');
		option.innerHTML = neighborhood;
		option.value = neighborhood;
		select.append(option);
	});
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
	DBHelper.fetchCuisines((error, cuisines) => {
		if (error) {
			// Got an error!
			console.error(error);
		} else {
			self.cuisines = cuisines;
			fillCuisinesHTML();
		}
	});
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');

	cuisines.forEach((cuisine) => {
		const option = document.createElement('option');
		option.innerHTML = cuisine;
		option.value = cuisine;
		select.append(option);
	});
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	let loc = {
		lat: 40.722216,
		lng: -73.987501
	};
	self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: loc,
		scrollwheel: false
	});
	updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
	const cSelect = document.getElementById('cuisines-select');
	const nSelect = document.getElementById('neighborhoods-select');

	const cIndex = cSelect.selectedIndex;
	const nIndex = nSelect.selectedIndex;

	const cuisine = cSelect[cIndex].value;
	const neighborhood = nSelect[nIndex].value;

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
		if (error) {
			// Got an error!
			console.error(error);
		} else {
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		}
	});
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';

	// Remove all map markers
	self.markers.forEach((m) => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const ul = document.getElementById('restaurants-list');
	restaurants.forEach((restaurant) => {
		ul.append(createRestaurantHTML(restaurant));
	});
	addLazyLoadingImages();
	addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
	const li = document.createElement('li');

	const favoriteCheckbox = document.createElement('input');
	favoriteCheckbox.id = `favorite-checkbox-${restaurant.id}`;
	favoriteCheckbox.type = 'checkbox';
	favoriteCheckbox.addEventListener('change', function() {
		let isFavorite = this.checked;

		fetch(`http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=${isFavorite}`, {
			method: 'put'
		}).then(() => {
			const favoriteDisplay = document.querySelector(`#favorite-display-${restaurant.id}`);
			favoriteDisplay.innerHTML = isFavorite ? 'is favorite' : 'is not favorite';
		});
	});

	const favoriteDisplay = document.createElement('label');
	favoriteDisplay.htmlFor = `favorite-checkbox-${restaurant.id}`;
	favoriteDisplay.id = `favorite-display-${restaurant.id}`;
	favoriteDisplay.innerHTML = restaurant.is_favorite ? 'is favorite' : 'is not favorite';

	const favoriteContainer = document.createElement('div');
	favoriteContainer.id = `favorite-container-${restaurant.id}`;

	favoriteContainer.appendChild(favoriteCheckbox);
	favoriteContainer.appendChild(favoriteDisplay);
	li.append(favoriteContainer);

	const image = document.createElement('img');
	image.className = 'restaurant-img';
	image.id = 'lazy-img';
	image.src = '/img/placeholder.webp';
	image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
	image.alt = restaurant.name;
	li.append(image);

	const name = document.createElement('h2');
	name.innerHTML = restaurant.name;
	li.append(name);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	li.append(neighborhood);

	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	li.append(address);

	const more = document.createElement('a');
	more.innerHTML = 'View Details';
	more.href = DBHelper.urlForRestaurant(restaurant);
	li.append(more);

	return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach((restaurant) => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url;
		});
		self.markers.push(marker);
	});
};
