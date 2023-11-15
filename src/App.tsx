import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { Chat } from "./chat/Chat"
import { MainPage } from "./MainPage"
import { Login } from "./Login"

export const App = () => {
    const routes = createBrowserRouter([{
        path: "/",
        element: <MainPage />,
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/chat/:chatId",
        element: <Chat />
    }])
    return <RouterProvider router={routes} />
}
