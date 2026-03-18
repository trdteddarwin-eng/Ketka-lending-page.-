import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LampBar } from './components/ui/hero';
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
