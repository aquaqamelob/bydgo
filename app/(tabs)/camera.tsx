import { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Button } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraScreen() {
  const [heading, setHeading] = useState(0);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
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

  return (
    <View style={styles.container}>
      {/* Camera Feed */}
      <CameraView style={styles.camera} ref={cameraRef} facing="back" />

      {/* Compass Overlay */}
      <View style={styles.compassOverlay}>
        <View style={styles.compassContainer}>
          {/* Rotating compass ring */}
          <View
            style={[
              styles.compassRing,
              {
                transform: [{ rotate: `${-heading}deg` }],
              },
            ]}
          >
            {/* Cardinal directions */}
            <Text style={[styles.cardinalText, styles.north]}>N</Text>
            <Text style={[styles.cardinalText, styles.east]}>E</Text>
            <Text style={[styles.cardinalText, styles.south]}>S</Text>
            <Text style={[styles.cardinalText, styles.west]}>W</Text>

            {/* Degree markers */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((degree) => (
              <View
                key={degree}
                style={[
                  styles.degreeMarker,
                  {
                    transform: [
                      { rotate: `${degree}deg` },
                      { translateY: -90 },
                    ],
                  },
                ]}
              />
            ))}
          </View>

          {/* Center blue dot (0 degrees / North indicator) */}
          <View style={styles.centerDot} />

          {/* Heading display */}
          <Text style={styles.headingText}>{Math.round(heading)}°</Text>
        </View>
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
  compassOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  compassContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0099ff',
  },
  compassRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardinalText: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0099ff',
  },
  north: {
    top: 8,
  },
  east: {
    right: 8,
  },
  south: {
    bottom: 8,
  },
  west: {
    left: 8,
  },
  degreeMarker: {
    width: 1.5,
    height: 12,
    backgroundColor: '#666',
    position: 'absolute',
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0099ff',
    position: 'absolute',
    zIndex: 10,
    shadowColor: '#0099ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  headingText: {
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
