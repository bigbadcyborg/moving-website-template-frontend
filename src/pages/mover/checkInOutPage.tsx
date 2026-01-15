import { useQuery, useMutation } from '@tanstack/react-query'
import { getJobs } from '../../api/jobsApi'
import { checkIn, checkOut, getTimeEntries } from '../../api/timeEntriesApi'

export default function CheckInOutPage() {
  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
  })

  const { data: timeEntries } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: getTimeEntries,
  })

  const checkInMutation = useMutation({
    mutationFn: checkIn,
  })

  const checkOutMutation = useMutation({
    mutationFn: checkOut,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Check In/Out</h1>
      <div className="grid gap-4">
        {jobs?.map((job) => {
          const entry = timeEntries?.find(e => e.jobId === job.id && !e.checkOutUtc)
          return (
            <div key={job.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Job #{job.id}</p>
                  <p className="text-sm text-gray-600">Status: {job.status}</p>
                </div>
                {!entry ? (
                  <button
                    onClick={() => checkInMutation.mutate(job.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Check In
                  </button>
                ) : (
                  <button
                    onClick={() => checkOutMutation.mutate(entry.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Check Out
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
