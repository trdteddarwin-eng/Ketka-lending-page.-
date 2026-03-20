import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LampBar } from './components/ui/hero';
import { Boxes } from './components/ui/background-boxes';
import './index.css';

const rootElement = document.getElementById('react-root');

if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

// Mount lamp bar in Claude Code Skills tab
const lampMount = document.getElementById('claude-hero-mount');
if (lampMount) {
    const root = ReactDOM.createRoot(lampMount);
    root.render(
        <React.StrictMode>
            <LampBar />
        </React.StrictMode>
    );
}

// Mount background boxes in hero section
const boxesMount = document.getElementById('hero-boxes-mount');
if (boxesMount) {
    const boxesRoot = ReactDOM.createRoot(boxesMount);
    boxesRoot.render(
        <React.StrictMode>
            <Boxes />
            <div style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                background: '#E8E4DD',
                zIndex: 1,
                maskImage: 'radial-gradient(transparent, white)',
                WebkitMaskImage: 'radial-gradient(transparent, white)',
                pointerEvents: 'none',
            }} />
        </React.StrictMode>
    );
}
