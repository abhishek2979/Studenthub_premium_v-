import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, BookOpen, X, Search, FileText, Upload, Download, Eye, XCircle } from 'lucide-react';
import { C, Btn, FieldInput, Modal, Spinner, Empty } from '../components/UI';
import { noteAPI } from '../utils/api';

const SUBJECTS = ['Math','Science','English','History','Geography','Physics','Chemistry','Biology','Other'];
const SUBJECT_COLORS = {
  Math:{ bg:'#EAF0FB',fg:'#185FA5' }, Science:{ bg:'#EAF3DE',fg:'#3B6D11' },
  English:{ bg:'#EEEDFE',fg:'#3C3489' }, History:{ bg:'#FAEEDA',fg:'#854F0B' },
  Geography:{ bg:'#E1F5EE',fg:'#0F6E56' }, Physics:{ bg:'#EAF0FB',fg:'#185FA5' },
  Chemistry:{ bg:'#FAEEDA',fg:'#854F0B' }, Biology:{ bg:'#EAF3DE',fg:'#3B6D11' },
  Other:{ bg:'#EBEBEB',fg:'#5A5A5A' },
};
const sc = s => SUBJECT_COLORS[s] || SUBJECT_COLORS.Other;
const EMPTY_FORM = { title:'', content:'', subject:'', class:'' };

export default function NotesTab({ showNotif }) {
  const [notes,setNotes]         = useState([]);
  const [loading,setLoading]     = useState(true);
  const [modal,setModal]         = useState(false);
  const [editing,setEditing]     = useState(null);
  const [form,setForm]           = useState(EMPTY_FORM);
  const [saving,setSaving]       = useState(false);
  const [viewing,setViewing]     = useState(null);
  const [search,setSearch]       = useState('');
  const [filter,setFilter]       = useState('All');
  const [pdfFile,setPdfFile]     = useState(null);
  const [removePdf,setRemovePdf] = useState(false);
  const fileRef                  = useRef();

  const load = () => {
    setLoading(true);
    noteAPI.getAll()
      .then(r => setNotes(r.data.notes))
      .catch(() => showNotif('Failed to load notes','error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setPdfFile(null); setRemovePdf(false); setModal(true); };
  const openEdit = n => {
    setEditing(n);
    setForm({ title:n.title, content:n.content, subject:n.subject||'', class:n.class||'' });
    setPdfFile(null); setRemovePdf(false);
    setModal(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return showNotif('Title and content required','error');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (pdfFile)          fd.append('pdf', pdfFile);
      if (removePdf)        fd.append('removePdf', 'true');

      editing ? await noteAPI.update(editing._id, fd) : await noteAPI.create(fd);
      showNotif(editing ? 'Note updated' : 'Note created','success');
      setModal(false); load();
    } catch(e) { showNotif(e.response?.data?.message || 'Failed to save','error'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!window.confirm('Delete this note?')) return;
    try { await noteAPI.delete(id); showNotif('Deleted','success'); load(); }
    catch { showNotif('Failed to delete','error'); }
  };

  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const subjects = ['All', ...new Set(notes.map(n=>n.subject).filter(Boolean))];
  const filtered = notes.filter(n => {
    const ms = n.title.toLowerCase().includes(search.toLowerCase()) ||
               (n.subject||'').toLowerCase().includes(search.toLowerCase()) ||
               n.content.toLowerCase().includes(search.toLowerCase());
    const mf = filter==='All' || n.subject===filter;
    return ms && mf;
  });

  const PdfBadge = ({ url, fileName }) => url ? (
    <div style={{ display:'flex', alignItems:'center', gap:6, background:'#FFF3E0', border:'1px solid #FFCC80', borderRadius:8, padding:'4px 10px', width:'fit-content', marginTop:6 }}>
      <FileText size={12} color="#E65100"/>
      <span style={{ fontSize:11, color:'#E65100', fontWeight:500, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{fileName || 'PDF Attachment'}</span>
      <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, color:'#1565C0', textDecoration:'none', fontWeight:500, marginLeft:4 }}>
        <Eye size={11}/> View
      </a>
    </div>
  ) : null;

  return (
    <div style={{ padding:'28px 32px', maxWidth:960 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, gap:16, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:600, color:C.text, margin:0, letterSpacing:'-0.4px' }}>Study Notes</h1>
          <p style={{ fontSize:13, color:C.text4, margin:'4px 0 0' }}>{notes.length} note{notes.length!==1?'s':''} · Share material with students</p>
        </div>
        <button onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:8, background:C.text, color:'#fff', border:'none', borderRadius:12, padding:'11px 20px', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>
          <Plus size={16}/>Add Note
        </button>
      </div>

      {notes.length > 0 && (
        <div style={{ marginBottom:22 }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:C.text4, pointerEvents:'none' }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes..."
                style={{ width:'100%', boxSizing:'border-box', background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 14px 9px 36px', color:C.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif" }}/>
            </div>
            <div style={{ position:'relative', flexShrink:0 }}>
              <select value={filter} onChange={e=>setFilter(e.target.value)}
                style={{ appearance:'none', WebkitAppearance:'none', background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 36px 9px 14px', color:C.text, fontSize:13, fontWeight:500, outline:'none', fontFamily:"'DM Sans',sans-serif", cursor:'pointer', minWidth:140 }}>
                {subjects.map(s=><option key={s} value={s}>{s==='All'?'All Subjects':s}</option>)}
              </select>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                <path d="M2 4L6 8L10 4" stroke={C.text4} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      {loading ? <Spinner/> : filtered.length === 0 ? (
        <Empty icon={BookOpen} message={notes.length===0 ? "No notes yet — click Add Note to create your first one" : "No notes match your search"}/>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {filtered.map(n => {
            const color = sc(n.subject);
            return (
              <div key={n._id}
                style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden', display:'flex', flexDirection:'column', cursor:'pointer', transition:'box-shadow .2s' }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.08)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
                onClick={()=>setViewing(n)}>
                <div style={{ height:4, background:n.subject?color.fg:C.accent, opacity:.7 }}/>
                <div style={{ padding:'18px 20px 16px', flex:1 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:10 }}>
                    <h3 style={{ fontSize:15, fontWeight:600, color:C.text, margin:0, lineHeight:1.4, flex:1 }}>{n.title}</h3>
                    <div style={{ display:'flex', gap:4, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>openEdit(n)} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`, background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.text4 }}><Edit2 size={12}/></button>
                      <button onClick={()=>del(n._id)} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`, background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.danger }}><Trash2 size={12}/></button>
                    </div>
                  </div>
                  <p style={{ fontSize:13, color:C.text3, margin:'0 0 10px', lineHeight:1.6, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' }}>{n.content}</p>
                  {n.pdfUrl && <PdfBadge url={n.pdfUrl} fileName={n.pdfFileName}/>}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap', marginTop:10 }}>
                    <div style={{ display:'flex', gap:6 }}>
                      {n.subject && <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:color.bg, color:color.fg }}>{n.subject}</span>}
                      <span style={{ fontSize:11, padding:'3px 9px', borderRadius:20, background:C.card2, color:C.text4 }}>{n.class ? `Class ${n.class}` : 'All classes'}</span>
                    </div>
                    <span style={{ fontSize:11, color:C.text4 }}>{new Date(n.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit Note':'New Note'} width={560}>
        <FieldInput label="TITLE" value={form.title} onChange={v=>f('title',v)} placeholder="e.g. Chapter 3 — Newton's Laws"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.text3, marginBottom:6, letterSpacing:'0.5px' }}>SUBJECT</label>
            <select value={form.subject} onChange={e=>f('subject',e.target.value)}
              style={{ width:'100%', background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', color:form.subject?C.text:C.text4, fontSize:14, outline:'none', fontFamily:"'DM Sans',sans-serif" }}>
              <option value="">Select subject</option>
              {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <FieldInput label="CLASS (optional)" value={form.class} onChange={v=>f('class',v)} placeholder="e.g. 10A  (blank = all)"/>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.text3, marginBottom:6, letterSpacing:'0.5px' }}>CONTENT</label>
          <textarea value={form.content} onChange={e=>f('content',e.target.value)} rows={6} placeholder="Write your note content here..."
            style={{ width:'100%', boxSizing:'border-box', background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', color:C.text, fontSize:14, outline:'none', fontFamily:"'DM Sans',sans-serif", resize:'vertical', lineHeight:1.6 }}/>
        </div>

        {/* PDF Upload */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.text3, marginBottom:8, letterSpacing:'0.5px' }}>ATTACH PDF (optional)</label>

          {/* Show existing PDF when editing */}
          {editing?.pdfUrl && !removePdf && !pdfFile && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#FFF3E0', border:'1px solid #FFCC80', borderRadius:10, padding:'10px 14px', marginBottom:10 }}>
              <FileText size={16} color="#E65100"/>
              <span style={{ flex:1, fontSize:13, color:'#E65100', fontWeight:500 }}>{editing.pdfFileName || 'Current PDF'}</span>
              <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(editing.pdfUrl)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:'#1565C0', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}><Eye size={12}/> View</a>
              <button onClick={()=>setRemovePdf(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9B2020', display:'flex', alignItems:'center' }}><XCircle size={16}/></button>
            </div>
          )}
          {removePdf && <p style={{ fontSize:12, color:'#9B2020', margin:'0 0 8px' }}>Current PDF will be removed on save.</p>}

          {/* New file picker */}
          {!pdfFile ? (
            <div onClick={()=>fileRef.current?.click()}
              style={{ border:`2px dashed ${C.border}`, borderRadius:10, padding:'16px', textAlign:'center', cursor:'pointer', background:C.card2 }}>
              <Upload size={20} color={C.text4} style={{ marginBottom:6 }}/>
              <p style={{ fontSize:13, color:C.text4, margin:0 }}>Click to upload a PDF file (max 20MB)</p>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display:'none' }}
                onChange={e=>{ if(e.target.files[0]){ setPdfFile(e.target.files[0]); setRemovePdf(false); } }}/>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'#EAF3DE', border:'1px solid #A8D5A2', borderRadius:10, padding:'10px 14px' }}>
              <FileText size={16} color="#3B6D11"/>
              <span style={{ flex:1, fontSize:13, color:'#3B6D11', fontWeight:500 }}>{pdfFile.name}</span>
              <button onClick={()=>{ setPdfFile(null); if(fileRef.current) fileRef.current.value=''; }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9B2020', display:'flex' }}><XCircle size={16}/></button>
            </div>
          )}
        </div>

        <Btn onClick={save} disabled={saving} style={{ width:'100%' }}>{saving?'Saving…':editing?'Update Note':'Create Note'}</Btn>
      </Modal>

      {/* View Modal */}
      {viewing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(28,26,22,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={()=>setViewing(null)}>
          <div style={{ background:C.card, borderRadius:20, padding:32, maxWidth:640, width:'100%', maxHeight:'82vh', overflow:'auto', position:'relative' }} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setViewing(null)} style={{ position:'absolute', top:20, right:20, background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.text3 }}><X size={15}/></button>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
              {viewing.subject && <span style={{ fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:20, background:sc(viewing.subject).bg, color:sc(viewing.subject).fg }}>{viewing.subject}</span>}
              {viewing.class   && <span style={{ fontSize:12, padding:'4px 12px', borderRadius:20, background:C.card2, color:C.text4 }}>Class {viewing.class}</span>}
            </div>
            <h2 style={{ fontSize:22, fontWeight:600, color:C.text, marginBottom:16, letterSpacing:'-0.3px' }}>{viewing.title}</h2>
            <p style={{ fontSize:15, color:C.text2, lineHeight:1.9, whiteSpace:'pre-wrap', margin:0 }}>{viewing.content}</p>
            {viewing.pdfUrl && (
              <div style={{ marginTop:20, padding:'14px 18px', background:'#FFF3E0', border:'1px solid #FFCC80', borderRadius:12, display:'flex', alignItems:'center', gap:12 }}>
                <FileText size={20} color="#E65100"/>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#E65100' }}>PDF Attachment</p>
                  <p style={{ margin:0, fontSize:12, color:'#8D4E00' }}>{viewing.pdfFileName || 'note.pdf'}</p>
                </div>
                <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(viewing.pdfUrl)}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:6, background:'#E65100', color:'#fff', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, textDecoration:'none' }}>
                  <Eye size={14}/> Open PDF
                </a>
              </div>
            )}
            <div style={{ marginTop:24, paddingTop:16, borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:12, color:C.text4 }}>{new Date(viewing.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span>
              <button onClick={()=>{ setViewing(null); openEdit(viewing); }} style={{ fontSize:12, color:C.accent, background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 14px', cursor:'pointer', fontWeight:500, display:'flex', alignItems:'center', gap:6 }}><Edit2 size={12}/>Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
