import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import MobileLayout from "./layouts/MobileLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OtpVerification from "./pages/OtpVerification";
import PassengerRegistration from "./pages/PassengerRegistration";
import SplashScreen from "./components/common/SplashScreen";
import { useCookies } from "react-cookie";
import { ACCESS_TOKEN_COOKIE } from "./api/callApi";

function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [cookies] = useCookies([ACCESS_TOKEN_COOKIE]);

  useEffect(() => {
    if (
      !cookies.passengerAccessToken &&
      pathname !== "/otp" &&
      pathname !== "/login" &&
      pathname !== "/register"
    ) {
      navigate("/login");
    }
  }, [cookies, navigate, pathname]);

  return (
    <>
      <SplashScreen />
      <Routes>
        <Route
          path="/login"
          element={
            <MobileLayout>
              <Login />
            </MobileLayout>
          }
        />
        <Route
          path="/otp"
          element={
            <MobileLayout>
              <OtpVerification />
            </MobileLayout>
          }
        />
        <Route
          path="/register"
          element={
            <MobileLayout>
              <PassengerRegistration />
            </MobileLayout>
          }
        />
        <Route
          path="/"
          element={
            <MobileLayout>
              <Home />
            </MobileLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
