import { Platform } from "react-native";
import * as Location from "expo-location";

export async function requestLocationPermission() {
  if (Platform.OS === "web") {
    return { granted: true, status: "granted" };
  }
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return { granted: status === "granted", status };
  } catch (e) {
    return { granted: false, status: "error", error: e };
  }
}

export async function getLocationPermissionStatus() {
  if (Platform.OS === "web") return { granted: true, status: "granted" };
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return { granted: status === "granted", status };
  } catch {
    return { granted: false, status: "error" };
  }
}

export async function getCurrentCoords() {
  if (Platform.OS === "web") {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("Geolocation API unavailable"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      );
    });
  }
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { lat: position.coords.latitude, lon: position.coords.longitude };
}

export async function reverseGeocode(lat, lon) {
  if (Platform.OS === "web") return null;
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    if (!results || !results.length) return null;
    const r = results[0];
    return {
      city: r.city || r.subregion || r.region || null,
      country: r.country || null,
    };
  } catch {
    return null;
  }
}

export function watchLocation(onUpdate, onError) {
  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onError?.(new Error("Geolocation API unavailable"));
      return { remove: () => undefined };
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => onUpdate({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => onError?.(err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return { remove: () => navigator.geolocation.clearWatch(watchId) };
  }
  let sub = null;
  Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 60000 },
    (pos) => onUpdate({ lat: pos.coords.latitude, lon: pos.coords.longitude })
  )
    .then((s) => {
      sub = s;
    })
    .catch((e) => onError?.(e));
  return {
    remove: () => {
      sub?.remove?.();
    },
  };
}

export async function watchHeading(onUpdate, onError) {
  if (Platform.OS === "web") {
    return startWebOrientationWatch(onUpdate, onError);
  }
  try {
    const sub = await Location.watchHeadingAsync(onUpdate);
    return { remove: () => sub?.remove?.() };
  } catch (e) {
    onError?.(e);
    return { remove: () => undefined };
  }
}

function startWebOrientationWatch(onUpdate, onError) {
  if (typeof window === "undefined") {
    onError?.(new Error("window unavailable"));
    return { remove: () => undefined };
  }

  const handler = (event) => {
    let trueHeading = null;
    let magHeading = null;
    if (typeof event.webkitCompassHeading === "number") {
      trueHeading = event.webkitCompassHeading;
      magHeading = event.webkitCompassHeading;
    } else if (typeof event.alpha === "number") {
      magHeading = (360 - event.alpha) % 360;
      if (event.absolute) trueHeading = magHeading;
    }
    if (magHeading == null) return;
    onUpdate({
      trueHeading,
      magHeading,
      accuracy: event.absolute ? 3 : 1,
    });
  };

  const start = () => {
    window.addEventListener("deviceorientationabsolute", handler, true);
    window.addEventListener("deviceorientation", handler, true);
  };

  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    DeviceOrientationEvent.requestPermission()
      .then((result) => {
        if (result === "granted") start();
        else onError?.(new Error("orientation permission denied"));
      })
      .catch((e) => onError?.(e));
  } else {
    start();
  }

  return {
    remove: () => {
      window.removeEventListener("deviceorientationabsolute", handler, true);
      window.removeEventListener("deviceorientation", handler, true);
    },
  };
}
