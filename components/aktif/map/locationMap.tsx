"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

type LocationMapProps = {
  latitude: number;
  longitude: number;
};

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapUpdater({
  latitude,
  longitude,
}: LocationMapProps) {
  const map = useMap();

  useEffect(() => {
    map.setView(
      [latitude, longitude],
      17
    );

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [
    latitude,
    longitude,
    map,
  ]);

  return null;
}

export default function LocationMap({
  latitude,
  longitude,
}: LocationMapProps) {
  return (
    <div className="mt-4 h-52 w-full overflow-hidden rounded-2xl">

      <MapContainer
        center={[
          latitude,
          longitude,
        ]}
        zoom={17}
        scrollWheelZoom={false}
        className="h-full w-full"
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[
            latitude,
            longitude,
          ]}
        >
          <Popup>
            Lokasi kamu saat ini
          </Popup>
        </Marker>

        <MapUpdater
          latitude={latitude}
          longitude={longitude}
        />

      </MapContainer>

    </div>
  );
}