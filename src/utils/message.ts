import { JSEncryptRSAKey } from "jsencrypt/lib/JSEncryptRSAKey"
import { AuthService } from "../auth/AuthService"
import { showErrorNotification } from "../misc/Notifications/Notifications"
import { fromBase64 } from "js-base64"
import { sha256 } from "js-sha256"
import { TMessageDirect } from "../types/messages"

export const verifyMessagesSignature = (messages: TMessageDirect[], recipient_public_key: string, self_public_key?: string): TMessageDirect[] | null => {
    try {
        if (!self_public_key) return messages

        const selfRSAPublic = new JSEncryptRSAKey(fromBase64(self_public_key))
        const recipientRSAPublic = new JSEncryptRSAKey(fromBase64(recipient_public_key))
        return messages.map(m => {
            const self_send = m.sender === AuthService.Instance.decodedToken?.sub

            if (self_send) {
                m.message_verified = selfRSAPublic.verify(m.message_self_encrypted, m.message_self_encrypted_signature, sha256)
            } else {
                m.message_verified = recipientRSAPublic.verify(m.message, m.message_signature, sha256)
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
        const selfRSA = new JSEncryptRSAKey(private_key)
        return messages.map(m => {
            const self_send = m.sender === AuthService.Instance.decodedToken?.sub

            if (m.message_decrypted) return m
            if (self_send) {
                m.message_decrypted = selfRSA.decrypt(m.message_self_encrypted)
            } else {
                m.message_decrypted = selfRSA.decrypt(m.message)
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
