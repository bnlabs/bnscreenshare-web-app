import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import "./index.css";
import { SignalRProvider } from './components/SignalR/SignalRContext.tsx'
import { WebRTCProvider } from './components/WebRTC/WebRTCContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SignalRProvider>
      <WebRTCProvider>
        <App/>
      </WebRTCProvider>
    </SignalRProvider>
  </React.StrictMode>,
)
