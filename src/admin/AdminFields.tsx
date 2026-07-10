import type { ReactNode } from "react"

type TextFieldProps = {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly placeholder?: string
  readonly type?: "text" | "url" | "number" | "color"
}

type SelectFieldProps<TValue extends string> = {
  readonly label: string
  readonly value: TValue
  readonly options: readonly TValue[]
  readonly getOptionLabel?: (value: TValue) => string
  readonly onChange: (value: TValue) => void
}

export function AdminTextField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: TextFieldProps) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  )
}

export function AdminTextareaField({
  label,
  value,
  onChange,
}: Omit<TextFieldProps, "placeholder" | "type">) {
  return (
    <label className="admin-field admin-field--wide">
      <span>{label}</span>
      <textarea value={value} rows={4} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  )
}

export function AdminSelectField<TValue extends string>({
  getOptionLabel,
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<TValue>) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => {
          const nextValue = options.find((option) => option === event.currentTarget.value)
          if (nextValue !== undefined) {
            onChange(nextValue)
          }
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getOptionLabel?.(option) ?? option}
          </option>
        ))}
      </select>
    </label>
  )
}

export function AdminCheckbox({
  label,
  checked,
  onChange,
}: {
  readonly label: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
}) {
  return (
    <label className="admin-check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

export function AdminPanel({
  title,
  meta,
  children,
}: {
  readonly title: string
  readonly meta?: string
  readonly children: ReactNode
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel__head">
        <h2>{title}</h2>
        {meta === undefined ? null : <span>{meta}</span>}
      </div>
      {children}
    </section>
  )
}
