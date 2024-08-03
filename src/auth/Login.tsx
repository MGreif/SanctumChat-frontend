import { FormEventHandler, useEffect } from 'react'
import { Layout } from '../layout'
import { useAuth } from './useAuth.tsx'
import { useNavigate } from 'react-router'
import { Button, PasswordInput, TextInput } from '@mantine/core'
import { useWebSocketContext } from '../Chat/websocket.tsx'
import { Link } from 'react-router-dom'
export const Login = () => {
  const { login, isLoggedIn } = useAuth()
  const { context } = useWebSocketContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/')
    }
  }, [isLoggedIn])
  const handleSubmit: FormEventHandler = async (e: any) => {
    e.preventDefault()
    const username = e.target.username.value
    const password = e.target.password.value
    if (!username || !password) return
    login(username, password).then(context.establishConnection)
  }

  return (
    <Layout>
      <div className="border border-slate-300 rounded-md min-w-fit w-3/12 place-self-center shadow-lg">
        <form action="/login" onSubmit={handleSubmit} method="POST">
          <h2 className="p-5 rounded-t-md py-8 text-white text-center text-3xl font-semibold bg-indigo-500">
            Login
          </h2>
          <div className="p-4 pb-0">
            <label htmlFor="username">Username</label> <br />
            <TextInput name="username" required max={80} /> <br />
            <label htmlFor="password">Password</label> <br />
            <PasswordInput type="password" name="password" required max={80} />
            <br />
            <Button
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-600"
            >
              Login
            </Button>
          </div>
          <div className="grid grid-cols-2 *:text-sm place-items-center gap-2 px-2 my-4 divide-x-2 *:w-full  text-center">
            <span className="text-slate-400">Dont have an account?</span>
            <Link to={'/register'} className="text-indigo-500">
              Register
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  )
}
