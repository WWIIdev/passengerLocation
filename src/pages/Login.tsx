import { useNavigate } from "react-router-dom";
import AuthContainer from "../components/auth/AuthContainer";
import PhoneInput from "../components/auth/PhoneInput";
import {
  normalizePhone,
} from "../components/auth/phoneUtils";

import Button from "../components/common/buttons/Button";
import { IoCallOutline } from "react-icons/io5";

import { useMutation } from "@tanstack/react-query";
import { notify } from "../utils/notify/notify";

import { callApi } from "../api/callApi";
import { LOGIN } from "../api/endpoints";

import { useForm, useWatch } from "react-hook-form";

type LoginForm = {
  phoneNumber: string;
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

export default function Login() {
  const navigate = useNavigate();

  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      phoneNumber: "",
    },
  });

  const phoneNumber = useWatch({
    control,
    name: "phoneNumber",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (normalizedMobile: string) => {
      const response = await callApi({
        url: LOGIN,
        method: "POST",
        data: {
          phoneNumber: normalizedMobile,
        },
      });

      if (response?.succeeded) {
        navigate("/otp", {
          state: {
            phoneNumber: normalizedMobile,
            challengeId: response?.data?.challengeId,
            code: response?.data?.code,
          },
        });
      }
    },

    onError(error: unknown) {
      notify(getErrorMessage(error, "خطایی رخ داده است"), "error");
    },
  });

  const submit = (data: LoginForm) => {
    const normalizedMobile = normalizePhone(data.phoneNumber);

    mutate(normalizedMobile);
  };

  return (
    <AuthContainer>
      <div className="h-12" />

      <form
        onSubmit={handleSubmit(submit)}
        className="flex flex-1 flex-col justify-center"
      >
        <div className="mb-10 text-start">
          <h1 className="text-size-xl font-extrabold text-dark">
            ورود به حساب کاربری
          </h1>

          <p className="mt-2 text-size-sm font-medium text-gray-text">
            شماره موبایل خود را وارد کنید
          </p>
        </div>

        <div className="space-y-5">
          <div className="relative">
            <PhoneInput
              value={phoneNumber}
              onChange={(value) =>
                setValue("phoneNumber", value, {
                  shouldValidate: true,
                })
              }
              error={errors.phoneNumber?.message}
            />

            <IoCallOutline
              className="
                absolute
                left-3
                top-10
                text-gray-text
              "
              size={20}
            />
          </div>

          <Button loading={isPending} type="submit" theme="secondary" fullWidth>
            ادامه
          </Button>
        </div>
      </form>

      <p
        className="
          text-center
          text-size-xs
          font-medium
          text-gray-text
        "
      >
        با ورود به برنامه، شرایط و قوانین را می‌پذیرم
      </p>
    </AuthContainer>
  );
}
