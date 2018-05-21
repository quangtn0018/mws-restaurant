importScripts('./js/idb.js');

var staticCacheName = 'restaurant-reviews-v1';
var urlsToCache = [
	'/',
	'/restaurant.html',
	'/css/styles.css',
	'/data/restaurants.json',
	'/img/1.webp',
	'/img/2.webp',
	'/img/3.webp',
	'/img/4.webp',
	'/img/5.webp',
	'/img/6.webp',
	'/img/7.webp',
	'/img/8.webp',
	'/img/9.webp',
	'/img/10.webp',
	'/img/placeholder.webp',
	'/js/dbhelper.js',
	'/js/main.js',
	'/js/restaurant_info.js'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(staticCacheName).then((cache) => {
			console.log('Opened cache');
			return cache.addAll(urlsToCache);
		})
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames
					.filter((cacheName) => {
						return cacheName.startsWith('restaurant-reviews-') && cacheName != staticCacheName;
					})
					.map((cacheName) => {
						return caches.delete(cacheName);
					})
			);
		})
	);
});

self.addEventListener('fetch', (event) => {
	if (!urlsToCache.includes(event.request.url)) {
		urlsToCache.push(event.request.url);
	}

	event.respondWith(
		caches.match(event.request).then((response) => {
			return response || fetch(event.request);
		})
	);
});

self.addEventListener('sync', function(event) {
	if (event.tag == 'syncOfflineComments') {
		event.waitUntil(syncOfflineComments());
	}
});

syncOfflineComments = () => {
	idb
		.open('restaurant-review-db', 1)
		.then((db) => {
			const tx = db.transaction('keyval', 'readonly');
			const keyValStore = tx.objectStore('keyval');
			return keyValStore.get('offlineReviews');
		})
		.then((offlineReviews) => {
			if (!offlineReviews) return;

			const fetchesArray = offlineReviews.map((review) => {
				let data = new FormData();
				data.append('restaurant_id', review.restaurant_id);
				data.append('name', review.name);
				data.append('rating', review.rating);
				data.append('comment', review.comment);

				return fetch('http://localhost:1337/reviews/', {
					method: 'post',
					body: data
				});
			});

			Promise.all(fetchesArray).then((_) => {
				idb
					.open('restaurant-review-db', 1)
					.then((db) => {
						const tx = db.transaction('keyval', 'readwrite');
						const keyValStore = tx.objectStore('keyval');
						keyValStore.put(null, 'offlineReviews');
						return tx.complete;
					})
					.then(() => console.log('Done syncing offline comments!'));
			});
		});
};
