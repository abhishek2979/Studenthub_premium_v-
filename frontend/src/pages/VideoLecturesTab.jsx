// frontend/src/pages/VideoLecturesTab.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Video, Plus, Trash2, Edit2, Eye, Upload, X, BookOpen,
  Calendar, PlayCircle, FileText, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Spinner, Modal, Btn, Empty, Badge, C } from '../components/UI';
import { videoAPI } from '../utils/api';

const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const COLORS  = {
  bg: '#F8F7F4', card: '#FFFFFF', border: '#E8E4DC',
  text: '#1C1917', muted: '#78716C', accent: '#8B5CF6',
};

const initialForm = { title:'', description:'', subject:'', day:'Monday', video:null, attachment:null };

function VideoCard({ v, onEdit, onDelete, onToggle }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Delete this video?')) return;
    setDeleting(true);
    try { await onDelete(v._id); } finally { setDeleting(false); }
  };

  return (
    <div style={{
      background: COLORS.card, border:`1px solid ${COLORS.border}`,
      borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column',
    }}>
      {/* Thumbnail / preview area */}
      <div style={{
        background:`linear-gradient(135deg,#1e1b4b,#312e81)`,
        aspectRatio:'16/9', display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative', cursor:'pointer',
      }} onClick={() => window.open(v.videoUrl,'_blank')}>
        {v.thumbnailUrl
          ? <img src={v.thumbnailUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }}/>
          : null
        }
        <PlayCircle size={48} color="rgba(255,255,255,.8)" style={{ position:'relative', zIndex:1 }}/>
        <div style={{
          position:'absolute', top:8, right:8, zIndex:1,
          background:'rgba(0,0,0,.5)', borderRadius:6, padding:'2px 8px',
          color:'#fff', fontSize:11, fontWeight:600,
        }}>
          {v.day}
        </div>
        {!v.isPublished && (
          <div style={{
            position:'absolute', top:8, left:8, zIndex:1,
            background:'#EF4444', borderRadius:6, padding:'2px 8px',
            color:'#fff', fontSize:11, fontWeight:600,
          }}>Draft</div>
        )}
      </div>

      <div style={{ padding:'14px 16px', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ fontWeight:600, fontSize:14, color:COLORS.text, marginBottom:4, lineHeight:1.3 }}>
          {v.title}
        </div>
        <div style={{ display:'flex', gap:6, marginBottom:8 }}>
          <span style={{
            background:`${COLORS.accent}15`, color:COLORS.accent,
            borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600,
          }}>{v.subject}</span>
          {v.attachmentUrl && (
            <a
              href={`https://docs.google.com/viewer?url=${encodeURIComponent(v.attachmentUrl)}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                background:'#F0FDF4', color:'#16A34A',
                borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600,
                textDecoration:'none',
              }}
            >PDF</a>
          )}
        </div>
        {v.description && (
          <p style={{ fontSize:12, color:COLORS.muted, margin:'0 0 8px', lineHeight:1.5 }}>
            {v.description.length > 80 ? v.description.slice(0,80)+'…' : v.description}
          </p>
        )}
        <div style={{ marginTop:'auto', display:'flex', alignItems:'center', gap:8, paddingTop:10, borderTop:`1px solid ${COLORS.border}` }}>
          <Eye size={12} color={COLORS.muted}/>
          <span style={{ fontSize:11, color:COLORS.muted }}>{v.views} views</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
            <button onClick={() => onToggle(v._id, v.isPublished)} title={v.isPublished?'Unpublish':'Publish'}
              style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:COLORS.muted }}>
              {v.isPublished ? <ToggleRight size={18} color='#10B981'/> : <ToggleLeft size={18}/>}
            </button>
            <button onClick={() => onEdit(v)}
              style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:COLORS.muted }}>
              <Edit2 size={14}/>
            </button>
            <button onClick={handleDelete} disabled={deleting}
              style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#EF4444' }}>
              {deleting ? <Spinner size={14}/> : <Trash2 size={14}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoLecturesTab({ teacher }) {
  const [videos,     setVideos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(initialForm);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [filterDay,  setFilterDay]  = useState('');
  const [filterSub,  setFilterSub]  = useState('');
  const [uploadPct,  setUploadPct]  = useState(0);
  const videoRef = useRef();
  const attRef   = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const res = await videoAPI.getAll({ subject: filterSub||undefined, day: filterDay||undefined });
      setVideos(res.data.videos);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterDay, filterSub]);

  const openCreate = () => { setEditing(null); setForm(initialForm); setError(''); setShowModal(true); };
  const openEdit   = (v)  => {
    setEditing(v);
    setForm({ title:v.title, description:v.description, subject:v.subject, day:v.day, video:null, attachment:null });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.subject || !form.day) { setError('Title, subject and day are required'); return; }
    if (!editing && !form.video) { setError('Please select a video file'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('title',       form.title);
      fd.append('description', form.description);
      fd.append('subject',     form.subject);
      fd.append('day',         form.day);
      if (form.video)      fd.append('video',      form.video);
      if (form.attachment) fd.append('attachment', form.attachment);

      if (editing) {
        await videoAPI.update(editing._id, fd);
      } else {
        await videoAPI.create(fd, (pct) => setUploadPct(pct));
      }
      setShowModal(false);
      setUploadPct(0);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await videoAPI.remove(id);
    setVideos(prev => prev.filter(v => v._id !== id));
  };

  const handleToggle = async (id, isPublished) => {
    await videoAPI.update(id, { isPublished: !isPublished });
    setVideos(prev => prev.map(v => v._id === id ? { ...v, isPublished: !isPublished } : v));
  };

  const subjects = [...new Set(videos.map(v => v.subject))];

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:COLORS.text }}>Video Lectures</h2>
          <p style={{ margin:'2px 0 0', fontSize:13, color:COLORS.muted }}>{videos.length} video{videos.length!==1?'s':''} uploaded</p>
        </div>
        <button onClick={openCreate} style={{
          display:'flex', alignItems:'center', gap:7,
          background:'linear-gradient(135deg,#8B5CF6,#A78BFA)',
          color:'#fff', border:'none', borderRadius:10,
          padding:'10px 18px', fontWeight:600, fontSize:14, cursor:'pointer',
        }}>
          <Plus size={16}/> Upload Video
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <select value={filterDay} onChange={e=>setFilterDay(e.target.value)}
          style={{ border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'7px 10px', fontSize:13, background:COLORS.card, color:COLORS.text }}>
          <option value="">All Days</option>
          {DAYS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={filterSub} onChange={e=>setFilterSub(e.target.value)}
          style={{ border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'7px 10px', fontSize:13, background:COLORS.card, color:COLORS.text }}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:48 }}><Spinner size={28}/></div>
      ) : videos.length === 0 ? (
        <Empty
          icon={Video}
          title="No videos yet"
          sub="Click 'Upload Video' to add your first lecture"
        />
      ) : (
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
          gap:16,
        }}>
          {videos.map(v => (
            <VideoCard key={v._id} v={v} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle}/>
          ))}
        </div>
      )}

      {/* Upload / Edit Modal */}
      {showModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:1000, padding:16,
        }} onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div style={{
            background:COLORS.card, borderRadius:20, padding:28,
            width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto',
            boxShadow:'0 20px 60px rgba(0,0,0,.2)',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0, fontWeight:700, color:COLORS.text }}>
                {editing ? 'Edit Video' : 'Upload Video Lecture'}
              </h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:COLORS.muted }}>
                <X size={20}/>
              </button>
            </div>

            {error && (
              <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', marginBottom:14, color:'#EF4444', fontSize:13 }}>
                {error}
              </div>
            )}

            {/* Title */}
            <label style={{ display:'block', marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:5 }}>TITLE *</div>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                placeholder="e.g. Introduction to Algebra"
                style={{ width:'100%', border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'9px 12px', fontSize:14, boxSizing:'border-box', color:COLORS.text }}/>
            </label>

            {/* Subject + Day */}
            <div style={{ display:'flex', gap:10, marginBottom:12 }}>
              <label style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:5 }}>SUBJECT *</div>
                <input value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}
                  placeholder="e.g. Mathematics"
                  style={{ width:'100%', border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'9px 12px', fontSize:14, boxSizing:'border-box', color:COLORS.text }}/>
              </label>
              <label style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:5 }}>DAY *</div>
                <select value={form.day} onChange={e=>setForm(f=>({...f,day:e.target.value}))}
                  style={{ width:'100%', border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'9px 12px', fontSize:14, color:COLORS.text }}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </label>
            </div>

            {/* Description */}
            <label style={{ display:'block', marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:5 }}>DESCRIPTION</div>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                rows={3} placeholder="Brief description of this lecture…"
                style={{ width:'100%', border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'9px 12px', fontSize:14, resize:'vertical', boxSizing:'border-box', color:COLORS.text }}/>
            </label>

            {/* Video file */}
            {!editing && (
              <label style={{ display:'block', marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:5 }}>VIDEO FILE * (max 500 MB)</div>
                <div
                  onClick={()=>videoRef.current.click()}
                  style={{
                    border:`2px dashed ${form.video?'#8B5CF6':COLORS.border}`, borderRadius:10,
                    padding:16, textAlign:'center', cursor:'pointer',
                    background: form.video ? '#F5F3FF' : COLORS.bg,
                  }}>
                  <Upload size={20} color={form.video?'#8B5CF6':COLORS.muted} style={{ marginBottom:4 }}/>
                  <div style={{ fontSize:13, color: form.video?'#8B5CF6':COLORS.muted }}>
                    {form.video ? form.video.name : 'Click to select video (MP4, MOV, WebM…)'}
                  </div>
                  <input ref={videoRef} type="file" accept="video/*" style={{ display:'none' }}
                    onChange={e=>setForm(f=>({...f,video:e.target.files[0]||null}))}/>
                </div>
                {uploadPct > 0 && uploadPct < 100 && (
                  <div style={{ marginTop:8, background:COLORS.bg, borderRadius:6, height:6 }}>
                    <div style={{ background:'#8B5CF6', borderRadius:6, height:'100%', width:`${uploadPct}%`, transition:'width .3s' }}/>
                  </div>
                )}
              </label>
            )}

            {/* Attachment */}
            <label style={{ display:'block', marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:5 }}>ATTACHMENT (optional PDF/image)</div>
              <div onClick={()=>attRef.current.click()}
                style={{
                  border:`1px dashed ${form.attachment?'#10B981':COLORS.border}`, borderRadius:10,
                  padding:'10px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                  background: form.attachment ? '#F0FDF4' : COLORS.bg,
                }}>
                <FileText size={16} color={form.attachment?'#10B981':COLORS.muted}/>
                <span style={{ fontSize:13, color:form.attachment?'#10B981':COLORS.muted }}>
                  {form.attachment ? form.attachment.name : 'Attach PDF or image'}
                </span>
                <input ref={attRef} type="file" accept=".pdf,image/*" style={{ display:'none' }}
                  onChange={e=>setForm(f=>({...f,attachment:e.target.files[0]||null}))}/>
              </div>
            </label>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowModal(false)} style={{
                flex:1, padding:'11px 0', borderRadius:10, border:`1px solid ${COLORS.border}`,
                background:COLORS.card, color:COLORS.text, fontWeight:600, cursor:'pointer', fontSize:14,
              }}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} style={{
                flex:2, padding:'11px 0', borderRadius:10, border:'none',
                background:'linear-gradient(135deg,#8B5CF6,#A78BFA)',
                color:'#fff', fontWeight:700, cursor:saving?'not-allowed':'pointer',
                fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? <><Spinner size={16}/> {editing?'Saving…':'Uploading…'}</> : (editing ? 'Save Changes' : 'Upload Lecture')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
