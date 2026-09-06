import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { MdClose, MdLocationOff, MdMyLocation } from "react-icons/md";

import NeshanMap from "@neshan-maps-platform/react-openlayers";
import "@neshan-maps-platform/ol/ol.css";
import "@neshan-maps-platform/react-openlayers/dist/style.css";

import Feature from "@neshan-maps-platform/ol/Feature";
import Map from "@neshan-maps-platform/ol/Map";
import Point from "@neshan-maps-platform/ol/geom/Point";
import VectorLayer from "@neshan-maps-platform/ol/layer/Vector";
import VectorSource from "@neshan-maps-platform/ol/source/Vector";
import { fromLonLat } from "@neshan-maps-platform/ol/proj";
import CircleStyle from "@neshan-maps-platform/ol/style/Circle";
import Fill from "@neshan-maps-platform/ol/style/Fill";
import Stroke from "@neshan-maps-platform/ol/style/Stroke";
import Style from "@neshan-maps-platform/ol/style/Style";

import Button from "../common/buttons/Button";
import { defaultOptions } from "./neshanOptions";
import type { BaseMapReadyPayload, LatLng } from "./types";

type BaseOpenLayerMapProps = {
  center?: LatLng;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  overlay?: ReactNode;
  followUserTrigger?: number;
  showUserLocation?: boolean;
  onReady?: (payload: BaseMapReadyPayload) => void;
};

const DEFAULT_CENTER: LatLng = {
  lat: 35.7575,
  lng: 51.41,
};

type LocationErrorReason = "permission" | "unsupported" | "unavailable";
type LocationDeviceKind = "ios" | "android" | "default";
type LocationGuideKind =
  | "iosStandalone"
  | "iosBrowser"
  | "androidStandalone"
  | "androidBrowser"
  | "default";

const normalizeCenter = (center?: LatLng) => center ?? DEFAULT_CENTER;

const resolveLocationErrorReason = (
  error?: GeolocationPositionError,
): LocationErrorReason => {
  if (!error) {
    return "unavailable";
  }

  return error.code === error.PERMISSION_DENIED
    ? "permission"
    : "unavailable";
};

const resolveLocationDeviceKind = (): LocationDeviceKind => {
  if (typeof navigator === "undefined") {
    return "default";
  }

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const isTouchMac =
    platform === "MacIntel" && navigator.maxTouchPoints > 1;

  if (/iPad|iPhone|iPod/.test(userAgent) || isTouchMac) {
    return "ios";
  }

  if (/Android/i.test(userAgent)) {
    return "android";
  }

  return "default";
};

const resolveIsStandalonePwa = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const standaloneNavigator = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    standaloneNavigator.standalone === true
  );
};

const resolveLocationGuideKind = (): LocationGuideKind => {
  const deviceKind = resolveLocationDeviceKind();
  const isStandalone = resolveIsStandalonePwa();

  if (deviceKind === "ios") {
    return isStandalone ? "iosStandalone" : "iosBrowser";
  }

  if (deviceKind === "android") {
    return isStandalone ? "androidStandalone" : "androidBrowser";
  }

  return "default";
};

const locationAccessGuides: Record<
  LocationGuideKind,
  {
    description: string;
    unavailableDescription: string;
    steps: string[];
  }
> = {
  iosStandalone: {
    description:
      "برای نمایش موقعیت فعلی در اپ نصب‌شده، دسترسی موقعیت مکانی را از تنظیمات فعال کنید.",
    unavailableDescription:
      "موقعیت فعلی دریافت نشد. لوکیشن دستگاه و دسترسی موقعیت مکانی این برنامه را بررسی کنید.",
    steps: [
      "۱. Settings دستگاه را باز کنید.",
      "۲. وارد Privacy & Security > Location Services شوید.",
      "۳. Location Services را روشن کنید.",
      "۴. نام این برنامه یا Safari Websites را پیدا کنید و دسترسی Location را روی Allow بگذارید.",
      "۵. به برنامه برگردید و دوباره «موقعیت فعلی» را بزنید.",
    ],
  },
  iosBrowser: {
    description:
      "برای نمایش موقعیت فعلی در iPhone یا iPad، دسترسی موقعیت مکانی سایت را در Safari فعال کنید.",
    unavailableDescription:
      "موقعیت فعلی دریافت نشد. لوکیشن دستگاه و دسترسی Safari به موقعیت مکانی را بررسی کنید.",
    steps: [
      "۱. در Safari روی aA یا آیکن تنظیمات کنار آدرس سایت بزنید.",
      "۲. Website Settings را باز کنید.",
      "۳. Location را روی Allow قرار دهید.",
      "۴. اگر گزینه را ندیدید، از Settings > Privacy & Security > Location Services دسترسی Safari را روشن کنید.",
      "۵. به برنامه برگردید و دوباره «موقعیت فعلی» را بزنید.",
    ],
  },
  androidStandalone: {
    description:
      "برای نمایش موقعیت فعلی در اپ نصب‌شده، دسترسی Location را از تنظیمات Android فعال کنید.",
    unavailableDescription:
      "موقعیت فعلی دریافت نشد. لوکیشن دستگاه و دسترسی Location این برنامه را بررسی کنید.",
    steps: [
      "۱. آیکن برنامه را چند لحظه نگه دارید و App info را باز کنید.",
      "۲. وارد Permissions شوید.",
      "۳. Location را انتخاب کنید.",
      "۴. گزینه Allow only while using the app را فعال کنید.",
      "۵. به برنامه برگردید و دوباره «موقعیت فعلی» را بزنید.",
    ],
  },
  androidBrowser: {
    description:
      "برای نمایش موقعیت فعلی در Android، دسترسی Location سایت را در مرورگر فعال کنید.",
    unavailableDescription:
      "موقعیت فعلی دریافت نشد. لوکیشن دستگاه و دسترسی مرورگر به Location را بررسی کنید.",
    steps: [
      "۱. در مرورگر روی آیکن قفل یا تنظیمات کنار آدرس سایت بزنید.",
      "۲. وارد Permissions یا Site settings شوید.",
      "۳. Location را روی Allow قرار دهید.",
      "۴. اگر هنوز کار نکرد، از Settings گوشی > Apps > مرورگر > Permissions دسترسی Location را فعال کنید.",
      "۵. به برنامه برگردید و دوباره «موقعیت فعلی» را بزنید.",
    ],
  },
  default: {
    description:
      "برای نمایش موقعیت فعلی، دسترسی لوکیشن مرورگر را فعال کنید.",
    unavailableDescription:
      "موقعیت فعلی دریافت نشد. لوکیشن دستگاه و دسترسی مرورگر را بررسی کنید.",
    steps: [
      "۱. روی آیکن قفل یا تنظیمات کنار آدرس سایت بزنید.",
      "۲. بخش Location یا موقعیت مکانی را روی Allow قرار دهید.",
      "۳. صفحه را رفرش کنید.",
      "۴. دوباره «موقعیت فعلی» را بزنید.",
    ],
  },
};

function LocationAccessModal({
  open,
  reason,
  onClose,
  onRetry,
}: {
  open: boolean;
  reason: LocationErrorReason;
  onClose: () => void;
  onRetry: () => void;
}) {
  if (!open) {
    return null;
  }

  const isUnsupported = reason === "unsupported";
  const guide = locationAccessGuides[resolveLocationGuideKind()];
  const description =
    reason === "unavailable"
      ? guide.unavailableDescription
      : guide.description;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-dark/45 px-5 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-access-title"
      dir="rtl"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-5 text-right shadow-[0_18px_52px_rgba(28,48,85,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
              <MdLocationOff size={24} />
            </span>

            <div>
              <h2
                id="location-access-title"
                className="text-size-lg font-bold text-dark"
              >
                دسترسی به موقعیت مکانی
              </h2>
              <p className="mt-1 text-size-sm font-medium text-gray-text">
                {isUnsupported
                  ? "مرورگر شما مکان‌یابی را پشتیبانی نمی‌کند."
                  : description}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="بستن"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray-text"
          >
            <MdClose size={22} />
          </button>
        </div>

        {!isUnsupported && (
          <ol className="mt-5 space-y-3 text-size-sm font-medium leading-7 text-secondary">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            type="button"
            theme="secondaryOutline"
            size="sm"
            fullWidth
            onClick={onClose}
          >
            متوجه شدم
          </Button>

          <Button
            type="button"
            theme="primary"
            size="sm"
            fullWidth
            disabled={isUnsupported}
            icon={<MdMyLocation size={20} />}
            onClick={onRetry}
          >
            تلاش دوباره
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BaseOpenLayerMap({
  center,
  zoom = 15,
  minZoom = 4,
  maxZoom = 20,
  className = "",
  overlay,
  followUserTrigger,
  showUserLocation = true,
  onReady,
}: BaseOpenLayerMapProps) {
  const mapRef = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [readyMap, setReadyMap] = useState<Map | null>(null);
  const [mapHeight, setMapHeight] = useState<number | null>(null);
  const [locationHelpOpen, setLocationHelpOpen] = useState(false);
  const [locationErrorReason, setLocationErrorReason] =
    useState<LocationErrorReason>("permission");

  const userFeatureRef = useRef<Feature<Point> | null>(null);
  const userLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const userCoordinateRef = useRef<LatLng | null>(null);

  const mapKey = defaultOptions.key ?? "";
  const initialCenter = normalizeCenter(center);

  const ensureUserLayer = useCallback(
    (map: Map) => {
      if (userLayerRef.current) {
        return;
      }

      const feature = new Feature({
        geometry: new Point(
          fromLonLat([initialCenter.lng, initialCenter.lat]),
        ),
      });

      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({
              color: "rgba(68, 148, 239, 0.95)",
            }),
            stroke: new Stroke({
              color: "rgba(255, 255, 255, 0.95)",
              width: 4,
            }),
          }),
        }),
      );

      const layer = new VectorLayer({
        source: new VectorSource({
          features: [feature],
        }),
        zIndex: 30,
      });

      userFeatureRef.current = feature;
      userLayerRef.current = layer;

      map.addLayer(layer);
    },
    [initialCenter.lat, initialCenter.lng],
  );

  const showLocationHelp = useCallback((reason: LocationErrorReason) => {
    setLocationErrorReason(reason);
    setLocationHelpOpen(true);
  }, []);

  const handleLocationError = useCallback(
    (error?: GeolocationPositionError) => {
      showLocationHelp(resolveLocationErrorReason(error));
    },
    [showLocationHelp],
  );

  const updateUserLocation = useCallback(
    (
      map: Map,
      position: GeolocationPosition,
      shouldFocus = false,
    ) => {
      const nextCoordinate: LatLng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      ensureUserLayer(map);
      userCoordinateRef.current = nextCoordinate;

      const mapCoordinate = fromLonLat([
        nextCoordinate.lng,
        nextCoordinate.lat,
      ]);

      userFeatureRef.current
        ?.getGeometry()
        ?.setCoordinates(mapCoordinate);

      if (shouldFocus) {
        map.getView().animate({
          center: mapCoordinate,
          duration: 350,
        });
      }
    },
    [ensureUserLayer],
  );

  const focusUserLocation = useCallback(() => {
    const map = mapRef.current;
    const coordinate = userCoordinateRef.current;

    if (!map || !coordinate) {
      return false;
    }

    map.getView().animate({
      center: fromLonLat([coordinate.lng, coordinate.lat]),
      duration: 350,
    });

    return true;
  }, []);

  const requestUserLocation = useCallback(() => {
    const map = mapRef.current;

    if (!navigator.geolocation) {
      showLocationHelp("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!map) {
          return;
        }

        setLocationHelpOpen(false);
        updateUserLocation(map, position, true);
      },
      handleLocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 12000,
      },
    );
  }, [handleLocationError, showLocationHelp, updateUserLocation]);

  const handleInit = useCallback(
    (map: Map) => {
      mapRef.current = map;
      setReadyMap(map);

      const view = map.getView();

      view.setMinZoom(minZoom);
      view.setMaxZoom(maxZoom);

      requestAnimationFrame(() => {
        map.updateSize();
      });

      window.setTimeout(() => {
        map.updateSize();
      }, 120);

      onReady?.({ map });
    },
    [maxZoom, minZoom, onReady],
  );

  useLayoutEffect(() => {
    const container = mapContainerRef.current;

    if (!container) {
      return;
    }

    let frame = 0;

    const updateContainerHeight = () => {
      window.cancelAnimationFrame(frame);

      frame = window.requestAnimationFrame(() => {
        const nextHeight = Math.round(
          container.getBoundingClientRect().height,
        );

        if (nextHeight <= 0) {
          return;
        }

        setMapHeight((currentHeight) =>
          currentHeight === nextHeight ? currentHeight : nextHeight,
        );
      });
    };

    const observer = new ResizeObserver(() => {
      updateContainerHeight();
    });

    observer.observe(container);

    updateContainerHeight();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!readyMap || !mapHeight) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      readyMap.updateSize();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [mapHeight, readyMap]);

  useEffect(() => {
    const map = readyMap;

    if (!showUserLocation || !map) {
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        updateUserLocation(map, position);
      },
      (error) => {
        setLocationErrorReason(resolveLocationErrorReason(error));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 12000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [readyMap, showUserLocation, updateUserLocation]);

  useEffect(() => {
    if (!followUserTrigger) {
      return;
    }

    if (!focusUserLocation()) {
      const frame = window.requestAnimationFrame(requestUserLocation);

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }
  }, [focusUserLocation, followUserTrigger, requestUserLocation]);

  return (
    <div
      ref={mapContainerRef}
      className={`relative flex h-full min-h-0 flex-1 overflow-hidden ${className}`}
    >
      <NeshanMap
        mapKey={mapKey}
        defaultType="neshan"
        center={{
          latitude: initialCenter.lat,
          longitude: initialCenter.lng,
        }}
        zoom={zoom}
        traffic={false}
        poi
        style={{
          flex: "1 1 0%",
          height: mapHeight ? `${mapHeight}px` : "100%",
          width: "100%",
        }}
        onInit={handleInit}
      />

      {overlay && (
        <div className="pointer-events-none absolute inset-0">
          {overlay}
        </div>
      )}

      <LocationAccessModal
        open={locationHelpOpen}
        reason={locationErrorReason}
        onClose={() => setLocationHelpOpen(false)}
        onRetry={requestUserLocation}
      />
    </div>
  );
}
