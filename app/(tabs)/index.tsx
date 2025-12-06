

import { useState, useEffect } from 'react';
import { Platform, Text, View, StyleSheet, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';

import * as Device from 'expo-device';
import * as Location from 'expo-location';
import data from '@/constants/data.json';
import { getOSRMRoute } from '@/hooks/getRoutes';

export default function HomeScreen() {
  const [region, setRegion] = useState<Region>({
    latitude: 53.1235,
    longitude: 18.0084,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [routeCoords, setRouteCoords] = useState([]);

  
const points = data.map(item => ({
  latitude: (item.x),
  longitude: (item.y),
}));

  useEffect(() => {
    async function loadRoute() {

      const route = await getOSRMRoute(points);
      if (route) {
        setRouteCoords(route.decoded);
      }
    }
    loadRoute();
  }, []);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [lastUpdateTs, setLastUpdateTs] = useState<number | null>(null);
  const [isManuallyPanning, setIsManuallyPanning] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  const metersBetween = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
    // Haversine distance in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371e3;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  };

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    async function startWatchingLocation() {
      if (Platform.OS === 'android' && !Device.isDevice) {
        setErrorMsg(
          'Oops, this will not work on Snack in an Android Emulator. Try it on your device!'
        );
        return;
      }
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Watch position for continuous updates (fallback source)
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // Update every 2 seconds
          distanceInterval: 5, // Update every 5 meters
          // activityType: Location.ActivityType.Fitness, // Removed: not supported in LocationOptions
          // pausesUpdatesAutomatically: true,
        },
        (newLocation) => {
          const { latitude, longitude, accuracy } = newLocation.coords;

          // Ignore noisy readings
          if (accuracy && accuracy > 30) return;

          const newCoords = { latitude, longitude };
          if (lastLocation) {
            const jumpMeters = metersBetween(lastLocation, newCoords);
            if (jumpMeters > 500) return; // ignore obvious teleport (>500m)
          }

          setUserLocation(newCoords);
          setLastLocation(newCoords);
          setLastUpdateTs(Date.now());

          if (!isManuallyPanning) {
            setRegion({
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      );
    }

    startWatchingLocation();

    // Cleanup function to stop watching location when component unmounts
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isManuallyPanning, lastLocation]);

  const handleUserLocationChange = (event: any) => {
    const coord = event?.nativeEvent?.coordinate;
    if (!coord) return;
    const { latitude, longitude, accuracy } = coord;

    if (accuracy && accuracy > 30) return;

    const newCoords = { latitude, longitude };
    if (lastLocation) {
      const jumpMeters = metersBetween(lastLocation, newCoords);
      if (jumpMeters > 500) return;
    }

    setUserLocation(newCoords);
    setLastLocation(newCoords);
    setLastUpdateTs(Date.now());

    if (!isManuallyPanning) {
      setRegion((prev) => ({
        latitude,
        longitude,
        latitudeDelta: prev.latitudeDelta,
        longitudeDelta: prev.longitudeDelta,
      }));
    }
  };

  const onRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
    setIsManuallyPanning(true);
    const timer = setTimeout(() => setIsManuallyPanning(false), 3000);
    return () => clearTimeout(timer);
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
      <MapView
        style={styles.map}
        region={region}
        onRegionChange={onRegionChange}
        showsUserLocation={true}
        followsUserLocation={false}
        onUserLocationChange={handleUserLocationChange}
      >
        {data.map((item, index) => {
          const typeColors: { [key: string]: string } = {
            sport: '#FF5733', // Example color for sport
            kultura: '#33FF57', // Example color for kultura
            historia: '#3357FF', // Example color for historia
          };

          const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16);
          const color = typeColors[item.type.toLowerCase()] || getRandomColor();  return (
            <Marker
              key={index}
              coordinate={{ latitude: item.x, longitude: item.y }}
              title={item.name}
              description={item.type}
              pinColor={color}
              onPress={() => setSelectedMarker(item)}
            />
          );
        })} 
        
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
    strokeWidth={6}
  />
  
   </MapView>

      {/* Modal for marker details */}
      <Modal
        visible={selectedMarker !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedMarker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedMarker(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedMarker?.img && (
                <Image
                  source={{ uri: selectedMarker.img }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}

            
              <Text style={styles.modalTitle}>{selectedMarker?.name}</Text>
              <Text style={styles.modalType}>{selectedMarker?.type}</Text>
              <Text style={styles.modalDescription}>{selectedMarker?.description}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
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

