import React, { useState, useCallback, useEffect } from "react";
import "./styles.css";
import { WebSocketDemo } from "./components/WebSocketDemo";

export default function App() {
  return (
    <div className="App">
      <h1>WebSocket Demo - Mojo</h1>
      <WebSocketDemo />
    </div>
  );
}
