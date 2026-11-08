import type { ReactNode } from 'react'

import AcademicWarning from './AcademicWarning'
import ChatHeader from './ChatHeader'

interface Props {
  children: ReactNode
  /** Nombre de la conversación/caso, mostrado en la cabecera minimalista. */
  title?: string
}

/**
 * Layout del chat a pantalla completa: cabecera minimalista + aviso académico +
 * área de conversación a todo el ancho disponible. El panel derecho de acciones
 * se eliminó; la navegación y las acciones viven ahora en la barra lateral.
 */
export default function ChatLayout({ children, title }: Props) {
  return (
    <div className="flex h-full flex-col">
      <ChatHeader title={title} />
      <AcademicWarning />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
