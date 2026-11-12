import { Truck } from 'lucide-react'
import type { ReactNode } from 'react'

interface PropsPlantillaAutenticacion {
  titulo: string
  subtitulo?: string
  children: ReactNode
}

export function PlantillaAutenticacion({ titulo, subtitulo, children }: PropsPlantillaAutenticacion) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Truck size={32} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold">{titulo}</h1>
          {subtitulo && <p className="text-sm text-slate-600 dark:text-slate-300">{subtitulo}</p>}
        </div>
        {children}
      </div>
    </main>
  )
}
