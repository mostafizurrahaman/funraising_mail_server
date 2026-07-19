export const AuthRole = {
   ADMIN: "admin",
   SUPER_ADMIN: "super_admin",
   COMPANY: "company",
   DRIVER: "driver",
} as const;

export const AuthPermission = {
   [AuthRole.SUPER_ADMIN]: 4,
   [AuthRole.ADMIN]: 3,
   [AuthRole.COMPANY]: 2,
   [AuthRole.DRIVER]: 1,
};

export const AuthStatus = {
   PENDING: "pending", // ausstehend
   ACTIVE: "active", // freigegeben
   BLOCKED: "blocked", // gesperrt
   REJECTED: "rejected", //  abgelehnt
} as const;

export const AuthRoleValues = Object.values(AuthRole);
export const AuthStatusValues = Object.values(AuthStatus);
