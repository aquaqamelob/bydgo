// utils/getOSRMRoute.js

import polyline from "@mapbox/polyline";

// Convert input points into OSRM format: "lon,lat;lon,lat;..."
function toOSRMFormat(points) {
  return points
    .map(p => `${p.longitude},${p.latitude}`)
    .join(";");
}

// Ramer-Douglas-Peucker line simplification
function simplifyPolyline(points, tolerance = 0.0001) {
  if (points.length < 3) return points;

  const dmax = (p1, p2, p3) => {
    const a = Math.abs((p2.longitude - p1.longitude) * (p1.latitude - p3.latitude) - 
                       (p1.longitude - p3.longitude) * (p2.latitude - p1.latitude));
    const b = Math.sqrt(
      Math.pow(p2.longitude - p1.longitude, 2) + 
      Math.pow(p2.latitude - p1.latitude, 2)
    );
    return a / b;
  };

  let dmax_val = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = dmax(points[0], points[i], points[points.length - 1]);
    if (d > dmax_val) {
      index = i;
      dmax_val = d;
    }
  }

  if (dmax_val > tolerance) {
    const rec1 = simplifyPolyline(points.slice(0, index + 1), tolerance);
    const rec2 = simplifyPolyline(points.slice(index), tolerance);
    return [...rec1.slice(0, -1), ...rec2];
  } else {
    return [points[0], points[points.length - 1]];
  }
}

// Main function to fetch + decode route
export async function getOSRMRoute(points) {
  try {
    const osrmCoords = toOSRMFormat(points);

      const url = `https://router.project-osrm.org/route/v1/walking/${osrmCoords}?overview=full&geometries=polyline&alternatives=0`;

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

    // Simplify the polyline to reduce coordinate count
    const simplified = simplifyPolyline(decoded, 0.0001);

    return {
      encoded,
      decoded: simplified,    // ⬅ simplified coordinates
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
    };

  } catch (err) {
    console.error("OSRM ROUTE ERROR:", err);
    return null;
  }
}
