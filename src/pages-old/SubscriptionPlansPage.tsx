import React from 'react'
import { SubscriptionPlans } from '../components/SubscriptionPlans'
import { useOutletContext } from 'react-router-dom'

interface SubscriptionPlansPageProps {}

interface OutletContext {
  showNotification: (notification: { message: string; type: 'success' | 'error' | 'info' }) => void
}

export const SubscriptionPlansPage: React.FC<SubscriptionPlansPageProps> = () => {
  const { showNotification } = useOutletContext<OutletContext>()

  return (
    <div className="flex-1 overflow-y-auto">
      <SubscriptionPlans />
    </div>
  )
}