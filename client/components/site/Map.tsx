import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import React from "react";

// Fix default icon paths for Leaflet in Vite
const icon = new L.Icon( {
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [ 25, 41 ],
  iconAnchor: [ 12, 41 ],
} );

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
};

function ClickCapture( { onSelect }: { onSelect?: ( lat: number, lng: number ) => void; } ) {

  useMapEvents( {

    click( e ) {
      onSelect?.( e.latlng.lat, e.latlng.lng );
    },

  } );

  return null;
}

export default function Map( {
  center = { lat: -17.8292, lng: 31.0522 },
  zoom = 12,
  markers = [],
  onSelect,
  className,
}: {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onSelect?: ( lat: number, lng: number ) => void;
  className?: string;
} ) {

  const [ isOnline, setIsOnline ] = React.useState( navigator.onLine );

  React.useEffect( () => {

    const goOnline = () => setIsOnline( true );
    const goOffline = () => setIsOnline( false );

    window.addEventListener( "online", goOnline );
    window.addEventListener( "offline", goOffline );

    return () => {
      window.removeEventListener( "online", goOnline );
      window.removeEventListener( "offline", goOffline );
    }

  }, [] )

  return (
    <div className={className}>

      {
        isOnline ? (
          <MapContainer
            center={[ center.lat, center.lng ]}
            zoom={zoom}
            style={{ height: "100%", width: "100%", borderRadius: 12 }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            <ClickCapture onSelect={onSelect} />
            {markers.map( ( m ) => (
              <Marker key={m.id} position={[ m.lat, m.lng ]} icon={icon} />
            ) )}

          </MapContainer>
        ) :
        (
          <div 
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f9f9f",
            }}
          >

            <p>Map not available offline</p>
            <p style={{ fontSize: "0.9em", color: "#666" }}>
              Please connect to the internet to select a location
            </p>
          </div>
        )
    }

    </div>

  );

}
