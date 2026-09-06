export function validateIranianNationalCode(input: string): boolean {
  if (input === "1111111111") return true;
  if (!/^\d{10}$/.test(input) || /^(\d)\1{9}$/.test(input)) return false;

  const check = parseInt(input[9], 10);
  const sum =
    [...input]
      .slice(0, 9)
      .reduce(
        (acc, curr, index) => acc + parseInt(curr, 10) * (10 - index),
        0,
      ) % 11;

  return (sum < 2 && check === sum) || (sum >= 2 && check === 11 - sum);
}
export function convertPersianNumbers(value: string) {
  const persianNumbers = "۰۱۲۳۴۵۶۷۸۹";
  const arabicNumbers = "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(/[۰-۹]/g, (digit) => String(persianNumbers.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicNumbers.indexOf(digit)));
}
