import { normalizeAngle } from "../utils/angles";

export const KAABA_LAT = 21.4225;
export const KAABA_LON = 39.8262;

export function calculateQiblaBearing(lat, lon) {
  if (lat == null || lon == null) return null;
  const phi1 = (lat * Math.PI) / 180;
  const lambda1 = (lon * Math.PI) / 180;
  const phi2 = (KAABA_LAT * Math.PI) / 180;
  const lambda2 = (KAABA_LON * Math.PI) / 180;
  const deltaLambda = lambda2 - lambda1;
  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);
  return normalizeAngle((Math.atan2(y, x) * 180) / Math.PI);
}

export function resolveHeadingFromExpo(headingData) {
  if (!headingData) return null;
  if (typeof headingData.trueHeading === "number" && headingData.trueHeading >= 0) {
    return normalizeAngle(headingData.trueHeading);
  }
  if (typeof headingData.magHeading === "number") {
    return normalizeAngle(headingData.magHeading);
  }
  return null;
}

export function mapAccuracyToLabel(accuracy) {
  if (accuracy == null) return "unknown";
  if (accuracy >= 3) return "high";
  if (accuracy >= 2) return "medium";
  if (accuracy >= 1) return "low";
  return "calibration";
}

export function getRelativeAngle(qiblaBearing, heading) {
  if (qiblaBearing == null || heading == null) return null;
  return normalizeAngle(qiblaBearing - heading);
}

export function getTurnHint(relativeAngle) {
  if (relativeAngle == null) return null;
  if (relativeAngle <= 6 || relativeAngle >= 354) {
    return { aligned: true, direction: null, degrees: 0 };
  }
  if (relativeAngle < 180) {
    return { aligned: false, direction: "right", degrees: Math.round(relativeAngle) };
  }
  return { aligned: false, direction: "left", degrees: Math.round(360 - relativeAngle) };
}
