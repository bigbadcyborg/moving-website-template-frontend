import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns'
import { Job } from '../api/jobsApi'
import { formatDateTime } from '../lib/format'
import { Link } from 'react-router-dom'

interface JobsCalendarProps {
  jobsByDay: Array<{ date: string; jobs: Job[] }>
  onDaySelect?: (date: Date) => void
  selectedDate?: Date | null
}

export default function JobsCalendar({
  jobsByDay,
  onDaySelect,
  selectedDate = null,
}: JobsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Get first day of month (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = getDay(monthStart)
  
  // Create array with empty cells for days before month starts
  const calendarDays: (Date | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null)
  }
  daysInMonth.forEach(day => calendarDays.push(day))
  
  // Create a map of date strings to jobs
  const jobsByDateMap = new Map<string, Job[]>()
  jobsByDay.forEach(({ date, jobs }) => {
    jobsByDateMap.set(date, jobs)
  })
  
  const getJobsForDate = (date: Date): Job[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return jobsByDateMap.get(dateStr) || []
  }
  
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }
  
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }
  
  const handleDayClick = (day: Date) => {
    if (onDaySelect) {
      onDaySelect(day)
    }
  }
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500'
      case 'enRoute':
        return 'bg-yellow-500'
      case 'started':
        return 'bg-green-500'
      case 'completed':
        return 'bg-gray-500'
      case 'issueReported':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
          type="button"
        >
          ←
        </button>
        <h2 className="text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={handleNextMonth}
          className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
          type="button"
        >
          →
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }
          
          const isToday = isSameDay(day, today)
          const dayJobs = getJobsForDate(day)
          const hasJobs = dayJobs.length > 0
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              disabled={!isCurrentMonth}
              className={`
                aspect-square rounded border-2 transition-all relative
                ${isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}
                ${isToday ? 'border-blue-500 font-bold' : 'border-gray-200'}
                ${isSelected ? 'bg-blue-100 border-blue-600' : ''}
                ${hasJobs && isCurrentMonth
                  ? 'hover:bg-blue-50 hover:border-blue-400 cursor-pointer'
                  : isCurrentMonth ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed opacity-50'
                }
                ${!isCurrentMonth ? 'opacity-40' : ''}
                flex flex-col items-center justify-center p-1
              `}
              type="button"
            >
              <span className="text-sm">{format(day, 'd')}</span>
              {hasJobs && isCurrentMonth && (
                <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 justify-center flex-wrap">
                  {dayJobs.slice(0, 3).map((job) => (
                    <div
                      key={job.id}
                      className={`w-1.5 h-1.5 rounded-full ${getStatusColor(job.status)}`}
                      title={`Job #${job.id} - ${job.status}`}
                    />
                  ))}
                  {dayJobs.length > 3 && (
                    <span className="text-xs text-gray-500">+{dayJobs.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-600 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <span>En Route</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>Started</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span>Issue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-blue-500 rounded" />
          <span>Today</span>
        </div>
      </div>
      
      {/* Selected day jobs */}
      {selectedDate && getJobsForDate(selectedDate).length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium mb-2">
            Jobs on {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {getJobsForDate(selectedDate).map((job) => (
              <Link
                key={job.id}
                to={`/mover/job/${job.id}`}
                className="block p-2 bg-gray-50 rounded hover:bg-gray-100 text-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">Job #{job.id}</p>
                    {job.booking && (
                      <p className="text-xs text-gray-600">{job.booking.customerName}</p>
                    )}
                    <p className="text-xs text-gray-500">{formatDateTime(job.scheduledStartUtc)}</p>
                    {job.assignedCrew && job.assignedCrew.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Crew: {job.assignedCrew.map(c => c.employeeNumber || `#${c.id}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    job.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'enRoute' ? 'bg-yellow-100 text-yellow-800' :
                    job.status === 'started' ? 'bg-green-100 text-green-800' :
                    job.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
