import { useQuery } from '@tanstack/react-query'
import { getJobs } from '../../api/jobsApi'
import { formatDateTime } from '../../lib/format'
import { Link } from 'react-router-dom'

export default function DispatchBoardPage() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(), // Backend automatically filters by current mover's employee ID
  })

  if (isLoading) return <div>Loading jobs...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Assigned Jobs</h1>
      {jobs && jobs.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600">You don't have any assigned jobs at this time.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs?.map((job) => (
            <div key={job.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link to={`/mover/job/${job.id}`} className="font-medium text-blue-600 hover:underline text-lg">
                    {job.booking?.customerName || `Job #${job.id}`}
                  </Link>
                  {job.booking && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">{job.booking.customerName}</p>
                      <p className="text-xs text-gray-500">{job.booking.moveFromAddress}</p>
                      <p className="text-xs text-gray-500">→ {job.booking.moveToAddress}</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Scheduled:</strong> {formatDateTime(job.scheduledStartUtc)}
                  </p>
                  <p className="text-sm">
                    <strong>Status:</strong> <span className="capitalize">{job.status}</span>
                  </p>
                  {job.assignedCrew && job.assignedCrew.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Crew: {job.assignedCrew.map(c => {
                        // Always prioritize userFullName if it exists (even if empty string, check for truthy)
                        const fullName = c.userFullName?.trim()
                        if (fullName) {
                          return fullName
                        }
                        // Fallback to employeeNumber if no fullName
                        if (c.employeeNumber?.trim()) {
                          return c.employeeNumber.trim()
                        }
                        // Last resort
                        return 'Unknown'
                      }).join(', ')}
                    </p>
                  )}
                </div>
                <div>
                  <Link
                    to={`/mover/job/${job.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
