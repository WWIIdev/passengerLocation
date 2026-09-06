/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_NESHAN_MAP_KEY?: string;
  readonly VITE_NESHAN_SERVICE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface BarcodeDetectorResult {
  rawValue: string;
}

interface BarcodeDetector {
  detect(image: HTMLImageElement | HTMLVideoElement): Promise<BarcodeDetectorResult[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetector;
}

interface Window {
  BarcodeDetector?: BarcodeDetectorConstructor;
}

declare module "@neshan-maps-platform/react-openlayers" {
  import type { CSSProperties, ForwardRefExoticComponent, RefAttributes } from "react";
  import type Map from "@neshan-maps-platform/ol/Map";

  export type NeshanMapRef = {
    map?: Map;
  };

  type NeshanMapProps = {
    mapKey: string;
    defaultType?: string;
    center?: {
      latitude: number;
      longitude: number;
    };
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    traffic?: boolean;
    poi?: boolean;
    style?: CSSProperties;
    onInit?: (map: Map) => void;
  };

  const NeshanMap: ForwardRefExoticComponent<
    NeshanMapProps & RefAttributes<NeshanMapRef>
  >;

  export default NeshanMap;
}

declare module "@mapbox/polyline" {
  type Position = [number, number];

  const polyline: {
    decode(value: string, precision?: number): Position[];
    encode(value: Position[], precision?: number): string;
  };

  export default polyline;
}
