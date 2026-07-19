import httpStatus from "http-status";
import type { TAuthRole } from "../modules/Auth/auth.interface";
import { catchAsync, verifyToken } from "../utils";
import { AppError } from "../errors";
import { configs } from "../configs";
import { Auth } from "../modules/Auth/auth.model";
import { AuthStatus } from "../modules/Auth/auth.constant";

export const auth = (...requiredRoles: TAuthRole[]) => {
   return catchAsync(async (req, res, next) => {
      /**
       * 1. Extract access token
       */
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
         throw new AppError(
            httpStatus.UNAUTHORIZED,
            "Authorization token is missing",
         );
      }

      const token = authHeader.split(" ")[1];

      /**
       * 2. Verify and decode token
       */
      const decoded = verifyToken(token as string, configs.accessTokenSecret);

      if (!decoded?.email) {
         throw new AppError(httpStatus.UNAUTHORIZED, "Invalid access token");
      }

      /**
       * 3. Fetch user
       */
      const user = await Auth.findOne({ email: decoded.email });
      if (!user) {
         throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }

      if (user.status !== AuthStatus.ACTIVE) {
         throw new AppError(
            httpStatus.FORBIDDEN,
            `You are not authorized. You account status ${user.status}`,
         );
      }

      /**
       * 5. Token invalidation check
       */
      if (
         user.passwordChangedAt &&
         (await Auth.isTokenStale(
            user.passwordChangedAt,
            decoded.iat as number,
         ))
      ) {
         throw new AppError(
            httpStatus.UNAUTHORIZED,
            "Token has expired. Please log in again",
         );
      }

      /**
       * 6. Role-based access control (RBAC)
       */
      if (requiredRoles.length && !requiredRoles.includes(user.role)) {
         throw new AppError(
            httpStatus.FORBIDDEN,
            "You do not have permission to access this resource",
         );
      }

      /**
       * 7. Attach user to request
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      req.user = user;

      next();
   });
};
