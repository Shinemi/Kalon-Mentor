import React from 'react'
import ReactDom from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import './styles/global.scss'
import DrawingProvider from './contexts/drawingProvider.tsx'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

ReactDom.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
        <DrawingProvider>
            <App />
        </DrawingProvider>
    </BrowserRouter>
</React.StrictMode>
)
