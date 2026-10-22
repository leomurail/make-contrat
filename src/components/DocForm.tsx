import type { ReactNode } from 'react'
import type { DocData, Field, FieldGroup } from '../lib/types'

interface Props {
  groups: FieldGroup[]
  data: DocData
  onChange: (key: string, value: string) => void
  /** Valeurs proposées en autocomplétion, par clé de champ. */
  suggestions?: Record<string, string[]>
}

export function DocForm({ groups, data, onChange, suggestions = {} }: Props) {
  return (
    <form className="form" onSubmit={(e) => e.preventDefault()}>
      {groups.map((group) => (
        <fieldset key={group.title} className="group">
          <legend>{group.title}</legend>
          {group.fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={data[field.key] ?? ''}
              suggestions={suggestions[field.key]}
              onChange={(v) => onChange(field.key, v)}
            />
          ))}
        </fieldset>
      ))}
    </form>
  )
}

interface FieldInputProps {
  field: Field
  value: string
  suggestions?: string[]
  onChange: (v: string) => void
}

function FieldInput({ field, value, suggestions, onChange }: FieldInputProps) {
  const id = `f-${field.key}`
  let control: ReactNode

  switch (field.type) {
    case 'textarea':
      control = (
        <textarea id={id} rows={field.rows ?? 4} value={value} placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)} />
      )
      break
    case 'select':
      control = (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((o) => <option key={o}>{o}</option>)}
        </select>
      )
      break
    case 'number':
      control = (
        <div className="with-suffix">
          <input id={id} type="number" inputMode={field.step === 1 ? 'numeric' : 'decimal'} step={field.step}
            min={field.min} placeholder={field.placeholder} value={value}
            onChange={(e) => onChange(e.target.value)} />
          {field.suffix ? <span>{field.suffix}</span> : null}
        </div>
      )
      break
    case 'image':
      control = <ImageInput id={id} value={value} onChange={onChange} />
      break
    case 'date':
      control = <input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      break
    case 'text':
      control = (
        <>
          <input id={id} type="text" value={value} placeholder={field.placeholder} readOnly={field.readOnly}
            list={suggestions?.length ? `${id}-list` : undefined} autoComplete="off"
            onChange={(e) => onChange(e.target.value)} />
          {suggestions?.length ? (
            <datalist id={`${id}-list`}>{suggestions.map((v) => <option key={v} value={v} />)}</datalist>
          ) : null}
        </>
      )
  }

  return (
    <div className="field">
      <label htmlFor={id}>{field.label}</label>
      {control}
      {'hint' in field && field.hint ? <small className="hint">{field.hint}</small> : null}
    </div>
  )
}

function ImageInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const onFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="image-input">
      <div className="thumb">{value ? <img src={value} alt="" /> : <span>Aucune</span>}</div>
      <label className="btn btn-small" htmlFor={id}>Choisir…</label>
      <input id={id} type="file" accept="image/png,image/jpeg" hidden
        onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
      {value ? <button type="button" className="btn btn-small btn-ghost" onClick={() => onChange('')}>Retirer</button> : null}
    </div>
  )
}
