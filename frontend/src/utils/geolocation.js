/**
 * Geolocation utility for fetching user's current location
 */

/**
 * Get the user's current geographic location
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export const getCurrentLocation = (highAccuracy = true) => {
    return new Promise((resolve, reject) => {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        // Options for geolocation
        const options = {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? 15000 : 10000, // 15s for GPS, 10s for low accuracy
            maximumAge: 30000 // Allow 30s old cached position for faster response
        };

        // Get current position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            async (error) => {
                // If high accuracy failed, try low accuracy once
                if (highAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
                    console.log("High accuracy location failed, retrying with low accuracy...");
                    try {
                        const lowAccLoc = await getCurrentLocation(false);
                        resolve(lowAccLoc);
                    } catch (lowAccErr) {
                        reject(lowAccErr);
                    }
                    return;
                }

                let errorMessage;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable. Check HTTPS connection or device settings.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out. Trying to get a lock on your position...';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred while fetching location.';
                }
                reject(new Error(errorMessage));
            },
            options
        );
    });
};

/**
 * Format location coordinates as a string
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} address - Optional address info (State, Country)
 * @returns {string} Formatted location string (e.g., "12.9716,77.5946|Bangalore, Karnataka, India")
 */
export const formatLocation = (latitude, longitude, address = "") => {
    const coords = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    return address ? `${coords}|${address}` : coords;
};

/**
 * Perform reverse geocoding to get address components from coordinates
 * Uses OpenStreetMap Nominatim (Free)
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>} Address string
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        console.log("Attempting reverse geocoding...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, {
            headers: {
                'Accept-Language': 'en'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.address) {

            const state = data.address.state || "";
            const country = data.address.country || "";

            const parts = [state, country].filter(p => p !== "");
            const addressString = parts.join(", ");
            console.log("Reverse geocoding success:", addressString);
            return addressString;
        }
        return "";
    } catch (error) {
        console.warn("Reverse geocoding failed:", error);
        return "";
    }
};

/**
 * Check if geolocation is available
 * @returns {boolean}
 */
export const isGeolocationAvailable = () => {
    return 'geolocation' in navigator;
};

/**
 * Get approximate location based on IP address
 * This works over HTTP and doesn't require browser permissions.
 * @returns {Promise<string>} Formatted location string
 */
export const getIPBasedLocation = async () => {
    try {
        console.log("Attempting IP-based location lookup...");
        // Using ipapi.co (free tier, no API key required for basic usage)
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data.latitude && data.longitude) {
            const address = [data.region, data.country_name].filter(p => p).join(", ");
            console.log("IP-based location found:", address);
            return formatLocation(data.latitude, data.longitude, address);
        }
        throw new Error("Could not determine location from IP");
    } catch (error) {
        console.error("IP-based location failed:", error);
        // Absolute last resort: return a dummy but valid format coordinate if everything fails
        // but prefer throwing so the UI can handle it.
        throw new Error("All location methods failed. Please check your connection.");
    }
};

/**
 * Get location with user-friendly error handling
 * Tries Browser Geolocation with Reverse Geocoding first, then falls back to IP-based location.
 * @returns {Promise<string>} Formatted location string
 */
export const getLocationString = async () => {
    try {
        // Try precise browser location first
        const { latitude, longitude } = await getCurrentLocation();

        // Try to get address info
        const address = await reverseGeocode(latitude, longitude);

        return formatLocation(latitude, longitude, address);
    } catch (error) {
        console.warn("Browser geolocation failed, falling back to IP-based location:", error.message);

        // If it's a permission denied error, we should probably still try IP fallback 
        // to be helpful, unless the app strictly requires GPS.
        return await getIPBasedLocation();
    }
};
