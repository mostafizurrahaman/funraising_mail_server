export const OTP_TYPE = {
   SIGNUP: "sign_up",
   FORGOT: "forgot",
} as const;

export const optTypeValues = Object.values(OTP_TYPE);

export type TOtpType = (typeof OTP_TYPE)[keyof typeof OTP_TYPE];
