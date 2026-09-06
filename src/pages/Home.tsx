import { useCallback, useEffect, useRef, useState } from "react";
import { MdCheckCircle, MdLocationPin, MdMyLocation } from "react-icons/md";
import type Map from "@neshan-maps-platform/ol/Map";
import { toLonLat } from "@neshan-maps-platform/ol/proj";

import Button from "../components/common/buttons/Button";
import BaseOpenLayerMap from "../components/map/BaseOpenLayerMap";
import type { LatLng } from "../components/map/types";

const HOME_LOCATION_STORAGE_KEY = "passengerHomeLocation";

const DEFAULT_CENTER: LatLng = {
  lat: 35.7575,
  lng: 51.41,
};

const formatCoordinate = (value: number) =>
  new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 6,
  }).format(value);

const readSavedLocation = (): LatLng | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedValue = window.localStorage.getItem(HOME_LOCATION_STORAGE_KEY);

    if (!savedValue) {
      return null;
    }

    const parsedValue = JSON.parse(savedValue) as Partial<LatLng>;

    if (
      typeof parsedValue.lat !== "number" ||
      typeof parsedValue.lng !== "number"
    ) {
      return null;
    }

    return {
      lat: parsedValue.lat,
      lng: parsedValue.lng,
    };
  } catch {
    return null;
  }
};

const getInitialLocationState = () => {
  const savedLocation = readSavedLocation();

  return {
    selectedLocation: savedLocation ?? DEFAULT_CENTER,
    isSubmitted: Boolean(savedLocation),
  };
};

export default function Home() {
  const [locationState, setLocationState] = useState(getInitialLocationState);
  const [isSaving, setIsSaving] = useState(false);
  const [followUserTrigger, setFollowUserTrigger] = useState(0);
  const [map, setMap] = useState<Map | null>(null);

  const saveTimeoutRef = useRef<number | null>(null);
  const selectedLocation = locationState.selectedLocation;
  const isSubmitted = locationState.isSubmitted;

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const updateSelectedLocation = useCallback((map: Map) => {
    const center = map.getView().getCenter();

    if (!center) {
      return;
    }

    const [lng, lat] = toLonLat(center);

    setLocationState((currentState) => ({
      ...currentState,
      selectedLocation: {
        lat,
        lng,
      },
    }));
  }, []);

  const handleMapReady = useCallback(
    ({ map }: { map: Map }) => {
      setMap(map);
      updateSelectedLocation(map);
    },
    [updateSelectedLocation],
  );

  useEffect(() => {
    if (!map) {
      return;
    }

    const handleMoveEnd = () => {
      updateSelectedLocation(map);
    };

    map.on("moveend", handleMoveEnd);

    return () => {
      map.un("moveend", handleMoveEnd);
    };
  }, [map, updateSelectedLocation]);

  const submitLocation = () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    window.localStorage.setItem(
      HOME_LOCATION_STORAGE_KEY,
      JSON.stringify(selectedLocation),
    );

    saveTimeoutRef.current = window.setTimeout(() => {
      setIsSaving(false);
      setLocationState((currentState) => ({
        ...currentState,
        isSubmitted: true,
      }));
    }, 650);
  };

  if (isSubmitted) {
    return (
      <>
        <header className="sticky top-0 z-[99] bg-white px-5 py-4 text-center shadow shadow-gray-50">
          <h1 className="text-size-lg font-bold text-secondary">
            پایان ثبت‌نام
          </h1>
        </header>

        <main className="relative flex min-h-0 flex-1 flex-col bg-white">
          <BaseOpenLayerMap
            center={selectedLocation}
            zoom={16}
            className="min-h-0 flex-1"
            showUserLocation={false}
            overlay={
              <>
                <div className="pointer-events-auto absolute inset-0 z-20" />

                <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-full text-primary drop-shadow-[0_8px_16px_rgba(28,48,85,0.25)]">
                  <MdLocationPin size={46} />
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-white px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5 text-center shadow-[0_-14px_36px_rgba(28,48,85,0.12)]">
                  <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-light text-success">
                    <MdCheckCircle size={42} />
                  </span>

                  <h1 className="mt-4 text-size-2xl font-extrabold leading-9 text-secondary">
                    موقعیت شما در سامانه ثبت شد
                  </h1>
                </div>
              </>
            }
          />
        </main>
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-[99] bg-white px-5 py-4 text-center shadow shadow-gray-50">
        <h1 className="text-size-lg font-bold text-secondary">
          ثبت موقعیت منزل
        </h1>
      </header>

      <section className="relative flex min-h-0 flex-1 flex-col bg-white">
        <BaseOpenLayerMap
          center={selectedLocation}
          zoom={15}
          className="min-h-0 flex-1"
          followUserTrigger={followUserTrigger}
          onReady={handleMapReady}
          overlay={
            <>
              <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-full text-primary drop-shadow-[0_8px_16px_rgba(28,48,85,0.25)]">
                <MdLocationPin size={46} />
              </div>

              <button
                type="button"
                aria-label="رفتن به موقعیت فعلی"
                onClick={() => setFollowUserTrigger((value) => value + 1)}
                className="pointer-events-auto absolute left-5 top-5 z-20 flex size-12 items-center justify-center rounded-xl bg-white text-secondary shadow-[0_8px_24px_rgba(28,48,85,0.16)]"
              >
                <MdMyLocation size={24} />
              </button>

              <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 bg-white px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-5 shadow-[0_-14px_36px_rgba(28,48,85,0.12)]">
                <p className="text-right text-size-lg font-extrabold text-secondary">
                  محل منزل را روی نقشه مشخص کنید
                </p>

                <p className="mt-2 text-right text-size-sm font-medium leading-6 text-gray-text">
                  نقشه را جابه‌جا کنید تا نشانگر روی موقعیت منزل قرار بگیرد.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-background p-3 text-right text-size-xs font-bold text-gray-text">
                  <span>عرض: {formatCoordinate(selectedLocation.lat)}</span>
                  <span>طول: {formatCoordinate(selectedLocation.lng)}</span>
                </div>

                <Button
                  type="button"
                  theme="secondary"
                  fullWidth
                  className="mt-4"
                  loading={isSaving}
                  disabled={isSaving}
                  onClick={submitLocation}
                >
                  ثبت موقعیت منزل
                </Button>
              </div>
            </>
          }
        />
      </section>
    </>
  );
}
