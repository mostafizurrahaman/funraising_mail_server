export const AuthRole = {
   ADMIN: "admin",
   SUPER_ADMIN: "super_admin",
   OWNER: "owner",
   DRIVER: "driver",
} as const;

export const AuthStatus = {
   PENDING: "pending", // ausstehend
   ACTIVE: "active", // freigegeben
   BLOCKED: "blocked", // gesperrt
   REJECTED: "rejected", //  abgelehnt
} as const;

export const AuthRoleValues = Object.values(AuthRole);
export const AuthStatusValues = Object.values(AuthStatus);
