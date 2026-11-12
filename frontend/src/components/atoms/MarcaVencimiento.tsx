import { CalendarClock } from 'lucide-react'

// Marker for document types whose documents carry an expiry date
export function MarcaVencimiento() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-100">
      <CalendarClock aria-hidden="true" className="size-3.5 shrink-0" />
      Requiere vencimiento
    </span>
  )
}
