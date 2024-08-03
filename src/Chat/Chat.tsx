import {
  FormEventHandler,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ActionIcon, TextInput } from '@mantine/core'
import { fromBase64 } from 'js-base64'

import { Layout } from '../layout/index.tsx'
import { AuthService } from '../auth/AuthService.ts'
import { useAuth } from '../auth/useAuth.tsx'
import { showErrorNotification } from '../misc/Notifications/Notifications.ts'
import { FriendNav } from './FriendNav.tsx'
import { TUser } from '../types/user.ts'
import { ActiveChat } from '../persistence/ActiveChat.ts'
import { SendHorizonal } from 'lucide-react'
import { Cipher } from '../utils/cipher.ts'
import { MessageSkeleton } from '../Components/MessageSkeleton.tsx'
import { MessageBadge } from '../Components/MessageBadge.tsx'
import { KeyModal } from '../Components/KeyModal.tsx'
import { useChatWebsocket } from '../hooks/useChatWebsocket.tsx'
import { useWebSocketContext } from './websocket.tsx'
import { TApiResponse } from '../types/Api.ts'
import { TFriend } from '../types/friends.ts'
import { buildApiUrl } from '../constants.ts'
import { EHTTPMethod, useFetchEndpoint } from '../utils/fetch.ts'



export const useFetchFriends = () => {
  const auth = useAuth()
  const { data: users, refetch } = useFetchEndpoint<
    object,
    TApiResponse<TFriend[]>,
    TFriend[]
  >(
    {
      url: buildApiUrl('/friends'),
      fetchOptions: {
        transform: (r) => r?.data || [],
        method: EHTTPMethod.GET,
      },
    },
    { skip: !auth.isLoggedIn }
  )
  return { users, refetch }
}

export const Chat = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { users, refetch } = useFetchFriends()
  const [privateKey, setPrivateKey] = useState<string | null>(null)
  const chatContainer = useRef<HTMLDivElement>(null)
  const auth = useAuth()
  const [activeChat, setActiveChat] = useState<TUser | null>(null)
  const { sendMessage } = useWebSocketContext()
  const { messages, loadMessages, loading } = useChatWebsocket({
    activeChat,
    privateKey,
    refetchFriends: refetch
  })
  const userPublicKey = fromBase64(auth.token?.public_key || '')

  useEffect(() => {
    if (!chatContainer.current) return
    chatContainer.current.scrollTop = chatContainer.current.scrollHeight
  }, [messages])

  const handleMessageSend: FormEventHandler = (e) => {
    e.preventDefault()
    if (!inputRef.current?.value) return
    const recipient = activeChat
    if (!recipient) return
    if (!privateKey)
      return showErrorNotification({
        title: 'Insert private RSA Key',
        message: 'Please insert your RSA Private key to send messages',
      })

    const public_key_encoded = recipient.public_key
    const public_key_decoded = fromBase64(public_key_encoded)

    const message = inputRef.current.value
    const recipientRSA = new Cipher({ publicKey: public_key_decoded })
    const selfRSA = new Cipher({
      publicKey: fromBase64(AuthService.Instance.decodedToken!.public_key),
      privateKey,
    })
    const encrypted_message = recipientRSA.encryptMessage(message)
    const message_self_encrypted = selfRSA.encryptMessage(message)

    const encrypted_message_signature = selfRSA.signMessage(encrypted_message)
    const self_encrypted_message_signature = selfRSA.signMessage(
      message_self_encrypted
    )

    const preparedText = JSON.stringify({
      recipient: recipient.username,
      message: encrypted_message,
      message_self_encrypted: message_self_encrypted,
      message_signature: encrypted_message_signature,
      message_self_encrypted_signature: self_encrypted_message_signature,
    })

    inputRef.current?.value && sendMessage(preparedText)
    inputRef.current.value = ''
  }

  const handleChatChange = (user: TUser | null) => {
    user && ActiveChat.setValue(user.username)
    setActiveChat(user)
  }

  if (!auth.isLoggedIn) {
    return <Layout title="You are not logged in, please login"></Layout>
  }

  const messagesForChat =
    messages?.filter(
      (m) =>
        m.recipient === activeChat?.username ||
        m.sender === activeChat?.username
    ) || []


  return (
    <Layout title="Chat">
      <div className="grid-cols-chat flex flex-col content-stretch items-stretch md:grid gap-4 mx-4 min-h-0">
        <FriendNav
          users={users}
          refetch={refetch}
          activeChat={activeChat}
          messages={messages || []}
          onChatChange={handleChatChange}
        />
        <section className={`${!activeChat ? "hidden" : ""} w-full h-full grid relative grid-rows-chat-message grid-cols-0 md:grid-cols-1 gap-2 min-h-0 bg-slate-100 shadow-lg`}>
          <div className="relative min-h-0">
            <div
              className="border rounded-md p-4 pb-16 shadow-sm relative scroll-auto h-full overflow-y-auto border-indigo-300 snap-y"
              ref={chatContainer}
            >
              {activeChat && !messages && loading && <MessageSkeleton />}
              {messagesForChat?.length > 0 && (
                <span onClick={() => loadMessages()}>Load more</span>
              )}
              {messagesForChat.map((message, i) => (
                <div key={i} className="w-full grid mb-2 snap-start">
                  <MessageBadge
                    sentByUser={message.sender === auth.token?.sub}
                    key={i}
                    content={message.message_decrypted || ''}
                    isEncrypted={!message.message_decrypted}
                    isVerified={message.message_verified || false}
                  />
                </div>
              ))}
            </div>
            <form onSubmit={handleMessageSend}>
              <div className="absolute bottom-4 w-2/4 md:w-3/4 left-1/2 transform -translate-x-1/2">
                <TextInput
                  placeholder="Hola"
                  className="w-full shadow-md"
                  ref={inputRef}
                />
                <ActionIcon
                  type="submit"
                  size={'lg'}
                  className="absolute shadow-lg -right-12 top-0 border rounded-full p-1.5 bg-indigo-500 hover:bg-indigo-700 cursor-pointer "
                >
                  <SendHorizonal color="white" size={20} />
                </ActionIcon>
              </div>
              <div>
                <KeyModal
                  publicKey={userPublicKey}
                  setPrivateKey={setPrivateKey}
                  privateKey={privateKey}
                />
              </div>
            </form>
          </div>
        </section>
      </div>
    </Layout>
  )
}
