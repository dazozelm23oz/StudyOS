// StudyOS Data Models & Type Definitions

export interface Profile {
  id: string;
  name: string;
  major: string;
  university: string;
  current_year: string;
  current_semester: string;
  semester_start: string;
  semester_end: string;
  avatar_url?: string;
  custom_fields: Record<string, string>;
}

export interface Year {
  id: string;
  name: string;
  accent_color: string;
  banner_url?: string;
  description?: string;
  sort_order: number;
  custom_fields?: Record<string, string>;
}

export interface Semester {
  id: string;
  year_id: string;
  name: string;
  accent_color: string;
  banner_url?: string;
  start_date?: string;
  end_date?: string;
  sort_order: number;
  custom_fields?: Record<string, string>;
}

export interface Subject {
  id: string;
  semester_id: string;
  name: string;
  code: string;
  credits: number;
  professor?: string;
  accent_color: string;
  banner_url?: string;
  notes?: string;
  sort_order: number;
  custom_fields?: Record<string, string>;
}

export interface ResourceType {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  sort_order: number;
}

export interface Resource {
  id: string;
  subject_id: string;
  type_id: string;
  title: string;
  original_filename: string;
  stored_path: string;
  file_hash: string;
  page_count: number;
  toc_json?: string;
  is_studied: boolean;
  last_page: number;
  last_zoom: number;
  last_scroll_y: number;
  sort_order: number;
  created_at: string;
}

export interface TocItem {
  title: string;
  page: number;
  children?: TocItem[];
}

export interface Unit {
  id: string;
  resource_id: string;
  title: string;
  page_ranges: string;
  is_studied: boolean;
  sort_order: number;
}

export interface Highlight {
  id: string;
  resource_id: string;
  page_number: number;
  rects_json: string; // JSON array of normalized [x, y, w, h] boxes
  text_snippet: string;
  color: string;
  note?: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  subject_id: string;
  title: string;
  page_range?: string;
  is_completed: boolean;
  sort_order: number;
}

export interface TodoItem {
  id: string;
  subject_id?: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  is_completed: boolean;
  notes?: string;
  created_at: string;
}

export interface SessionLog {
  id: string;
  subject_id?: string;
  resource_id?: string;
  timer_kind: 'pomodoro' | 'session' | 'stopwatch' | 'flight';
  start_time: string;
  end_time: string;
  duration_seconds: number;
  audio_preset_name?: string;
}

export interface ThemeColors {
  canvas: string;
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  border: string;
  borderGlow: string;
  primary: string;
  primaryGlow: string;
  secondary: string;
  accent: string;
  accentGlow: string;
  textMain: string;
  textMuted: string;
  textFaint: string;
  success: string;
  warning: string;
  danger: string;
}

export interface ThemeLayout {
  density: 'compact' | 'comfortable' | 'spacious';
  borderRadius: 'sharp' | 'rounded' | 'pill';
  cardOpacity: number; // 0.85 to 1.0
  cardBlur: number; // 0 to 24px
  uiScale: number; // 0.85 to 1.25 (default 1.0)
  fontFamily: 'Inter' | 'JetBrains Mono' | 'Space Grotesk' | 'System Sans';
  shadowStyle: 'soft' | 'medium' | 'glow' | 'none';
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  is_built_in: boolean;
  is_dark: boolean;
  colors: ThemeColors;
  layout?: ThemeLayout;
}

export interface AudioLayer {
  id: string;
  kind: 'procedural_rain' | 'wind' | 'thunder' | 'custom_file';
  name: string;
  source_path?: string;
  volume: number;
  is_muted: boolean;
  parameters?: Record<string, number>;
}

export interface AudioPreset {
  id: string;
  name: string;
  master_volume: number;
  layers: AudioLayer[];
  attached_timer_phase?: 'work' | 'break' | 'always' | 'none';
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  backup_path: string;
  files_changed: number;
  size_delta_bytes: number;
  outcome: 'success' | 'skipped' | 'failed';
  error_message?: string;
}

export interface BackupSnapshotInfo {
  name: string;
  path: string;
  timestamp: string;
  file_count: number;
  size_bytes: number;
}

export type DockPosition = 'left' | 'right' | 'bottom';

export interface DashboardWidget {
  id: string;
  title: string;
  type:
    | 'welcome'
    | 'kpis'
    | 'enrolled_subjects'
    | 'quick_tools'
    | 'recently_opened'
    | 'timer_stats'
    | 'date_calendar'
    | 'study_streak';
  visible: boolean;
  order: number;
  width?: 'full' | 'half' | 'third';
}

export interface AppSettings {
  dock_position: DockPosition;
  visible_tabs: string[];
  extraction_output_mode: 'merged' | 'split' | 'ask';
  max_pdf_panes: number;
  theme_id: string;
  is_dark_mode: boolean;
  library_path: string;
  backup_destination: string;
  gallery_online_enabled: boolean;
  flight_timer_sound_enabled: boolean;
  dashboard_widgets?: DashboardWidget[];
}
