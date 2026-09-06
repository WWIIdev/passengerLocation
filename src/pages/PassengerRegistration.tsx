import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useCookies } from "react-cookie";

import AppHeader from "../components/common/AppHeader";
import Button from "../components/common/buttons/Button";
import Input from "../components/common/inputs/Input";
import { formatPhone } from "../components/auth/phoneUtils";
import { validateIranianNationalCode } from "../utils/helper";
import ContainerLayout from "../layouts/ContainerLayout";

import {
  ACCESS_TOKEN_COOKIE,
  callApi,
  REFRESH_TOKEN_COOKIE,
} from "../api/callApi";

import { PASSENGER_REGISTER } from "../api/endpoints";
import { notify } from "../utils/notify/notify";

type FormData = {
  mobile: string;
  firstName: string;
  lastName: string;
  nationalCode?: string;
  gender: "مرد" | "زن";
};

type LocationState = {
  phoneNumber?: string;
  accessToken?: string;
  challengeId?: string;
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

export default function PassengerRegistration() {
  const navigate = useNavigate();

  const { state } = useLocation() as {
    state: LocationState | null;
  };

  const [, setCookie] = useCookies([ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]);

  const phoneNumber = state?.phoneNumber ?? "";
  const accessToken = state?.accessToken ?? "";
  const challengeId = state?.challengeId ?? "";

  const hasValidState =
    Boolean(phoneNumber) && Boolean(accessToken) && Boolean(challengeId);

  const displayMobile = phoneNumber ? formatPhone(phoneNumber) : "";

  useEffect(() => {
    if (!hasValidState) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    setCookie(ACCESS_TOKEN_COOKIE, accessToken, {
      path: "/",
      sameSite: "lax",
    });
  }, [hasValidState, accessToken, navigate, setCookie]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    mode: "onBlur",
    defaultValues: {
      mobile: displayMobile,
      firstName: "",
      lastName: "",
      nationalCode: "",
      gender: "مرد",
    },
  });

  const gender = useWatch({
    control,
    name: "gender",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await callApi({
        url: PASSENGER_REGISTER,
        method: "PUT",
        data: {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          nationalCode: data.nationalCode?.trim() ?? "",
          gender: data.gender,
        },
      });

      return response;
    },

    onSuccess: (response) => {
      if (!response?.succeeded) {
        notify(response?.message ?? "ثبت‌نام با خطا مواجه شد", "error");

        return;
      }

      const responseData = response?.data;

      if (responseData?.accessToken) {
        setCookie(ACCESS_TOKEN_COOKIE, responseData.accessToken, {
          expires: responseData?.expireDate
            ? new Date(responseData.expireDate)
            : undefined,
          path: "/",
          sameSite: "lax",
        });
      }

      if (responseData?.refreshKey) {
        setCookie(REFRESH_TOKEN_COOKIE, responseData.refreshKey, {
          expires: responseData?.expireDate
            ? new Date(responseData.expireDate)
            : undefined,
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
        getErrorMessage(error, "خطایی در ثبت‌نام رخ داد"),
        "error",
      );
    },
  });

  const submit = (data: FormData) => {
    if (isPending) {
      return;
    }

    mutate(data);
  };

  if (!hasValidState) {
    return null;
  }

  return (
    <>
      <AppHeader
        title="ثبت‌نام"
        onBack={() => navigate("/login")}
      />

      <ContainerLayout className="flex h-full min-h-0 flex-1 flex-col">
        <form
          onSubmit={handleSubmit(submit)}
          className="flex h-full min-h-0 flex-1 flex-col justify-between gap-3"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <Input label="شماره موبایل" disabled {...register("mobile")} />

            <Input
              label="نام"
              required
              placeholder="نام خود را وارد کنید"
              {...register("firstName", {
                required: "وارد کردن نام الزامی است",
                minLength: {
                  value: 2,
                  message: "نام باید حداقل ۲ حرف باشد",
                },
              })}
              error={errors.firstName?.message}
            />

            <Input
              label="نام خانوادگی"
              required
              placeholder="نام خانوادگی خود را وارد کنید"
              {...register("lastName", {
                required: "وارد کردن نام خانوادگی الزامی است",
                minLength: {
                  value: 2,
                  message: "نام خانوادگی باید حداقل ۲ حرف باشد",
                },
              })}
              error={errors.lastName?.message}
            />

            <Input
              label="کد ملی (اختیاری)"
              placeholder="کد ملی ۱۰ رقمی"
              inputMode="numeric"
              maxLength={10}
              {...register("nationalCode", {
                validate: (value) => {
                  if (!value?.trim()) {
                    return true;
                  }

                  return (
                    validateIranianNationalCode(value.trim()) ||
                    "کد ملی وارد شده معتبر نیست"
                  );
                },
              })}
              error={errors.nationalCode?.message}
            />

            <div>
              <p className="mb-2 text-right text-size-sm font-bold text-dark">
                جنسیت
                <span className="mr-1 text-primary">*</span>
              </p>

              <div className="relative grid h-12 grid-cols-2 overflow-hidden rounded-xl border border-stroke bg-white">
                <div
                  className="absolute inset-0 w-1/2 rounded-xl border border-secondary bg-secondary-light transition-transform duration-300 ease-out"
                  style={{
                    transform:
                      gender === "زن" ? "translateX(0)" : "translateX(-100%)",
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setValue("gender", "زن", {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  className={`relative z-10 text-size-sm font-bold transition ${
                    gender === "زن" ? "text-secondary" : "text-dark"
                  }`}
                >
                  زن
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setValue("gender", "مرد", {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  className={`relative z-10 text-size-sm font-bold transition ${
                    gender === "مرد" ? "text-secondary" : "text-dark"
                  }`}
                >
                  مرد
                </button>
              </div>

              <input
                type="hidden"
                {...register("gender", {
                  required: "انتخاب جنسیت الزامی است",
                })}
              />

              {errors.gender && (
                <p className="mt-1 text-right text-size-xs text-primary">
                  {errors.gender.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            theme="secondary"
            fullWidth
            className="mt-auto"
            loading={isPending}
            disabled={isPending}
          >
            ثبت نام
          </Button>
        </form>
      </ContainerLayout>
    </>
  );
}
