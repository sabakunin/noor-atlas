import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { getCurrentCoords, watchHeading, watchLocation, getLocationPermissionStatus } from "../services/location";
import { calculateQiblaBearing, resolveHeadingFromExpo, mapAccuracyToLabel, getRelativeAngle, getTurnHint } from "../services/qibla";
import { distanceKm, smoothAngle } from "../utils/angles";
import { KAABA_LAT, KAABA_LON } from "../services/qibla";

export function useQibla({ city }) {
  const [coords, setCoords] = useState(city ? { lat: city.lat, lon: city.lon } : null);
  const [heading, setHeading] = useState(null);
  const [accuracyLabel, setAccuracyLabel] = useState("unknown");
  const [bearing, setBearing] = useState(city ? calculateQiblaBearing(city.lat, city.lon) : null);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);

  const headingSubRef = useRef(null);
  const locationSubRef = useRef(null);
  const smoothedRef = useRef(null);
  const lastCommitRef = useRef(0);
  const bearingRef = useRef(city ? calculateQiblaBearing(city.lat, city.lon) : null);

  useEffect(() => {
    if (city) {
      setCoords({ lat: city.lat, lon: city.lon });
      const nextBearing = calculateQiblaBearing(city.lat, city.lon);
      bearingRef.current = nextBearing;
      setBearing(nextBearing);
    }
  }, [city]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        if (Platform.OS !== "web") {
          const perm = await getLocationPermissionStatus();
          if (!perm.granted) {
            return;
          }
        }
        const fresh = await getCurrentCoords();
        if (cancelled) return;
        setCoords(fresh);
        const nextBearing = calculateQiblaBearing(fresh.lat, fresh.lon);
        bearingRef.current = nextBearing;
        setBearing(nextBearing);
      } catch {
        /* keep city-based bearing */
      }
    }

    start();

    locationSubRef.current = watchLocation(
      (next) => {
        setCoords(next);
        const nextBearing = calculateQiblaBearing(next.lat, next.lon);
        if (bearingRef.current == null || Math.abs(nextBearing - bearingRef.current) > 0.2) {
          bearingRef.current = nextBearing;
          setBearing(nextBearing);
        }
      },
      () => undefined
    );

    headingSubRef.current = watchHeading(
      (data) => {
        const value = resolveHeadingFromExpo(data);
        if (value == null) return;
        const previous = smoothedRef.current ?? value;
        // Heavier low-pass: 0.12 (was 0.28) — much less jitter, slower follow
        const next = smoothAngle(previous, value, 0.12);
        smoothedRef.current = next;
        const now = Date.now();
        if (now - lastCommitRef.current >= 60) {
          lastCommitRef.current = now;
          setHeading(next);
        }
        if (data.accuracy != null) {
          setAccuracyLabel(mapAccuracyToLabel(data.accuracy));
        } else {
          setAccuracyLabel("medium");
        }
      },
      (err) => {
        setSupported(false);
        setError(err);
      }
    );

    return () => {
      cancelled = true;
      headingSubRef.current?.remove?.();
      locationSubRef.current?.remove?.();
    };
  }, []);

  const relativeAngle = getRelativeAngle(bearing, heading);
  const turnHint = getTurnHint(relativeAngle);
  const distance =
    coords?.lat != null && coords?.lon != null ? distanceKm(coords.lat, coords.lon, KAABA_LAT, KAABA_LON) : null;

  return {
    coords,
    bearing,
    heading,
    relativeAngle,
    turnHint,
    accuracyLabel,
    distance,
    supported,
    error,
  };
}
