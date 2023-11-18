import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { AuthService } from './auth/AuthService'

const render = () => ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

AuthService.Instance.refreshToken().then(render)
