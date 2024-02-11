import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CreateRoom from "./components/CreateRoom";
import Room from "./components/Room";
import AdminScreen from "./components/AdminScreen";
import { PeerContextProvider } from './PeerContextProvider';

function App() {
  return (
    <PeerContextProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateRoom />} />
        <Route path="/room/:roomID/:name"  element={<Room />} />
        <Route path="/admin"  element={<AdminScreen />} />
      </Routes>
    </BrowserRouter>
    </PeerContextProvider>
  );
}

export default App;