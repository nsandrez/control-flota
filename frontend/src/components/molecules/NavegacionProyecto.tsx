import { NavLink } from 'react-router'

interface PropsNavegacionProyecto {
  proyectoId: number
}

const ESTILO_BASE =
  'inline-flex min-h-10 items-center border-b-2 px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'

// Tab-like links between the sections of one project
export function NavegacionProyecto({ proyectoId }: PropsNavegacionProyecto) {
  const secciones = [
    { destino: `/proyectos/${proyectoId}/vehiculos`, texto: 'Vehículos' },
    { destino: `/proyectos/${proyectoId}/conductores`, texto: 'Conductores' },
    { destino: `/proyectos/${proyectoId}/tipos-documento`, texto: 'Documentos requeridos' },
  ]
  return (
    <nav aria-label="Secciones del proyecto" className="border-b border-slate-200 dark:border-slate-800">
      <ul className="-mb-px flex flex-wrap gap-1">
        {secciones.map(({ destino, texto }) => (
          <li key={destino}>
            <NavLink
              to={destino}
              className={({ isActive }) =>
                `${ESTILO_BASE} ${
                  isActive
                    ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-50'
                }`
              }
            >
              {texto}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
