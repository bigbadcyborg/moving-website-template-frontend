import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { formatDateTime, formatCurrency } from '../../lib/format'

export default function BookingSuccessPage() {
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const type = searchParams.get('type')
  const isReschedule = type === 'reschedule'

  // Get estimate data from sessionStorage
  const details = useMemo(() => {
    const stored = sessionStorage.getItem('estimateData')
    if (!stored) return null
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 md:p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 border-4 border-white shadow-md">
            <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
            {isReschedule ? 'Reschedule Confirmed!' : 'Move Confirmed!'}
          </h2>
          <p className="text-lg text-gray-600 font-medium">
            {isReschedule 
              ? 'Your move has been successfully rescheduled. We have updated your arrival window.'
              : 'Thank you for your deposit. Your move is now officially scheduled.'}
          </p>
        </div>

        {details && (
          <div className="mt-8 border-t border-gray-100 pt-8 space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Move Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Arrival Window</label>
                  <p className="font-bold text-blue-700">{details.startUtc ? formatDateTime(details.startUtc) : 'Scheduled'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">From</label>
                  <p className="text-sm font-semibold text-gray-700">{details.originAddress}</p>
                  <p className="text-[10px] text-blue-500 mt-0.5 capitalize">Walk: {details.originLongCarry}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">To</label>
                  <p className="text-sm font-semibold text-gray-700">{details.destinationAddress}</p>
                  <p className="text-[10px] text-blue-500 mt-0.5 capitalize">Walk: {details.destinationLongCarry}</p>
                </div>
                {details.additionalStops?.length > 0 && (
                  <div className="pt-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Additional Stops</label>
                    <div className="space-y-1 mt-1">
                      {details.additionalStops.map((stop: any, i: number) => (
                        <div key={i} className="text-[11px] font-semibold text-gray-600 flex items-start">
                          <span className="text-blue-500 mr-1">•</span>
                          <span>{stop.address} <span className="text-[9px] text-gray-400 font-normal">(Walk: {stop.longCarry})</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Property Type</label>
                  <p className="text-sm font-semibold text-gray-700 capitalize">{details.moveType}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Bedrooms</label>
                    <p className="text-sm font-semibold text-gray-700">{details.bedroomsWithMattresses}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Boxes</label>
                    <p className="text-sm font-semibold text-gray-700">{details.boxCount}</p>
                  </div>
                </div>
                {(details.specialItems?.length > 0 || details.disassemblyNeeds !== 'none') && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Special Items/Services</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {details.specialItems?.map((item: string) => (
                        <span key={item} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-md capitalize">{item}</span>
                      ))}
                      {details.disassemblyNeeds !== 'none' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md capitalize">Assembly: {details.disassemblyNeeds}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {details.quote?.kind === 'instant' && details.quote.options && (
              <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold uppercase tracking-widest opacity-80">Estimated Price Range</h4>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">2 Mover Rate</span>
                </div>
                <div className="text-3xl font-black">
                  {formatCurrency(details.quote.options[0].priceRange.low * 100)} - {formatCurrency(details.quote.options[0].priceRange.high * 100)}
                </div>
                <p className="text-[10px] mt-2 opacity-75 italic">* Final price is based on actual hours worked. Includes transport fees.</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <h3 className="text-blue-800 font-bold mb-3 text-sm uppercase tracking-wider">What's Next?</h3>
            <ul className="text-sm text-blue-700 space-y-3 font-medium">
              <li className="flex items-start">
                <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] mr-3 mt-0.5 shrink-0 font-black">1</span>
                Check your inbox for a confirmation email with these details.
              </li>
              <li className="flex items-start">
                <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] mr-3 mt-0.5 shrink-0 font-black">2</span>
                Our operations team will call you 24-48 hours before the move to confirm final logistics.
              </li>
              <li className="flex items-start">
                <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] mr-3 mt-0.5 shrink-0 font-black">3</span>
                Need to make changes? Reply to your confirmation email or contact our support team.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
