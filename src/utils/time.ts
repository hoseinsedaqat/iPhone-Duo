import { useEffect, useState } from 'react'
export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), interval); return () => window.clearInterval(id) }, [interval])
  return now
}
export function localDateInput(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
