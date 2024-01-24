import { Button, Checkbox, FileInput, Tooltip } from "@mantine/core"
import { KeyRound } from "lucide-react"
import { ChangeEventHandler, FC, useEffect, useState } from "react"

type TKeyInputProps = {
    onChange: (file: string | null) => void
    privateKey?: string | null
}

const tooltipText = "Checking this checkbox will save your private key in your browsers local-storage. It may be easier and more comfortable, but having your private key saved might result in leaking your private key if someone manages to access your browser/local-storage."

export const KeyInput: FC<TKeyInputProps> = ({ onChange, privateKey }) => {
    const [checked, setChecked] = useState(!!localStorage.getItem("privateKey"))
    
 

    useEffect(() => {
        if (checked && privateKey) {
            localStorage.setItem("privateKey", privateKey)
        } else if (!checked) {
            localStorage.removeItem("privateKey")
        }
    }, [checked, privateKey])

    const handleInput: ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        file.text().then(text => text && onChange(text))
    }

    return <div className="relative">
        <label htmlFor="key-input">
        <div className={`p-4 ${privateKey ? "bg-indigo-500" : "bg-red-500"} ${privateKey ? "hover:bg-indigo-700" : "hover:bg-red-700"} text-white text-xl rounded-lg hover:bg-indigo-700 cursor-pointer mb-4 text-center`} role="button">Select RSA private key (.pem)</div>
        </label>
        <input accept=".pem" onChange={handleInput} id="key-input" className="hidden" type="file" />

        <div className="flex gap-2">
        <Checkbox className="flex-1" disabled={!privateKey} label={<span>Save in Browser <Tooltip multiline withinPortal style={{ width: "300px", whiteSpace: "pre-wrap", lineBreak: "normal" }} label={tooltipText}><span>(not recommended)</span></Tooltip></span>} checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <Button disabled={!privateKey} onClick={() => onChange(null)} className="bg-red-500 w-full flex-1">Remove current key</Button>

        </div>
    </div>

}
