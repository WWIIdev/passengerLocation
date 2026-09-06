import type Map from "@neshan-maps-platform/ol/Map";

export type LatLng = {
  lat: number;
  lng: number;
};

export type BaseMapReadyPayload = {
  map: Map;
};
