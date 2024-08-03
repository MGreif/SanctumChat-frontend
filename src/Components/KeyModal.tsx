import { useEffect, useState } from 'react'
import { Cipher } from '../utils/cipher'
import { showErrorNotification } from '../misc/Notifications/Notifications'
import { Modal, Tooltip } from '@mantine/core'
import { KeyRound } from 'lucide-react'
import { KeyInput } from '../Chat/KeyInput'

export const KeyModal = (props: {
  setPrivateKey: (key: string | null) => void
  privateKey: string | null
  publicKey?: string
}) => {
  const [open, setOpen] = useState(false)
  const [privateKey, setPrivateKey] = useState<string | null>(null)

  useEffect(() => {
    props.setPrivateKey(privateKey)
  }, [privateKey])

  useEffect(() => {
    const keyInStorage = localStorage.getItem('privateKey') || undefined
    if (!props.publicKey || !keyInStorage) return

    const cipher = new Cipher({
      privateKey: keyInStorage,
      publicKey: props.publicKey,
    })
    const challenge = 'Decrypt me'

    const decrypted = cipher.encryptMessage(challenge)
    const encrypted = cipher.decryptWithPrivate(decrypted)

    if (encrypted !== challenge) {
      showErrorNotification({
        message:
          'The stored private key failed to solve the decryption challenge. Please use another one',
        title: 'Decryption error',
      })
    }

    if (keyInStorage) setPrivateKey(keyInStorage)
  }, [])

  return (
    <>
      <div role="button" onClick={() => setOpen(true)}>
        <Tooltip
          multiline
          style={{ width: 300 }}
          label="Click to insert or adjust your private key settings."
          withArrow
        >
          <KeyRound
            className={`absolute ${props.privateKey ? 'bg-indigo-500' : 'bg-red-500'} ${props.privateKey ? 'hover:bg-indigo-700' : 'hover:bg-red-700'} p-4 box-border w-fit h-fit rounded-lg bg-indigo-500 bottom-4 md:left-16 left-4 transform md:-translate-x-1/2`}
            color="white"
          />
        </Tooltip>
      </div>
      <Modal
        centered
        title={<h2 className="text-xl">Manage Private-Key settings</h2>}
        size={'md'}
        opened={open}
        onClose={() => setOpen(false)}
      >
        <KeyInput
          publicKey={props.publicKey}
          privateKey={props.privateKey}
          onChange={(key) => setPrivateKey(key)}
        />
      </Modal>
    </>
  )
}
