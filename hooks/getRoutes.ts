// utils/getOSRMRoute.js

import polyline from "@mapbox/polyline";

// Convert input points into OSRM format: "lon,lat;lon,lat;..."
function toOSRMFormat(points) {
  return points
    .map(p => `${p.longitude},${p.latitude}`)
    .join(";");
}

// Main function to fetch + decode route
export async function getOSRMRoute(points) {
  try {
    const osrmCoords = toOSRMFormat(points);

    const url = `https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=full&geometries=polyline`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM error: ${res.status}`);

    const data = await res.json();

    const encoded = data.routes[0].geometry;

    // Decode polyline into raw lat/lon pairs
    const decodedPairs = polyline.decode(encoded);

    // Convert to React Native Maps format
    const decoded = decodedPairs.map(([lat, lon]) => ({
      latitude: lat,
      longitude: lon,
    }));

    return {
      encoded,
      decoded,    // ⬅ ready for <Polyline coordinates={decoded} />
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
    };

  } catch (err) {
    console.error("OSRM ROUTE ERROR:", err);
    return null;
  }
}
