import { renderHook, act } from '@testing-library/react'
import { expect, test, vi, beforeEach, afterEach } from 'vitest'
import { useTransliterate } from '../hooks/useTransliterate'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('detects script immediately and converts after debounce', () => {
  const { result } = renderHook(() => useTransliterate('салом', 100))
  expect(result.current.detectedScript).toBe('cyrillic')
  act(() => { vi.advanceTimersByTime(100) })
  expect(result.current.text).toBe('salom')
})

test('empty input yields empty output', () => {
  const { result } = renderHook(() => useTransliterate('', 100))
  expect(result.current.text).toBe('')
  expect(result.current.detectedScript).toBe('foreign')
})
