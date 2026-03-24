import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const App = lazy(() => import('./App'));
const LampBar = lazy(() => import('./components/ui/hero').then(m => ({ default: m.LampBar })));
const Boxes = lazy(() => import('./components/ui/background-boxes').then(m => ({ default: m.Boxes })));

const rootElement = document.getElementById('react-root');

if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <Suspense fallback={null}>
                <App />
            </Suspense>
        </React.StrictMode>
    );
}

// Mount lamp bar in Claude Code Skills tab
const lampMount = document.getElementById('claude-hero-mount');
if (lampMount) {
    const root = ReactDOM.createRoot(lampMount);
    root.render(
        <React.StrictMode>
            <Suspense fallback={null}>
                <LampBar />
            </Suspense>
        </React.StrictMode>
    );
}

// Mount background boxes in hero section
const boxesMount = document.getElementById('hero-boxes-mount');
if (boxesMount) {
    const boxesRoot = ReactDOM.createRoot(boxesMount);
    boxesRoot.render(
        <React.StrictMode>
            <Suspense fallback={null}>
                <Boxes />
            </Suspense>
        </React.StrictMode>
    );
}
