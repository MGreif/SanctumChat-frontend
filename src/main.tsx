import ReactDOM from 'react-dom/client'
import { App } from './App'
import { AuthService } from './auth/AuthService'
import { AuthContextProvider } from './auth/useAuth'

const render = () => ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthContextProvider>
    <App />
  </AuthContextProvider>
)

AuthService.Instance.refreshToken().catch(err => {
  sessionStorage.removeItem("token")
  location.href = "/login"
}).then(render)
