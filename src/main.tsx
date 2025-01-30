/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import './index.css'
import { AppLoading } from './components/app/AppLoading.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<AppLoading />}>
      <App />
    </Suspense>
  </React.StrictMode>,
)
