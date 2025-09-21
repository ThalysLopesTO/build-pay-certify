import * as React from "react"
import { Upload, FileImage, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileDropzoneProps {
  files: File[]
  uploadedUrls: string[]
  onFilesChange: (files: File[]) => void
  onRemoveFile: (index: number) => void
  onRemoveUploaded: (url: string) => void
  maxFiles?: number
  maxSize?: number // in MB
  accept?: string
  className?: string
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  files,
  uploadedUrls,
  onFilesChange,
  onRemoveFile,
  onRemoveUploaded,
  maxFiles = 5,
  maxSize = 5,
  accept = "image/*",
  className
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  const totalFiles = files.length + uploadedUrls.length

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles: File[]) => {
    const filteredFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false
      }
      if (file.size > maxSize * 1024 * 1024) {
        return false
      }
      return true
    })

    const remainingSlots = maxFiles - totalFiles
    const filesToAdd = filteredFiles.slice(0, remainingSlots)
    
    onFilesChange([...files, ...filesToAdd])
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          totalFiles >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium mb-1">
          Drop files here or click to upload
        </p>
        <p className="text-xs text-muted-foreground">
          PNG, JPG up to {maxSize}MB each (max {maxFiles} files)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {totalFiles}/{maxFiles} files selected
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={totalFiles >= maxFiles}
        />
      </div>

      {/* File Preview Grid */}
      {(files.length > 0 || uploadedUrls.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Uploaded Files */}
          {uploadedUrls.map((url, index) => (
            <div key={`uploaded-${index}`} className="relative group">
              <div className="aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted">
                <img
                  src={url}
                  alt={`Uploaded ${index}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveUploaded(url)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-1 left-1 px-2 py-1 bg-secondary/80 text-secondary-foreground text-xs rounded">
                Uploaded
              </div>
            </div>
          ))}
          
          {/* New Files */}
          {files.map((file, index) => (
            <div key={`new-${index}`} className="relative group">
              <div className="aspect-square rounded-lg border-2 border-primary overflow-hidden bg-primary/5">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveFile(index)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-1 left-1 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                New
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}