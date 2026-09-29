import { useSelector } from "react-redux";

// 1. Core Guard Component
export const RoleGuard = ({ allow, allowedRoles, children, fallback = null }) => {
  const { user } = useSelector((state) => state.auth);
  
  // Support both 'allowedRoles' and 'allow'
  const roles = allowedRoles || allow || [];

  if (!user || !roles.includes(user?.role)) {
    return fallback;
  }

  return children;
};

// 2. Helper for Admin elements
export const AdminOnly = ({ children, fallback = null }) => (
  <RoleGuard allow={["admin"]} fallback={fallback}>
    {children}
  </RoleGuard>
);

// 3. Helper for User elements
export const UserOnly = ({ children, fallback = null }) => (
  <RoleGuard allow={["user"]} fallback={fallback}>
    {children}
  </RoleGuard>
);