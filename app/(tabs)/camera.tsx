import { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import data from '@/constants/message.json';
import { metersBetween } from '@/utils/geo';

export default function CameraScreen() {
  const [heading, setHeading] = useState(0);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearestTarget, setNearestTarget] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    async function startWatchingLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setUserLocation({ latitude, longitude });
        }
      );
    }

    startWatchingLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Compute nearest target from message.json
  useEffect(() => {
    if (!userLocation) return;
    const points = data.map((item: any) => ({ latitude: item.x, longitude: item.y }));
    let nearest = null as { latitude: number; longitude: number } | null;
    let best = Infinity;
    for (const p of points) {
      const d = metersBetween(userLocation, p);
      if (d < best) {
        best = d;
        nearest = p;
      }
    }
    setNearestTarget(nearest);
  }, [userLocation]);

  useEffect(() => {
    // Set magnetometer update interval
    Magnetometer.setUpdateInterval(100);

    const subscription = Magnetometer.addListener(({ x, y, z }) => {
      // Calculate heading from magnetometer data
      let headingValue = Math.atan2(y, x) * (180 / Math.PI);
      
      // Normalize to 0-360
      if (headingValue < 0) {
        headingValue = 360 + headingValue;
      }

      setHeading(headingValue);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission required</Text>
        <Button onPress={requestPermission} title='Grant persmission'></Button>
      </View>
    );
  }

  // Bearing from point A to B
  const bearingTo = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = toDeg(Math.atan2(y, x));
    if (brng < 0) brng += 360;
    return brng;
  };

  const targetBearing = userLocation && nearestTarget ? bearingTo(userLocation, nearestTarget) : null;
  const arrowRotation = targetBearing != null ? ((targetBearing - heading + 360) % 360) : 0;

  return (
    <View style={styles.container}>
      {/* Camera Feed */}
      <CameraView style={styles.camera} ref={cameraRef} facing="back" />

      {/* 1D Compass Line at Bottom with Arrow to nearest marker */}
      <View style={styles.bottomCompass}>
        <View style={styles.line} />
        <View style={[styles.arrow, { transform: [{ rotate: `${arrowRotation}deg` }] }]} />
        <Text style={styles.bottomText}>
          {targetBearing != null ? `Bearing: ${Math.round(targetBearing)}° | Heading: ${Math.round(heading)}°` : 'Finding target...'}
        </Text>
      </View>

      {/* Location info at bottom */}
      <View style={styles.infoContainer}>
        {userLocation ? (
          <>
            <Text style={styles.infoText}>Lat: {userLocation.latitude.toFixed(6)}</Text>
            <Text style={styles.infoText}>Lon: {userLocation.longitude.toFixed(6)}</Text>
          </>
        ) : (
          <Text style={styles.infoText}>Getting location...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  bottomCompass: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0099ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    position: 'absolute',
    top: 28,
    left: 16,
    right: 16,
    height: 4,
    backgroundColor: '#0099ff',
    borderRadius: 2,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ffcc00',
  },
  bottomText: {
    position: 'absolute',
    bottom: 6,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0099ff',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0099ff',
  },
  infoText: {
    fontSize: 12,
    color: '#0099ff',
    marginVertical: 3,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
  },
});
