import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { Chat } from "./chat/Chat"
import { MainPage } from "./MainPage"
import { WebSocketProvider } from "react-use-websockets"

export const App = () => {
    const routes = createBrowserRouter([{
        path: "/",
        element: <MainPage />,
    },
    {
        path: "/chat/:chatId",
        element: <Chat />
    }])
    return <RouterProvider router={routes} />
}
