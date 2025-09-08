import React from 'react'
import SettingsView from '../components/SettingsView'
import { useOutletContext } from 'react-router-dom'

interface SettingsPageProps {}

interface OutletContext {
  showNotification: (notification: { message: string; type: 'success' | 'error' | 'info' }) => void
}

export const SettingsPage: React.FC<SettingsPageProps> = () => {
  const { showNotification } = useOutletContext<OutletContext>()

  return (
    <div className="flex-1 overflow-y-auto">
      <SettingsView showNotification={showNotification} />
    </div>
  )
}