import { shortLabel } from './labels'

interface Props {
  matrix: number[][]
  classes: string[]
}

/**
 * Matriz de confusión como heatmap (filas = clase real, columnas = predicha).
 * La intensidad del color es proporcional al valor; la diagonal concentra los
 * aciertos y resalta de forma natural.
 */
export default function ConfusionMatrix({ matrix, classes }: Props) {
  const max = Math.max(1, ...matrix.flat())

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-center text-xs">
        <thead>
          <tr>
            <th className="p-1 text-[10px] font-medium text-slate-400">real ＼ pred.</th>
            {classes.map((c) => (
              <th key={c} className="p-1 font-semibold text-slate-600">
                {shortLabel(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={classes[i]}>
              <td className="p-1 text-right font-semibold text-slate-600">{shortLabel(classes[i])}</td>
              {row.map((value, j) => {
                const intensity = value / max
                const isDiagonal = i === j
                return (
                  <td
                    key={j}
                    className="p-1"
                    style={{
                      backgroundColor: isDiagonal
                        ? `rgba(22, 163, 74, ${0.12 + 0.78 * intensity})`
                        : `rgba(220, 38, 38, ${value === 0 ? 0 : 0.12 + 0.78 * intensity})`,
                      color: intensity > 0.5 ? '#fff' : '#334155',
                    }}
                  >
                    <span className="inline-block min-w-[2.2rem] rounded font-medium tabular-nums">
                      {value}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
