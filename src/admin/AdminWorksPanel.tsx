import { useState } from "react"
import { AdminEmptyWorksPanel } from "./AdminEmptyWorksPanel"
import { AdminPanel } from "./AdminFields"
import { AdminPreviewToolbar } from "./AdminPreviewToolbar"
import { AdminWorksAssetPanel } from "./AdminWorksAssetPanel"
import { AdminWorksCanvas } from "./AdminWorksCanvas"
import type { SelectedCanvasElement } from "./AdminWorksEditorTypes"
import { AdminWorksInspector } from "./AdminWorksInspector"
import { createWorkAudioFromArchiveTrack, listArchiveAudioTracks } from "./adminAudioSelection"
import { uploadAdminImageAsset } from "./adminBlobUpload"
import {
  createBlankWork,
  createBlankWorkImage,
  createBlankWorkTextElement,
  createWorkImageFromAsset,
} from "./adminFactories"
import { AdminImageUploadError } from "./adminImageUpload"
import type {
  AdminCanvasViewport,
  AdminContent,
  AdminWork,
  AdminWorkImage,
  AdminWorkTextElement,
} from "./adminTypes"
import {
  renumberImages,
  renumberTextElements,
  renumberWorks,
  updateWorkCanvasHeightAndClampElements,
} from "./adminWorkMutations"

type WorksPanelProps = {
  readonly content: AdminContent
  readonly onChange: (content: AdminContent) => void
}

export function AdminWorksPanel({ content, onChange }: WorksPanelProps) {
  const [selectedWorkId, setSelectedWorkId] = useState(content.works[0]?.id ?? "")
  const [selectedElement, setSelectedElement] = useState<SelectedCanvasElement | null>(null)
  const [viewport, setViewport] = useState<AdminCanvasViewport>("mobile")
  const [notice, setNotice] = useState("Drag images and text directly on the preview.")
  const selectedWork = content.works.find((work) => work.id === selectedWorkId) ?? content.works[0]
  const archiveTracks = listArchiveAudioTracks(content)

  const replaceWorks = (works: readonly AdminWork[]) => {
    onChange({ ...content, works: renumberWorks(works) })
  }
  const updateSelectedWork = (patch: Partial<AdminWork>) => {
    if (selectedWork === undefined) {
      return
    }

    const works = content.works.map((work) => {
      if (work.id !== selectedWork.id) {
        return patch.isEntry === true ? { ...work, isEntry: false } : work
      }

      return { ...work, ...patch }
    })
    replaceWorks(works)
  }
  const selectAudioTrack = (trackId: string) => {
    if (selectedWork === undefined) {
      return
    }

    const archiveTrack = archiveTracks.find((track) => track.id === trackId)

    if (archiveTrack === undefined) {
      return
    }

    updateSelectedWork({ audio: createWorkAudioFromArchiveTrack(archiveTrack) })
  }
  const updateImage = (imageId: string, patch: Partial<AdminWorkImage>) => {
    if (selectedWork === undefined) {
      return
    }
    updateSelectedWork({
      images: selectedWork.images.map((image) =>
        image.id === imageId ? { ...image, ...patch } : image,
      ),
    })
  }
  const updateTextElement = (textElementId: string, patch: Partial<AdminWorkTextElement>) => {
    if (selectedWork === undefined) {
      return
    }
    updateSelectedWork({
      textElements: selectedWork.textElements.map((textElement) =>
        textElement.id === textElementId ? { ...textElement, ...patch } : textElement,
      ),
    })
  }
  const addWork = () => {
    const work = createBlankWork(content.works.length)
    replaceWorks([...content.works, work])
    setSelectedWorkId(work.id)
    setSelectedElement(null)
  }
  const deleteWork = (workId: string) => {
    const works = renumberWorks(content.works.filter((work) => work.id !== workId))
    replaceWorks(works)

    if (selectedWorkId === workId) {
      setSelectedWorkId(works[0]?.id ?? "")
      setSelectedElement(null)
    }
  }
  const updateCanvasHeight = (height: number) => {
    if (selectedWork === undefined) {
      return
    }

    const nextWork = updateWorkCanvasHeightAndClampElements({
      height,
      work: selectedWork,
    })

    updateSelectedWork({
      canvas: nextWork.canvas,
      images: nextWork.images,
      textElements: nextWork.textElements,
    })
  }
  const addBlankImage = () => {
    if (selectedWork === undefined) {
      return
    }
    const image = createBlankWorkImage(selectedWork.images.length)
    updateSelectedWork({ images: [...selectedWork.images, image] })
    setSelectedElement({ kind: "image", id: image.id })
  }
  const addTextElement = () => {
    if (selectedWork === undefined) {
      return
    }
    const textElement = createBlankWorkTextElement(selectedWork.textElements.length)
    updateSelectedWork({ textElements: [...selectedWork.textElements, textElement] })
    setSelectedElement({ kind: "text", id: textElement.id })
  }
  const deleteImage = (imageId: string) => {
    if (selectedWork === undefined) {
      return
    }
    updateSelectedWork({
      images: renumberImages(selectedWork.images.filter((image) => image.id !== imageId)),
    })
    if (selectedElement?.kind === "image" && selectedElement.id === imageId) {
      setSelectedElement(null)
    }
  }
  const deleteTextElement = (textElementId: string) => {
    if (selectedWork === undefined) {
      return
    }
    updateSelectedWork({
      textElements: renumberTextElements(
        selectedWork.textElements.filter((textElement) => textElement.id !== textElementId),
      ),
    })
    if (selectedElement?.kind === "text" && selectedElement.id === textElementId) {
      setSelectedElement(null)
    }
  }
  const uploadImage = async (file: File) => {
    if (selectedWork === undefined) {
      return
    }

    try {
      const uploaded = await uploadAdminImageAsset(file)
      const image = createWorkImageFromAsset({
        ...uploaded,
        sortOrder: selectedWork.images.length,
      })
      updateSelectedWork({ images: [...selectedWork.images, image] })
      setSelectedElement({ kind: "image", id: image.id })
      setNotice("Image added.")
    } catch (error: unknown) {
      if (error instanceof AdminImageUploadError) {
        setNotice(error.message)
        return
      }
      throw error
    }
  }

  if (selectedWork === undefined) {
    return <AdminEmptyWorksPanel onAddWork={addWork} />
  }

  return (
    <AdminPanel title="Main Works" meta={`${content.works.length} works`}>
      <div className="admin-works-builder">
        <AdminWorksAssetPanel
          works={content.works}
          selectedWork={selectedWork}
          selectedElement={selectedElement}
          onAddBlankImage={addBlankImage}
          onAddText={addTextElement}
          onAddWork={addWork}
          onDeleteImage={deleteImage}
          onDeleteWork={deleteWork}
          onSelectElement={setSelectedElement}
          onSelectWork={(workId) => {
            setSelectedWorkId(workId)
            setSelectedElement(null)
          }}
          onUploadImage={(file) => {
            void uploadImage(file)
          }}
        />

        <section className="admin-preview-workspace">
          <AdminPreviewToolbar notice={notice} viewport={viewport} onViewportChange={setViewport} />

          <AdminWorksCanvas
            work={selectedWork}
            viewport={viewport}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onUpdateImage={updateImage}
            onUpdateTextElement={updateTextElement}
          />
        </section>

        <AdminWorksInspector
          archiveTracks={archiveTracks}
          work={selectedWork}
          viewport={viewport}
          selectedElement={selectedElement}
          onDeleteImage={deleteImage}
          onDeleteTextElement={deleteTextElement}
          onSelectAudioTrack={selectAudioTrack}
          onUpdateCanvasHeight={updateCanvasHeight}
          onUpdateImage={updateImage}
          onUpdateTextElement={updateTextElement}
          onUpdateWork={updateSelectedWork}
        />
      </div>
    </AdminPanel>
  )
}
