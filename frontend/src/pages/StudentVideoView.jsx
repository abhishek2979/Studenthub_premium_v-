// frontend/src/pages/StudentVideoView.jsx
import { useState, useEffect } from 'react';
import { Video, PlayCircle, Eye, BookOpen, Calendar, Search, X, FileText, ExternalLink } from 'lucide-react';
import { Spinner, Empty } from '../components/UI';
import { videoAPI } from '../utils/api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const C = {
  bg:'#F8F7F4', card:'#FFFFFF', border:'#E8E4DC',
  text:'#1C1917', muted:'#78716C', accent:'#0284C7',
};

function VideoPlayer({ video, onClose }) {
  useEffect(() => {
    videoAPI.view(video._id).catch(() => {});
  }, [video._id]);

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.85)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:1000, padding:16, flexDirection:'column',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:'#000', borderRadius:16, overflow:'hidden',
        width:'100%', maxWidth:900, boxShadow:'0 24px 80px rgba(0,0,0,.5)',
      }}>
        {/* Header */}
        <div style={{
          background:'#111', padding:'12px 16px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:'#F0EDE9' }}>{video.title}</div>
            <div style={{ fontSize:12, color:'rgba(240,237,233,.5)', marginTop:2 }}>
              {video.subject} · {video.day}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,.1)', border:'none', cursor:'pointer',
            borderRadius:8, padding:8, color:'#F0EDE9', display:'flex',
          }}>
            <X size={18}/>
          </button>
        </div>
        {/* Video */}
        <video
          controls
          autoPlay
          style={{ width:'100%', display:'block', maxHeight:'70vh', background:'#000' }}
          src={video.videoUrl}
        />
        {/* Footer */}
        <div style={{
          background:'#111', padding:'12px 16px',
          display:'flex', alignItems:'center', gap:12,
        }}>
          {video.description && (
            <p style={{ margin:0, fontSize:13, color:'rgba(240,237,233,.6)', flex:1 }}>
              {video.description}
            </p>
          )}
          {video.attachmentUrl && (
            <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(video.attachmentUrl)}`} target="_blank" rel="noopener noreferrer"
              style={{
                display:'flex', alignItems:'center', gap:6,
                background:'rgba(255,255,255,.1)', color:'#F0EDE9',
                borderRadius:8, padding:'7px 14px', textDecoration:'none',
                fontSize:13, fontWeight:600, whiteSpace:'nowrap',
              }}>
              <FileText size={14}/> Download Material
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function VideoCard({ v, onPlay }) {
  return (
    <div style={{
      background:C.card, border:`1px solid ${C.border}`,
      borderRadius:14, overflow:'hidden', cursor:'pointer',
      transition:'box-shadow .2s',
    }} onClick={() => onPlay(v)}
      onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
    >
      {/* Thumbnail */}
      <div style={{
        background:'linear-gradient(135deg,#1e1b4b,#312e81)',
        aspectRatio:'16/9', display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative',
      }}>
        {v.thumbnailUrl && (
          <img src={v.thumbnailUrl} alt="" style={{
            width:'100%', height:'100%', objectFit:'cover',
            position:'absolute', inset:0, opacity:0.6,
          }}/>
        )}
        <PlayCircle size={48} color="rgba(255,255,255,.85)" style={{ position:'relative', zIndex:1 }}/>
        <div style={{
          position:'absolute', top:8, right:8, zIndex:1,
          background:'rgba(0,0,0,.6)', borderRadius:6, padding:'2px 8px',
          color:'#fff', fontSize:11, fontWeight:600,
        }}>{v.day}</div>
      </div>
      {/* Info */}
      <div style={{ padding:'12px 14px' }}>
        <div style={{ fontWeight:600, fontSize:14, color:C.text, marginBottom:6, lineHeight:1.3 }}>
          {v.title}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{
            background:`${C.accent}15`, color:C.accent,
            borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600,
          }}>{v.subject}</span>
          <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:C.muted }}>
            <Eye size={11}/>{v.views}
          </span>
        </div>
        {v.description && (
          <p style={{ margin:'8px 0 0', fontSize:12, color:C.muted, lineHeight:1.5 }}>
            {v.description.length > 70 ? v.description.slice(0,70)+'…' : v.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function StudentVideoView({ showNotif }) {
  const [videos,    setVideos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [playing,   setPlaying]   = useState(null);
  const [filterDay, setFilterDay] = useState('');
  const [filterSub, setFilterSub] = useState('');
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    setLoading(true);
    videoAPI.getAll({ day: filterDay||undefined, subject: filterSub||undefined })
      .then(res => setVideos(res.data.videos))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterDay, filterSub]);

  const subjects = [...new Set(videos.map(v => v.subject))].sort();

  const displayed = search.trim()
    ? videos.filter(v =>
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.subject.toLowerCase().includes(search.toLowerCase())
      )
    : videos;

  // Group by subject
  const bySubject = subjects.reduce((acc, sub) => {
    const group = displayed.filter(v => v.subject === sub);
    if (group.length) acc[sub] = group;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:700, color:C.text }}>Video Lectures</h2>
        <p style={{ margin:0, fontSize:13, color:C.muted }}>
          {videos.length} lecture{videos.length!==1?'s':''} available from your teachers
        </p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {/* Search */}
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:C.card, border:`1px solid ${C.border}`, borderRadius:8,
          padding:'7px 12px', flex:1, minWidth:180,
        }}>
          <Search size={14} color={C.muted}/>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search lectures…"
            style={{ border:'none', background:'none', outline:'none', fontSize:13, color:C.text, width:'100%' }}
          />
          {search && (
            <button onClick={()=>setSearch('')}
              style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, padding:0, display:'flex' }}>
              <X size={14}/>
            </button>
          )}
        </div>
        <select value={filterDay} onChange={e=>setFilterDay(e.target.value)}
          style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 10px', fontSize:13, background:C.card, color:C.text }}>
          <option value="">All Days</option>
          {DAYS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={filterSub} onChange={e=>setFilterSub(e.target.value)}
          style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 10px', fontSize:13, background:C.card, color:C.text }}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:48 }}><Spinner size={28}/></div>
      ) : displayed.length === 0 ? (
        <Empty icon={Video} title="No videos available" sub="Your teachers haven't uploaded any lectures yet"/>
      ) : search ? (
        /* Flat grid when searching */
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
          {displayed.map(v => <VideoCard key={v._id} v={v} onPlay={setPlaying}/>)}
        </div>
      ) : (
        /* Grouped by subject */
        Object.entries(bySubject).map(([subject, items]) => (
          <div key={subject} style={{ marginBottom:32 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:8, marginBottom:14,
              fontSize:13, fontWeight:700, color:C.muted, letterSpacing:'0.5px',
            }}>
              <BookOpen size={13}/>
              {subject.toUpperCase()}
              <div style={{ flex:1, height:1, background:C.border, marginLeft:4 }}/>
              <span style={{ fontWeight:400, fontSize:12 }}>{items.length} video{items.length!==1?'s':''}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
              {items.map(v => <VideoCard key={v._id} v={v} onPlay={setPlaying}/>)}
            </div>
          </div>
        ))
      )}

      {/* Player Modal */}
      {playing && <VideoPlayer video={playing} onClose={() => setPlaying(null)}/>}
    </div>
  );
}
