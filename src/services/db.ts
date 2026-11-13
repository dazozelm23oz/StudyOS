import Database from '@tauri-apps/plugin-sql';
import {
  Profile,
  Year,
  Semester,
  Subject,
  Resource,
  ResourceType,
  Unit,
  Highlight,
  ChecklistItem,
  TodoItem,
  SessionLog,
  Theme,
  AudioPreset,
  BackupRecord,
  AppSettings,
} from '../types';
import { BUILT_IN_THEMES } from '../theme/themes';

class DatabaseService {
  private db: Database | null = null;
  private isTauri: boolean = false;
  private memoryStore: Record<string, any[]> = {};

  async init(): Promise<void> {
    try {
      // Check if running in Tauri environment
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        this.isTauri = true;
        this.db = await Database.load('sqlite:data/studyos.db');
        await this.runMigrations();
      } else {
        console.warn('Running outside Tauri runtime. Initializing in-memory fallback store.');
        this.initMemoryStore();
      }
    } catch (err) {
      console.error('Failed to initialize SQLite via Tauri plugin. Falling back to memory store:', err);
      this.initMemoryStore();
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) return;

    // Execute SQLite DDL statements
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        major TEXT NOT NULL,
        university TEXT NOT NULL,
        current_year TEXT,
        current_semester TEXT,
        semester_start TEXT,
        semester_end TEXT,
        avatar_url TEXT,
        custom_fields TEXT
      );

      CREATE TABLE IF NOT EXISTS years (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        accent_color TEXT NOT NULL,
        banner_url TEXT,
        description TEXT,
        sort_order INTEGER NOT NULL,
        custom_fields TEXT
      );

      CREATE TABLE IF NOT EXISTS semesters (
        id TEXT PRIMARY KEY,
        year_id TEXT NOT NULL,
        name TEXT NOT NULL,
        accent_color TEXT NOT NULL,
        banner_url TEXT,
        start_date TEXT,
        end_date TEXT,
        sort_order INTEGER NOT NULL,
        custom_fields TEXT,
        FOREIGN KEY (year_id) REFERENCES years (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        semester_id TEXT NOT NULL,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        credits INTEGER NOT NULL DEFAULT 3,
        professor TEXT,
        accent_color TEXT NOT NULL,
        banner_url TEXT,
        notes TEXT,
        sort_order INTEGER NOT NULL,
        custom_fields TEXT,
        FOREIGN KEY (semester_id) REFERENCES semesters (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS resource_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        type_id TEXT NOT NULL,
        title TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        stored_path TEXT NOT NULL,
        file_hash TEXT NOT NULL,
        page_count INTEGER NOT NULL DEFAULT 0,
        toc_json TEXT,
        is_studied INTEGER NOT NULL DEFAULT 0,
        last_page INTEGER NOT NULL DEFAULT 1,
        last_zoom REAL NOT NULL DEFAULT 1.0,
        last_scroll_y REAL NOT NULL DEFAULT 0.0,
        sort_order INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
        FOREIGN KEY (type_id) REFERENCES resource_types (id)
      );

      CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        resource_id TEXT NOT NULL,
        title TEXT NOT NULL,
        page_ranges TEXT NOT NULL,
        is_studied INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL,
        FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS highlights (
        id TEXT PRIMARY KEY,
        resource_id TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        rects_json TEXT NOT NULL,
        text_snippet TEXT NOT NULL,
        color TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS checklist_items (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        title TEXT NOT NULL,
        page_range TEXT,
        is_completed INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        subject_id TEXT,
        title TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        due_date TEXT,
        is_completed INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS session_logs (
        id TEXT PRIMARY KEY,
        subject_id TEXT,
        resource_id TEXT,
        timer_kind TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL,
        audio_preset_name TEXT
      );

      CREATE TABLE IF NOT EXISTS themes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_built_in INTEGER NOT NULL DEFAULT 0,
        is_dark INTEGER NOT NULL DEFAULT 1,
        colors_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audio_presets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        master_volume REAL NOT NULL DEFAULT 0.8,
        layers_json TEXT NOT NULL,
        attached_timer_phase TEXT NOT NULL DEFAULT 'always'
      );

      CREATE TABLE IF NOT EXISTS backup_history (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        backup_path TEXT NOT NULL,
        files_changed INTEGER NOT NULL,
        size_delta_bytes INTEGER NOT NULL,
        outcome TEXT NOT NULL,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Seed system default resource types if empty
    const existingTypes: any[] = await this.db.select('SELECT count(*) as count FROM resource_types');
    if (existingTypes[0]?.count === 0) {
      const defaults = [
        { id: 'type-guide', name: 'Subject Guide', icon: 'BookOpen', color: '#00e5ff', sort: 1 },
        { id: 'type-textbook', name: 'Textbook', icon: 'Book', color: '#a855f7', sort: 2 },
        { id: 'type-notes', name: 'Lecture Notes', icon: 'FileText', color: '#10b981', sort: 3 },
        { id: 'type-assignment', name: 'Assignment', icon: 'CheckSquare', color: '#f59e0b', sort: 4 },
        { id: 'type-past-paper', name: 'Past Exam Paper', icon: 'Award', color: '#ec4899', sort: 5 },
        { id: 'type-other', name: 'Other Reference', icon: 'Folder', color: '#94a3b8', sort: 6 },
      ];
      for (const t of defaults) {
        await this.db.execute(
          'INSERT INTO resource_types (id, name, icon, color, is_default, sort_order) VALUES ($1, $2, $3, $4, 1, $5)',
          [t.id, t.name, t.icon, t.color, t.sort]
        );
      }
    }

    // Seed themes if empty
    const existingThemes: any[] = await this.db.select('SELECT count(*) as count FROM themes');
    if (existingThemes[0]?.count === 0) {
      for (const th of BUILT_IN_THEMES) {
        await this.db.execute(
          'INSERT INTO themes (id, name, description, is_built_in, is_dark, colors_json) VALUES ($1, $2, $3, 1, $4, $5)',
          [th.id, th.name, th.description, th.is_dark ? 1 : 0, JSON.stringify(th.colors)]
        );
      }
    }
  }

  private initMemoryStore(): void {
    this.memoryStore = {
      profile: [],
      years: [],
      semesters: [],
      subjects: [],
      resources: [],
      resource_types: [
        { id: 'type-guide', name: 'Subject Guide', icon: 'BookOpen', color: '#00e5ff', is_default: true, sort_order: 1 },
        { id: 'type-textbook', name: 'Textbook', icon: 'Book', color: '#a855f7', is_default: true, sort_order: 2 },
        { id: 'type-notes', name: 'Lecture Notes', icon: 'FileText', color: '#10b981', is_default: true, sort_order: 3 },
        { id: 'type-assignment', name: 'Assignment', icon: 'CheckSquare', color: '#f59e0b', is_default: true, sort_order: 4 },
        { id: 'type-past-paper', name: 'Past Exam Paper', icon: 'Award', color: '#ec4899', is_default: true, sort_order: 5 },
        { id: 'type-other', name: 'Other Reference', icon: 'Folder', color: '#94a3b8', is_default: true, sort_order: 6 },
      ],
      units: [],
      highlights: [],
      checklist_items: [],
      todos: [],
      session_logs: [],
      themes: BUILT_IN_THEMES.map((th) => ({
        ...th,
        is_built_in: true,
        colors_json: JSON.stringify(th.colors),
      })),
      audio_presets: [],
      backup_history: [],
      app_settings: [],
    };
  }

  // --- Profile ---
  async getProfile(): Promise<Profile | null> {
    if (this.isTauri && this.db) {
      const rows: any[] = await this.db.select('SELECT * FROM profile LIMIT 1');
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        ...r,
        custom_fields: r.custom_fields ? JSON.parse(r.custom_fields) : {},
      };
    }
    return this.memoryStore.profile[0] || null;
  }

  async saveProfile(profile: Profile): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute(
        `INSERT OR REPLACE INTO profile (id, name, major, university, current_year, current_semester, semester_start, semester_end, avatar_url, custom_fields)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          profile.id,
          profile.name,
          profile.major,
          profile.university,
          profile.current_year,
          profile.current_semester,
          profile.semester_start,
          profile.semester_end,
          profile.avatar_url || null,
          JSON.stringify(profile.custom_fields || {}),
        ]
      );
      return;
    }
    this.memoryStore.profile = [profile];
  }

  // --- Hierarchy (Years, Semesters, Subjects) ---
  async getYears(): Promise<Year[]> {
    if (this.isTauri && this.db) {
      const rows: any[] = await this.db.select('SELECT * FROM years ORDER BY sort_order ASC');
      return rows.map((r) => ({
        ...r,
        custom_fields: r.custom_fields ? JSON.parse(r.custom_fields) : {},
      }));
    }
    return [...this.memoryStore.years].sort((a, b) => a.sort_order - b.sort_order);
  }

  async saveYear(year: Year): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute(
        `INSERT OR REPLACE INTO years (id, name, accent_color, banner_url, description, sort_order, custom_fields)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [year.id, year.name, year.accent_color, year.banner_url || null, year.description || null, year.sort_order, JSON.stringify(year.custom_fields || {})]
      );
      return;
    }
    const idx = this.memoryStore.years.findIndex((y) => y.id === year.id);
    if (idx >= 0) this.memoryStore.years[idx] = year;
    else this.memoryStore.years.push(year);
  }

  async deleteYear(id: string): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute('DELETE FROM years WHERE id = $1', [id]);
      return;
    }
    this.memoryStore.years = this.memoryStore.years.filter((y) => y.id !== id);
  }

  async getSemesters(yearId?: string): Promise<Semester[]> {
    if (this.isTauri && this.db) {
      const sql = yearId
        ? 'SELECT * FROM semesters WHERE year_id = $1 ORDER BY sort_order ASC'
        : 'SELECT * FROM semesters ORDER BY sort_order ASC';
      const rows: any[] = await this.db.select(sql, yearId ? [yearId] : []);
      return rows.map((r) => ({
        ...r,
        custom_fields: r.custom_fields ? JSON.parse(r.custom_fields) : {},
      }));
    }
    return this.memoryStore.semesters
      .filter((s) => !yearId || s.year_id === yearId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async saveSemester(sem: Semester): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute(
        `INSERT OR REPLACE INTO semesters (id, year_id, name, accent_color, banner_url, start_date, end_date, sort_order, custom_fields)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [sem.id, sem.year_id, sem.name, sem.accent_color, sem.banner_url || null, sem.start_date || null, sem.end_date || null, sem.sort_order, JSON.stringify(sem.custom_fields || {})]
      );
      return;
    }
    const idx = this.memoryStore.semesters.findIndex((s) => s.id === sem.id);
    if (idx >= 0) this.memoryStore.semesters[idx] = sem;
    else this.memoryStore.semesters.push(sem);
  }

  async deleteSemester(id: string): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute('DELETE FROM semesters WHERE id = $1', [id]);
      return;
    }
    this.memoryStore.semesters = this.memoryStore.semesters.filter((s) => s.id !== id);
  }

  async getSubjects(semesterId?: string): Promise<Subject[]> {
    if (this.isTauri && this.db) {
      const sql = semesterId
        ? 'SELECT * FROM subjects WHERE semester_id = $1 ORDER BY sort_order ASC'
        : 'SELECT * FROM subjects ORDER BY sort_order ASC';
      const rows: any[] = await this.db.select(sql, semesterId ? [semesterId] : []);
      return rows.map((r) => ({
        ...r,
        custom_fields: r.custom_fields ? JSON.parse(r.custom_fields) : {},
      }));
    }
    return this.memoryStore.subjects
      .filter((s) => !semesterId || s.semester_id === semesterId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async saveSubject(sub: Subject): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute(
        `INSERT OR REPLACE INTO subjects (id, semester_id, name, code, credits, professor, accent_color, banner_url, notes, sort_order, custom_fields)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          sub.id,
          sub.semester_id,
          sub.name,
          sub.code,
          sub.credits,
          sub.professor || null,
          sub.accent_color,
          sub.banner_url || null,
          sub.notes || null,
          sub.sort_order,
          JSON.stringify(sub.custom_fields || {}),
        ]
      );
      return;
    }
    const idx = this.memoryStore.subjects.findIndex((s) => s.id === sub.id);
    if (idx >= 0) this.memoryStore.subjects[idx] = sub;
    else this.memoryStore.subjects.push(sub);
  }

  async deleteSubject(id: string): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute('DELETE FROM subjects WHERE id = $1', [id]);
      return;
    }
    this.memoryStore.subjects = this.memoryStore.subjects.filter((s) => s.id !== id);
  }

  // --- Resource Types & Resources ---
  async getResourceTypes(): Promise<ResourceType[]> {
    if (this.isTauri && this.db) {
      const rows: any[] = await this.db.select('SELECT * FROM resource_types ORDER BY sort_order ASC');
      return rows.map((r) => ({ ...r, is_default: Boolean(r.is_default) }));
    }
    return [...this.memoryStore.resource_types].sort((a, b) => a.sort_order - b.sort_order);
  }

  async getResources(subjectId?: string): Promise<Resource[]> {
    if (this.isTauri && this.db) {
      const sql = subjectId
        ? 'SELECT * FROM resources WHERE subject_id = $1 ORDER BY sort_order ASC'
        : 'SELECT * FROM resources ORDER BY sort_order ASC';
      const rows: any[] = await this.db.select(sql, subjectId ? [subjectId] : []);
      return rows.map((r) => ({ ...r, is_studied: Boolean(r.is_studied) }));
    }
    return this.memoryStore.resources
      .filter((r) => !subjectId || r.subject_id === subjectId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async saveResource(res: Resource): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute(
        `INSERT OR REPLACE INTO resources (id, subject_id, type_id, title, original_filename, stored_path, file_hash, page_count, toc_json, is_studied, last_page, last_zoom, last_scroll_y, sort_order, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          res.id,
          res.subject_id,
          res.type_id,
          res.title,
          res.original_filename,
          res.stored_path,
          res.file_hash,
          res.page_count,
          res.toc_json || null,
          res.is_studied ? 1 : 0,
          res.last_page,
          res.last_zoom,
          res.last_scroll_y,
          res.sort_order,
          res.created_at,
        ]
      );
      return;
    }
    const idx = this.memoryStore.resources.findIndex((r) => r.id === res.id);
    if (idx >= 0) this.memoryStore.resources[idx] = res;
    else this.memoryStore.resources.push(res);
  }

  async deleteResource(id: string): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute('DELETE FROM resources WHERE id = $1', [id]);
      return;
    }
    this.memoryStore.resources = this.memoryStore.resources.filter((r) => r.id !== id);
  }

  async updateResourceStudyStatus(id: string, isStudied: boolean): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute('UPDATE resources SET is_studied = $1 WHERE id = $2', [isStudied ? 1 : 0, id]);
      return;
    }
    const res = this.memoryStore.resources.find((r) => r.id === id);
    if (res) res.is_studied = isStudied;
  }

  async updateResourceSession(id: string, page: number, zoom: number, scrollY: number): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute(
        'UPDATE resources SET last_page = $1, last_zoom = $2, last_scroll_y = $3 WHERE id = $4',
        [page, zoom, scrollY, id]
      );
      return;
    }
    const res = this.memoryStore.resources.find((r) => r.id === id);
    if (res) {
      res.last_page = page;
      res.last_zoom = zoom;
      res.last_scroll_y = scrollY;
    }
  }

  // --- Batch Reordering (Fractional / Sort Order Persistence) ---
  async reorderYears(ordered: Year[]): Promise<void> {
    for (let i = 0; i < ordered.length; i++) {
      ordered[i].sort_order = i + 1;
      await this.saveYear(ordered[i]);
    }
  }

  async reorderSemesters(ordered: Semester[]): Promise<void> {
    for (let i = 0; i < ordered.length; i++) {
      ordered[i].sort_order = i + 1;
      await this.saveSemester(ordered[i]);
    }
  }

  async reorderSubjects(ordered: Subject[]): Promise<void> {
    for (let i = 0; i < ordered.length; i++) {
      ordered[i].sort_order = i + 1;
      await this.saveSubject(ordered[i]);
    }
  }

  async reorderResources(ordered: Resource[]): Promise<void> {
    for (let i = 0; i < ordered.length; i++) {
      ordered[i].sort_order = i + 1;
      await this.saveResource(ordered[i]);
    }
  }

  // --- Units ---
  async getUnits(resourceId?: string): Promise<Unit[]> {
    if (this.isTauri && this.db) {
      const sql = resourceId
        ? 'SELECT * FROM units WHERE resource_id = $1 ORDER BY sort_order ASC'
        : 'SELECT * FROM units ORDER BY sort_order ASC';
      const rows: any[] = await this.db.select(sql, resourceId ? [resourceId] : []);
      return rows.map((r) => ({ ...r, is_studied: Boolean(r.is_studied) }));
    }
    return this.memoryStore.units
      .filter((u) => !resourceId || u.resource_id === resourceId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async saveUnit(unit: Unit): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute(
        `INSERT OR REPLACE INTO units (id, resource_id, title, page_ranges, is_studied, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [unit.id, unit.resource_id, unit.title, unit.page_ranges, unit.is_studied ? 1 : 0, unit.sort_order]
      );
      return;
    }
    const idx = this.memoryStore.units.findIndex((u) => u.id === unit.id);
    if (idx >= 0) this.memoryStore.units[idx] = unit;
    else this.memoryStore.units.push(unit);
  }

  async deleteUnit(id: string): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute('DELETE FROM units WHERE id = $1', [id]);
      return;
    }
    this.memoryStore.units = this.memoryStore.units.filter((u) => u.id !== id);
  }

  async updateUnitStudyStatus(id: string, isStudied: boolean): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute('UPDATE units SET is_studied = $1 WHERE id = $2', [isStudied ? 1 : 0, id]);
      return;
    }
    const unit = this.memoryStore.units.find((u) => u.id === id);
    if (unit) unit.is_studied = isStudied;
  }

  // --- Highlights ---
  async getHighlights(resourceId: string): Promise<Highlight[]> {
    if (this.isTauri && this.db) {
      const rows: any[] = await this.db.select(
        'SELECT * FROM highlights WHERE resource_id = $1 ORDER BY page_number ASC',
        [resourceId]
      );
      return rows;
    }
    return this.memoryStore.highlights.filter((h) => h.resource_id === resourceId);
  }

  async saveHighlight(h: Highlight): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute(
        `INSERT OR REPLACE INTO highlights (id, resource_id, page_number, rects_json, text_snippet, color, note, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [h.id, h.resource_id, h.page_number, h.rects_json, h.text_snippet, h.color, h.note || null, h.created_at]
      );
      return;
    }
    const idx = this.memoryStore.highlights.findIndex((item) => item.id === h.id);
    if (idx >= 0) this.memoryStore.highlights[idx] = h;
    else this.memoryStore.highlights.push(h);
  }

  async deleteHighlight(id: string): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute('DELETE FROM highlights WHERE id = $1', [id]);
      return;
    }
    this.memoryStore.highlights = this.memoryStore.highlights.filter((item) => item.id !== id);
  }

  // --- Themes ---
  async getThemes(): Promise<Theme[]> {
    if (this.isTauri && this.db) {
      const rows: any[] = await this.db.select('SELECT * FROM themes');
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        is_built_in: Boolean(r.is_built_in),
        is_dark: Boolean(r.is_dark),
        colors: JSON.parse(r.colors_json),
      }));
    }
    return this.memoryStore.themes.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      is_built_in: Boolean(t.is_built_in),
      is_dark: Boolean(t.is_dark),
      colors: typeof t.colors_json === 'string' ? JSON.parse(t.colors_json) : t.colors,
    }));
  }

  async saveTheme(theme: Theme): Promise<void> {
    if (this.isTauri && this.db) {
      await this.db.execute(
        `INSERT OR REPLACE INTO themes (id, name, description, is_built_in, is_dark, colors_json)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [theme.id, theme.name, theme.description, theme.is_built_in ? 1 : 0, theme.is_dark ? 1 : 0, JSON.stringify(theme.colors)]
      );
      return;
    }
    const idx = this.memoryStore.themes.findIndex((t) => t.id === theme.id);
    if (idx >= 0) this.memoryStore.themes[idx] = theme;
    else this.memoryStore.themes.push(theme);
  }
}

export const dbService = new DatabaseService();
