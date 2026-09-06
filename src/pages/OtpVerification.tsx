import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useCookies } from "react-cookie";

import AppHeader from "../components/common/AppHeader";
import AuthContainer from "../components/auth/AuthContainer";
import OtpInput from "../components/auth/OtpInput";
import Button from "../components/common/buttons/Button";

import { notify } from "../utils/notify/notify";
import { CHECK_OTP } from "../api/endpoints";
import {
  ACCESS_TOKEN_COOKIE,
  callApi,
  REFRESH_TOKEN_COOKIE,
} from "../api/callApi";

interface StateType {
  phoneNumber: string;
  challengeId: string;
  code?: string;
}

const formatTimer = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");

  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const maybeApiError = error as {
    response?: {
      data?: {
        message?: unknown;
      };
    };
    message?: unknown;
  };

  if (typeof maybeApiError?.response?.data?.message === "string") {
    return maybeApiError.response.data.message;
  }

  if (typeof maybeApiError?.message === "string") {
    return maybeApiError.message;
  }

  return fallback;
};

export default function OtpVerification() {
  const navigate = useNavigate();

  const { state } = useLocation() as {
    state: StateType | null;
  };

  const [code, setCode] = useState<string>(state?.code ?? "");
  const [timer, setTimer] = useState(108);
  const [error, setError] = useState("");

  const [, setCookie] = useCookies([ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]);

  const hasValidState =
    Boolean(state?.phoneNumber) && Boolean(state?.challengeId);

  useEffect(() => {
    if (!hasValidState) {
      navigate("/login", {
        replace: true,
      });
    }
  }, [hasValidState, navigate]);

  useEffect(() => {
    if (timer <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimer((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [timer]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return await callApi({
        url: CHECK_OTP,
        method: "POST",
        data: {
          phoneNumber: state?.phoneNumber,
          challengeId: state?.challengeId,
          code,
        },
      });
    },

    onSuccess: (response) => {
      if (!response?.succeeded) {
        notify(response?.message ?? "کد تایید صحیح نیست", "error");
        return;
      }

      const data = response?.data;

      if (!data) {
        notify("پاسخ دریافتی از سرور نامعتبر است", "error");
        return;
      }

      if (!data.accessToken) {
        notify("توکن ورود از سرور دریافت نشد", "error");
        return;
      }

      setCookie(ACCESS_TOKEN_COOKIE, data.accessToken, {
        expires: data.expireDate ? new Date(data.expireDate) :  new Date(Date.now() + 31536000000),
        path: "/",
        sameSite: "lax",
      });
      setCookie(REFRESH_TOKEN_COOKIE, data.refreshToken, {
        expires: data.expireDate ? new Date(data.expireDate) :  new Date(Date.now() + 31536000000),
        path: "/",
        sameSite: "lax",
      });
      if (data.isNewUser) {
        navigate("/register", {
          replace: true,
          state: {
            phoneNumber: state?.phoneNumber,
            accessToken: data.accessToken,

            // مهم:
            // challengeId اصلی را از state صفحه OTP بگیر
            challengeId: state?.challengeId,
          },
        });

        return;
      }

      if (data.refreshKey) {
        setCookie(REFRESH_TOKEN_COOKIE, data.refreshKey, {
          expires: data.expireDate ? new Date(data.expireDate) : undefined,
          path: "/",
          sameSite: "lax",
        });
      }

      navigate("/", {
        replace: true,
      });
    },

    onError: (error: unknown) => {
      notify(
        getErrorMessage(error, "خطایی در بررسی کد تایید رخ داد"),
        "error",
      );
    },
  });

  const submit = () => {
    if (isPending) {
      return;
    }

    if (code.length !== 6) {
      setError("کد تایید باید ۶ رقم باشد");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError("کد تایید فقط باید شامل عدد باشد");
      return;
    }

    setError("");
    mutate();
  };

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 6);

    setCode(numericValue);

    if (error) {
      setError("");
    }
  };

  const handleResend = () => {
    if (timer > 0) {
      return;
    }

    setCode("");
    setError("");
    setTimer(108);
  };

  if (!hasValidState) {
    return null;
  }

  return (
    <>
      <AppHeader title="" onBack={() => navigate("/login")} />

      <AuthContainer>
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-8 text-right">
            <h1 className="text-size-xl font-extrabold text-dark">کد تایید</h1>

            <p className="mt-2 text-size-sm font-medium text-gray-text">
              کد ۶ رقمی ارسال شده به <span dir="ltr">{state?.phoneNumber}</span>
            </p>
          </div>

          <OtpInput value={code} onChange={handleCodeChange} error={error} />

          <div className="mt-5 flex items-center justify-between text-size-sm font-bold">
            <span className="text-secondary">
              {timer > 0
                ? `ارسال مجدد ${formatTimer(timer)}`
                : "امکان ارسال مجدد کد"}
            </span>

            <button
              type="button"
              disabled={timer > 0}
              onClick={handleResend}
              className={`transition ${
                timer > 0
                  ? "cursor-not-allowed text-gray-text"
                  : "text-secondary"
              }`}
            >
              ارسال مجدد
            </button>
          </div>

          <Button
            type="button"
            theme="secondary"
            fullWidth
            className="mt-7"
            onClick={submit}
            loading={isPending}
            disabled={isPending}
          >
            تایید و ورود
          </Button>
        </div>
      </AuthContainer>
    </>
  );
}
