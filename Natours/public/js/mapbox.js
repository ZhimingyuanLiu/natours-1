/* eslint-disable */

const locations = JSON.parse(document.getElementById('map').dataset.locations)

mapboxgl.accessToken = 'pk.eyJ1IjoiY29keHIwMiIsImEiOiJjazJkcHN2dXYwMThiM2Nxa3VwNGkyYnd3In0.VEaMG0IJVK94--I--li0vQ'

var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/codxr02/ck2c9v6o90a4j1cr91qxcjg69',
	scrollZoom: false,
	zoom: 8
	// center: [-118.113491, 34.111745],
	// zoom: 4,
	// interactive: false
})

const bounds = new mapboxgl.LngLatBounds()

locations.forEach(loc => {
	// Create marker
	const el = document.createElement('div')
	el.className = 'marker'

	// Add marker
	new mapboxgl.Marker({
		element: el,
		anchor: 'bottom'
	})
		.setLngLat(loc.coordinates)
		.addTo(map)

	/* // Add popup
	new mapboxgl.Popup({
		offset: 30
	})
		.setLngLat(loc.coordinates)
		.setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
		.addTo(map) */

	// Extend map bounds to include current location
	bounds.extend(loc.coordinates)
})

map.fitBounds(bounds, {
	padding: {
		top: 120,
		bottom: 150,
		left: 100,
		right: 100
	}
})
