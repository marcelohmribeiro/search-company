import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { ThemeProvider } from 'next-themes'
import './css/index.css'
import { router } from './routes'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem storageKey='search-company:theme' disableTransitionOnChange>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
)
