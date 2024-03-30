import { Button, Checkbox, Tooltip } from "@mantine/core"
import { ChangeEventHandler, FC, useEffect, useState } from "react"
import { Cipher } from "../utils/cipher"

type TKeyInputProps = {
    onChange: (file: string | null) => void
    privateKey: string | null
    publicKey?: string
}

const tooltipText = "Checking this checkbox will save your private key in your browsers local-storage. It may be easier and more comfortable, but having your private key saved might result in leaking your private key if someone manages to access your browser/local-storage."

export const KeyInput: FC<TKeyInputProps> = ({ onChange, privateKey, publicKey }) => {
    const [checked, setChecked] = useState(!!localStorage.getItem("privateKey"))
    const [error, setError] = useState<string | null>(null)
 

    useEffect(() => {
        if (checked && privateKey) {
            localStorage.setItem("privateKey", privateKey)
        } else if (!checked) {
            localStorage.removeItem("privateKey")
        }
    }, [checked, privateKey])

    const handleInput: ChangeEventHandler<HTMLInputElement> = async (e) => {
        setError(null)
        const file = e.target.files?.[0]
        if (!file) return
        const privateKey = await file.text()
        const cipher = new Cipher({ privateKey, publicKey })
        const challenge = "Decrypt me"

        const decrypted = cipher.encryptMessage(challenge)
        const encrypted = cipher.decryptWithPrivate(decrypted)

        if (encrypted === challenge) {
            onChange(privateKey)
        } else {
            setError("The given private key did not solve the decryption challenge. Please try a different key.")
        }
    }

    return <div className="relative">
        <label htmlFor="key-input">
        <div className={`p-4 ${privateKey ? "bg-indigo-500" : "bg-red-500"} ${privateKey ? "hover:bg-indigo-700" : "hover:bg-red-700"} text-white text-xl rounded-lg hover:bg-indigo-700 cursor-pointer mb-4 text-center`} role="button">Select RSA private key (.pem)</div>
        </label>
        <input accept=".pem" onChange={handleInput} id="key-input" className="hidden" type="file" />

        <div className="flex gap-2">
        <Checkbox className="flex-1" disabled={!privateKey} label={<span>Save in Browser <Tooltip multiline withinPortal style={{ width: "300px", whiteSpace: "pre-wrap", lineBreak: "normal" }} label={tooltipText}><span>(not recommended)</span></Tooltip></span>} checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <Button disabled={!privateKey} onClick={() => onChange(null)} className="bg-red-500 hover:bg-red-700 w-full flex-1">Remove current key</Button>

        </div>
        {error && <div className="p-4 border mt-3 border-red-600 bg-red-300 text-center text-xl">
            {error}
        </div>}

        {!error && privateKey && <div className="p-4 border mt-3 border-green-600 bg-green-300 text-center text-xl">Your private key successfully solved the decryption challenge.</div>}
    </div>

}
