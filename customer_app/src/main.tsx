import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { colors } from './styles/colors'
import { AppRoutes } from './routes/AppRoutes'
import { initializeInstallPromptCapture } from './utils/installPrompt'
import { AuthProvider } from './context/AuthContext'
import './styles/global.css'

const toCssVariableToken = (tokenName: string) =>
  tokenName
    .replace(/([a-z])([A-Z0-9])/g, '$1-$2')
    .replace(/([0-9])([A-Za-z])/g, '$1-$2')
    .toLowerCase()

const rootStyles = document.documentElement.style
const colorVariables = Object.entries(colors) as Array<[string, string]>

colorVariables.forEach(([tokenName, tokenValue]) => {
  const cssVariableToken = toCssVariableToken(tokenName)
  rootStyles.setProperty(`--color-${cssVariableToken}`, tokenValue)
})

initializeInstallPromptCapture()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
