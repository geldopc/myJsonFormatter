import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "@templates/AppLayout";
import { Home } from "@pages/Home";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
      children: [{ index: true, element: <Home /> }],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

export function Router() {
  return <RouterProvider router={router} />;
}
