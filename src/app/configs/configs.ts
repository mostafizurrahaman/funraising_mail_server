import dotenv from "dotenv";
import path from "path";
import z from "zod";

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
};

const validateEnv = () => {
   const { error, data } = z.safeParse(envValidationSchema, envs);

   console.log("ZOD ERRORS", error);

   return data as TConfigType;
};

export const configs = validateEnv();
