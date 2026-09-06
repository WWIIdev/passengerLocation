export const normalizePhone = (value: string) =>
  value.replace(/\D/g, "").slice(0, 11);

export const formatPhone = (value: string) => {
  const normalized = normalizePhone(value);
  const first = normalized.slice(0, 4);
  const second = normalized.slice(4, 7);
  const third = normalized.slice(7, 11);

  return [first, second, third].filter(Boolean).join(" ");
};

export const isValidIranMobile = (value: string) =>
  /^09\d{9}$/.test(normalizePhone(value));
