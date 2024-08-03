import ReactDOM from 'react-dom/client'
import { App } from './App'
import { AuthService } from './auth/AuthService'
import { AuthContextProvider } from './auth/useAuth'
import './output.css'
import './scrollbar.css'
import { SessionRefresh } from './auth/SessionRefresh'

const render = () =>
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <AuthContextProvider>
      <App />
      <SessionRefresh />
    </AuthContextProvider>
  )

AuthService.Instance.refreshToken()
  .catch(() => {
    sessionStorage.removeItem('token')
    location.href = '/login'
  })
  .then(render)
