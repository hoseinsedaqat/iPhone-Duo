export type Operator = '+' | '−' | '×' | '÷'
export interface CalculatorState { display: string; previous: number | null; operator: Operator | null; waiting: boolean; expression: string }
export const initialCalculator: CalculatorState = { display: '0', previous: null, operator: null, waiting: false, expression: '' }
export function calculate(a: number, b: number, op: Operator): number | null {
  const result = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : b === 0 ? NaN : a / b
  return Number.isFinite(result) ? Number(result.toPrecision(12)) : null
}
export function calculatorInput(state: CalculatorState, key: string): CalculatorState {
  if (key === 'AC') return initialCalculator
  if (state.display === 'Error') state = initialCalculator
  if (/^\d$/.test(key)) {
    const display = state.waiting || state.display === '0' ? key : state.display.replace('-', '').length >= 12 ? state.display : state.display + key
    return { ...state, display, waiting: false }
  }
  if (key === '.') return { ...state, display: state.waiting ? '0.' : state.display.includes('.') ? state.display : `${state.display}.`, waiting: false }
  if (key === '⌫') return { ...state, display: state.waiting ? state.display : state.display.length <= 1 || (state.display.length === 2 && state.display.startsWith('-')) ? '0' : state.display.slice(0, -1) }
  if (key === '±') return { ...state, display: String(-Number(state.display)), waiting: false }
  if (key === '%') return { ...state, display: String(Number((Number(state.display) / 100).toPrecision(12))), waiting: false }
  if (['+', '−', '×', '÷'].includes(key)) {
    const current = Number(state.display)
    const result = state.operator && state.previous !== null && !state.waiting ? calculate(state.previous, current, state.operator) : current
    if (result === null) return { ...initialCalculator, display: 'Error' }
    return { display: String(result), previous: result, operator: key as Operator, waiting: true, expression: `${result} ${key}` }
  }
  if (key === '=' && state.operator && state.previous !== null) {
    const current = Number(state.display); const result = calculate(state.previous, current, state.operator)
    return result === null ? { ...initialCalculator, display: 'Error' } : { display: String(result), previous: null, operator: null, waiting: true, expression: `${state.previous} ${state.operator} ${current} =` }
  }
  return state
}
