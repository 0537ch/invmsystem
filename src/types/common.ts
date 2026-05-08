// File Validation
export type FileType = 'image' | 'video'

export interface ValidationResult {
  valid: boolean
  mimeType?: string
  error?: string
}

// Route
export type Route = {
  name: string
  path: string
  icon?: string
  badge?: string
}

// Sidebar Context
export type SidebarContextProps = {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}
