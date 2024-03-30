import { AuthService } from "../Auth/AuthService"
import { showErrorNotification } from "../misc/Notifications/Notifications"
import { fromBase64 } from "js-base64"
import { TMessageDirect } from "../types/messages"
import { Cipher } from "./cipher"

export const verifyMessagesSignature = (messages: TMessageDirect[], recipient_public_key: string, self_public_key?: string): TMessageDirect[] | null => {
    try {
        if (!self_public_key) return messages

        const selfRSAPublic = new Cipher({ publicKey: fromBase64(self_public_key)})
        const recipientRSAPublic = new Cipher({ publicKey: fromBase64(recipient_public_key)})
        return messages.map(m => {
            const self_send = m.sender === AuthService.Instance.decodedToken?.sub

            if (self_send) {
                m.message_verified = selfRSAPublic.verifySignature(m.message_self_encrypted, m.message_self_encrypted_signature)
            } else {
                m.message_verified = recipientRSAPublic.verifySignature(m.message, m.message_signature)
            }
            return m
        })
    } catch (err) {
        showErrorNotification({
            message: "Could not validate messages signatures.",
            title: "Signature validation error"
        })
        return null
    }
}

export const decryptMessages = (messages: TMessageDirect[], private_key: string): TMessageDirect[] | null => {
    try {
        const selfRSA = new Cipher({ privateKey: private_key })
        return messages.map(m => {
            const self_send = m.sender === AuthService.Instance.decodedToken?.sub

            if (m.message_decrypted) return m
            if (self_send) {
                m.message_decrypted = selfRSA.decryptWithPrivate(m.message_self_encrypted)
            } else {
                m.message_decrypted = selfRSA.decryptWithPrivate(m.message)
            }
            return m
        })
    } catch (err) {
        showErrorNotification({
            message: "Could not decrypt messages. Check RSA Private key file",
            title: "Decryption error"
        })
        return null
    }
}


export const tryVerifyAndDecryptMessages = (senderCipher: Cipher, recipientCipher: Cipher, messages: TMessageDirect[]): TMessageDirect[] => {
    const recipient_public_key = recipientCipher.getPublicKey()
    const sender_public_key = senderCipher.getPublicKey()
    console.log("pub key", recipient_public_key, sender_public_key)
    if (!recipient_public_key || !sender_public_key) return messages
    const verifiedMessages = verifyMessagesSignature(messages || [],recipient_public_key , senderCipher.getPublicKey())
    if (!verifiedMessages) return messages

    const sender_private_key = senderCipher.getPrivateKey()
    if (!sender_private_key) return verifiedMessages

    const decryptedMessages = decryptMessages(verifiedMessages, sender_private_key)

    if (!decryptedMessages) return verifiedMessages
    return decryptedMessages
}