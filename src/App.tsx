import { useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type SelectedPosition = {
  latitude: number;
  longitude: number;
};

type MapClickHandlerProps = {
  onSelect: (position: SelectedPosition) => void;
};

function MapClickHandler({ onSelect }: MapClickHandlerProps) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function App() {
  const [selectedPosition, setSelectedPosition] =
    useState<SelectedPosition | null>(null);

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      <MapContainer
        center={[35.681236, 139.767125]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onSelect={setSelectedPosition} />

        {selectedPosition && (
          <CircleMarker
            center={[
              selectedPosition.latitude,
              selectedPosition.longitude,
            ]}
            radius={10}
          >
            <Popup>投稿する場所</Popup>
          </CircleMarker>
        )}
      </MapContainer>

      <div
        style={{
          position: "absolute",
          zIndex: 1000,
          bottom: 20,
          left: 20,
          padding: 16,
          background: "white",
          borderRadius: 8,
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.25)",
        }}
      >
        <strong>選択した場所</strong>

        {selectedPosition ? (
          <>
            <div>緯度：{selectedPosition.latitude.toFixed(6)}</div>
            <div>経度：{selectedPosition.longitude.toFixed(6)}</div>
          </>
        ) : (
          <div>地図をクリックしてください</div>
        )}
      </div>
    </div>
  );
}

export default App;