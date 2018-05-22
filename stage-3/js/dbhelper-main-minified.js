class DBHelper{static get DATABASE_URL(){return"http://localhost:1337"}static readDB(e){let t=window.indexedDB.open("restaurant-review-db",1);t.onsuccess=(t=>{t.target.result.transaction("keyval").objectStore("keyval").get("restaurants").onsuccess=function(t){t.target.result?e(null,t.target.result):DBHelper.fetchRestaurantsFromServer(e)}}),t.onerror=function(e){console.log("failed to open indexedDB in readDB")}}static addToDB(e){let t=window.indexedDB.open("restaurant-review-db",1);t.onsuccess=(t=>{t.target.result.transaction("keyval","readwrite").objectStore("keyval").put(e,"restaurants")}),t.onerror=function(e){console.log("failed to open indexedDB in addToDB")}}static clearDB(){let e=window.indexedDB.open("restaurant-review-db",1);e.onsuccess=(e=>{e.target.result.transaction("keyval","readwrite").objectStore("keyval").put(null,"restaurants")}),e.onerror=function(e){console.log("failed to open indexedDB in addToDB")}}static updateFavorites(e,t=!1){let n=window.indexedDB.open("restaurant-review-db",1);n.onsuccess=(n=>{var r=n.target.result.transaction("keyval","readwrite").objectStore("keyval");r.get("restaurants").onsuccess=function(n){if(n.target.result){let a=n.target.result;a[parseInt(e)-1].is_favorite=t,r.put(a,"restaurants")}else console.error("data not in DB")}}),n.onerror=function(e){console.log("failed to open indexedDB in addToDB")}}static addToDBOffline(e){let t=window.indexedDB.open("restaurant-review-db",1);t.onsuccess=function(t){var n=t.target.result.transaction("keyval","readwrite").objectStore("keyval");n.get("restaurants").onsuccess=function(t){if(t.target.result){let r=t.target.result;const a=DBHelper.getReviewToAdd(e);r[parseInt(e.restaurant_id)-1].reviews.push(a),n.put(r,"restaurants")}else console.error("data not in DB")},n.get("offlineReviews").onsuccess=function(t){const r={restaurant_id:e.restaurant_id,name:e.name,rating:e.rating,comment:e.comment};if(t.target.result){const e=[...t.target.result,r];n.put(e,"offlineReviews")}else n.put([r],"offlineReviews")}},t.onerror=function(e){console.error("failed to open indexedDB in addToDBOffline")}}static getReviewToAdd(e){const t=new Date(e.createdAt).toDateString().split(" "),n=`${t[1]} ${t[2]}, ${t[3]}`;return{name:e.name,date:n,rating:e.rating,comments:e.comment}}static fetchRestaurantsFromServer(e){const t=fetch(`${DBHelper.DATABASE_URL}/reviews`),n=fetch(`${DBHelper.DATABASE_URL}/restaurants`);Promise.all([t,n]).then(t=>{const n=t[0].json(),r=t[1].json();Promise.all([n,r]).then(t=>{const n=t[0];let r=t[1];n.forEach(e=>{const t=DBHelper.getReviewToAdd(e),n=parseInt(e.restaurant_id)-1;r[n].reviews.push(t)}),DBHelper.addToDB(r),e(null,r)}).catch(t=>e(t,null))}).catch(t=>e(t,null))}static fetchRestaurants(e){DBHelper.readDB(e)}static fetchRestaurantById(e,t){DBHelper.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.find(t=>t.id==e);n?t(null,n):t("Restaurant does not exist",null)}})}static fetchRestaurantByCuisine(e,t){DBHelper.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.filter(t=>t.cuisine_type==e);t(null,n)}})}static fetchRestaurantByNeighborhood(e,t){DBHelper.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.filter(t=>t.neighborhood==e);t(null,n)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,n){DBHelper.fetchRestaurants((r,a)=>{if(r)n(r,null);else{let r=a;"all"!=e&&(r=r.filter(t=>t.cuisine_type==e)),"all"!=t&&(r=r.filter(e=>e.neighborhood==t)),n(null,r)}})}static fetchNeighborhoods(e){DBHelper.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].neighborhood),r=t.filter((e,n)=>t.indexOf(e)==n);e(null,r)}})}static fetchCuisines(e){DBHelper.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].cuisine_type),r=t.filter((e,n)=>t.indexOf(e)==n);e(null,r)}})}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageUrlForRestaurant(e){return`/img/${e.photograph}.webp`}static mapMarkerForRestaurant(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:DBHelper.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}}let restaurants,neighborhoods,cuisines;var map,markers=[];navigator.serviceWorker&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").then(e=>{console.log("ServiceWorker registration successful with scope: ",e.scope)},e=>{console.log("ServiceWorker registration failed: ",e)}),navigator.serviceWorker.ready.then(function(e){return e.sync.register("syncOfflineComments")})}),updateOnlineStatus=(e=>{const t=navigator.onLine?"online":"offline";document.getElementById("connection-status").innerHTML=`Currently ${t}`}),window.addEventListener("online",updateOnlineStatus),window.addEventListener("offline",updateOnlineStatus),openDB=(()=>{window.indexedDB||window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");let e=window.indexedDB.open("restaurant-review-db",1);e.onupgradeneeded=function(e){e.target.result.createObjectStore("keyval");console.log("created object store in openDB")},e.onerror=function(e){console.log("failed to open indexedDB openDB")}}),addLazyLoadingImages=(()=>{var e=[].slice.call(document.querySelectorAll("#lazy-img"));if("IntersectionObserver"in window){let t=new IntersectionObserver(function(e,n){e.forEach(function(e){if(e.isIntersecting){let n=e.target;n.src=n.dataset.src,n.removeAttribute("id"),t.unobserve(n)}})});e.forEach(function(e){t.observe(e)})}}),document.addEventListener("DOMContentLoaded",e=>{updateOnlineStatus(),openDB(),fetchNeighborhoods(),fetchCuisines(),updateRestaurants()}),fetchNeighborhoods=(()=>{DBHelper.fetchNeighborhoods((e,t)=>{e?console.error(e):(self.neighborhoods=t,fillNeighborhoodsHTML())})}),fillNeighborhoodsHTML=((e=self.neighborhoods)=>{const t=document.getElementById("neighborhoods-select");e.forEach(e=>{const n=document.createElement("option");n.innerHTML=e,n.value=e,t.append(n)})}),fetchCuisines=(()=>{DBHelper.fetchCuisines((e,t)=>{e?console.error(e):(self.cuisines=t,fillCuisinesHTML())})}),fillCuisinesHTML=((e=self.cuisines)=>{const t=document.getElementById("cuisines-select");e.forEach(e=>{const n=document.createElement("option");n.innerHTML=e,n.value=e,t.append(n)})}),updateRestaurants=(()=>{const e=document.getElementById("cuisines-select"),t=document.getElementById("neighborhoods-select"),n=e.selectedIndex,r=t.selectedIndex,a=e[n].value,s=t[r].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(a,s,(e,t)=>{e?console.error(e):(resetRestaurants(t),fillRestaurantsHTML())})}),resetRestaurants=(e=>{self.restaurants=[],document.getElementById("restaurants-list").innerHTML="",self.markers.forEach(e=>e.setMap(null)),self.markers=[],self.restaurants=e}),fillRestaurantsHTML=((e=self.restaurants)=>{const t=document.getElementById("restaurants-list");e.forEach(e=>{t.append(createRestaurantHTML(e))}),addLazyLoadingImages(),addMarkersToMap()}),createRestaurantHTML=(e=>{const t=document.createElement("li"),n=document.createElement("label");n.htmlFor=`favorite-checkbox-${e.id}`,n.id=`favorite-display-${e.id}`,n.innerHTML=e.is_favorite?"is favorite":"is not favorite";const r=document.createElement("span");r.innerHTML=e.is_favorite?"&#x2605":"";const a=document.createElement("input");a.id=`favorite-checkbox-${e.id}`,a.type="checkbox",a.checked=e.is_favorite,a.addEventListener("change",function(){let t=this.checked;fetch(`http://localhost:1337/restaurants/${e.id}/?is_favorite=${t}`,{method:"put"}).then(()=>{document.querySelector(`#favorite-display-${e.id}`).innerHTML=t?"is favorite":"is not favorite",r.innerHTML=t?"&#x2605":"",DBHelper.updateFavorites(e.id,t)})});const s=document.createElement("div");s.id=`favorite-container-${e.id}`,s.appendChild(a),s.appendChild(n),s.appendChild(r),t.append(s);const o=document.createElement("img");o.className="restaurant-img",o.id="lazy-img",o.src="/img/placeholder.webp",o.dataset.src=DBHelper.imageUrlForRestaurant(e),o.alt=e.name,t.append(o);const i=document.createElement("h2");i.innerHTML=e.name,t.append(i);const l=document.createElement("p");l.innerHTML=e.neighborhood,t.append(l);const c=document.createElement("p");c.innerHTML=e.address,t.append(c);const d=document.createElement("a");return d.innerHTML="View Details",d.href=DBHelper.urlForRestaurant(e),t.append(d),t}),addMarkersToMap=((e=self.restaurants)=>{e.forEach(e=>{const t=DBHelper.mapMarkerForRestaurant(e,self.map);google.maps.event.addListener(t,"click",()=>{window.location.href=t.url}),self.markers.push(t)})}),initMap=(()=>{self.map=new google.maps.Map(document.getElementById("map"),{zoom:12,center:{lat:40.722216,lng:-73.987501},scrollwheel:!1}),updateRestaurants()}),loadMapOnClick=(e=>{e.preventDefault(),initMap()});