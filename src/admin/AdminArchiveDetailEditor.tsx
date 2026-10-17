import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, Type } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Rnd } from "react-rnd"
import {
  ArchiveDetailCanvasElementContent,
  archiveDetailCanvasElementStyle,
} from "../components/ArchiveDetailCanvas"
import {
  type ArchiveDetailCanvasDesign,
  type ArchiveDetailCanvasElement,
  type ArchiveDetailCanvasRect,
  type ArchiveDetailCanvasStyle,
  type ArchiveDetailCanvasViewport,
  archiveDetailCanvasLabels,
  archiveDetailCanvasMaxHeight,
  archiveDetailCanvasWidths,
  clampArchiveDetailCanvasRect,
  createArchiveDetailCanvasElement,
  createDefaultArchiveDetailCanvas,
} from "../data/archiveDetailCanvas"
import { AdminSelectField, AdminTextareaField, AdminTextField } from "./AdminFields"
import { AdminImageUploadField } from "./AdminImageUploadField"
import { AdminPreviewToolbar } from "./AdminPreviewToolbar"
import { uploadAdminImageAsset } from "./adminBlobUpload"
import { createAdminId } from "./adminFactories"
import { adminImageInputAccept } from "./adminImageUploadConfig"
import type { AdminArchiveRelease } from "./adminTypes"

type Props = {
  readonly release: AdminArchiveRelease
  readonly releases: readonly AdminArchiveRelease[]
  readonly onChange: (patch: Partial<AdminArchiveRelease>) => void
  readonly onSelectRelease: (id: string) => void
  readonly onAddRelease: () => void
}

function fitNewElement(
  element: ArchiveDetailCanvasElement,
  design: ArchiveDetailCanvasDesign,
): ArchiveDetailCanvasElement {
  return {
    ...element,
    layout: clampArchiveDetailCanvasRect(
      element.layout,
      archiveDetailCanvasWidths.mobile,
      design.height,
    ),
  }
}

export function AdminArchiveDetailEditor({
  release,
  releases,
  onChange,
  onSelectRelease,
  onAddRelease,
}: Props) {
  const design = release.detail ?? createDefaultArchiveDetailCanvas(release)
  const latestChange = useRef(onChange)
  latestChange.current = onChange
  const [viewport, setViewport] = useState<ArchiveDetailCanvasViewport>("desktop")
  const [selectedId, setSelectedId] = useState(design.elements[0]?.id ?? "")
  const [notice, setNotice] = useState(
    "Select an element, then drag or resize it. Mobile and Web share one layout, just like Works.",
  )
  const [progress, setProgress] = useState<number | null>(null)
  const uploadTarget = useRef(release.id)
  const frameRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(600)
  const latestDesign = useRef(design)
  latestDesign.current = design
  const selected = design.elements.find((element) => element.id === selectedId)
  const width = archiveDetailCanvasWidths[viewport]
  const height = design.height
  const scale = Math.min(1, availableWidth / width)

  useEffect(() => {
    uploadTarget.current = release.id
    return () => {
      uploadTarget.current = ""
    }
  }, [release.id])

  useEffect(() => {
    const frame = frameRef.current
    if (frame === null) return
    const measure = () => setAvailableWidth(Math.max(120, frame.clientWidth - 36))
    measure()
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure)
      return () => window.removeEventListener("resize", measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const save = (detail: ArchiveDetailCanvasDesign) => latestChange.current({ detail })
  const update = (patch: Partial<ArchiveDetailCanvasElement>) => {
    if (!selected) return
    save({
      ...latestDesign.current,
      elements: latestDesign.current.elements.map((element) =>
        element.id === selected.id ? { ...element, ...patch } : element,
      ),
    })
  }
  const move = (element: ArchiveDetailCanvasElement, rect: ArchiveDetailCanvasRect) => {
    save({
      ...design,
      elements: design.elements.map((item) =>
        item.id === element.id
          ? {
              ...item,
              layout: clampArchiveDetailCanvasRect(rect, width, height),
            }
          : item,
      ),
    })
  }
  const changeStyle = (patch: Partial<ArchiveDetailCanvasStyle>) => {
    if (selected)
      update({
        style: { ...selected.style, ...patch },
      })
  }
  const changeText = (text: string) => {
    if (!selected) return
    update({ text })
  }
  const addText = () => {
    if (design.elements.length >= 60) return
    const element = fitNewElement(
      createArchiveDetailCanvasElement("text", createAdminId("detail-text")),
      design,
    )
    save({ ...design, elements: [...design.elements, element] })
    setSelectedId(element.id)
  }
  const upload = async (file: File) => {
    if (progress !== null || design.elements.length >= 60) return
    const targetId = release.id
    setProgress(0)
    setNotice("Uploading image…")
    try {
      const image = await uploadAdminImageAsset(file, setProgress)
      if (uploadTarget.current !== targetId) return
      if (latestDesign.current.elements.length >= 60) {
        setNotice("The detail can contain up to 60 elements.")
        return
      }
      const element = fitNewElement(
        {
          ...createArchiveDetailCanvasElement("image", createAdminId("detail-image")),
          src: image.src,
          alt: image.alt,
        },
        latestDesign.current,
      )
      // Preserve edits made while the file was uploading through the current design ref.
      save({ ...latestDesign.current, elements: [...latestDesign.current.elements, element] })
      setSelectedId(element.id)
      setNotice("Image added to the detail.")
    } catch (error) {
      if (uploadTarget.current === targetId)
        setNotice(error instanceof Error ? error.message : "Image upload failed.")
    } finally {
      if (uploadTarget.current === targetId) setProgress(null)
    }
  }
  const numeric = (value: string, fallback: number, min: number, max: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
  }
  const reorder = (offset: number) => {
    const index = design.elements.findIndex((element) => element.id === selectedId)
    const next = index + offset
    if (index < 0 || next < 0 || next >= design.elements.length) return
    const elements = [...design.elements]
    const [element] = elements.splice(index, 1)
    if (element) elements.splice(next, 0, element)
    save({ ...design, elements })
  }

  return (
    <section className="admin-archive-detail-editor" aria-label="Archive detail editor">
      <div className="admin-subpanel__head">
        <h3>Detail design</h3>
        <span>Below the track list · Images & text</span>
      </div>
      <div className="admin-works-builder admin-archive-detail-builder">
        <aside className="admin-asset-panel" aria-label="Detail elements">
          <AdminSelectField
            label="Release"
            value={release.id}
            options={releases.map((item) => item.id)}
            getOptionLabel={(id) => releases.find((item) => item.id === id)?.title ?? id}
            onChange={onSelectRelease}
          />
          <button type="button" className="pill-button" onClick={onAddRelease}>
            <Plus size={15} />
            Add release
          </button>
          <div className="admin-asset-section__head">
            <strong>Elements</strong>
            <button
              className="pill-button"
              type="button"
              disabled={design.elements.length >= 60}
              onClick={addText}
            >
              <Type size={15} />
              Text
            </button>
          </div>
          <label className="admin-upload-dropzone" htmlFor={`detail-upload-${release.id}`}>
            <ImagePlus size={22} />
            <strong>Add detail image</strong>
            <span>Place a photo anywhere in the detail.</span>
            <input
              id={`detail-upload-${release.id}`}
              type="file"
              accept={adminImageInputAccept}
              disabled={progress !== null || design.elements.length >= 60}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ""
                if (file) void upload(file)
              }}
            />
          </label>
          {progress !== null ? (
            <progress
              max="100"
              value={progress}
              aria-label={`Detail image upload ${Math.round(progress)}%`}
            />
          ) : null}
          <div className="admin-detail-element-list">
            {design.elements.map((element) => (
              <button
                className={
                  selectedId === element.id ? "admin-list-row is-active" : "admin-list-row"
                }
                type="button"
                key={element.id}
                onClick={() => setSelectedId(element.id)}
                aria-pressed={selectedId === element.id}
              >
                <strong>
                  {element.kind === "image"
                    ? element.alt
                    : element.kind === "text"
                      ? element.text || "Text"
                      : archiveDetailCanvasLabels[element.kind]}
                </strong>
                <span>{element.kind === "image" ? "Image" : "Text"}</span>
              </button>
            ))}
          </div>
        </aside>
        <section className="admin-preview-workspace">
          <AdminPreviewToolbar
            notice={`${notice}${progress === null ? "" : ` ${Math.round(progress)}%`}`}
            viewport={viewport}
            onViewportChange={setViewport}
          />
          <div className="admin-canvas-frame" ref={frameRef}>
            <div
              className="admin-canvas-stage"
              style={{ width: width * scale, height: height * scale }}
            >
              <fieldset
                className={`admin-canvas admin-archive-detail-canvas admin-canvas--${viewport}`}
                style={{ width, height, transform: `scale(${scale})` }}
                aria-label={`${viewport === "desktop" ? "Web" : "Mobile"} archive detail canvas`}
              >
                {design.elements.length === 0 ? (
                  <p className="admin-detail-empty">
                    Add an image or text to start the detail content below the track list.
                  </p>
                ) : null}
                {design.elements.map((element) => {
                  const rect = element.layout
                  return (
                    <Rnd
                      key={element.id}
                      bounds="parent"
                      scale={scale}
                      position={{ x: rect.x, y: rect.y }}
                      size={{ width: rect.width, height: rect.height }}
                      enableResizing={selectedId === element.id}
                      className={`admin-canvas-element${selectedId === element.id ? " is-selected" : ""}`}
                      onMouseDown={() => setSelectedId(element.id)}
                      onDragStop={(_, data) => move(element, { ...rect, x: data.x, y: data.y })}
                      onResizeStop={(_, _direction, ref, _delta, position) =>
                        move(element, {
                          ...position,
                          width: ref.offsetWidth,
                          height: ref.offsetHeight,
                        })
                      }
                    >
                      <button
                        className="admin-detail-selectable"
                        type="button"
                        tabIndex={0}
                        aria-label={`Select ${element.kind === "text" ? element.text : element.kind === "image" ? element.alt : archiveDetailCanvasLabels[element.kind]}`}
                        style={archiveDetailCanvasElementStyle(element)}
                        onClick={() => setSelectedId(element.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            setSelectedId(element.id)
                          }
                          const step = event.shiftKey ? 10 : 1
                          if (
                            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
                          ) {
                            event.preventDefault()
                            setSelectedId(element.id)
                            move(element, {
                              ...rect,
                              x:
                                rect.x +
                                (event.key === "ArrowRight"
                                  ? step
                                  : event.key === "ArrowLeft"
                                    ? -step
                                    : 0),
                              y:
                                rect.y +
                                (event.key === "ArrowDown"
                                  ? step
                                  : event.key === "ArrowUp"
                                    ? -step
                                    : 0),
                            })
                          }
                        }}
                      >
                        <ArchiveDetailCanvasElementContent element={element} />
                      </button>
                    </Rnd>
                  )
                })}
              </fieldset>
            </div>
          </div>
        </section>
        <aside className="admin-inspector" aria-label="Detail element settings">
          <AdminTextField
            label="Detail height"
            type="number"
            value={String(height)}
            onChange={(value) => {
              const nextHeight = Math.round(
                numeric(value, height, 360, archiveDetailCanvasMaxHeight),
              )
              save({
                ...design,
                height: nextHeight,
                elements: design.elements.map((element) => ({
                  ...element,
                  layout: clampArchiveDetailCanvasRect(element.layout, width, nextHeight),
                })),
              })
            }}
          />
          {selected ? (
            <>
              <div className="admin-inspector__head">
                <h3>{archiveDetailCanvasLabels[selected.kind]}</h3>
                {selected.kind === "image" || selected.kind === "text" ? (
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Remove detail element"
                    onClick={() => {
                      save({
                        ...design,
                        elements: design.elements.filter((element) => element.id !== selected.id),
                      })
                      setSelectedId("")
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
              {selected.kind === "image" ? (
                <>
                  <AdminImageUploadField
                    label="Detail image"
                    value={selected.src}
                    alt={selected.alt}
                    onUpload={({ src, alt }) => update({ src, alt })}
                  />
                  <AdminTextField
                    label="Image description"
                    value={selected.alt}
                    onChange={(alt) => update({ alt })}
                  />
                  <AdminTextField
                    label="Object position"
                    value={selected.objectPosition}
                    onChange={(objectPosition) =>
                      update({ objectPosition: objectPosition || "center" })
                    }
                  />
                </>
              ) : (
                <>
                  <AdminTextareaField
                    label="Detail text"
                    value={selected.text}
                    onChange={changeText}
                  />
                  <AdminTextField
                    label="Font size"
                    type="number"
                    value={String(selected.style.fontSize)}
                    onChange={(value) =>
                      changeStyle({
                        fontSize: numeric(value, selected.style.fontSize, 8, 220),
                      })
                    }
                  />
                  <AdminSelectField
                    label="Font weight"
                    value={String(selected.style.fontWeight)}
                    options={["300", "430", "500", "700", "760", "900"]}
                    onChange={(value) => changeStyle({ fontWeight: Number(value) })}
                  />
                  <AdminSelectField
                    label="Text alignment"
                    value={selected.style.textAlign}
                    options={["left", "center", "right"]}
                    onChange={(textAlign) => changeStyle({ textAlign })}
                  />
                  <AdminTextField
                    label="Text color"
                    type="color"
                    value={selected.style.color}
                    onChange={(color) => changeStyle({ color })}
                  />
                  <AdminTextField
                    label="Line height"
                    type="number"
                    value={String(selected.style.lineHeight)}
                    onChange={(value) =>
                      changeStyle({
                        lineHeight: numeric(value, selected.style.lineHeight, 0.75, 3),
                      })
                    }
                  />
                </>
              )}
              <div className="admin-inspector-grid">
                {(["x", "y", "width", "height"] as const).map((key) => (
                  <AdminTextField
                    key={key}
                    label={
                      key === "x" || key === "y"
                        ? key.toUpperCase()
                        : key === "width"
                          ? "Width"
                          : "Height"
                    }
                    type="number"
                    value={String(selected.layout[key])}
                    onChange={(value) =>
                      move(selected, {
                        ...selected.layout,
                        [key]: numeric(
                          value,
                          selected.layout[key],
                          key === "x" || key === "y" ? 0 : 24,
                          key === "x" || key === "width" ? width : height,
                        ),
                      })
                    }
                  />
                ))}
              </div>
              <div className="admin-detail-layer-actions">
                <button className="pill-button" type="button" onClick={() => reorder(-1)}>
                  <ArrowDown size={14} />
                  Send backward
                </button>
                <button className="pill-button" type="button" onClick={() => reorder(1)}>
                  <ArrowUp size={14} />
                  Bring forward
                </button>
              </div>
            </>
          ) : (
            <p>Select an image or text block to edit it.</p>
          )}
        </aside>
      </div>
    </section>
  )
}
