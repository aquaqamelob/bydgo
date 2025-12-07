
import { useState, useMemo, useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import MapView, { Polyline, Region } from 'react-native-maps';

import data from '@/constants/message.json';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useOsrmRoute } from '@/hooks/useOsrmRoute';
import MarkerModal from '@/components/MarkerModal';
import PoiMarkers from '@/components/PoiMarkers';
import { WANTED_TYPE } from '@/constants/map';
import { metersBetween } from '@/utils/geo';

export default function HomeScreen() {
  const { userLocation, errorMsg, region, setRegion } = useUserLocation();
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [visitedKeys, setVisitedKeys] = useState<Set<string>>(new Set());

  const [routeCoords, setRouteCoords] = useState([]);

  const initialRegion: Region = useMemo(() => ({
    latitude: 53.122340158659746,
    longitude: 18.00006289506423,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }), []);


  const points = useMemo(() => {
    const filtered = data.filter((item) => item.type === WANTED_TYPE);
    // Keep original order from data; do not impose geometric sort
    return filtered.map((item) => ({ latitude: item.x, longitude: item.y }));
  }, []);

  const pointKey = (p: { latitude: number; longitude: number }) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`;

  // Only route through unvisited points
  const unvisitedPoints = useMemo(() => {
    return points.filter((p) => !visitedKeys.has(pointKey(p)));
  }, [points, visitedKeys]);

  // Build a greedy nearest-neighbor path starting from userLocation through all points.
  const routePoints = useMemo(() => {
    if (!userLocation || unvisitedPoints.length === 0) return [];
    const remaining = [...unvisitedPoints];
    const ordered: { latitude: number; longitude: number }[] = [];
    let current = userLocation;
    while (remaining.length > 0) {
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let idx = 0; idx < remaining.length; idx++) {
        const d = metersBetween(current, remaining[idx]);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      }
      const next = remaining.splice(bestIdx, 1)[0];
      ordered.push(next);
      current = next;
    }
    return [userLocation, ...ordered];
  }, [userLocation, unvisitedPoints]);

  // Auto-mark as visited when user gets very close to a point
  useEffect(() => {
    if (!userLocation || unvisitedPoints.length === 0) return;
    let nearestIdx = -1;
    let nearestDist = Infinity;
    for (let i = 0; i < unvisitedPoints.length; i++) {
      const d = metersBetween(userLocation, unvisitedPoints[i]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    const VISIT_RADIUS_METERS = 30;
    if (nearestIdx >= 0 && nearestDist <= VISIT_RADIUS_METERS) {
      const key = pointKey(unvisitedPoints[nearestIdx]);
      setVisitedKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    }
  }, [userLocation, unvisitedPoints]);

  const { routeCoords: osrmRoute, isLoading: routeLoading, error: routeError } = useOsrmRoute(routePoints as any);
  useEffect(() => {
    setRouteCoords(osrmRoute as any);
  }, [osrmRoute]);

  const onRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
  };

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <Text style={{color: "white"}}>{userLocation ? `${userLocation.latitude}, ${userLocation.longitude}` : 'Waiting for location...'}</Text> */}
      {routeLoading && <Text style={{color: "white"}}>Loading route…</Text>}
      {routeError && <Text style={{color: "white"}}>Route error: {routeError}</Text>}
      <MapView
        style={styles.map}
        region={region || initialRegion}
        onRegionChange={onRegionChange}
        showsUserLocation={true}
        followsUserLocation={false}
      >
        <PoiMarkers points={points} data={data as any} wantedType={WANTED_TYPE} onPressMarker={setSelectedMarker} />
        
        {routeCoords && routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        )}
  
   </MapView>

      <MarkerModal item={selectedMarker} onClose={() => setSelectedMarker(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 20,
    paddingBottom: 30,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingRight: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#333',
    fontWeight: 'bold',
  },
  modalImage: {
    width: '100%',
    height: 250,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  modalType: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 15,
    textTransform: 'capitalize',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
});

