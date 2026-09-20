/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_PACKETA_API_KEY?: string;
}

interface PacketaPoint {
  id: string;
  name: string;
  nameStreet: string;
  city: string;
  zip: string;
  country: string;
}

interface Window {
  Packeta?: {
    Widget: {
      pick: (
        apiKey: string,
        callback: (point: PacketaPoint | null) => void,
        options?: Record<string, unknown>,
        element?: HTMLElement | null
      ) => void;
    };
  };
}
