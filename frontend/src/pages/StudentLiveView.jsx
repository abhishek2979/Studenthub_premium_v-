// frontend/src/pages/StudentLiveView.jsx
import { useState, useEffect } from 'react';
import { Radio, Calendar, Clock, Users, ExternalLink, BookOpen } from 'lucide-react';
import { Spinner, Empty } from '../components/UI';
import { liveAPI } from '../utils/api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const C = {
  bg:'#F8F7F4', card:'#FFFFFF', border:'#E8E4DC',
  text:'#1C1917', muted:'#78716C',
};

const STATUS_STYLE = {
  scheduled: { bg:'#EFF6FF', color:'#3B82F6', dot:'#3B82F6', label:'Scheduled' },
  live:      { bg:'#FEF2F2', color:'#EF4444', dot:'#EF4444', label:'🔴 LIVE NOW' },
  completed: { bg:'#F0FDF4', color:'#16A34A', dot:'#16A34A', label:'Completed'  },
  cancelled: { bg:'#F9FAFB', color:'#9CA3AF', dot:'#9CA3AF', label:'Cancelled'  },
};

function LectureCard({ lecture, onJoin }) {
  const ss = STATUS_STYLE[lecture.status] || STATUS_STYLE.scheduled;
  const isJoinable = lecture.status === 'live' || lecture.status === 'scheduled';
  const scheduledDate = new Date(lecture.scheduledAt);
  const isPast = scheduledDate < new Date() && lecture.status === 'scheduled';

  return (
    <div style={{
      background:C.card, border:`1px solid ${lecture.status==='live' ? '#FECACA' : C.border}`,
      borderRadius:14, padding:18,
      boxShadow: lecture.status==='live' ? '0 0 0 2px rgba(239,68,68,.15)' : 'none',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:6, lineHeight:1.3 }}>
            {lecture.title}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span style={{
              background:'rgba(2,132,199,.1)', color:'#0284C7',
              borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600,
            }}>{lecture.subject}</span>
            <span style={{
              background:ss.bg, color:ss.color,
              borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:700,
              display:'flex', alignItems:'center', gap:4,
            }}>
              {lecture.status === 'live' && (
                <span style={{
                  width:6, height:6, borderRadius:'50%',
                  background:ss.dot, display:'inline-block',
                  animation:'pulse 1.5s infinite',
                }}/>
              )}
              {ss.label}
            </span>
          </div>
        </div>
        {/* Teacher avatar placeholder */}
        <div style={{
          width:38, height:38, borderRadius:10,
          background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontSize:13, fontWeight:700, flexShrink:0,
        }}>
          {lecture.teacher?.name?.slice(0,2).toUpperCase() || 'T'}
        </div>
      </div>

      {/* Meta info */}
      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:C.muted }}>
          <Calendar size={12}/>
          {lecture.day}, {scheduledDate.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:C.muted }}>
          <Clock size={12}/>
          {scheduledDate.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
          {' '}· {lecture.durationMin} min
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:C.muted }}>
          <Users size={12}/>
          {lecture.attendees?.length || 0} joined
        </div>
      </div>

      {lecture.description && (
        <p style={{ margin:'0 0 12px', fontSize:13, color:C.muted, lineHeight:1.5 }}>
          {lecture.description}
        </p>
      )}

      {/* Teacher info */}
      {lecture.teacher?.name && (
        <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>
          By <strong style={{ color:C.text }}>{lecture.teacher.name}</strong>
          {lecture.teacher.subject && ` · ${lecture.teacher.subject}`}
        </div>
      )}

      {/* Join button */}
      {isJoinable && !isPast && (
        <button
          onClick={() => onJoin(lecture)}
          style={{
            display:'flex', alignItems:'center', gap:7,
            background: lecture.status==='live'
              ? 'linear-gradient(135deg,#EF4444,#F97316)'
              : 'linear-gradient(135deg,#0284C7,#0EA5E9)',
            color:'#fff', border:'none', borderRadius:10,
            padding:'10px 18px', fontWeight:700, fontSize:13, cursor:'pointer',
            width:'100%', justifyContent:'center',
          }}
        >
          <ExternalLink size={14}/>
          {lecture.status==='live' ? 'Join Live Now' : 'Open Meeting Link'}
        </button>
      )}
    </div>
  );
}

export default function StudentLiveView({ showNotif }) {
  const [lectures,  setLectures]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filterDay, setFilterDay] = useState('');
  const [filterSt,  setFilterSt]  = useState('');

  const load = () => {
    setLoading(true);
    liveAPI.getAll({ day: filterDay||undefined, status: filterSt||undefined })
      .then(res => setLectures(res.data.lectures))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [filterDay, filterSt]);

  const handleJoin = async (lecture) => {
    try {
      const res = await liveAPI.join(lecture._id);
      window.open(res.data.meetingLink, '_blank');
      load(); // refresh attendance count
    } catch {
      window.open(lecture.meetingLink, '_blank');
    }
  };

  // Group by day, sort upcoming first
  const liveLectures     = lectures.filter(l => l.status === 'live');
  const upcomingLectures = lectures.filter(l => l.status === 'scheduled');
  const pastLectures     = lectures.filter(l => ['completed','cancelled'].includes(l.status));

  const byDay = DAYS.reduce((acc, d) => {
    const group = upcomingLectures.filter(l => l.day === d);
    if (group.length) acc[d] = group;
    return acc;
  }, {});

  const subjects = [...new Set(lectures.map(l => l.subject))].sort();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:700, color:C.text }}>Live Classes</h2>
        <p style={{ margin:0, fontSize:13, color:C.muted }}>
          Join your teacher's live lectures in real time
        </p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <select value={filterDay} onChange={e=>setFilterDay(e.target.value)}
          style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 10px', fontSize:13, background:C.card, color:C.text }}>
          <option value="">All Days</option>
          {DAYS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={filterSt} onChange={e=>setFilterSt(e.target.value)}
          style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 10px', fontSize:13, background:C.card, color:C.text }}>
          <option value="">All Statuses</option>
          <option value="live">🔴 Live Now</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:48 }}><Spinner size={28}/></div>
      ) : lectures.length === 0 ? (
        <Empty icon={Radio} title="No live classes yet" sub="Your teacher will schedule live classes here"/>
      ) : (
        <>
          {/* Live NOW section */}
          {liveLectures.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <div style={{
                display:'flex', alignItems:'center', gap:8, marginBottom:12,
                fontSize:13, fontWeight:700, color:'#EF4444',
              }}>
                <span style={{
                  width:8, height:8, borderRadius:'50%', background:'#EF4444',
                  display:'inline-block',
                }}/>
                LIVE RIGHT NOW
                <div style={{ flex:1, height:1, background:'#FECACA', marginLeft:4 }}/>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {liveLectures.map(l => <LectureCard key={l._id} lecture={l} onJoin={handleJoin}/>)}
              </div>
            </div>
          )}

          {/* Upcoming — grouped by day */}
          {Object.entries(byDay).map(([day, items]) => (
            <div key={day} style={{ marginBottom:24 }}>
              <div style={{
                display:'flex', alignItems:'center', gap:8, marginBottom:12,
                fontSize:13, fontWeight:700, color:C.muted, letterSpacing:'0.5px',
              }}>
                <Calendar size={13}/>
                {day.toUpperCase()}
                <div style={{ flex:1, height:1, background:C.border, marginLeft:4 }}/>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {items.map(l => <LectureCard key={l._id} lecture={l} onJoin={handleJoin}/>)}
              </div>
            </div>
          ))}

          {/* Past lectures */}
          {pastLectures.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{
                display:'flex', alignItems:'center', gap:8, marginBottom:12,
                fontSize:13, fontWeight:700, color:C.muted,
              }}>
                <Clock size={13}/>
                PAST CLASSES
                <div style={{ flex:1, height:1, background:C.border, marginLeft:4 }}/>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {pastLectures.map(l => <LectureCard key={l._id} lecture={l} onJoin={handleJoin}/>)}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
