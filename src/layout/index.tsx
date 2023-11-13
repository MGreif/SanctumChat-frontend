import { FC, PropsWithChildren } from "react"

type TLayoutProps = PropsWithChildren<{
    title: string
}>

export const Layout: FC<TLayoutProps> = ({ children, title }) => {
    return <span>
        <h2>
            {title}
        </h2>
        <div>
            {children}
        </div>
    </span>
}
