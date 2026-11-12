import type { ReactNode } from 'react'

interface PropsPlantillaPrincipal {
  encabezado: ReactNode
  children: ReactNode
}

export function PlantillaPrincipal({ encabezado, children }: PropsPlantillaPrincipal) {
  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-blue-800"
      >
        Saltar al contenido
      </a>
      {encabezado}
      <main id="contenido" className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}
