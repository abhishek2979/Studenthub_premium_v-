import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, FileText, Clock, AlertTriangle, CheckCircle, Upload, Eye, XCircle, Users, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { C, Btn, FieldInput, Modal, Spinner, Empty } from '../components/UI';
import { assignmentAPI, submissionAPI } from '../utils/api';

const SUBJECTS = ['Math','Science','English','History','Geography','Physics','Chemistry','Biology','Other'];
const EMPTY = { title:'', description:'', subject:'', class:'', dueDate:'', maxMarks:'100' };

function getDueBadge(dueDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(dueDate);
  const diff  = Math.ceil((due-today)/86400000);
  if(diff<0)   return {label:'Overdue',      bg:'#FAEAEA',fg:'#9B2020',icon:'overdue'};
  if(diff===0) return {label:'Due today',    bg:'#FDF3DC',fg:'#8A6300',icon:'today'};
  if(diff<=2)  return {label:`${diff}d left`,bg:'#FDF3DC',fg:'#8A6300',icon:'soon'};
  return              {label:`${diff}d left`,bg:'#EAF3DE',fg:'#3B6D11',icon:'ok'};
}


function SubmissionsPanel({ assignment, showNotif, onClose }) {
  const [subs,setSubs]           = useState([]);
  const [loading,setLoading]     = useState(true);
  const [grading,setGrading]     = useState(null); // submissionId being graded
  const [gradeForm,setGradeForm] = useState({ grade:'', feedback:'' });
  const [saving,setSaving]       = useState(false);

  useEffect(() => {
    submissionAPI.getSubmissions(assignment._id)
      .then(r => setSubs(r.data.submissions))
      .catch(() => showNotif('Failed to load submissions','error'))
      .finally(() => setLoading(false));
  }, [assignment._id]);

  const openGrade = sub => {
    setGrading(sub._id);
    setGradeForm({ grade: sub.grade ?? '', feedback: sub.feedback || '' });
  };

  const saveGrade = async () => {
    if (!gradeForm.grade && gradeForm.grade !== 0) return showNotif('Please enter a grade','error');
    setSaving(true);
    try {
      const r = await submissionAPI.grade(grading, gradeForm);
      setSubs(prev => prev.map(s => s._id === grading ? r.data.submission : s));
      showNotif('Grade saved','success'); setGrading(null);
    } catch(e) { showNotif(e.response?.data?.message || 'Failed to save grade','error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div style={{ background:C.card, borderRadius:20, padding:28, maxWidth:740, width:'100%', maxHeight:'88vh', overflow:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <h2 style={{ fontSize:18, fontWeight:600, color:C.text, margin:0 }}>Student Submissions</h2>
            <p style={{ fontSize:12, color:C.text4, margin:'4px 0 0' }}>{assignment.title}</p>
          </div>
          <button onClick={onClose} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.text3 }}>✕</button>
        </div>

        {loading ? <Spinner/> : subs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:C.text4 }}>
            <Users size={36} style={{ marginBottom:12, opacity:.4 }}/>
            <p style={{ margin:0 }}>No submissions yet</p>
          </div>
        ) : (
          <div style={{ display:'grid', gap:10 }}>
            {subs.map(sub => (
              <div key={sub._id} style={{ background:C.card2, borderRadius:12, padding:'16px 18px', border:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {sub.student?.profilePic
                    ? <img src={sub.student.profilePic} alt="" style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover' }}/>
                    : <div style={{ width:38, height:38, borderRadius:'50%', background:'#EAF0FB', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#185FA5', fontSize:16 }}>{(sub.student?.name||'?')[0].toUpperCase()}</div>
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontWeight:600, fontSize:14, color:C.text }}>{sub.student?.name || 'Student'}</p>
                    <p style={{ margin:0, fontSize:12, color:C.text4 }}>{sub.student?.studentId || sub.student?.email} · Submitted {new Date(sub.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    {sub.grade !== null && sub.grade !== undefined
                      ? <span style={{ background:'#EAF3DE', color:'#3B6D11', borderRadius:8, padding:'4px 12px', fontSize:13, fontWeight:700 }}>{sub.grade}/{assignment.maxMarks}</span>
                      : <span style={{ background:'#FDF3DC', color:'#8A6300', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:500 }}>Ungraded</span>
                    }
                    <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(sub.pdfUrl)}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:'flex', alignItems:'center', gap:4, background:'#EAF0FB', color:'#185FA5', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, textDecoration:'none' }}>
                      <Eye size={12}/> View PDF
                    </a>
                    <button onClick={()=>openGrade(sub)}
                      style={{ display:'flex', alignItems:'center', gap:4, background:C.text, color:'#fff', border:'none', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      <Award size={12}/> {sub.grade != null ? 'Re-grade' : 'Grade'}
                    </button>
                  </div>
                </div>

                {sub.feedback && (
                  <div style={{ marginTop:10, background:C.card, borderRadius:8, padding:'8px 12px' }}>
                    <p style={{ margin:0, fontSize:12, color:C.text3 }}><strong>Feedback:</strong> {sub.feedback}</p>
                  </div>
                )}

                {grading === sub._id && (
                  <div style={{ marginTop:12, padding:'14px', background:C.card, borderRadius:10, border:`1px solid ${C.border}` }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12, marginBottom:10 }}>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.text3, marginBottom:5 }}>GRADE (out of {assignment.maxMarks})</label>
                        <input type="number" min="0" max={assignment.maxMarks} value={gradeForm.grade}
                          onChange={e=>setGradeForm(p=>({...p,grade:e.target.value}))}
                          style={{ width:'100%', boxSizing:'border-box', background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px', color:C.text, fontSize:14, outline:'none', fontFamily:"'DM Sans',sans-serif" }}/>
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.text3, marginBottom:5 }}>FEEDBACK (optional)</label>
                        <input value={gradeForm.feedback} onChange={e=>setGradeForm(p=>({...p,feedback:e.target.value}))}
                          placeholder="Write feedback for student..."
                          style={{ width:'100%', boxSizing:'border-box', background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px', color:C.text, fontSize:14, outline:'none', fontFamily:"'DM Sans',sans-serif" }}/>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={saveGrade} disabled={saving}
                        style={{ background:C.text, color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                        {saving?'Saving…':'Save Grade'}
                      </button>
                      <button onClick={()=>setGrading(null)}
                        style={{ background:C.card2, color:C.text, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


export default function AssignmentsTab({ showNotif }) {
  const [items,setItems]         = useState([]);
  const [loading,setLoading]     = useState(true);
  const [modal,setModal]         = useState(false);
  const [editing,setEditing]     = useState(null);
  const [form,setForm]           = useState(EMPTY);
  const [saving,setSaving]       = useState(false);
  const [expanded,setExpanded]   = useState(null);
  const [pdfFile,setPdfFile]     = useState(null);
  const [removePdf,setRemovePdf] = useState(false);
  const [viewSubs,setViewSubs]   = useState(null); // assignment whose subs we're viewing
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    assignmentAPI.getAll()
      .then(r=>setItems(r.data.assignments))
      .catch(()=>showNotif('Failed to load assignments','error'))
      .finally(()=>setLoading(false));
  };
  useEffect(load, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setPdfFile(null); setRemovePdf(false); setModal(true); };
  const openEdit = a => {
    setEditing(a);
    setForm({ title:a.title, description:a.description||'', subject:a.subject, class:a.class||'', dueDate:a.dueDate, maxMarks:String(a.maxMarks) });
    setPdfFile(null); setRemovePdf(false);
    setModal(true);
  };

  const save = async () => {
    if(!form.title.trim()||!form.subject||!form.dueDate) return showNotif('Title, subject and due date required','error');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k,v));
      if (pdfFile)   fd.append('pdf', pdfFile);
      if (removePdf) fd.append('removePdf','true');
      editing ? await assignmentAPI.update(editing._id, fd) : await assignmentAPI.create(fd);
      showNotif(editing?'Assignment updated':'Assignment created','success');
      setModal(false); load();
    } catch(e){showNotif(e.response?.data?.message||'Failed to save','error');}
    finally{setSaving(false);}
  };

  const del = async id => {
    if(!window.confirm('Delete this assignment?')) return;
    try{await assignmentAPI.delete(id);showNotif('Deleted','success');load();}
    catch{showNotif('Failed to delete','error');}
  };

  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = items.filter(a=>new Date(a.dueDate)>=today);
  const past     = items.filter(a=>new Date(a.dueDate)<today);

  const AssignmentCard = ({a}) => {
    const badge  = getDueBadge(a.dueDate);
    const isOpen = expanded===a._id;
    return (
      <div style={{ background:C.card, border:`1px solid ${badge.icon==='overdue'?'#F0C4C4':badge.icon==='today'?'#F5DFA0':C.border}`, borderRadius:14, overflow:'hidden', marginBottom:10 }}>
        <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14, cursor:'pointer' }} onClick={()=>setExpanded(isOpen?null:a._id)}>
          <div style={{ width:44, height:44, borderRadius:12, background:badge.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <FileText size={18} color={badge.fg}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
              <span style={{ fontWeight:600, fontSize:15, color:C.text }}>{a.title}</span>
              <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:badge.bg, color:badge.fg, display:'flex', alignItems:'center', gap:4 }}>
                <Clock size={10}/>{badge.label}
              </span>
              <span style={{ fontSize:11, fontWeight:500, padding:'3px 9px', borderRadius:20, background:'#EAF0FB', color:'#185FA5' }}>{a.subject}</span>
              {a.class&&<span style={{ fontSize:11, padding:'3px 9px', borderRadius:20, background:C.card2, color:C.text4 }}>Class {a.class}</span>}
              {a.pdfUrl&&<span style={{ fontSize:11, padding:'3px 9px', borderRadius:20, background:'#FFF3E0', color:'#E65100', display:'flex', alignItems:'center', gap:4 }}><FileText size={10}/> PDF</span>}
            </div>
            <p style={{ fontSize:12, color:C.text4, margin:0 }}>
              Due: {new Date(a.dueDate).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})} · Max: {a.maxMarks} marks
            </p>
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setViewSubs(a)} title="View submissions"
              style={{ height:30, borderRadius:8, border:`1px solid ${C.border}`, background:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, padding:'0 10px', color:'#185FA5', fontSize:12, fontWeight:500 }}>
              <Users size={13}/> Submissions
            </button>
            <button onClick={()=>openEdit(a)} style={{ width:30, height:30, borderRadius:8, border:`1px solid ${C.border}`, background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.text4 }}><Edit2 size={13}/></button>
            <button onClick={()=>del(a._id)} style={{ width:30, height:30, borderRadius:8, border:`1px solid ${C.border}`, background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.danger }}><Trash2 size={13}/></button>
          </div>
        </div>
        {isOpen && (
          <div style={{ padding:'0 20px 16px', borderTop:`1px solid ${C.border}` }}>
            {a.description && <p style={{ fontSize:13, color:C.text3, lineHeight:1.7, margin:'12px 0 0', whiteSpace:'pre-wrap' }}>{a.description}</p>}
            {a.pdfUrl && (
              <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:10, background:'#FFF3E0', border:'1px solid #FFCC80', borderRadius:10, padding:'10px 14px' }}>
                <FileText size={16} color="#E65100"/>
                <span style={{ flex:1, fontSize:13, color:'#E65100', fontWeight:500 }}>{a.pdfFileName || 'Assignment PDF'}</span>
                <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(a.pdfUrl)}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:4, background:'#E65100', color:'#fff', borderRadius:7, padding:'6px 14px', fontSize:12, fontWeight:600, textDecoration:'none' }}>
                  <Eye size={12}/> Open
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding:'28px 32px', maxWidth:900 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, gap:16, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:600, color:C.text, margin:0, letterSpacing:'-0.4px' }}>Assignments</h1>
          <p style={{ fontSize:13, color:C.text4, margin:'4px 0 0' }}>{upcoming.length} upcoming · {past.length} past</p>
        </div>
        <button onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:8, background:C.text, color:'#fff', border:'none', borderRadius:12, padding:'11px 20px', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>
          <Plus size={16}/>Add Assignment
        </button>
      </div>

      {items.length>0&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {[
            {label:'Total',value:items.length,bg:'#EAF0FB',fg:'#185FA5'},
            {label:'Upcoming',value:upcoming.length,bg:'#EAF3DE',fg:'#3B6D11'},
            {label:'Overdue',value:items.filter(a=>{const d=new Date(a.dueDate);d.setHours(0,0,0,0);return d<today;}).length,bg:'#FAEAEA',fg:'#9B2020'},
          ].map(s=>(
            <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'14px 18px', textAlign:'center' }}>
              <div style={{ fontSize:26, fontWeight:700, color:s.fg }}>{s.value}</div>
              <div style={{ fontSize:12, color:s.fg, opacity:.7, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading?<Spinner/>:items.length===0?(
        <Empty icon={FileText} message="No assignments yet — click Add Assignment to create one"/>
      ):(
        <>
          {upcoming.length>0&&(
            <>
              <div style={{ fontSize:11, fontWeight:700, color:C.text4, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:10 }}>Upcoming ({upcoming.length})</div>
              {upcoming.map(a=><AssignmentCard key={a._id} a={a}/>)}
            </>
          )}
          {past.length>0&&(
            <>
              <div style={{ fontSize:11, fontWeight:700, color:C.text4, letterSpacing:'0.8px', textTransform:'uppercase', margin:'20px 0 10px' }}>Past ({past.length})</div>
              {past.map(a=><AssignmentCard key={a._id} a={a}/>)}
            </>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit Assignment':'New Assignment'} width={560}>
        <FieldInput label="TITLE" value={form.title} onChange={v=>f('title',v)} placeholder="e.g. Chapter 5 Exercises"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.text3, marginBottom:6, letterSpacing:'0.5px' }}>SUBJECT</label>
            <select value={form.subject} onChange={e=>f('subject',e.target.value)}
              style={{ width:'100%', background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', color:form.subject?C.text:C.text4, fontSize:14, outline:'none', fontFamily:"'DM Sans',sans-serif" }}>
              <option value="">Select subject</option>
              {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <FieldInput label="CLASS (optional)" value={form.class} onChange={v=>f('class',v)} placeholder="e.g. 10A"/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.text3, marginBottom:6, letterSpacing:'0.5px' }}>DUE DATE</label>
            <input type="date" value={form.dueDate} onChange={e=>f('dueDate',e.target.value)}
              style={{ width:'100%', boxSizing:'border-box', background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', color:C.text, fontSize:14, outline:'none', fontFamily:"'DM Sans',sans-serif" }}/>
          </div>
          <FieldInput label="MAX MARKS" value={form.maxMarks} onChange={v=>f('maxMarks',v)} placeholder="100"/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.text3, marginBottom:6, letterSpacing:'0.5px' }}>DESCRIPTION (optional)</label>
          <textarea value={form.description} onChange={e=>f('description',e.target.value)} rows={3} placeholder="Add instructions or details for students..."
            style={{ width:'100%', boxSizing:'border-box', background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', color:C.text, fontSize:14, outline:'none', fontFamily:"'DM Sans',sans-serif", resize:'vertical' }}/>
        </div>

        {/* PDF Upload */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.text3, marginBottom:8, letterSpacing:'0.5px' }}>ATTACH PDF (optional)</label>
          {editing?.pdfUrl && !removePdf && !pdfFile && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#FFF3E0', border:'1px solid #FFCC80', borderRadius:10, padding:'10px 14px', marginBottom:10 }}>
              <FileText size={16} color="#E65100"/>
              <span style={{ flex:1, fontSize:13, color:'#E65100', fontWeight:500 }}>{editing.pdfFileName || 'Current PDF'}</span>
              <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(editing.pdfUrl)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:'#1565C0', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}><Eye size={12}/> View</a>
              <button onClick={()=>setRemovePdf(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9B2020', display:'flex' }}><XCircle size={16}/></button>
            </div>
          )}
          {removePdf && <p style={{ fontSize:12, color:'#9B2020', margin:'0 0 8px' }}>Current PDF will be removed on save.</p>}
          {!pdfFile ? (
            <div onClick={()=>fileRef.current?.click()}
              style={{ border:`2px dashed ${C.border}`, borderRadius:10, padding:'16px', textAlign:'center', cursor:'pointer', background:C.card2 }}>
              <Upload size={20} color={C.text4} style={{ marginBottom:6 }}/>
              <p style={{ fontSize:13, color:C.text4, margin:0 }}>Click to upload a PDF (max 20MB)</p>
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

        <Btn onClick={save} disabled={saving} style={{ width:'100%' }}>{saving?'Saving…':editing?'Update Assignment':'Create Assignment'}</Btn>
      </Modal>

      {/* Submissions panel */}
      {viewSubs && <SubmissionsPanel assignment={viewSubs} showNotif={showNotif} onClose={()=>setViewSubs(null)}/>}
    </div>
  );
}
