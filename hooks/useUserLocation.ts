import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { metersBetween, LatLng } from '@/utils/geo';

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState({
    latitude: 53.1235,
    longitude: 18.0084,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const lastLocationRef = useRef<LatLng | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    async function startWatchingLocation() {
      if (Platform.OS === 'android' && !Device.isDevice) {
        setErrorMsg('Android emulator not supported for precise location.');
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Seed initial region from last known position if available
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown?.coords) {
          const { latitude, longitude } = lastKnown.coords;
          const seed = { latitude, longitude };
          setUserLocation(seed);
          lastLocationRef.current = seed;
          setRegion((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
        }
      } catch {}

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (newLocation) => {
          const { latitude, longitude, accuracy } = newLocation.coords;
          // Relax accuracy slightly to improve initial fix availability
          if (accuracy && accuracy > 100) return;
          const newCoords = { latitude, longitude };
          const lastLocation = lastLocationRef.current;
          if (lastLocation) {
            const jumpMeters = metersBetween(lastLocation, newCoords);
            if (jumpMeters > 500) return;
          }
          setUserLocation(newCoords);
          lastLocationRef.current = newCoords;
          setRegion((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
        }
      );

      // Fallback: if no fix arrives quickly, seed from current region
      fallbackTimer = setTimeout(() => {
        if (!lastLocationRef.current) {
          const fallback = { latitude: region.latitude, longitude: region.longitude };
          setUserLocation(fallback);
          lastLocationRef.current = fallback;
        }
      }, 5000);
    }

    startWatchingLocation();
    return () => {
      if (locationSubscription) locationSubscription.remove();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  return { userLocation, errorMsg, region, setRegion };
}
