import { type DragEvent, type PointerEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import {
  cleanFileNameToLabel,
  formatSocialAccountLegal,
  type PhotoItem,
  parsePhotoItems,
  parseSocialAccounts,
  SOCIAL_PLATFORMS,
  type SocialAccount,
  serializePhotoItems,
  serializeSocialAccounts,
} from '../lib/format'
import type { DocData, Field, FieldGroup, RadioCardOption } from '../lib/types'

interface Props {
  groups: FieldGroup[]
  data: DocData
  onChange: (key: string, value: string) => void
  /** Valeurs proposées en autocomplétion, par clé de champ. */
  suggestions?: Record<string, string[]>
  /** Index du groupe à afficher (si mode par étapes). */
  activeGroupIndex?: number
}

export function DocForm({ groups, data, onChange, suggestions = {}, activeGroupIndex }: Props) {
  const displayedGroups =
    activeGroupIndex !== undefined && groups[activeGroupIndex]
      ? [groups[activeGroupIndex]]
      : groups

  return (
    <form className="form" onSubmit={(e) => e.preventDefault()}>
      {displayedGroups.map((group) => (
        <fieldset key={group.title} className="group">
          {activeGroupIndex === undefined ? <legend>{group.title}</legend> : null}
          {group.fields
            .filter((field) => !field.showIf || field.showIf(data))
            .map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={data[field.key] ?? ''}
                data={data}
                suggestions={suggestions[field.key]}
                onChange={(v) => onChange(field.key, v)}
                onChangeKey={onChange}
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
  data: DocData
  suggestions?: string[]
  onChange: (v: string) => void
  onChangeKey: (key: string, v: string) => void
}

function FieldInput({ field, value, data, suggestions, onChange, onChangeKey }: FieldInputProps) {
  const id = `f-${field.key}`
  let control: ReactNode

  switch (field.type) {
    case 'textarea':
      control = (
        <textarea
          id={id}
          rows={field.rows ?? 4}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      break
    case 'select':
      control = (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      )
      break
    case 'radio-cards':
      control = <RadioCardsInput options={field.options} value={value} onChange={onChange} />
      break
    case 'socials':
      control = <SocialsInput value={value} onChange={onChange} />
      break
    case 'photos':
      control = (
        <PhotosGalleryInput
          id={id}
          imagesValue={data.annexeImage ?? ''}
          notesValue={value}
          onChangeImages={(imgs) => onChangeKey('annexeImage', imgs)}
          onChangeNotes={onChange}
        />
      )
      break
    case 'number':
      control = (
        <div className="number-field-stack">
          <div className="with-suffix">
            <input
              id={id}
              type="number"
              inputMode={field.step === 1 ? 'numeric' : 'decimal'}
              step={field.step}
              min={field.min}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            {field.suffix ? <span>{field.suffix}</span> : null}
          </div>
          {field.presets?.length ? (
            <div className="preset-pills">
              {field.presets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={value === p.value ? 'preset-pill active' : 'preset-pill'}
                  onClick={() => onChange(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )
      break
    case 'image':
      control = <ImageInput id={id} value={value} onChange={onChange} />
      break
    case 'signature':
      control = <SignatureInput id={id} value={value} onChange={onChange} />
      break
    case 'date':
      control = <input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      break
    case 'text':
      control = field.prefix ? (
        <div className="input-with-prefix">
          <span className="input-prefix">{field.prefix}</span>
          <input
            id={id}
            type="text"
            value={value}
            placeholder={field.placeholder}
            readOnly={field.readOnly}
            autoComplete="off"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : (
        <>
          <input
            id={id}
            type="text"
            value={value}
            placeholder={field.placeholder}
            readOnly={field.readOnly}
            list={suggestions?.length ? `${id}-list` : undefined}
            autoComplete="off"
            onChange={(e) => onChange(e.target.value)}
          />
          {suggestions?.length ? (
            <datalist id={`${id}-list`}>
              {suggestions.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          ) : null}
        </>
      )
  }

  return (
    <div className="field">
      <label htmlFor={id}>{field.label}</label>
      {control}
      {field.hint ? <small className="hint">{field.hint}</small> : null}
    </div>
  )
}

function RadioCardsInput({
  options,
  value,
  onChange,
}: {
  options: RadioCardOption[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="radio-cards">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            className={active ? 'radio-card active' : 'radio-card'}
            onClick={() => onChange(opt.value)}
          >
            <div className="radio-card-header">
              <span className={active ? 'radio-dot active' : 'radio-dot'} />
              <span className="radio-card-title">{opt.title}</span>
            </div>
            <span className="radio-card-desc">{opt.description}</span>
          </button>
        )
      })}
    </div>
  )
}

function SocialsInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const accounts = parseSocialAccounts(value)
  const rows: SocialAccount[] =
    accounts.length > 0 ? accounts : [{ platform: 'Instagram', handle: '', url: '' }]

  const updateRows = (next: SocialAccount[]) => {
    const nonEmpty = next.filter((r) => r.handle.trim() !== '' || r.url.trim() !== '')
    onChange(nonEmpty.length > 0 ? serializeSocialAccounts(next) : '')
  }

  const handleChangeRow = (idx: number, patch: Partial<SocialAccount>) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    onChange(serializeSocialAccounts(next))
  }

  const handleAddRow = () => {
    const used = new Set(rows.map((r) => r.platform))
    const nextPlatform = SOCIAL_PLATFORMS.find((p) => !used.has(p)) ?? 'Instagram'
    onChange(serializeSocialAccounts([...rows, { platform: nextPlatform, handle: '', url: '' }]))
  }

  const handleRemoveRow = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx)
    updateRows(next)
  }

  return (
    <div className="collection-box">
      {rows.map((row, idx) => {
        const preview = formatSocialAccountLegal(row)
        return (
          <div key={idx} className="social-item-card">
            <div className="social-item-top">
              <select
                className="social-select"
                value={row.platform}
                onChange={(e) => handleChangeRow(idx, { platform: e.target.value })}
                aria-label="Plateforme"
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {rows.length > 1 || row.handle || row.url ? (
                <button
                  type="button"
                  className="btn btn-small btn-ghost icon-btn"
                  onClick={() => handleRemoveRow(idx)}
                  title="Retirer ce compte"
                >
                  <span className="material-symbols-rounded icon-xs">close</span>
                </button>
              ) : null}
            </div>

            <div className="social-fields-row">
              <div className="input-with-prefix social-field-pseudo">
                <span className="input-prefix">@</span>
                <input
                  type="text"
                  value={row.handle.replace(/^@+/, '')}
                  placeholder="Pseudo / Nom du compte"
                  onChange={(e) => handleChangeRow(idx, { handle: e.target.value })}
                />
              </div>

              <div className="input-with-prefix social-field-url">
                <span className="input-prefix">
                  <span className="material-symbols-rounded icon-xs">link</span>
                </span>
                <input
                  type="url"
                  value={row.url}
                  placeholder="Lien du compte (https://...)"
                  onChange={(e) => handleChangeRow(idx, { url: e.target.value })}
                />
              </div>
            </div>

            {preview ? (
              <small className="social-preview">
                <span className="material-symbols-rounded icon-xs" style={{ color: '#16a34a', verticalAlign: 'text-bottom', marginRight: 4 }}>
                  check_circle
                </span>
                Sera inscrit au contrat : {preview}
              </small>
            ) : null}
          </div>
        )
      })}

      <button type="button" className="btn btn-small add-row-btn" onClick={handleAddRow}>
        <span className="material-symbols-rounded icon-sm">add</span>
        <span>Ajouter un réseau social</span>
      </button>
    </div>
  )
}

/** Redimensionne et compresse une image (capture d'écran ou photo) pour un PDF léger et rapide. */
function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => resolve(String(reader.result))
      img.onload = () => {
        const maxDim = 960
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(String(reader.result))
          return
        }
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function PhotosGalleryInput({
  id,
  imagesValue,
  notesValue,
  onChangeImages,
  onChangeNotes,
}: {
  id: string
  imagesValue: string
  notesValue: string
  onChangeImages: (v: string) => void
  onChangeNotes: (v: string) => void
}) {
  const items = parsePhotoItems(imagesValue)
  const [dragging, setDragging] = useState(false)
  const [showNotes, setShowNotes] = useState(Boolean(notesValue && notesValue.trim()))

  const handleFiles = async (fileList: FileList | null | undefined) => {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    const newItems: PhotoItem[] = await Promise.all(
      files.map(async (file, i) => ({
        src: await compressImageFile(file),
        label: cleanFileNameToLabel(file.name, items.length + i + 1),
      })),
    )
    onChangeImages(serializePhotoItems([...items, ...newItems]))
  }

  const handleDrop = async (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragging(false)
    await handleFiles(e.dataTransfer.files)
  }

  const updateItemLabel = (idx: number, label: string) => {
    const next = items.map((item, i) => (i === idx ? { ...item, label } : item))
    onChangeImages(serializePhotoItems(next))
  }

  const removeImage = (idx: number) => {
    const next = items.filter((_, i) => i !== idx)
    onChangeImages(serializePhotoItems(next))
  }

  return (
    <div className="photos-gallery-widget">
      <div className="photos-info-banner">
        <div className="photos-info-title">
          <span className="material-symbols-rounded icon-sm">shield</span>
          <strong>Recommandé pour une protection juridique maximale (art. L. 131-3 CPI)</strong>
        </div>
        <p className="photos-info-desc">
          Glissez-déposez directement les <strong>photos</strong> ou les <strong>captures d’écran Instagram</strong>{' '}
          ci-dessous. Elles seront <strong>numérotées, nommées et intégrées visuellement</strong> dans l’Article 1 et en
          Annexe du contrat (PDF & Word) pour prouver exactement quelles images sont autorisées.
        </p>
      </div>

      <label
        htmlFor={id}
        className={dragging ? 'photos-dropzone dragging' : 'photos-dropzone'}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="photos-dropzone-title">
          <span className="material-symbols-rounded icon-md" style={{ verticalAlign: 'middle', marginRight: 6 }}>
            add_photo_alternate
          </span>
          Cliquez ou glissez-déposez ici les photos / captures d’écran Instagram
        </span>
        <span className="photos-dropzone-sub">
          Sélection multiple autorisée — numérotation et intitulé automatiques ({items.length} photo
          {items.length > 1 ? 's' : ''} jointe{items.length > 1 ? 's' : ''})
        </span>
        <input
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>

      {items.length > 0 ? (
        <div className="photos-thumbs-grid">
          {items.map((item, idx) => (
            <div key={idx} className="photo-thumb-card">
              <div className="photo-thumb-header">
                <span>Photo #{idx + 1}</span>
                <button
                  type="button"
                  className="photo-thumb-remove"
                  onClick={() => removeImage(idx)}
                  title="Retirer cette photo"
                >
                  <span className="material-symbols-rounded icon-xs">close</span>
                </button>
              </div>
              <img src={item.src} alt={item.label} />
              <div className="photo-thumb-input-wrap">
                <input
                  type="text"
                  className="photo-thumb-label-input"
                  value={item.label}
                  placeholder={`Photographie n°${idx + 1}`}
                  onChange={(e) => updateItemLabel(idx, e.target.value)}
                  title="Nom ou description courte de la photo dans le contrat"
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!showNotes ? (
        <button
          type="button"
          className="btn btn-small btn-ghost"
          style={{ alignSelf: 'flex-start', paddingLeft: 4 }}
          onClick={() => setShowNotes(true)}
        >
          + Ajouter des liens ou précisions complémentaires (optionnel)
        </button>
      ) : (
        <div className="field" style={{ marginTop: 4 }}>
          <label htmlFor={`${id}-notes`} style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            Liens Instagram ou précisions complémentaires (optionnel) :
          </label>
          <textarea
            id={`${id}-notes`}
            rows={2}
            value={notesValue}
            placeholder="Ex : https://www.instagram.com/p/... ou description complémentaire"
            onChange={(e) => onChangeNotes(e.target.value)}
          />
        </div>
      )}
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
      <label className="btn btn-small" htmlFor={id}>
        Choisir une image…
      </label>
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {value ? (
        <button type="button" className="btn btn-small btn-ghost" onClick={() => onChange('')}>
          Retirer
        </button>
      ) : null}
    </div>
  )
}

function SignatureInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [drawing, setDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDownRef = useRef(false)

  useEffect(() => {
    if (!drawing || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [drawing])

  const getPos = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    }
  }

  const startStroke = (e: PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    isDownRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const moveStroke = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDownRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endStroke = () => {
    if (!isDownRef.current || !canvasRef.current) return
    isDownRef.current = false
    onChange(canvasRef.current.toDataURL('image/png'))
  }

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    onChange('')
  }

  const onFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onChange(String(reader.result))
      setDrawing(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="signature-widget">
      {!drawing ? (
        <div className="image-input">
          <div className="thumb">{value ? <img src={value} alt="" /> : <span>Vide (à signer)</span>}</div>
          <button type="button" className="btn btn-small" onClick={() => setDrawing(true)}>
            <span className="material-symbols-rounded icon-sm">draw</span>
            <span>Dessiner la signature</span>
          </button>
          <label className="btn btn-small" htmlFor={id}>
            <span className="material-symbols-rounded icon-sm">upload_file</span>
            <span>Importer image</span>
          </label>
          <input
            id={id}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={(e) => {
              onFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          {value ? (
            <button type="button" className="btn btn-small btn-ghost" onClick={() => onChange('')}>
              Effacer
            </button>
          ) : null}
        </div>
      ) : (
        <div className="signature-pad-container">
          <canvas
            ref={canvasRef}
            width={440}
            height={130}
            className="signature-canvas"
            onPointerDown={startStroke}
            onPointerMove={moveStroke}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
          />
          <div className="signature-pad-actions">
            <small className="hint">Dessinez à la souris ou au doigt dans le cadre ci-dessus</small>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn btn-small btn-ghost" onClick={clearCanvas}>
                Recommencer
              </button>
              <button type="button" className="btn btn-small btn-primary" onClick={() => setDrawing(false)}>
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
