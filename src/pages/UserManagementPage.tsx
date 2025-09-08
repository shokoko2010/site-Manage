import React from 'react'
import { UserManagement } from '../components/admin/UserManagement'
import { useOutletContext } from 'react-router-dom'

interface UserManagementPageProps {}

interface OutletContext {
  showNotification: (notification: { message: string; type: 'success' | 'error' | 'info' }) => void
}

export const UserManagementPage: React.FC<UserManagementPageProps> = () => {
  const { showNotification } = useOutletContext<OutletContext>()

  return (
    <div className="flex-1 overflow-y-auto">
      <UserManagement />
    </div>
  )
}