"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive, Bell, Check, ChevronDown, ChevronRight, Clock3, Command,
  FileText, Folder, FolderPlus, Hash, Home, Inbox, LayoutGrid,
  MoreHorizontal, Plus, Search, Share2, Sparkles, Star, Trash2,
  Users, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type FolderRow = { id: string; name: string; color: string; sort_order: number };
type Note = {
  id: string;
  folder_id: string | null;
  title: string;
  content: string;
  preview: string;
  folder: string;
  updated: string;
  favorite: boolean;
  color: string;
  author_name: string;
  deleted_at: string | null;
  updated_at: string;
};

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function mapNote(row: any): Note {
  return {
    id: row.id,
    folder_id: row.folder_id,
    title: row.title ?? "",
    content: row.content ?? "",
    preview: (row.content ?? "").replace(/\s+/g, " ").slice(0, 100),
    folder: row.folders?.name ?? "Shared Space",
    updated: relativeTime(row.updated_at),
    favorite: Boolean(row.favorite),
    color: row.color ?? "lavender",
    author_name: row.author_name ?? "Udin",
    deleted_at: row.deleted_at,
    updated_at: row.updated_at
  };
}

export default function HomePage() {
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeFolder, setActiveFolder] = useState("All notes");
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [shareLabel, setShareLabel] = useState("Share");
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const loadWorkspace = useCallback(async () => {
    if (!supabase) {
      setErrorMessage("Supabase belum terhubung. Environment variables belum diatur.");
      setLoading(false);
      return;
    }
    const [{ data: folderData, error: folderError }, { data: noteData, error: noteError }] = await Promise.all([
      supabase.from("folders").select("*").order("sort_order"),
      supabase.from("notes").select("*, folders(name)").order("updated_at", { ascending: false })
    ]);
    if (folderError || noteError) {
      setErrorMessage(folderError?.message ?? noteError?.message ?? "Gagal memuat workspace.");
      setLoading(false);
      return;
    }
    const nextFolders = (folderData ?? []) as FolderRow[];
    const nextNotes = (noteData ?? []).map(mapNote) as Note[];
    setFolders(nextFolders);
    setNotes(nextNotes);
    setActiveNote((current) => current && nextNotes.some((note) => note.id === current && !note.deleted_at)
      ? current
      : nextNotes.find((note) => !note.deleted_at)?.id ?? null);
    setErrorMessage("");
    setLoading(false);
    setSaved(true);
  }, []);

  useEffect(() => {
    void loadWorkspace();
    if (!supabase) return;
    const channel = supabase
      .channel("notetogether-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, () => void loadWorkspace())
      .on("postgres_changes", { event: "*", schema: "public", table: "folders" }, () => void loadWorkspace())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
      Object.values(saveTimers.current).forEach(clearTimeout);
    };
  }, [loadWorkspace]);

  const activeNotes = useMemo(() => notes.filter((note) => !note.deleted_at), [notes]);
  const trash = useMemo(() => notes.filter((note) => Boolean(note.deleted_at)), [notes]);
  const selected = activeNotes.find((note) => note.id === activeNote) ?? null;
  const visibleNotes = useMemo(() => activeNotes.filter((note) => {
    const matchesFolder = activeFolder === "All notes" || note.folder === activeFolder;
    const matchesQuery = (note.title + " " + note.content).toLowerCase().includes(query.toLowerCase());
    return matchesFolder && matchesQuery && (!favoritesOnly || note.favorite);
  }), [activeNotes, activeFolder, query, favoritesOnly]);

  async function addNote() {
    if (!supabase) return;
    const folder = folders.find((item) => item.name === (activeFolder === "All notes" ? "Shared Space" : activeFolder)) ?? folders[0];
    if (!folder) return;
    setSaved(false);
    const { data, error } = await supabase.from("notes").insert({
      folder_id: folder.id,
      title: "",
      content: "",
      color: folder.color,
      author_name: "Udin"
    }).select("id").single();
    if (error) {
      setErrorMessage(error.message);
      setSaved(true);
      return;
    }
    await loadWorkspace();
    setActiveFolder(folder.name);
    setFavoritesOnly(false);
    setShowTrash(false);
    setActiveNote(data.id);
    setErrorMessage("");
  }

  function updateSelected(patch: Partial<Pick<Note, "title" | "content">>) {
    if (!selected || !supabase) return;
    const updated = { ...selected, ...patch, preview: (patch.content ?? selected.content).replace(/\s+/g, " ").slice(0, 100) };
    setNotes((current) => current.map((note) => note.id === selected.id ? updated : note));
    setSaved(false);
    const id = selected.id;
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      const { error } = await supabase.from("notes").update({
        title: updated.title,
        content: updated.content
      }).eq("id", id);
      if (error) setErrorMessage(error.message);
      else setErrorMessage("");
      setSaved(true);
      delete saveTimers.current[id];
    }, 550);
  }

  async function toggleFavorite(note: Note) {
    if (!supabase) return;
    const favorite = !note.favorite;
    setNotes((current) => current.map((item) => item.id === note.id ? { ...item, favorite } : item));
    const { error } = await supabase.from("notes").update({ favorite }).eq("id", note.id);
    if (error) setErrorMessage(error.message);
  }

  async function deleteSelected() {
    if (!selected || !supabase) return;
    const deletedAt = new Date().toISOString();
    const { error } = await supabase.from("notes").update({ deleted_at: deletedAt }).eq("id", selected.id);
    if (error) { setErrorMessage(error.message); return; }
    setNotes((current) => current.map((note) => note.id === selected.id ? { ...note, deleted_at: deletedAt } : note));
    setActiveNote(activeNotes.find((note) => note.id !== selected.id)?.id ?? null);
  }

  async function restoreNote(note: Note) {
    if (!supabase) return;
    const { error } = await supabase.from("notes").update({ deleted_at: null }).eq("id", note.id);
    if (error) { setErrorMessage(error.message); return; }
    setNotes((current) => current.map((item) => item.id === note.id ? { ...item, deleted_at: null } : item));
    setActiveNote(note.id);
    setShowTrash(false);
  }

  async function addFolder() {
    if (!supabase) return;
    const name = window.prompt("Nama folder baru:");
    if (!name?.trim()) return;
    const { error } = await supabase.from("folders").insert({
      name: name.trim(),
      color: "lavender",
      sort_order: folders.length
    });
    if (error) setErrorMessage(error.message);
    else await loadWorkspace();
  }

  async function shareWorkspace() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareLabel("Copied!");
      window.setTimeout(() => setShareLabel("Share"), 1800);
    } catch {
      setShareLabel("Copy unavailable");
      window.setTimeout(() => setShareLabel("Share"), 1800);
    }
  }

  const folderCounts = (name: string) => activeNotes.filter((note) => note.folder === name).length;

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileSidebar ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><span>n</span></div>
          <span className="brand-name">note<span>together</span></span>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setMobileSidebar(false)}><X size={17} /></button>
        </div>
        <div className="workspace-switch">
          <div className="workspace-avatar">NT</div>
          <div className="workspace-copy"><strong>Our workspace</strong><small>2 members · Shared</small></div>
          <ChevronDown size={15} className="muted-icon" />
        </div>

        <div className="side-section">
          <div className="section-label">WORKSPACE</div>
          <button className={`nav-item ${activeFolder === "All notes" && !favoritesOnly && !showTrash ? "active" : ""}`} onClick={() => { setActiveFolder("All notes"); setFavoritesOnly(false); setShowTrash(false); }}><Home size={17} /><span>All notes</span><kbd>⌘ 1</kbd></button>
          <button className={`nav-item ${favoritesOnly ? "active" : ""}`} onClick={() => { setFavoritesOnly(true); setShowTrash(false); }}><Star size={17} /><span>Favorites</span></button>
          <button className={`nav-item ${showTrash ? "active" : ""}`} onClick={() => { setShowTrash(true); setFavoritesOnly(false); }}><Trash2 size={17} /><span>Trash</span><span className="nav-count">{trash.length}</span></button>
        </div>

        <div className="side-section folder-section">
          <div className="section-heading"><span className="section-label">YOUR FOLDERS</span><button className="tiny-icon" title="Add folder" onClick={addFolder}><Plus size={15} /></button></div>
          {folders.map((folder) => {
            const Icon = folder.name === "Shared Space" ? Users : Folder;
            return <button key={folder.id} className={`nav-item folder-item ${activeFolder === folder.name && !showTrash ? "active" : ""}`} onClick={() => { setActiveFolder(folder.name); setFavoritesOnly(false); setShowTrash(false); }}><Icon size={17} /><span>{folder.name}</span><span className="nav-count">{folderCounts(folder.name)}</span></button>;
          })}
          <button className="add-folder" onClick={addFolder}><FolderPlus size={16} /> Add a folder</button>
        </div>

        <div className="sidebar-bottom">
          <div className="sync-card"><div className="sync-icon"><Users size={16} /></div><div><strong>Together is better</strong><p>Your notes, one shared space.</p></div></div>
          <div className="nav-item"><Archive size={17} /><span>Live shared workspace</span></div>
          <div className="profile-row"><div className="profile-avatar">U</div><div className="profile-copy"><strong>Udin</strong><small>Workspace member</small></div><MoreHorizontal size={18} className="muted-icon" /></div>
        </div>
      </aside>

      {mobileSidebar && <button className="mobile-scrim" aria-label="Close sidebar" onClick={() => setMobileSidebar(false)} />}

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs"><button className="mobile-menu icon-button" onClick={() => setMobileSidebar(true)}><LayoutGrid size={18} /></button><span>Workspace</span><ChevronRight size={14} /><strong>{showTrash ? "Trash" : favoritesOnly ? "Favorites" : activeFolder}</strong></div>
          <div className="top-actions"><div className="save-state"><span className={saved ? "status-dot" : "status-dot pending"} />{saved ? "All changes saved" : "Saving..."}</div><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><button className="share-button" onClick={shareWorkspace}><Share2 size={15} /> {shareLabel}</button></div>
        </header>

        <div className="content-area">
          <div className="page-heading"><div><div className="eyebrow"><Sparkles size={13} /> A LITTLE SPACE FOR BIG IDEAS</div><h1>{showTrash ? "Trash" : favoritesOnly ? "Your favorites" : activeFolder === "All notes" ? "All notes" : activeFolder}</h1><p>{showTrash ? "Notes you deleted will stay here for now." : "A calm place to collect thoughts, plans, and everything in between."}</p></div><button className="primary-button" onClick={addNote} disabled={loading}><Plus size={17} /> New note</button></div>

          {errorMessage && <div className="workspace-alert">{errorMessage}</div>}
          {loading ? <div className="loading-state">Preparing your shared workspace...</div> : (
            <div className="workspace-grid">
              <section className="notes-column">
                <div className="list-toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes..." /><kbd><Command size={10} /> K</kbd></div><span className="sort-button">Recently edited <ChevronDown size={14} /></span></div>
                <div className="notes-list">
                  {showTrash ? trash.map((note) => <article key={note.id} className="note-card"><div className="note-card-top"><span className="note-folder"><Trash2 size={12} /> Deleted</span></div><h3>{note.title || "Untitled note"}</h3><p>{note.preview || "No preview yet..."}</p><div className="note-meta"><span><Clock3 size={12} /> {note.updated}</span><button className="restore-button" onClick={() => restoreNote(note)}>Restore</button></div></article>) : visibleNotes.map((note) => <article key={note.id} className={`note-card ${activeNote === note.id ? "selected" : ""}`} onClick={() => setActiveNote(note.id)}><div className="note-card-top"><span className="note-folder"><Folder size={12} /> {note.folder}</span><button className={`favorite-button ${note.favorite ? "is-favorite" : ""}`} aria-label="Toggle favorite" onClick={(event) => { event.stopPropagation(); void toggleFavorite(note); }}><Star size={15} fill={note.favorite ? "currentColor" : "none"} /></button></div><h3>{note.title || "Untitled note"}</h3><p>{note.preview || "No preview yet..."}</p><div className="note-meta"><span><Clock3 size={12} /> {note.updated}</span><span className={`note-color ${note.color}`} /></div></article>)}
                  {!showTrash && visibleNotes.length === 0 && <div className="empty-state"><Inbox size={24} /><strong>No notes found</strong><span>Try another search or create a new note.</span><button onClick={addNote}>Create a note</button></div>}
                  {!showTrash && <button className="new-note-card" onClick={addNote}><Plus size={17} /><span>Create a new note</span></button>}
                </div>
                <div className="list-footer"><span>{showTrash ? trash.length : visibleNotes.length} notes</span><span>Made for two <span className="heart">♥</span></span></div>
              </section>

              <section className="editor-panel">
                {showTrash ? <div className="editor-empty"><Archive size={28} /><h2>Your trash</h2><p>Restore a note to continue editing it.</p></div> : selected ? <><div className="editor-toolbar"><div className="editor-folder"><Folder size={13} /> {selected.folder} <ChevronRight size={12} /> <span>Edited {selected.updated.toLowerCase()}</span></div><div className="editor-tools"><button className="icon-button" title="Favorite" onClick={() => void toggleFavorite(selected)}><Star size={17} fill={selected.favorite ? "currentColor" : "none"} className={selected.favorite ? "star-active" : ""} /></button><button className="icon-button" title="Delete note" onClick={() => void deleteSelected()}><Trash2 size={17} /></button><button className="icon-button" title="Saved in shared workspace"><Check size={17} /></button></div></div><div className="editor-content"><input className="title-input" value={selected.title} onChange={(event) => updateSelected({ title: event.target.value })} placeholder="Untitled note" /><div className="editor-byline"><div className="mini-avatar">U</div><span>{selected.author_name}</span><span className="byline-dot">·</span><span>Shared workspace</span></div><div className="format-toolbar"><span className="format-select">Normal text <ChevronDown size={13} /></span><span className="format-divider" /><span><strong>B</strong></span><span><em>I</em></span><span><u>U</u></span><span><Hash size={15} /></span><span className="format-divider" /><span>☷</span><span><Check size={15} /></span></div><textarea className="note-editor" value={selected.content} onChange={(event) => updateSelected({ content: event.target.value })} placeholder={"Start writing your thoughts here...\n\nThere's no perfect way to begin. Just let it flow."} /><div className="editor-bottom"><span><span className={saved ? "status-dot" : "status-dot pending"} /> {saved ? "Synced to shared workspace" : "Saving changes..."}</span><span>{selected.content.length} characters</span></div></div></> : <div className="editor-empty"><FileText size={28} /><h2>Select a note</h2><p>Choose a note from the list or create a new one.</p></div>}
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
