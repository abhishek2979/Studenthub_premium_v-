import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, HelpCircle, ToggleLeft, ToggleRight, Users, Award, ChevronRight, X } from 'lucide-react';
import { C, Btn, FieldInput, Modal, Spinner, Empty } from '../components/UI';
import { quizAPI } from '../utils/api';

const EMPTY_FORM = { title:'', subject:'', class:'', duration:'10' };
const newQ = () => ({ question:'', options:['','','',''], correct:0 });

export default function QuizTab({ showNotif }) {
  const [quizzes,setQuizzes] = useState([]);
  const [loading,setLoading] = useState(true);
  const [modal,setModal]     = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm]       = useState(EMPTY_FORM);
  const [questions,setQuestions] = useState([newQ()]);
  const [saving,setSaving]   = useState(false);
  const [results,setResults] = useState(null);

  const load = () => {
    setLoading(true);
    quizAPI.getAll().then(r=>setQuizzes(r.data.quizzes)).catch(()=>showNotif('Failed to load quizzes','error')).finally(()=>setLoading(false));
  };
  useEffect(load,[]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setQuestions([newQ()]); setModal(true); };
  const openEdit = q => {
    setEditing(q);
    setForm({title:q.title,subject:q.subject,class:q.class||'',duration:String(q.duration)});
    setQuestions(q.questions.map(qu=>({question:qu.question,options:[...qu.options],correct:qu.correct})));
    setModal(true);
  };

  const save = async () => {
    if(!form.title.trim()||!form.subject) return showNotif('Title and subject required','error');
    for(let i=0;i<questions.length;i++){
      if(!questions[i].question.trim()) return showNotif(`Q${i+1}: enter the question text`,'error');
      if(questions[i].options.some(o=>!o.trim())) return showNotif(`Q${i+1}: fill all 4 options`,'error');
    }
    setSaving(true);
    try {
      const payload={...form,duration:Number(form.duration)||10,questions};
      editing ? await quizAPI.update(editing._id,payload) : await quizAPI.create(payload);
      showNotif(editing?'Quiz updated':'Quiz created','success');
      setModal(false); load();
    } catch(e){showNotif(e.response?.data?.message||'Failed to save','error');}
    finally{setSaving(false);}
  };

  const toggle = async q => {
    try{ const r=await quizAPI.toggle(q._id); showNotif(r.data.message,'success'); load(); }
    catch{showNotif('Failed to toggle','error');}
  };

  const del = async id => {
    if(!window.confirm('Delete this quiz and all student attempts?')) return;
    try{await quizAPI.delete(id);showNotif('Deleted','success');load();}
    catch{showNotif('Failed to delete','error');}
  };

  const viewResults = async q => {
    try{ const r=await quizAPI.getResults(q._id); setResults(r.data); }
    catch{showNotif('Failed to load results','error');}
  };

  const addQ    = () => setQuestions(p=>[...p,newQ()]);
  const removeQ = i => setQuestions(p=>p.filter((_,idx)=>idx!==i));
  const setQ    = (i,k,v) => setQuestions(p=>p.map((q,idx)=>idx===i?{...q,[k]:v}:q));
  const setOpt  = (qi,oi,v) => setQuestions(p=>p.map((q,idx)=>idx===qi?{...q,options:q.options.map((o,j)=>j===oi?v:o)}:q));
  const ff      = (k,v) => setForm(p=>({...p,[k]:v}));

  if(results) return <ResultsView data={results} onBack={()=>{setResults(null);load();}}/>;

  return (
    <div style={{padding:'28px 32px',maxWidth:900}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:28,gap:16,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:600,color:C.text,margin:0,letterSpacing:'-0.4px'}}>Quizzes</h1>
          <p style={{fontSize:13,color:C.text4,margin:'4px 0 0'}}>{quizzes.length} quiz{quizzes.length!==1?'zes':''} · Create and manage online tests</p>
        </div>
        <button onClick={openAdd} style={{display:'flex',alignItems:'center',gap:8,background:C.text,color:'#fff',border:'none',borderRadius:12,padding:'11px 20px',fontWeight:600,fontSize:14,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>
          <Plus size={16}/>New Quiz
        </button>
      </div>

      {loading?<Spinner/>:quizzes.length===0?(
        <Empty icon={HelpCircle} message="No quizzes yet — click New Quiz to create your first test"/>
      ):(
        <div style={{display:'grid',gap:12}}>
          {quizzes.map(q=>(
            <div key={q._id} style={{background:C.card,border:`1px solid ${q.isActive?'#C5D9B0':C.border}`,borderRadius:16,padding:'18px 22px',display:'flex',alignItems:'center',gap:16,transition:'box-shadow .2s'}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.06)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
              <div style={{width:48,height:48,borderRadius:14,background:q.isActive?'#EAF3DE':'#F0EDE9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <HelpCircle size={22} color={q.isActive?'#3B6D11':C.text4}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:5}}>
                  <span style={{fontWeight:600,fontSize:15,color:C.text}}>{q.title}</span>
                  <span style={{fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:20,background:q.isActive?'#EAF3DE':'#EBEBEB',color:q.isActive?'#3B6D11':'#5A5A5A'}}>
                    {q.isActive?'● Live':'○ Draft'}
                  </span>
                  <span style={{fontSize:11,padding:'3px 9px',borderRadius:20,background:'#EAF0FB',color:'#185FA5'}}>{q.subject}</span>
                  {q.class&&<span style={{fontSize:11,padding:'3px 9px',borderRadius:20,background:C.card2,color:C.text4}}>Class {q.class}</span>}
                </div>
                <div style={{display:'flex',gap:16,fontSize:12,color:C.text4}}>
                  <span>{q.questions.length} questions · {q.duration} min</span>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><Users size={11}/>{q.attemptCount||0} attempts</span>
                  {q.attemptCount>0&&<span><Award size={11} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>Avg {q.avgScore||0}%</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                <button onClick={()=>viewResults(q)} style={{fontSize:12,color:C.info,background:'#EAF0FB',border:'none',borderRadius:8,padding:'7px 12px',cursor:'pointer',fontWeight:600}}>Results</button>
                <button onClick={()=>toggle(q)} title={q.isActive?'Unpublish':'Publish'}
                  style={{background:'none',border:'none',cursor:'pointer',color:q.isActive?'#3B6D11':C.text4,display:'flex',alignItems:'center',padding:'4px'}}>
                  {q.isActive?<ToggleRight size={26}/>:<ToggleLeft size={26}/>}
                </button>
                <button onClick={()=>openEdit(q)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:C.text4}}><Edit2 size={14}/></button>
                <button onClick={()=>del(q._id)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:C.danger}}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit Quiz':'New Quiz'} width={640}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <FieldInput label="TITLE" value={form.title} onChange={v=>ff('title',v)} placeholder="e.g. Mid-term Test"/>
          <FieldInput label="SUBJECT" value={form.subject} onChange={v=>ff('subject',v)} placeholder="e.g. Science"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          <FieldInput label="CLASS (optional)" value={form.class} onChange={v=>ff('class',v)} placeholder="e.g. 10A"/>
          <FieldInput label="DURATION (minutes)" value={form.duration} onChange={v=>ff('duration',v)} placeholder="10"/>
        </div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <label style={{fontSize:11,fontWeight:700,color:C.text3,letterSpacing:'0.5px'}}>QUESTIONS ({questions.length})</label>
          <button onClick={addQ} style={{fontSize:12,color:C.accent,background:'none',border:`1px solid ${C.border}`,borderRadius:8,padding:'5px 12px',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:5,fontFamily:"'DM Sans',sans-serif"}}>
            <Plus size={12}/>Add Question
          </button>
        </div>

        <div style={{maxHeight:360,overflowY:'auto',paddingRight:4,marginBottom:20}}>
          {questions.map((q,qi)=>(
            <div key={qi} style={{background:C.card2,borderRadius:12,padding:16,marginBottom:10,border:`1px solid ${C.border}`}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <span style={{fontSize:12,fontWeight:700,color:C.text4}}>Question {qi+1}</span>
                {questions.length>1&&<button onClick={()=>removeQ(qi)} style={{fontSize:11,color:C.danger,background:'none',border:'none',cursor:'pointer',fontWeight:600}}>Remove</button>}
              </div>
              <input value={q.question} onChange={e=>setQ(qi,'question',e.target.value)} placeholder="Enter question text..."
                style={{width:'100%',boxSizing:'border-box',background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:'9px 12px',color:C.text,fontSize:13,outline:'none',fontFamily:"'DM Sans',sans-serif",marginBottom:10}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {q.options.map((opt,oi)=>(
                  <div key={oi} style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="radio" name={`correct-${qi}`} checked={q.correct===oi} onChange={()=>setQ(qi,'correct',oi)}
                      style={{accentColor:C.accent,cursor:'pointer',flexShrink:0,width:16,height:16}} title="Mark as correct"/>
                    <input value={opt} onChange={e=>setOpt(qi,oi,e.target.value)} placeholder={`Option ${String.fromCharCode(65+oi)}`}
                      style={{flex:1,background:q.correct===oi?'#EAF3DE':C.card,border:`1px solid ${q.correct===oi?'#C5D9B0':C.border}`,borderRadius:8,padding:'7px 10px',color:C.text,fontSize:12,outline:'none',fontFamily:"'DM Sans',sans-serif"}}/>
                  </div>
                ))}
              </div>
              <p style={{fontSize:11,color:C.text4,margin:'8px 0 0'}}>Select the radio button next to the correct answer</p>
            </div>
          ))}
        </div>
        <Btn onClick={save} disabled={saving} style={{width:'100%'}}>{saving?'Saving…':editing?'Update Quiz':'Create Quiz'}</Btn>
      </Modal>
    </div>
  );
}

function ResultsView({ data, onBack }) {
  const { quiz, attempts } = data;
  const avg = attempts.length ? Math.round(attempts.reduce((s,a)=>s+a.percentage,0)/attempts.length) : 0;
  return (
    <div style={{padding:'28px 32px',maxWidth:900}}>
      <button onClick={onBack} style={{fontSize:13,color:C.info,background:'none',border:'none',cursor:'pointer',fontWeight:600,marginBottom:20,padding:0,display:'flex',alignItems:'center',gap:6}}>
        ← Back to Quizzes
      </button>
      <h2 style={{fontSize:20,fontWeight:600,color:C.text,marginBottom:6}}>{quiz.title}</h2>
      <p style={{fontSize:13,color:C.text4,marginBottom:24}}>{quiz.subject} · {quiz.questions.length} questions · {quiz.duration} min</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:28}}>
        {[{label:'Total Attempts',value:attempts.length,bg:'#EAF0FB',fg:'#185FA5'},
          {label:'Average Score',value:`${avg}%`,bg:'#EAF3DE',fg:'#3B6D11'},
          {label:'Top Score',value:attempts.length?`${Math.max(...attempts.map(a=>a.percentage))}%`:'—',bg:'#FAEEDA',fg:'#854F0B'}
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:12,padding:'14px 18px',textAlign:'center'}}>
            <div style={{fontSize:26,fontWeight:700,color:s.fg}}>{s.value}</div>
            <div style={{fontSize:12,color:s.fg,opacity:.7,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {attempts.length===0?(
        <Empty icon={Users} message="No students have attempted this quiz yet"/>
      ):(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:C.card2}}>
                {['#','Student','Score','Percentage','Time','Date'].map(h=>(
                  <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:C.text4,letterSpacing:'0.5px',textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attempts.map((a,i)=>(
                <tr key={a._id} style={{borderTop:`1px solid ${C.border}`,background:i%2===0?C.card:C.card2}}>
                  <td style={{padding:'12px 16px',fontSize:13,color:C.text4,fontWeight:600}}>{i+1}</td>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{fontSize:13,color:C.text,fontWeight:600}}>{a.student?.name||'Unknown'}</div>
                    <div style={{fontSize:11,color:C.text4}}>{a.student?.rollNo}</div>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:13,color:C.text}}>{a.score}/{a.total}</td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{fontSize:12,fontWeight:700,padding:'4px 10px',borderRadius:20,background:a.percentage>=75?'#EAF3DE':a.percentage>=50?'#FDF3DC':'#FAEAEA',color:a.percentage>=75?'#3B6D11':a.percentage>=50?'#8A6300':'#9B2020'}}>
                      {a.percentage}%
                    </span>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:12,color:C.text4}}>{Math.floor(a.timeTaken/60)}m {a.timeTaken%60}s</td>
                  <td style={{padding:'12px 16px',fontSize:12,color:C.text4}}>{new Date(a.submittedAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
