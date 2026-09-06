import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import { Toaster } from "react-hot-toast";
export const queryClient = new QueryClient();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <CookiesProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              duration: 5500,
              style: {
                direction: "rtl",
                fontFamily: "Vazirmatn",
                fontSize: "0.875rem",
                borderRadius: "12px",
              },
            }}
          />
        </QueryClientProvider>
      </CookiesProvider>
    </BrowserRouter>
  </StrictMode>,
);
