import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Position = {
  latitude: number;
  longitude: number;
};

type Spot = Position & {
  id: string;
  title: string;
  description: string;
  category: string;
};

type MapClickHandlerProps = {
  onSelect: (position: Position) => void;
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
    useState<Position | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("object");
  const [spots, setSpots] = useState<Spot[]>(() => {
  const savedSpots = localStorage.getItem("cspot-map-spots");

  if (!savedSpots) {
    return [];
  }

  try {
    return JSON.parse(savedSpots) as Spot[];
  } catch {
    return [];
  }
});

 useEffect(() => {
  localStorage.setItem("cspot-map-spots", JSON.stringify(spots));
}, [spots]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPosition) {
      alert("地図をクリックして場所を選んでください。");
      return;
    }

    if (!title.trim() || !description.trim()) {
      alert("タイトルと説明を入力してください。");
      return;
    }

    const newSpot: Spot = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      category,
      ...selectedPosition,
    };

    setSpots((currentSpots) => [...currentSpots, newSpot]);

    setTitle("");
    setDescription("");
    setCategory("object");
    setSelectedPosition(null);

    alert("C級スポットを仮登録しました。");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header
        style={{
          padding: "12px 20px",
          background: "white",
          borderBottom: "1px solid #ddd",
        }}
      >
        <h1 style={{ margin: 0 }}>C Spot Map</h1>
        <p style={{ margin: "4px 0 0" }}>
          変化のない日常に、小さな発見を。
        </p>
      </header>

      <div style={{ height: "55vh" }}>
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
              <Popup>投稿予定の場所</Popup>
            </CircleMarker>
          )}

          {spots.map((spot) => (
            <CircleMarker
              key={spot.id}
              center={[spot.latitude, spot.longitude]}
              radius={10}
            >
              <Popup>
                <strong>{spot.title}</strong>
                <br />
                {spot.description}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <main
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: 20,
        }}
      >
        <h2>スポットを投稿する</h2>

        <p>
          {selectedPosition
            ? `選択位置：${selectedPosition.latitude.toFixed(
                6,
              )}, ${selectedPosition.longitude.toFixed(6)}`
            : "最初に地図をクリックして場所を選んでください。"}
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: 12,
            padding: 20,
            background: "white",
            borderRadius: 8,
          }}
        >
          <label>
            タイトル
            <input
              type="text"
              value={title}
              maxLength={100}
              onChange={(event) => setTitle(event.target.value)}
              style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                marginTop: 4,
                padding: 10,
              }}
            />
          </label>

          <label>
            説明
            <textarea
              value={description}
              maxLength={500}
              rows={4}
              onChange={(event) => setDescription(event.target.value)}
              style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                marginTop: 4,
                padding: 10,
              }}
            />
          </label>

          <label>
            カテゴリ
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              style={{
                display: "block",
                width: "100%",
                marginTop: 4,
                padding: 10,
              }}
            >
              <option value="object">謎のオブジェ</option>
              <option value="statue">石像・人物像</option>
              <option value="sign">看板・標識</option>
              <option value="retro">レトロ</option>
              <option value="building">建物・設備</option>
              <option value="other">その他</option>
            </select>
          </label>

          <button
            type="submit"
            style={{
              padding: 12,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            仮投稿する
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;