import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './utils/dayjsLocale'
import { AuthProvider } from './context/AuthContext'
import { EmpresaProvider } from './context/EmpresaContext'
import { HeaderContentProvider } from './context/HeaderContentContext'
import { AppThemeProvider } from './theme/AppThemeProvider'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EmpresaProvider>
          <HeaderContentProvider>
            <AppThemeProvider>
              <App />
            </AppThemeProvider>
          </HeaderContentProvider>
        </EmpresaProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
