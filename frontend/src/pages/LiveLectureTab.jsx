// frontend/src/pages/LiveLectureTab.jsx
import { useState, useEffect } from 'react';
import { Radio, Plus, Trash2, Edit2, X, ExternalLink, Clock, Users, Calendar, Video } from 'lucide-react';
import { Spinner, Empty } from '../components/UI';
import { liveAPI } from '../utils/api';

const DAYS   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const STATUS = ['scheduled','live','completed','cancelled'];

const COLORS = {
  bg:'#F8F7F4', card:'#FFFFFF', border:'#E8E4DC',
  text:'#1C1917', muted:'#78716C', accent:'#06B6D4',
};

const STATUS_COLORS = {
  scheduled: { bg:'#EFF6FF', color:'#3B82F6', label:'Scheduled' },
  live:      { bg:'#FEF2F2', color:'#EF4444', label:'🔴 LIVE' },
  completed: { bg:'#F0FDF4', color:'#16A34A', label:'Completed' },
  cancelled: { bg:'#F9FAFB', color:'#6B7280', label:'Cancelled' },
};

const initialForm = {
  title:'', description:'', subject:'', day:'Monday',
  scheduledAt:'', durationMin:60, meetingLink:'', meetingId:'', password:'',
};

function LectureCard({ lecture, onEdit, onDelete, onStatusChange }) {
  const sc = STATUS_COLORS[lecture.status] || STATUS_COLORS.scheduled;

  return (
    <div style={{
      background:COLORS.card, border:`1px solid ${COLORS.border}`,
      borderRadius:14, padding:18, display:'flex', flexDirection:'column', gap:12,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:15, color:COLORS.text, marginBottom:4 }}>{lecture.title}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span style={{ background:`${COLORS.accent}15`, color:COLORS.accent, borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600 }}>
              {lecture.subject}
            </span>
            <span style={{ background:sc.bg, color:sc.color, borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:700 }}>
              {sc.label}
            </span>
          </div>
        </div>
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          <button onClick={() => onEdit(lecture)} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:COLORS.muted }}>
            <Edit2 size={14}/>
          </button>
          <button onClick={() => { if(window.confirm('Delete?')) onDelete(lecture._id); }}
            style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#EF4444' }}>
            <Trash2 size={14}/>
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:COLORS.muted }}>
          <Calendar size={12}/>
          {lecture.day}, {new Date(lecture.scheduledAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:COLORS.muted }}>
          <Clock size={12}/>
          {new Date(lecture.scheduledAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
          &nbsp;· {lecture.durationMin} min
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:COLORS.muted }}>
          <Users size={12}/>
          {lecture.attendees?.length || 0} joined
        </div>
      </div>

      {lecture.description && (
        <p style={{ margin:0, fontSize:12, color:COLORS.muted, lineHeight:1.5 }}>{lecture.description}</p>
      )}

      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        {/* Meeting link */}
        <a href={lecture.meetingLink} target="_blank" rel="noopener noreferrer"
          style={{
            display:'flex', alignItems:'center', gap:6,
            background:'linear-gradient(135deg,#06B6D4,#0EA5E9)',
            color:'#fff', borderRadius:8, padding:'7px 14px',
            textDecoration:'none', fontSize:13, fontWeight:600,
          }}>
          <ExternalLink size={13}/> Join Meeting
        </a>

        {/* Status changer */}
        <select value={lecture.status} onChange={e => onStatusChange(lecture._id, e.target.value)}
          style={{
            border:`1px solid ${COLORS.border}`, borderRadius:8,
            padding:'7px 10px', fontSize:12, background:COLORS.card, color:COLORS.text,
          }}>
          {STATUS.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function LiveLectureTab() {
  const [lectures,  setLectures]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(initialForm);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterSt,  setFilterSt]  = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await liveAPI.getAll({ day: filterDay||undefined, status: filterSt||undefined });
      setLectures(res.data.lectures);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterDay, filterSt]);

  const openCreate = () => { setEditing(null); setForm(initialForm); setError(''); setShowModal(true); };
  const openEdit   = (l) => {
    setEditing(l);
    const dt = new Date(l.scheduledAt);
    const localDT = new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
    setForm({
      title:l.title, description:l.description, subject:l.subject, day:l.day,
      scheduledAt:localDT, durationMin:l.durationMin,
      meetingLink:l.meetingLink, meetingId:l.meetingId||'', password:l.password||'',
    });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title||!form.subject||!form.day||!form.scheduledAt||!form.meetingLink) {
      setError('Title, subject, day, date/time and meeting link are required'); return;
    }
    setSaving(true); setError('');
    try {
      if (editing) {
        await liveAPI.update(editing._id, form);
      } else {
        await liveAPI.create(form);
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await liveAPI.remove(id);
    setLectures(prev => prev.filter(l => l._id !== id));
  };

  const handleStatusChange = async (id, status) => {
    await liveAPI.updateStatus(id, { status });
    setLectures(prev => prev.map(l => l._id===id ? {...l, status} : l));
  };

  // Group by day
  const byDay = DAYS.reduce((acc, d) => {
    const group = lectures.filter(l => l.day === d);
    if (group.length) acc[d] = group;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:COLORS.text }}>Live Lectures</h2>
          <p style={{ margin:'2px 0 0', fontSize:13, color:COLORS.muted }}>{lectures.length} lecture{lectures.length!==1?'s':''} scheduled</p>
        </div>
        <button onClick={openCreate} style={{
          display:'flex', alignItems:'center', gap:7,
          background:'linear-gradient(135deg,#06B6D4,#0EA5E9)',
          color:'#fff', border:'none', borderRadius:10,
          padding:'10px 18px', fontWeight:600, fontSize:14, cursor:'pointer',
        }}>
          <Plus size={16}/> Schedule Lecture
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <select value={filterDay} onChange={e=>setFilterDay(e.target.value)}
          style={{ border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'7px 10px', fontSize:13, background:COLORS.card, color:COLORS.text }}>
          <option value="">All Days</option>
          {DAYS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={filterSt} onChange={e=>setFilterSt(e.target.value)}
          style={{ border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'7px 10px', fontSize:13, background:COLORS.card, color:COLORS.text }}>
          <option value="">All Statuses</option>
          {STATUS.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:48 }}><Spinner size={28}/></div>
      ) : lectures.length === 0 ? (
        <Empty
          icon={Radio}
          title="No live lectures yet"
          sub="Schedule your first live class with a meeting link"
        />
      ) : (
        Object.entries(byDay).map(([day, items]) => (
          <div key={day} style={{ marginBottom:28 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:8, marginBottom:12,
              fontSize:13, fontWeight:700, color:COLORS.muted, letterSpacing:'0.5px',
            }}>
              <Calendar size={13}/>
              {day.toUpperCase()}
              <div style={{ flex:1, height:1, background:COLORS.border, marginLeft:4 }}/>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {items.map(l => (
                <LectureCard key={l._id} lecture={l}
                  onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange}/>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal */}
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
                {editing ? 'Edit Lecture' : 'Schedule Live Lecture'}
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

            {[
              { label:'TITLE *', key:'title', placeholder:'e.g. Chapter 5: Quadratic Equations' },
              { label:'SUBJECT *', key:'subject', placeholder:'e.g. Mathematics' },
              { label:'MEETING LINK * (Google Meet / Zoom / Jitsi)', key:'meetingLink', placeholder:'https://meet.google.com/xxx-xxxx-xxx' },
              { label:'MEETING ID', key:'meetingId', placeholder:'Optional meeting ID' },
              { label:'PASSWORD', key:'password', placeholder:'Optional password' },
            ].map(({ label, key, placeholder }) => (
              <label key={key} style={{ display:'block', marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:5 }}>{label}</div>
                <input value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                  placeholder={placeholder}
                  style={{ width:'100%', border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'9px 12px', fontSize:14, boxSizing:'border-box', color:COLORS.text }}/>
              </label>
            ))}

            <div style={{ display:'flex', gap:10, marginBottom:12 }}>
              <label style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:5 }}>DAY *</div>
                <select value={form.day} onChange={e=>setForm(f=>({...f,day:e.target.value}))}
                  style={{ width:'100%', border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'9px 12px', fontSize:14, color:COLORS.text }}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </label>
              <label style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:5 }}>DURATION (min)</div>
                <input type="number" min={15} max={480} value={form.durationMin}
                  onChange={e=>setForm(f=>({...f,durationMin:+e.target.value}))}
                  style={{ width:'100%', border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'9px 12px', fontSize:14, boxSizing:'border-box', color:COLORS.text }}/>
              </label>
            </div>

            <label style={{ display:'block', marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:5 }}>DATE & TIME *</div>
              <input type="datetime-local" value={form.scheduledAt}
                onChange={e=>setForm(f=>({...f,scheduledAt:e.target.value}))}
                style={{ width:'100%', border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'9px 12px', fontSize:14, boxSizing:'border-box', color:COLORS.text }}/>
            </label>

            <label style={{ display:'block', marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:5 }}>DESCRIPTION</div>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                rows={2} placeholder="What will be covered…"
                style={{ width:'100%', border:`1px solid ${COLORS.border}`, borderRadius:8, padding:'9px 12px', fontSize:14, resize:'vertical', boxSizing:'border-box', color:COLORS.text }}/>
            </label>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowModal(false)} style={{
                flex:1, padding:'11px 0', borderRadius:10, border:`1px solid ${COLORS.border}`,
                background:COLORS.card, color:COLORS.text, fontWeight:600, cursor:'pointer', fontSize:14,
              }}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} style={{
                flex:2, padding:'11px 0', borderRadius:10, border:'none',
                background:'linear-gradient(135deg,#06B6D4,#0EA5E9)',
                color:'#fff', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontSize:14,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? <><Spinner size={16}/> Saving…</> : (editing ? 'Save Changes' : 'Schedule')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
