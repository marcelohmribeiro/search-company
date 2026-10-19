import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './css/index.css'
import { router } from './routes'

// A chave do Google agora fica na conta, no banco. Apaga a cópia que versões antigas guardavam neste navegador.
try {
  localStorage.removeItem('search-company:google-api-key')
} catch {
  // Sem acesso ao localStorage, não há o que apagar.
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
