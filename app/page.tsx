"use client";

import { useMemo, useState } from "react";
import {
  Archive, Bell, Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, Command, FileText, Folder, FolderPlus, Hash, Home,
  Inbox, LayoutGrid, MoreHorizontal, Plus, Search, Settings2, Share2,
  Sparkles, Star, Trash2, Users, X
} from "lucide-react";

type Note = {
  id: number;
  title: string;
  preview: string;
  folder: string;
  updated: string;
  favorite?: boolean;
  color: string;
  content: string;
};

const initialNotes: Note[] = [
  { id: 1, title: "Ide dan rencana", preview: "Tempat menyimpan ide-ide random yang bisa kita kembangkan bareng.", folder: "Shared Space", updated: "Baru saja", favorite: true, color: "lavender", content: "Tempat menyimpan ide-ide random yang bisa kita kembangkan bareng.\n\nTulis apa saja di sini — ide kecil, rencana, atau hal yang jangan sampai lupa." },
  { id: 2, title: "To-do minggu ini", preview: "Hal-hal yang perlu diselesaikan minggu ini.", folder: "Shared Space", updated: "10 menit lalu", color: "mint", content: "Hal-hal yang perlu diselesaikan minggu ini.\n\n- Rapikan daftar catatan\n- Bahas rencana berikutnya\n- Update progress" },
  { id: 3, title: "Catatan Udin", preview: "Catatan pribadi versi bersama milik Udin.", folder: "Udin", updated: "Kemarin", color: "peach", content: "Catatan Udin.\n\nFolder ini terlihat oleh kita berdua." },
  { id: 4, title: "Catatan teman", preview: "Kumpulan catatan dari teman.", folder: "Teman", updated: "Senin", color: "blue", content: "Kumpulan catatan dari teman.\n\nFolder ini juga terlihat oleh kita berdua." }
];

const folders = [
  { name: "Shared Space", icon: Users, count: 2 },
  { name: "Udin", icon: Folder, count: 1 },
  { name: "Teman", icon: Folder, count: 1 }
];

export default function HomePage() {
  const [notes, setNotes] = useState(initialNotes);
  const [activeFolder, setActiveFolder] = useState("All notes");
  const [activeNote, setActiveNote] = useState(1);
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [trash, setTrash] = useState<Note[]>([]);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [saved, setSaved] = useState(true);

  const selected = notes.find((note) => note.id === activeNote) ?? notes[0];
  const visibleNotes = useMemo(() => notes.filter((note) => {
    const matchesFolder = activeFolder === "All notes" || note.folder === activeFolder;
    const matchesQuery = (note.title + " " + note.preview).toLowerCase().includes(query.toLowerCase());
    return matchesFolder && matchesQuery && (!favoritesOnly || note.favorite);
  }), [notes, activeFolder, query, favoritesOnly]);

  function addNote() {
    const note: Note = {
      id: Date.now(),
      title: "Untitled note",
      preview: "Mulai tulis sesuatu...",
      folder: activeFolder === "All notes" ? "Shared Space" : activeFolder,
      updated: "Baru saja",
      color: "lavender",
      content: ""
    };
    setNotes((current) => [note, ...current]);
    setActiveFolder(note.folder);
    setActiveNote(note.id);
    setSaved(false);
  }

  function updateSelected(patch: Partial<Note>) {
    if (!selected) return;
    setNotes((current) => current.map((note) => note.id === selected.id ? { ...note, ...patch } : note));
    setSaved(false);
  }

  function deleteSelected() {
    if (!selected) return;
    setTrash((current) => [selected, ...current]);
    setNotes((current) => current.filter((note) => note.id !== selected.id));
    setActiveNote(notes.find((note) => note.id !== selected.id)?.id ?? 0);
  }

  function toggleFavorite(noteId: number) {
    setNotes((current) => current.map((note) => note.id === noteId ? { ...note, favorite: !note.favorite } : note));
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileSidebar ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><span>n</span></div>
          <span className="brand-name">note<span>together</span></span>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setMobileSidebar(false)}><X size={17} /></button>
        </div>

        <button className="workspace-switch">
          <div className="workspace-avatar">NT</div>
          <div className="workspace-copy"><strong>Our workspace</strong><small>2 members · Shared</small></div>
          <ChevronDown size={15} className="muted-icon" />
        </button>

        <div className="side-section">
          <div className="section-label">WORKSPACE</div>
          <button className={`nav-item ${activeFolder === "All notes" && !favoritesOnly && !showTrash ? "active" : ""}`} onClick={() => { setActiveFolder("All notes"); setFavoritesOnly(false); setShowTrash(false); }}><Home size={17} /><span>All notes</span><kbd>⌘ 1</kbd></button>
          <button className={`nav-item ${favoritesOnly ? "active" : ""}`} onClick={() => { setFavoritesOnly(true); setShowTrash(false); }}><Star size={17} /><span>Favorites</span></button>
          <button className={`nav-item ${showTrash ? "active" : ""}`} onClick={() => { setShowTrash(true); setFavoritesOnly(false); }}><Trash2 size={17} /><span>Trash</span><span className="nav-count">{trash.length}</span></button>
        </div>

        <div className="side-section folder-section">
          <div className="section-heading"><span className="section-label">YOUR FOLDERS</span><button className="tiny-icon" title="Add folder"><Plus size={15} /></button></div>
          {folders.map((folder) => {
            const Icon = folder.icon;
            return <button key={folder.name} className={`nav-item folder-item ${activeFolder === folder.name && !showTrash ? "active" : ""}`} onClick={() => { setActiveFolder(folder.name); setFavoritesOnly(false); setShowTrash(false); }}><Icon size={17} /><span>{folder.name}</span><span className="nav-count">{folder.count}</span></button>;
          })}
          <button className="add-folder"><FolderPlus size={16} /> Add a folder</button>
        </div>

        <div className="sidebar-bottom">
          <div className="sync-card"><div className="sync-icon"><Users size={16} /></div><div><strong>Together is better</strong><p>Your notes, one shared space.</p></div></div>
          <button className="nav-item"><Settings2 size={17} /><span>Settings</span></button>
          <button className="nav-item"><CircleHelp size={17} /><span>Help & feedback</span></button>
          <div className="profile-row"><div className="profile-avatar">U</div><div className="profile-copy"><strong>Udin</strong><small>Workspace member</small></div><MoreHorizontal size={18} className="muted-icon" /></div>
        </div>
      </aside>

      {mobileSidebar && <button className="mobile-scrim" aria-label="Close sidebar" onClick={() => setMobileSidebar(false)} />}

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs"><button className="mobile-menu icon-button" onClick={() => setMobileSidebar(true)}><LayoutGrid size={18} /></button><span>Workspace</span><ChevronRight size={14} /><strong>{showTrash ? "Trash" : favoritesOnly ? "Favorites" : activeFolder}</strong></div>
          <div className="top-actions"><div className="save-state"><span className={saved ? "status-dot" : "status-dot pending"} />{saved ? "All changes saved" : "Unsaved changes"}</div><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><button className="share-button"><Share2 size={15} /> Share</button></div>
        </header>

        <div className="content-area">
          <div className="page-heading"><div><div className="eyebrow"><Sparkles size={13} /> A LITTLE SPACE FOR BIG IDEAS</div><h1>{showTrash ? "Trash" : favoritesOnly ? "Your favorites" : activeFolder === "All notes" ? "All notes" : activeFolder}</h1><p>{showTrash ? "Notes you deleted will stay here for now." : "A calm place to collect thoughts, plans, and everything in between."}</p></div><button className="primary-button" onClick={addNote}><Plus size={17} /> New note</button></div>

          <div className="workspace-grid">
            <section className="notes-column">
              <div className="list-toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes..." /><kbd><Command size={10} /> K</kbd></div><button className="sort-button">Recently edited <ChevronDown size={14} /></button></div>
              <div className="notes-list">
                {showTrash ? trash.map((note) => <article key={note.id} className="note-card"><div className="note-card-top"><span className="note-folder"><Trash2 size={12} /> Deleted</span></div><h3>{note.title}</h3><p>{note.preview}</p><div className="note-meta"><span><Clock3 size={12} /> {note.updated}</span><button className="restore-button" onClick={() => { setNotes((current) => [note, ...current]); setTrash((current) => current.filter((item) => item.id !== note.id)); }}>Restore</button></div></article>) : visibleNotes.map((note) => <article key={note.id} className={`note-card ${activeNote === note.id ? "selected" : ""}`} onClick={() => setActiveNote(note.id)}><div className="note-card-top"><span className="note-folder"><Folder size={12} /> {note.folder}</span><button className={`favorite-button ${note.favorite ? "is-favorite" : ""}`} aria-label="Toggle favorite" onClick={(event) => { event.stopPropagation(); toggleFavorite(note.id); }}><Star size={15} fill={note.favorite ? "currentColor" : "none"} /></button></div><h3>{note.title || "Untitled note"}</h3><p>{note.preview || "No preview yet..."}</p><div className="note-meta"><span><Clock3 size={12} /> {note.updated}</span><span className={`note-color ${note.color}`} /></div></article>)}
                {!showTrash && visibleNotes.length === 0 && <div className="empty-state"><Inbox size={24} /><strong>No notes found</strong><span>Try another search or create a new note.</span><button onClick={addNote}>Create a note</button></div>}
                {!showTrash && <button className="new-note-card" onClick={addNote}><Plus size={17} /><span>Create a new note</span></button>}
              </div>
              <div className="list-footer"><span>{showTrash ? trash.length : visibleNotes.length} notes</span><span>Made for two <span className="heart">♥</span></span></div>
            </section>

            <section className="editor-panel">
              {showTrash ? <div className="editor-empty"><Archive size={28} /><h2>Your trash</h2><p>Restore a note to continue editing it.</p></div> : selected ? <><div className="editor-toolbar"><div className="editor-folder"><Folder size={13} /> {selected.folder} <ChevronRight size={12} /> <span>Edited {selected.updated.toLowerCase()}</span></div><div className="editor-tools"><button className="icon-button" title="Favorite" onClick={() => toggleFavorite(selected.id)}><Star size={17} fill={selected.favorite ? "currentColor" : "none"} className={selected.favorite ? "star-active" : ""} /></button><button className="icon-button" title="Delete note" onClick={deleteSelected}><Trash2 size={17} /></button><button className="icon-button"><MoreHorizontal size={18} /></button></div></div><div className="editor-content"><input className="title-input" value={selected.title} onChange={(event) => updateSelected({ title: event.target.value })} placeholder="Untitled note" /><div className="editor-byline"><div className="mini-avatar">U</div><span>Udin</span><span className="byline-dot">·</span><span>Just you and your friend can see this</span></div><div className="format-toolbar"><button className="format-select">Normal text <ChevronDown size={13} /></button><span className="format-divider" /><button><strong>B</strong></button><button><em>I</em></button><button><u>U</u></button><button><Hash size={15} /></button><span className="format-divider" /><button><ul><li /></ul></button><button><Check size={15} /></button></div><textarea className="note-editor" value={selected.content} onChange={(event) => updateSelected({ content: event.target.value, preview: event.target.value.slice(0, 90) })} placeholder="Start writing your thoughts here...&#10;&#10;There's no perfect way to begin. Just let it flow." /><div className="editor-bottom"><span><span className={saved ? "status-dot" : "status-dot pending"} /> {saved ? "Saved to this device" : "Draft changes"}</span><span>Markdown supported soon</span></div></div></> : <div className="editor-empty"><FileText size={28} /><h2>Select a note</h2><p>Choose a note from the list or create a new one.</p></div>}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}