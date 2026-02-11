// lib/geo.ts
export type GeoFix = {
  latitude: number;
  longitude: number;
  accuracy_m: number;
};

export async function getGeoPermissionState():
    Promise<"granted" | "prompt" | "denied" | "unknown">
{
  try {
    const anyNav: any = navigator;
    const p = await anyNav.permissions?.query({ name: "geolocation" as PermissionName });
    return p?.state ?? "unknown";
  } catch {
    return "unknown"; // Safari often lands here
  }
}

function toFix(pos: GeolocationPosition): GeoFix {
  return {
    latitude: Number(pos.coords.latitude.toFixed(6)),
    longitude: Number(pos.coords.longitude.toFixed(6)),
    accuracy_m: Math.round(pos.coords.accuracy ?? 0),
  };
}

function getPos(opts: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}

export async function getPositionOnce(): Promise<GeoFix> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    throw new Error("GeolocationUnsupported");
  }

  // Strategy:
  // 1) Try high accuracy with a more realistic timeout and allow a recent cached fix.
  // 2) If it TIMEOUTs, fallback to low accuracy (often faster indoors / on desktop).
  try {
    const pos = await getPos({
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 30000,
    });
    return toFix(pos);
  } catch (e: any) {
    // TIMEOUT (code 3) → fallback
    if (e?.code === 3) {
      const pos = await getPos({
        enableHighAccuracy: false,
        timeout: 25000,
        maximumAge: 60000,
      });
      return toFix(pos);
    }
    throw e;
  }
}

/** Returns a short browser-specific hint for where to change the setting */
export function getPermissionInstructions(): { title: string; steps: string[] } {
  const ua = navigator.userAgent.toLowerCase();
  const isChrome = ua.includes("chrome") && !ua.includes("edg");
  const isEdge = ua.includes("edg");
  const isFirefox = ua.includes("firefox");
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari =
      (!isChrome && !isEdge && ua.includes("safari")) || (isIOS && ua.includes("safari"));

  if (isChrome || isEdge || isFirefox) {
    return {
      title: "Enable location in your browser",
      steps: [
        "Click the lock icon next to the address bar.",
        "Open Site settings (or Permissions).",
        "Set Location to Allow for this site, then reload.",
      ],
    };
  }
  if (isSafari && !isIOS) {
    return {
      title: "Enable location in Safari",
      steps: [
        "Safari → Settings… → Websites → Location.",
        "Find this site and set it to Allow.",
        "Reload the page.",
      ],
    };
  }
  // iOS Safari (and generic fallback)
  return {
    title: "Enable location in settings",
    steps: [
      "Tap the A button → Website Settings → Location → Allow.",
      "If that’s missing: iOS Settings → Privacy & Security → Location Services.",
      "Open Safari Websites and set to While Using the App, then return and reload.",
    ],
  };
}
