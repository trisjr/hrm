import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface RequirementsMatrixCellProps {
  value: number | null
  onChange: (value: number | null) => Promise<void>
  disabled?: boolean
}

export function RequirementsMatrixCell({
  value,
  onChange,
  disabled = false,
}: RequirementsMatrixCellProps) {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || '')
  const [isSaving, setIsSaving] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setLocalValue(value?.toString() || '')
  }, [value])

  const handleBlur = async () => {
    const trimmed = localValue.trim()

    // If empty, set to null
    if (trimmed === '') {
      if (value !== null) {
        setIsSaving(true)
        setHasError(false)
        try {
          await onChange(null)
        } catch (error) {
          setHasError(true)
          setLocalValue(value?.toString() || '')
        } finally {
          setIsSaving(false)
        }
      }
      return
    }

    // Validate 1-5
    const numValue = parseInt(trimmed, 10)
    if (isNaN(numValue) || numValue < 1 || numValue > 5) {
      setHasError(true)
      setLocalValue(value?.toString() || '')
      return
    }

    // If value changed, save
    if (numValue !== value) {
      setIsSaving(true)
      setHasError(false)
      try {
        await onChange(numValue)
      } catch (error) {
        setHasError(true)
        setLocalValue(value?.toString() || '')
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasError(false)
    setLocalValue(e.target.value)
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled || isSaving}
      placeholder="—"
      className={cn(
        'h-9 w-16 text-center',
        isSaving && 'opacity-50',
        hasError && 'border-destructive focus-visible:ring-destructive',
      )}
      aria-label="Required level (1-5)"
    />
  )
}
