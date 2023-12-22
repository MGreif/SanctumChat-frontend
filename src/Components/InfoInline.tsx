import { Tooltip } from "@mantine/core"
import { Info } from "lucide-react"
import { FC, ReactNode } from "react"
import classes from "./InfoInline.module.css"

type TInfoInlineProps = {
    text?: ReactNode,
    tooltip: ReactNode
}

export const InfoInline: FC<TInfoInlineProps> = ({ text, tooltip }) => {
    return <Tooltip multiline className={classes.tooltip} label={tooltip}><span className={classes.container}>{text}<Info className={text ? classes["info-icon"] : ""} color="#666" size={16} /></span></Tooltip>
}
