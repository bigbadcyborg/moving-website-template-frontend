import { useQuery } from '@tanstack/react-query'
import { getNotifications } from '../../api/notificationsApi'
import { formatDateTime } from '../../lib/format'

export default function CommunicationsPage() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
  })

  if (isLoading) return <div>Loading communications...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Communications</h1>
      <div className="grid gap-4">
        {notifications?.map((notif) => (
          <div key={notif.id} className="bg-white p-4 rounded-lg shadow">
            <p className="font-medium">{notif.template}</p>
            <p className="text-sm text-gray-600">{formatDateTime(notif.createdAtUtc)}</p>
            <p className="text-sm">Status: {notif.status}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
