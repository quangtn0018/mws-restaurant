let restaurant;
var map;

updateOnlineStatus = (event) => {
	const condition = navigator.onLine ? 'online' : 'offline';
	let status = document.getElementById('connection-status');

	status.innerHTML = `Currently ${condition}`;
};

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

document.addEventListener('DOMContentLoaded', (event) => {
	updateOnlineStatus();
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) {
			// Got an error!
			console.error(error);
		} else {
			self.map = new google.maps.Map(document.getElementById('map'), {
				zoom: 16,
				center: restaurant.latlng,
				scrollwheel: false
			});
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
		}
	});
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) {
		// restaurant already fetched!
		callback(null, self.restaurant);
		return;
	}
	const id = getParameterByName('id');
	if (!id) {
		// no id found in URL
		error = 'No restaurant id in URL';
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			callback(null, restaurant);
		});
	}
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img';
	image.alt = restaurant.name;
	image.src = DBHelper.imageUrlForRestaurant(restaurant);

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews
	fillReviewsHTML();
	fillCommentRestaurantID();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);

		hours.appendChild(row);
	}
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');
	const title = document.createElement('h3');
	title.innerHTML = 'Reviews';
	container.appendChild(title);

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	reviews.forEach((review) => {
		ul.appendChild(createReviewHTML(review));
	});
	container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
	const li = document.createElement('li');
	li.tabIndex = '0';
	const name = document.createElement('p');
	name.className = 'reviews-list-name';
	name.innerHTML = review.name;
	li.appendChild(name);

	const date = document.createElement('p');
	date.innerHTML = review.date;
	li.appendChild(date);

	const nameDateContainer = document.createElement('div');
	nameDateContainer.className = 'name-date-container';
	nameDateContainer.appendChild(name);
	nameDateContainer.appendChild(date);
	li.appendChild(nameDateContainer);

	const ratingContainer = document.createElement('div');
	ratingContainer.className = 'rating-container';
	const rating = document.createElement('p');
	rating.innerHTML = `Rating: ${review.rating}`;
	ratingContainer.appendChild(rating);
	li.appendChild(ratingContainer);

	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	li.appendChild(comments);

	return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

fillCommentRestaurantID = (id = self.restaurant.id) => {
	const restaurantID = document.getElementById('restaurant-id');
	restaurantID.value = id;
};

postComment = (id = self.restaurant.id) => {
	const restaurant_id = id;
	const name = document.getElementById('user-name').value;
	const rating = document.getElementById('user-rating').value;
	const comment = document.getElementById('user-comment').value;

	let data = new FormData();
	data.append('restaurant_id', restaurant_id);
	data.append('name', name);
	data.append('rating', rating);
	data.append('comment', comment);

	// TODO: post reviews after connection is back online
	if (!navigator.onLine) {
		const review = {
			restaurant_id,
			name,
			rating,
			comment,
			createdAt: new Date()
		};

		DBHelper.addToDBOffline(review);
		return;
	}
	// when user is online
	fetch('http://localhost:1337/reviews/', {
		method: 'post',
		body: data
	}).then((_) => {
		// set "restaurants" to null so indexDB can be updated with new comment
		DBHelper.clearDB();
		window.location.href = `http://localhost:3000/restaurant.html?id=${id}`;
	});
};
