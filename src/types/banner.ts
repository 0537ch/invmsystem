// Banner Status
export type BannerStatus = 'live' | 'scheduled' | 'expired' | 'inactive'

// Banner Types
export type BannerItemType = 'image' | 'youtube' | 'video' | 'iframe' | 'gdrive' | 'pdf'
export type ImageSourceType = 'url' | 'gdrive' | 'upload'
export type ContentCategory = 'image' | 'youtube' | 'video' | 'html' | 'pdf'

// Database Banner (from db.ts)
export type Banner = {
  id: number
  type: BannerItemType
  url: string
  duration: number
  title: string | null
  description: string | null
  active: boolean
  image_source: ImageSourceType | null
  position: number
  created_at: Date
  updated_at: Date
  start_date: string | Date | null
  end_date: string | Date | null
  locations?: Location[]
  status?: BannerStatus
}

// Location
export type Location = {
  id: number
  name: string
  slug: string
  created_at: Date
}

// Banner Item (UI State - extends Banner with optional fields)
export interface BannerItem extends Omit<Banner, 'image_source'> {
  imageSource?: ImageSourceType
  location_ids?: number[]
}

// Banner Form Props
export interface BannerFormProps {
  mode: 'add' | 'edit'
  data: Partial<BannerItem>
  category: ContentCategory
  imageSource: ImageSourceType
  htmlFile: File | null
  isLoading?: boolean
  onDataChange: (data: Partial<BannerItem>) => void
  onCategoryChange: (category: ContentCategory) => void
  onImageSourceChange: (source: ImageSourceType) => void
  onHtmlFileChange: (file: File | null) => void
  onSubmit: () => void
  onCancel: () => void
  fileInputRef?: React.RefObject<HTMLInputElement | null>
  onUploadPending?: (file: File) => void
  onUploadConfirmed?: () => Promise<string | null>
  onClearPending?: () => void
  isUploading?: boolean
  uploadedFilePath?: string | null
  pendingFile?: File | null
  formatFileSize?: (bytes: number) => string
}

// Banner Detail Dialog Props
export interface BannerDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: BannerItem | null
}
