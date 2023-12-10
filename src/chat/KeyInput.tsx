import { Checkbox, FileInput, Tooltip } from "@mantine/core"
import { FC, useEffect, useState } from "react"

type TKeyInputProps = {
    onChange: (file: string | null) => void
}

const tooltipText = "Checking this checkbox will save your private key in your browsers local-storage. It may be easier and more comfortable, but having your private key saved might result in leaking your private key if someone manages to access your browser/local storage."

export const KeyInput: FC<TKeyInputProps> = ({ onChange }) => {
    const [checked, setChecked] = useState(!!localStorage.getItem("privateKey"))
    const [privateKey, setPrivateKey] = useState<string | null>(localStorage.getItem("privateKey") || null)

    useEffect(() => {
        onChange(privateKey)
    }, [privateKey])

    useEffect(() => {
        if (checked && privateKey) {
            localStorage.setItem("privateKey", privateKey)
        } else if (!checked) {
            localStorage.removeItem("privateKey")
        }
        onChange(privateKey)
    }, [checked])

    return <>
        <FileInput accept={".pem"} label={"Select RSA private key (.pem)"} onChange={file => file && file.text().then(text => text && setPrivateKey(text))} />
        <Checkbox label={<span>Save in Browser <Tooltip multiline withinPortal style={{ width: "300px", whiteSpace: "pre-wrap", lineBreak: "normal" }} label={tooltipText}><span>(not recommended)</span></Tooltip></span>} checked={checked} onChange={(e) => setChecked(e.target.checked)} />
    </>

}
