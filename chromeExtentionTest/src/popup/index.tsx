import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

console.log('Hello Popup');

const root = document.createElement('div');
root.id = 'crx-popup-root';
document.body.appendChild(root);

createRoot(root).render(
  <StrictMode>
    <h1>Hello Popup!</h1>
  </StrictMode>
);