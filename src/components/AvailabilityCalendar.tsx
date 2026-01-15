import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns'

interface AvailabilityCalendarProps {
  onDaySelect: (date: Date) => void
  availableDates?: string[] // Array of YYYY-MM-DD date strings that have available slots
  selectedDate?: Date | null
}

export default function AvailabilityCalendar({
  onDaySelect,
  availableDates = [],
  selectedDate = null,
}: AvailabilityCalendarProps) {
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
  
  const hasAvailability = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return availableDates.includes(dateStr)
  }
  
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }
  
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }
  
  const handleDayClick = (day: Date) => {
    if (hasAvailability(day)) {
      onDaySelect(day)
    }
  }
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()
  
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
          const hasSlots = hasAvailability(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              disabled={!hasSlots || !isCurrentMonth}
              className={`
                aspect-square rounded border-2 transition-all
                ${isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}
                ${isToday ? 'border-blue-500 font-bold' : 'border-gray-200'}
                ${isSelected ? 'bg-blue-100 border-blue-600' : ''}
                ${hasSlots && isCurrentMonth
                  ? 'hover:bg-blue-50 hover:border-blue-400 cursor-pointer'
                  : 'cursor-not-allowed opacity-50'
                }
                ${!hasSlots || !isCurrentMonth ? 'opacity-40' : ''}
                relative flex flex-col items-center justify-center
              `}
              type="button"
            >
              <span>{format(day, 'd')}</span>
              {hasSlots && isCurrentMonth && (
                <span className="absolute bottom-1 w-1.5 h-1.5 bg-green-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
      
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>Has availability</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-blue-500 rounded" />
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}
