import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'
import { Entrada } from '../atoms/Entrada'

interface PropsEntradaContrasena
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalido?: boolean
}

export function EntradaContrasena({ className = '', ...resto }: PropsEntradaContrasena) {
  const [visible, setVisible] = useState(false)
  const Icono = visible ? EyeOff : Eye

  return (
    <div className="relative">
      <Entrada {...resto} type={visible ? 'text' : 'password'} className={`pr-10 ${className}`} />
      <button
        type="button"
        onClick={() => setVisible((valor) => !valor)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-slate-500 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <Icono size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
