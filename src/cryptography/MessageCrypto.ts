import { AuthService } from "../auth/AuthService";
import { TMessageDirect } from "../types/messages";
import { Cipher } from "./cipher";
import { tryVerifyAndDecryptMessages } from "./message";

export class MessageCrypto {
    private _meCipher: Cipher
    private _partnerCipher: Cipher

    constructor(privateKey: string, partnerPublicKeyBase64Encoded: string) {
        const token = AuthService.Instance.decodedToken
        this._meCipher = new Cipher({
            publicKey: token?.public_key,
            privateKey
        })
        this._partnerCipher = new Cipher({
            publicKey: partnerPublicKeyBase64Encoded
        })
    }

    verifyAndDecryptMessages = (messages: TMessageDirect[]) => {
        return tryVerifyAndDecryptMessages(this.meCipher, this._partnerCipher, messages)
    }

    public get meCipher() {
        return this._meCipher
    }

    public get partnerCipher() {
        return this._partnerCipher
    }
}