/**
 * Common database helper functions.
 */
class DBHelper {
	/**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
	static get DATABASE_URL() {
		const port = 1337; // Change this to your server port
		return `http://localhost:${port}`;
	}

	static readDB(callback) {
		let request = window.indexedDB.open('restaurant-review-db', 1);

		request.onsuccess = (event) => {
			var db = event.target.result;
			var tx = db.transaction('keyval');
			var keyValStore = tx.objectStore('keyval');

			keyValStore.get('restaurants').onsuccess = function(event) {
				// data is in db
				if (event.target.result) {
					callback(null, event.target.result);
				} else {
					DBHelper.fetchRestaurantsFromServer(callback);
				}
			};
		};

		request.onerror = function(event) {
			console.log('failed to open indexedDB in readDB');
		};
	}

	static addToDB(data) {
		let request = window.indexedDB.open('restaurant-review-db', 1);

		request.onsuccess = (event) => {
			var db = event.target.result;
			var tx = db.transaction('keyval', 'readwrite');
			var keyValStore = tx.objectStore('keyval');
			keyValStore.put(data, 'restaurants');
		};

		request.onerror = function(event) {
			console.log('failed to open indexedDB in addToDB');
		};
	}

	static clearDB() {
		let request = window.indexedDB.open('restaurant-review-db', 1);

		request.onsuccess = (event) => {
			var db = event.target.result;
			var tx = db.transaction('keyval', 'readwrite');
			var keyValStore = tx.objectStore('keyval');
			keyValStore.put(null, 'restaurants');
		};

		request.onerror = function(event) {
			console.log('failed to open indexedDB in addToDB');
		};
	}

	static updateFavorites(restaurantId, isFavorite = false) {
		let request = window.indexedDB.open('restaurant-review-db', 1);

		request.onsuccess = (event) => {
			var db = event.target.result;
			var tx = db.transaction('keyval', 'readwrite');
			var keyValStore = tx.objectStore('keyval');

			keyValStore.get('restaurants').onsuccess = function(event) {
				if (!event.target.result) {
					console.error('data not in DB');
				} else {
					let restaurants = event.target.result;

					const index = parseInt(restaurantId) - 1;
					restaurants[index].is_favorite = isFavorite;

					keyValStore.put(restaurants, 'restaurants');
				}
			};
		};

		request.onerror = function(event) {
			console.log('failed to open indexedDB in addToDB');
		};
	}

	static addToDBOffline(review) {
		let request = window.indexedDB.open('restaurant-review-db', 1);

		request.onsuccess = function(event) {
			var db = event.target.result;
			var tx = db.transaction('keyval', 'readwrite');
			var keyValStore = tx.objectStore('keyval');

			keyValStore.get('restaurants').onsuccess = function(event) {
				if (!event.target.result) {
					console.error('data not in DB');
				} else {
					let restaurants = event.target.result;

					const reviewToAdd = DBHelper.getReviewToAdd(review);
					const index = parseInt(review.restaurant_id) - 1;
					restaurants[index].reviews.push(reviewToAdd);

					keyValStore.put(restaurants, 'restaurants');
				}
			};

			keyValStore.get('offlineReviews').onsuccess = function(event) {
				const offlineReviewToAdd = {
					restaurant_id: review.restaurant_id,
					name: review.name,
					rating: review.rating,
					comment: review.comment
				};

				if (!event.target.result) {
					keyValStore.put([ offlineReviewToAdd ], 'offlineReviews');
				} else {
					const reviews = [ ...event.target.result, offlineReviewToAdd ];
					keyValStore.put(reviews, 'offlineReviews');
				}
			};
		};

		request.onerror = function(event) {
			console.error('failed to open indexedDB in addToDBOffline');
		};
	}

	static getReviewToAdd(review) {
		const date = new Date(review.createdAt).toDateString().split(' ');
		// date has the form of, ex: ['Mon', 'Jul', '24', '2017']
		const dateToAdd = `${date[1]} ${date[2]}, ${date[3]}`;
		const reviewToAdd = {
			name: review.name,
			date: dateToAdd,
			rating: review.rating,
			comments: review.comment
		};

		return reviewToAdd;
	}

	/**
	 * Fetch restaurants from server
	 * also fetches reviews and add to restaurants accordingly
	 */
	static fetchRestaurantsFromServer(callback) {
		const fetchReviews = fetch(`${DBHelper.DATABASE_URL}/reviews`);
		const fetchRestaurants = fetch(`${DBHelper.DATABASE_URL}/restaurants`);

		Promise.all([ fetchReviews, fetchRestaurants ])
			.then((responses) => {
				const reviewsResponse = responses[0].json();
				const restaurantsResponse = responses[1].json();
				Promise.all([ reviewsResponse, restaurantsResponse ])
					.then((response) => {
						const reviews = response[0];
						let restaurants = response[1];

						reviews.forEach((review) => {
							const reviewToAdd = DBHelper.getReviewToAdd(review);
							const index = parseInt(review.restaurant_id) - 1;
							restaurants[index].reviews.push(reviewToAdd);
						});

						DBHelper.addToDB(restaurants);
						callback(null, restaurants);
					})
					.catch((error) => callback(error, null));
			})
			.catch((error) => callback(error, null));
	}

	/**
   * Fetch all restaurants.
   */
	static fetchRestaurants(callback) {
		DBHelper.readDB(callback);
	}

	/**
   * Fetch a restaurant by its ID.
   */
	static fetchRestaurantById(id, callback) {
		// fetch all restaurants with proper error handling.
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				const restaurant = restaurants.find((r) => r.id == id);
				if (restaurant) {
					// Got the restaurant
					callback(null, restaurant);
				} else {
					// Restaurant does not exist in the database
					callback('Restaurant does not exist', null);
				}
			}
		});
	}

	/**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
	static fetchRestaurantByCuisine(cuisine, callback) {
		// Fetch all restaurants  with proper error handling
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given cuisine type
				const results = restaurants.filter((r) => r.cuisine_type == cuisine);
				callback(null, results);
			}
		});
	}

	/**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
	static fetchRestaurantByNeighborhood(neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given neighborhood
				const results = restaurants.filter((r) => r.neighborhood == neighborhood);
				callback(null, results);
			}
		});
	}

	/**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				let results = restaurants;
				if (cuisine != 'all') {
					// filter by cuisine
					results = results.filter((r) => r.cuisine_type == cuisine);
				}
				if (neighborhood != 'all') {
					// filter by neighborhood
					results = results.filter((r) => r.neighborhood == neighborhood);
				}
				callback(null, results);
			}
		});
	}

	/**
   * Fetch all neighborhoods with proper error handling.
   */
	static fetchNeighborhoods(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
				callback(null, uniqueNeighborhoods);
			}
		});
	}

	/**
   * Fetch all cuisines with proper error handling.
   */
	static fetchCuisines(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
				callback(null, uniqueCuisines);
			}
		});
	}

	/**
   * Restaurant page URL.
   */
	static urlForRestaurant(restaurant) {
		return `./restaurant.html?id=${restaurant.id}`;
	}

	/**
   * Restaurant image URL.
   */
	static imageUrlForRestaurant(restaurant) {
		return `/img/${restaurant.photograph}.webp`;
	}

	/**
   * Map marker for a restaurant.
   */
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new google.maps.Marker({
			position: restaurant.latlng,
			title: restaurant.name,
			url: DBHelper.urlForRestaurant(restaurant),
			map: map,
			animation: google.maps.Animation.DROP
		});
		return marker;
	}
}
