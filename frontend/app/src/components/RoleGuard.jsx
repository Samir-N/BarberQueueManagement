import { useSelector } from "react-redux";

// 1. Core Guard Component
export const RoleGuard = ({ allow = [], children, fallback = null }) => {
  // Adjust 'state.auth' if your Redux slice key is named differently
  const { user } = useSelector((state) => state.auth);

  if (!user || !allow.includes(user.role)) {
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