import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

console.log('Hello Content');

const root = document.createElement('div');
root.id = 'crx-content-root';
document.body.appendChild(root);

createRoot(root).render(
  <StrictMode>
    <h1 style={{position: 'fixed', left: 0, top: 0}}>Hello Content!</h1>
  </StrictMode>
);
