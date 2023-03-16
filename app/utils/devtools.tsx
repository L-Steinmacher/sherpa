
export function init() {
	navigator.geolocation.getCurrentPosition = function (success, error) {
		success({
			timestamp: 0,
			coords: {
				accuracy: 0,
				altitude: 0,
				altitudeAccuracy: 0,
				heading: 0,
				speed: 0,
				// Seattle
				latitude: 47.609722,
				longitude: -122.333056,
			},
		})
	}

	// @ts-expect-error
	navigator.permissions.query = function (options) {
		return Promise.resolve({ state: 'granted' })
		// return Promise.resolve({ state: 'denied' })
	}
}