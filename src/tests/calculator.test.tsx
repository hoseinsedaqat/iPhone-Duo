import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { calculate, calculatorInput, initialCalculator } from '../utils/calculator'
import { CalculatorApp } from '../apps/Calculator'

describe('calculator', () => {
  it('handles all operations and invalid division', () => {
    expect(calculate(0.1, 0.2, '+')).toBe(0.3)
    expect(calculate(7, 8, '×')).toBe(56)
    expect(calculate(10, 2, '÷')).toBe(5)
    expect(calculate(3, 5, '−')).toBe(-2)
    expect(calculate(5, 0, '÷')).toBeNull()
  })
  it('chains operations, decimals, sign and percent', () => {
    const result = ['1', '.', '5', '+', '2', '=', '±', '%'].reduce(calculatorInput, initialCalculator)
    expect(result.display).toBe('-0.035')
  })
  it('supports keyboard input', () => {
    render(<CalculatorApp/>)
    for (const key of ['7', '*', '8', 'Enter']) fireEvent.keyDown(window, { key })
    expect(screen.getByLabelText('Calculator result')).toHaveTextContent('56')
  })
})
