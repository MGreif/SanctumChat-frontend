import { sha256 } from "js-sha256";
import { JSEncryptRSAKey } from "jsencrypt/lib/JSEncryptRSAKey";

export class Cipher {
    private privateKey: JSEncryptRSAKey
    private publicKey: JSEncryptRSAKey
    private privateKeyRaw: string | undefined
    private publicKeyRaw: string | undefined
    constructor({ privateKey, publicKey }: { privateKey?: string, publicKey?: string}) {
        this.privateKey = new JSEncryptRSAKey(privateKey)
        this.publicKey = new JSEncryptRSAKey(publicKey)
        this.privateKeyRaw = privateKey
        this.publicKeyRaw = publicKey
    }


    public decryptWithPrivate(message: string) {
        return this.privateKey.decrypt(message)
    }

    public verifySignature(message: string, signature: string) {
        return this.publicKey.verify(message, signature, sha256)
    }

    public encryptMessage(message: string) {
        return this.publicKey.encrypt(message)
    }

    public signMessage(message:string) {
        return this.privateKey.sign(message, sha256, "sha256")
    }

    public getPrivateKey() {
        return this.privateKeyRaw
    }

    public getPublicKey() {
        return this.publicKeyRaw
    }
}