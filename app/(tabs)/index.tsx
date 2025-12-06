
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

  const [routeCoords, setRouteCoords] = useState([]);

  const initialRegion: Region = useMemo(() => ({
    latitude: 53.1235,
    longitude: 18.0084,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }), []);


  const points = useMemo(() => {
    const filtered = data.filter((item) => item.type === WANTED_TYPE);
    // Keep original order from data; do not impose geometric sort
    return filtered.map((item) => ({ latitude: item.x, longitude: item.y }));
  }, []);

  // Determine nearest POI to the user (prefer within 1km)
  const nearestPoint = useMemo(() => {
    if (!userLocation || points.length === 0) return null;
    let nearest: { latitude: number; longitude: number } | null = null;
    let nearestDist = Infinity;
    for (const p of points) {
      const d = metersBetween(userLocation, p);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = p;
      }
    }
    const RADIUS_METERS = 1000;
    // If within radius, keep; otherwise still use nearest overall so user gets a route
    return nearest;
  }, [userLocation, points]);

  // Route only from user to the nearest single point
  const routePoints = useMemo(() => {
    if (userLocation && nearestPoint) return [userLocation, nearestPoint];
    return [];
  }, [userLocation, nearestPoint]);

  const { routeCoords: osrmRoute } = useOsrmRoute(routePoints as any);
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
      <Text style={{color: "white"}}>{userLocation ? `${userLocation.latitude}, ${userLocation.longitude}` : '...'}</Text>
      <MapView
        style={styles.map}
        region={region || initialRegion}
        onRegionChange={onRegionChange}
        showsUserLocation={true}
        followsUserLocation={false}
      >
        <PoiMarkers points={points} data={data as any} wantedType={WANTED_TYPE} onPressMarker={setSelectedMarker} />
        
        <Polyline
      coordinates={routeCoords}
    
    strokeColor="#000" // fallback for when `strokeColors` is not supported by the map-provider
    strokeColors={[
      '#7F0000',
      '#00000000', // no color, creates a "long" gradient between the previous and next coordinate
      '#B24112',
      '#E5845C',
      '#238C23',
      '#7F0000',
    ]}
    strokeWidth={3}
  />
  
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

