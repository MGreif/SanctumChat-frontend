import { FormEventHandler, useState } from 'react'
import { Layout } from '../layout'
import { useAuth } from './useAuth.tsx'
import classes from './index.module.css'
import {
  Button,
  Checkbox,
  FileInput,
  PasswordInput,
  TextInput,
} from '@mantine/core'
import { toBase64 } from 'js-base64'
import { InfoInline } from '../Components/InfoInline.tsx'
import { Link } from 'react-router-dom'

const tooltipText =
  'As of the current version of SanctumChat, generating an RSA keypair will happen on the server side. Thus eavesdropping on the communication channel could result in potential decryption and disclosure of the private key.'

export const Register = () => {
  const { register } = useAuth()
  const [generateKey, setChecked] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const handleSubmit: FormEventHandler = async (e: any) => {
    e.preventDefault()
    if (!generateKey && !publicKey) return
    const username = e.target.username.value
    const password = e.target.password.value
    if (!username || !password) return

    register(username, password, generateKey, toBase64(publicKey || ''))
  }

  return (
    <Layout>
      <div className="border border-slate-300 rounded-md w-4/12 min-w-fit place-self-center shadow-lg">
        <form action="/login" onSubmit={handleSubmit} method="POST">
          <h2 className="p-5 rounded-t-md py-8 text-white text-center text-3xl font-semibold bg-indigo-500">
            Register
          </h2>
          <div className="p-4 pb-0">
            <label className={classes.required} htmlFor="username">
              Username
            </label>{' '}
            <br />
            <TextInput required name="username" max={80} /> <br />
            <label className={classes.required} htmlFor="password">
              Password
            </label>{' '}
            <br />
            <PasswordInput required type="password" name="password" max={80} />
            <br />
            <label
              className={generateKey ? '' : classes.required}
              htmlFor="public_key"
            >
              Insert own public RSA key (PKCS#8 .pem file)
            </label>{' '}
            <br />
            <FileInput
              onChange={(file) => file?.text().then(setPublicKey)}
              disabled={generateKey}
              required={!generateKey}
            />
            <Checkbox
              className={classes.marginTop}
              onChange={(e) => setChecked(e.target.checked)}
              mb={'1em'}
              label={
                <InfoInline
                  tooltip={tooltipText}
                  text={'Or let the server generate a RSA key pair'}
                />
              }
            />
            <Button
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-600"
            >
              Register
            </Button>
          </div>
          <div className="grid grid-cols-2 *:text-sm place-items-center gap-2 px-2 my-4 divide-x-2 *:w-full  text-center">
            <span className="text-slate-400">Already have an account?</span>
            <Link to={'/login'} className="text-indigo-500">
              Login
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  )
}
