import {RouterProvider, createBrowserRouter} from "react-router-dom"
import { Chat } from "./chat/Chat"
import { Login } from "./Auth/Login.tsx"
import {FriendRequests} from "./FriendRequests";
import {MantineProvider} from "@mantine/core";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import {Notifications} from "@mantine/notifications";
import {Register} from "./Auth/Register.tsx";
export const App = () => {

    const routes = createBrowserRouter([
    {
        path: "/",
        element: <Chat />,
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/register",
        element: <Register />,
    },
    {
        path: "/friend-requests",
        element: <FriendRequests />,
    }])
    return <MantineProvider>
        <Notifications position={"bottom-center"} withinPortal={true}/>
        <RouterProvider router={routes} />
    </MantineProvider>
}
