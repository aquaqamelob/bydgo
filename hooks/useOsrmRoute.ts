import { useEffect, useState } from 'react';
import { getOSRMRoute } from '@/hooks/getRoutes';
import { LatLng } from '@/utils/geo';

export function useOsrmRoute(points: LatLng[]) {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadRoute() {
      try {
        if (!points || points.length === 0) return;
        setIsLoading(true);
        const route = await getOSRMRoute(points);
        if (!cancelled && route) {
          setRouteCoords(route.decoded);
          setDistance(route.distance);
          setDuration(route.duration);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Route error');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(points)]);

  return { routeCoords, distance, duration, error, isLoading };
}
