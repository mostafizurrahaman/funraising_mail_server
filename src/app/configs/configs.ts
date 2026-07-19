import dotenv from "dotenv";
import path from "path";
import z from "zod";

import { requiredString } from "../utils";
import { GERMANY_PHONE_NUMBER_REGEX } from "../constants";

//zod Validation for Configs

const envValidationSchema = z.object({
   nodeEnv: z.string({
      error: "Node env is required!",
   }),
   port: z
      .string({
         error: "PORT is required!",
      })
      .min(4, {
         error: "Port length should be 4 char like 5000,  8080",
      }),
   databaseUrl: z.string({
      error: "Database is required!",
   }),
   // JWT VALIDATION :
   accessTokenSecret: z.string({
      error: "Access token secret is required!",
   }),
   accessTokenExpiresIn: z.string({
      error: "Access token secret is required!",
   }),
   refreshTokenSecret: z.string({
      error: "Refresh token secret is required!",
   }),
   refreshTokenExpiresIn: z.string({
      error: "Refresh token secret is required!",
   }),
   resetTokenSecret: z.string({
      error: "Reset token secret is required!",
   }),
   resetTokenExpiresIn: z.string({
      error: "Reset token secret is required!",
   }),

   passwordSaltRound: z.number({
      error: "Password salt round is required!",
   }),
   cloudinaryApiKey: requiredString("cloudinaryApiKey"),
   cloudinaryApiSecret: requiredString("cloudinaryApiSecret"),
   cloudinaryCloudName: requiredString("cloudinaryCloudName"),

   superAdminName: requiredString("Super Admin Name"),
   superAdminEmail: requiredString("Super Admin Email"),
   superAdminPhone: z
      .string({
         error: `phone number should be  string!`,
      })
      .regex(GERMANY_PHONE_NUMBER_REGEX, {
         error: "Phone number is invalid!",
      }),
   superAdminPassword: requiredString("Password"),
});

type TConfigType = z.infer<typeof envValidationSchema>;

dotenv.config({
   path: path.join(process.cwd(), ".env"),
});

const envs: TConfigType = {
   nodeEnv: process.env.NODE_ENV!,
   port: process.env.PORT!,
   databaseUrl: process.env.DATABASE_URL!,

   // JWT FIELDS:
   accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
   accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN!,
   refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
   refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN!,
   resetTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
   resetTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN!,
   passwordSaltRound: Number(process.env.PASSWORD_SALT_ROUND),
   cloudinaryApiKey: process.env.CLOUDINARY_API_KEY!,
   cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET!,
   cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME!,

   // SUPER Admin  env:
   superAdminName: process.env.SUPER_ADMIN_NAME!,
   superAdminEmail: process.env.SUPER_ADMIN_EMAIL!,
   superAdminPhone: process.env.SUPER_ADMIN_PHONE!,
   superAdminPassword: process.env.SUPER_ADMIN_PASSWORD!,
};

const validateEnv = () => {
   const { error, data } = z.safeParse(envValidationSchema, envs);

   console.log("ZOD ERRORS", error);

   return data as TConfigType;
};

export const configs = validateEnv();
