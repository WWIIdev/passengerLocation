import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MdCheckCircle, MdLocationPin, MdMyLocation } from "react-icons/md";
import type Map from "@neshan-maps-platform/ol/Map";
import { toLonLat } from "@neshan-maps-platform/ol/proj";

import { callApi } from "../api/callApi";
import {
  GET_LOCATION_ADDRESS,
  SAVE_PASSENGER_LOCATION,
} from "../api/endpoints";
import Button from "../components/common/buttons/Button";
import BaseOpenLayerMap from "../components/map/BaseOpenLayerMap";
import type { LatLng } from "../components/map/types";
import { notify } from "../utils/notify/notify";

const HOME_LOCATION_STORAGE_KEY = "passengerHomeLocation";

type SavedLocation = LatLng & {
  address?: string;
};

type LocationState = {
  selectedLocation: SavedLocation;
  isSubmitted: boolean;
};

const DEFAULT_CENTER: LatLng = {
  lat: 35.7575,
  lng: 51.41,
};

const readSavedLocation = (): SavedLocation | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedValue = window.localStorage.getItem(HOME_LOCATION_STORAGE_KEY);

    if (!savedValue) {
      return null;
    }

    const parsedValue = JSON.parse(savedValue) as Partial<SavedLocation>;

    if (
      typeof parsedValue.lat !== "number" ||
      typeof parsedValue.lng !== "number"
    ) {
      return null;
    }

    return {
      lat: parsedValue.lat,
      lng: parsedValue.lng,
      address:
        typeof parsedValue.address === "string"
          ? parsedValue.address
          : undefined,
    };
  } catch {
    return null;
  }
};

const getInitialLocationState = (): LocationState => {
  const savedLocation = readSavedLocation();

  return {
    selectedLocation: savedLocation ?? DEFAULT_CENTER,
    isSubmitted: Boolean(savedLocation),
  };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const maybeApiError = error as {
    response?: {
      data?: {
        message?: unknown;
      };
    };
    message?: unknown;
  };

  if (typeof maybeApiError?.response?.data?.message === "string") {
    return maybeApiError.response.data.message;
  }

  if (typeof maybeApiError?.message === "string") {
    return maybeApiError.message;
  }

  return fallback;
};

const extractAddressText = (response: unknown) => {
  const apiResponse = response as {
    data?: unknown;
  };

  if (typeof apiResponse.data === "string") {
    return apiResponse.data;
  }

  if (!apiResponse.data || typeof apiResponse.data !== "object") {
    return "";
  }

  const data = apiResponse.data as Record<string, unknown>;
  const address =
    data.address ??
    data.formattedAddress ??
    data.locationTxt ??
    data.fullAddress ??
    data.title;

  return typeof address === "string" ? address : "";
};

const getLocationAddress = async (location: LatLng) => {
  const response = await callApi({
    url: GET_LOCATION_ADDRESS,
    method: "POST",
    data: {
      lat: location.lat,
      lng: location.lng,
    },
  });

  return extractAddressText(response);
};

const isSameLocation = (firstLocation: LatLng, secondLocation: LatLng) =>
  firstLocation.lat.toFixed(6) === secondLocation.lat.toFixed(6) &&
  firstLocation.lng.toFixed(6) === secondLocation.lng.toFixed(6);

export default function Home() {
  const [locationState, setLocationState] = useState(getInitialLocationState);
  const [followUserTrigger, setFollowUserTrigger] = useState(0);
  const [map, setMap] = useState<Map | null>(null);

  const selectedLocation = locationState.selectedLocation;
  const selectedAddress = locationState.selectedLocation.address ?? "";
  const isSubmitted = locationState.isSubmitted;

  const updateSelectedLocation = useCallback((map: Map) => {
    const center = map.getView().getCenter();

    if (!center) {
      return null;
    }

    const [lng, lat] = toLonLat(center);
    const nextLocation: SavedLocation = {
      lat,
      lng,
      address: undefined,
    };

    setLocationState((currentState) => ({
      ...currentState,
      selectedLocation: nextLocation,
    }));

    return nextLocation;
  }, []);

  const handleMapReady = useCallback(
    ({ map }: { map: Map }) => {
      setMap(map);
      updateSelectedLocation(map);
    },
    [updateSelectedLocation],
  );

  const {
    mutate: fetchAddress,
    isPending: isFetchingAddress,
    isError: hasAddressError,
  } = useMutation({
    mutationFn: async (location: LatLng) => {
      const address = await getLocationAddress(location);

      return {
        address,
        location,
      };
    },

    onSuccess: ({ address, location }) => {
      setLocationState((currentState) => {
        if (!isSameLocation(currentState.selectedLocation, location)) {
          return currentState;
        }

        return {
          ...currentState,
          selectedLocation: {
            ...currentState.selectedLocation,
            address,
          },
        };
      });
    },
  });

  const { mutate: saveLocation, isPending: isSaving } = useMutation({
    mutationFn: async (location: LatLng) => {
      const locationTxt =
        "address" in location && typeof location.address === "string"
          ? location.address
          : await getLocationAddress(location);

      const savedLocation: SavedLocation = {
        ...location,
        address: locationTxt,
      };

      const response = await callApi({
        url: SAVE_PASSENGER_LOCATION,
        method: "POST",
        data: {
          latitude: location.lat,
          longitude: location.lng,
          locationTxt,
        },
      });

      return {
        response,
        savedLocation,
      };
    },

    onSuccess: ({ response, savedLocation }) => {
      if (!response?.succeeded) {
        notify(response?.message ?? "ثبت موقعیت با خطا مواجه شد", "error");
        return;
      }

      window.localStorage.setItem(
        HOME_LOCATION_STORAGE_KEY,
        JSON.stringify(savedLocation),
      );

      setLocationState((currentState) => ({
        ...currentState,
        selectedLocation: savedLocation,
        isSubmitted: true,
      }));
    },

    onError: (error: unknown) => {
      notify(getErrorMessage(error, "خطایی در ثبت موقعیت رخ داد"), "error");
    },
  });

  useEffect(() => {
    if (!map) {
      return;
    }

    const handleMoveEnd = () => {
      const nextLocation = updateSelectedLocation(map);

      if (nextLocation) {
        fetchAddress(nextLocation);
      }
    };

    map.on("moveend", handleMoveEnd);

    return () => {
      map.un("moveend", handleMoveEnd);
    };
  }, [fetchAddress, map, updateSelectedLocation]);

  const submitLocation = () => {
    if (isSaving) {
      return;
    }

    saveLocation(selectedLocation);
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

                  {selectedAddress && (
                    <p className="mx-auto mt-3 max-w-sm text-size-sm font-bold leading-7 text-gray-text">
                      {selectedAddress}
                    </p>
                  )}
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

                <div className="mt-4 rounded-xl bg-background p-3 text-right text-size-base font-bold leading-7 text-navy">
                  {isFetchingAddress
                    ? "در حال دریافت آدرس..."
                    : hasAddressError
                      ? "آدرس این نقطه دریافت نشد"
                      : selectedAddress || "نقشه را جابه‌جا کنید تا آدرس نمایش داده شود."}
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
