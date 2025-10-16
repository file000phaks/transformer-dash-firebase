import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "@/components/site/Layout";
import Dashboard from "./pages/Dashboard";
import Transformers from "./pages/Transformers";
import Alerts from "./pages/Alerts";
import Sensors from "./pages/Sensors";
import TransformerDetails from "./pages/TransformerDetails";
import NotFound from "./pages/NotFound";
import AlertDetails from "./pages/AlertDetails";
import { NotificationsProvider } from "@/state/notifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NotificationsProvider>
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transformers" element={<Transformers />} />
                <Route
                  path="/transformers/:id"
                  element={<TransformerDetails />}
                />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/alerts/:id" element={<AlertDetails />} />
                <Route path="/sensors" element={<Sensors />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </NotificationsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

// import React, { useEffect, useState } from "react";
// // import { ref, onValue } from "firebase/database";
// import { database } from "./firebase.js"

// interface SensorData {
//   cabinetHumidity: number;
//   cabinetTemp: number;
//   currentSensor: 0 | 1;
//   doorSensor: 0 | 1;
//   oilLevelSensor: 0 | 1;
//   pirSensor: 0 | 1;
//   transf_temperature: number;
//   ts: number;
//   vibrationSensor: 0 | 1;
//   voltSensor: number;
// }

// import { ref, query, limitToLast, onValue } from "firebase/database";

// function App() {

//   const [ latestPacket, setLatestPacket ] = useState( null );

//   useEffect( () => {

//     const dataRef = query( ref( database, "loriotData" ), limitToLast( 1 ) );

//     const unsubscribe = onValue( dataRef, ( snapshot ) => {

//       if ( snapshot.exists() ) {

//         const data = snapshot.val();

//         // Firebase returns an object { id: packet }

//         const packet = Object.values( data )[ 0 ];

//         setLatestPacket( packet );

//       }

//     } );

//     return () => unsubscribe();

//   }, [] );

//   return (
//     <div>
//       <h2>Realtime Sensor Data</h2>
//       {
//         latestPacket ? (

//           <ul>
//             <li>Cabinet Humidity: {latestPacket.cabinetHumidity}</li>
//             <li>Cabinet Temp: {latestPacket.cabinetTemp}</li>
//             <li>Current Sensor: {latestPacket.currentSensor}</li>
//             <li>Door Sensor: {latestPacket.doorSensor}</li>
//             <li>Transformer Temp: {latestPacket.transf_temperature}</li>
//             <li>Volt Sensor: {latestPacket.voltSensor}</li>
//             <li>Timestamp: {new Date( latestPacket.ts ).toLocaleString()}</li>

//           </ul>
//         ) : (
//           <p>Loading latest data...</p>
//         )}
//     </div>
//   );
// }


// export default App;


createRoot( document.getElementById( "root" )! ).render( <App /> );
