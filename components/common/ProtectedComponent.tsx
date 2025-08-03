// components/common/ProtectedComponent.tsx
import React from 'react';
import { useAuthContext } from '../../context/AuthContext';

interface ProtectedComponentProps {
  children: React.ReactNode;
  allowedRoles: Array<'Admin' | 'Editor' | 'Viewer'>;
}

const ProtectedComponent: React.FC<ProtectedComponentProps> = ({ children, allowedRoles }) => {
  const { userRole } = useAuthContext();

  if (userRole && allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }

  return null;
};

export default ProtectedComponent;
