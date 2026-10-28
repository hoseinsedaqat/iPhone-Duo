import { useEffect, useReducer } from 'react'
import { calculatorInput, initialCalculator } from '../utils/calculator'

const keys = ['AC', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '=']
export function CalculatorApp() {
  const [state, press] = useReducer(calculatorInput, initialCalculator)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return
      const mapping: Record<string, string> = { '*': '×', '/': '÷', '-': '−', Enter: '=', '=': '=', Escape: 'AC', Backspace: '⌫' }
      const key = mapping[event.key] ?? event.key
      if (/^[0-9.]$/.test(key) || ['+', '−', '×', '÷', '=', '%', 'AC', '⌫'].includes(key)) { event.preventDefault(); press(key) }
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])
  return <div className="app-root calculator-app"><div className="calculator-body"><div className="calculator-display"><span>{state.expression || 'Calculator'}</span><output aria-label="Calculator result">{state.display}</output></div><div className="calculator-keys">{keys.map(key => <button key={key} aria-label={key === '=' ? 'Equals' : key === 'AC' ? 'Clear' : key === '±' ? 'Change sign' : key} className={`${['AC','±','%'].includes(key) ? 'calc-function' : ''} ${['÷','×','−','+','='].includes(key) ? 'calc-operator' : ''} ${key === '0' ? 'calc-zero' : ''} ${state.operator === key && state.waiting ? 'operator-active' : ''}`} onClick={() => press(key)}>{key}</button>)}</div><small>Keyboard supported</small></div></div>
}
