import type { TSignupPayload } from "./auth.validation";

const signupIntoDB = async (payload: TSignupPayload) => {
   const { name, email, password } = payload;
};

export const AuthServices = {
   signupIntoDB,
};
