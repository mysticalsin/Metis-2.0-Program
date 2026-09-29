import React from 'react'
import { createRoot } from 'react-dom/client'
import { M2DesignPrototypes } from './components/M2DesignPrototypes'
import './components/M2DesignPrototypes.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root for M2 design prototypes')

createRoot(root).render(
  <React.StrictMode>
    <M2DesignPrototypes />
  </React.StrictMode>
)
