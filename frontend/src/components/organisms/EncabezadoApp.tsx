import { Truck } from 'lucide-react'
import { NavLink } from 'react-router'
import type { Usuario } from '../../interface/usuario.interface'
import { formatearRut } from '../../utils/rut'
import { Boton } from '../atoms/Boton'

export interface EnlaceNavegacion {
  a: string
  texto: string
}

interface PropsEncabezadoApp {
  usuario: Usuario
  enlaces: EnlaceNavegacion[]
  onCerrarSesion: () => void
}

export function EncabezadoApp({ usuario, enlaces, onCerrarSesion }: PropsEncabezadoApp) {
  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="flex items-center gap-2 text-base font-semibold">
            <Truck size={22} aria-hidden="true" className="text-blue-700 dark:text-blue-300" />
            Control de Flota
          </span>
          <nav aria-label="Principal" className="flex gap-1">
            {enlaces.map((enlace) => (
              <NavLink
                key={enlace.a}
                to={enlace.a}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-blue-600 ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 dark:bg-slate-800 dark:text-blue-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
              >
                {enlace.texto}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm leading-tight">
            <p className="font-medium">{usuario.nombre}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {usuario.rut ? `${formatearRut(usuario.rut)} · ` : ''}
              {usuario.rol === 'ADMIN' ? 'Administrador' : 'Operador'}
            </p>
          </div>
          <Boton variante="secundario" onClick={onCerrarSesion}>
            Cerrar sesión
          </Boton>
        </div>
      </div>
    </header>
  )
}
