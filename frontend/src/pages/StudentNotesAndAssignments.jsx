import { useState, useEffect, useRef } from 'react';
import { BookOpen, FileText, Clock, X, ChevronRight, Upload, Eye, XCircle, CheckCircle, Award, AlertTriangle } from 'lucide-react';
import { C, Spinner, Empty } from '../components/UI';
import { noteAPI, assignmentAPI, submissionAPI } from '../utils/api';


export function StudentNotesTab({ showNotif }) {
  const [notes,   setNotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    noteAPI.getAll()
      .then(r => setNotes(r.data.notes))
      .catch(() => showNotif('Failed to load notes', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px 20px', maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>Study Notes</h2>
        <p style={{ fontSize: 13, color: C.text4, margin: '4px 0 0' }}>Notes shared by your teacher</p>
      </div>

      {notes.length > 0 && (
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or subject..."
          style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }} />
      )}

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <Empty icon={BookOpen} title="No notes yet" sub="Your teacher hasn't shared any notes yet" />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(n => (
            <div key={n._id} onClick={() => setViewing(n)}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{n.title}</span>
                    {n.subject && <span style={{ fontSize: 11, background: C.successBg, color: C.successFg, borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>{n.subject}</span>}
                    {n.pdfUrl  && <span style={{ fontSize: 11, background: '#FFF3E0', color: '#E65100', borderRadius: 6, padding: '2px 8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}><FileText size={10}/>PDF</span>}
                  </div>
                  <p style={{ fontSize: 13, color: C.text4, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5 }}>{n.content}</p>
                  <span style={{ fontSize: 11, color: C.text4, marginTop: 8, display: 'block' }}>
                    {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <ChevronRight size={16} color={C.text4} style={{ flexShrink: 0, marginTop: 2 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.card, borderRadius: 16, padding: 28, maxWidth: 620, width: '100%', maxHeight: '80vh', overflow: 'auto', position: 'relative' }}>
            <button onClick={() => setViewing(null)} style={{ position: 'absolute', top: 16, right: 16, background: C.card2, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3 }}>
              <X size={16} />
            </button>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {viewing.subject && <span style={{ fontSize: 11, background: C.successBg, color: C.successFg, borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>{viewing.subject}</span>}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 16 }}>{viewing.title}</h3>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{viewing.content}</p>

            {/* PDF Download / View */}
            {viewing.pdfUrl && (
              <div style={{ marginTop: 20, background: '#FFF3E0', border: '1px solid #FFCC80', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <FileText size={22} color="#E65100"/>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#E65100' }}>PDF Attachment</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#8D4E00' }}>{viewing.pdfFileName || 'note.pdf'}</p>
                </div>
                <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(viewing.pdfUrl)}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E65100', color: '#fff', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  <Eye size={14}/> Open PDF
                </a>
              </div>
            )}

            <p style={{ fontSize: 12, color: C.text4, marginTop: 20 }}>
              {new Date(viewing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


export function StudentAssignmentsTab({ showNotif }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null); // assignment being submitted

  useEffect(() => {
    assignmentAPI.getAll()
      .then(r => setItems(r.data.assignments))
      .catch(() => showNotif('Failed to load assignments', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const today    = new Date(); today.setHours(0,0,0,0);
  const upcoming = items.filter(a => new Date(a.dueDate) >= today);
  const past     = items.filter(a => new Date(a.dueDate) < today);

  return (
    <div style={{ padding: '24px 20px', maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>Assignments</h2>
        <p style={{ fontSize: 13, color: C.text4, margin: '4px 0 0' }}>Homework and assignments from your teacher</p>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <Empty icon={FileText} title="No assignments yet" sub="Your teacher hasn't posted any assignments yet" />
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.text4, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 10 }}>Upcoming ({upcoming.length})</p>
              <AssignmentCards items={upcoming} showNotif={showNotif} onSubmit={setSubmitting} />
            </>
          )}
          {past.length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.text4, letterSpacing: '0.6px', textTransform: 'uppercase', margin: '20px 0 10px' }}>Past ({past.length})</p>
              <AssignmentCards items={past} showNotif={showNotif} onSubmit={setSubmitting} />
            </>
          )}
        </>
      )}

      {submitting && (
        <SubmitModal
          assignment={submitting}
          showNotif={showNotif}
          onClose={() => setSubmitting(null)}
          onSuccess={() => { setSubmitting(null); /* reload to update submission state */ setLoading(true); assignmentAPI.getAll().then(r=>setItems(r.data.assignments)).finally(()=>setLoading(false)); }}
        />
      )}
    </div>
  );
}


function AssignmentCards({ items, showNotif, onSubmit }) {
  const today = new Date(); today.setHours(0,0,0,0);
  // Load submission status for all assignments
  const [submissionMap, setSubmissionMap] = useState({});

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled(
        items.map(a => submissionAPI.getMySubmission(a._id).then(r => ({ id: a._id, sub: r.data.submission })))
      );
      const map = {};
      results.forEach(r => { if (r.status === 'fulfilled') map[r.value.id] = r.value.sub; });
      setSubmissionMap(map);
    };
    if (items.length) load();
  }, [items]);

  return (
    <div style={{ display: 'grid', gap: 10, marginBottom: 4 }}>
      {items.map(a => {
        const due    = new Date(a.dueDate);
        const diff   = Math.ceil((due - today) / 86400000);
        const isOver = diff < 0;
        const badge  = isOver ? { label: 'Overdue', bg: '#FAEAEA', fg: '#9B2020' }
                     : diff === 0 ? { label: 'Due today', bg: '#FDF3DC', fg: '#8A6300' }
                     : diff <= 2  ? { label: `${diff}d left`, bg: '#FDF3DC', fg: '#8A6300' }
                     : { label: `${diff}d left`, bg: C.successBg, fg: C.successFg };
        const sub = submissionMap[a._id];

        return (
          <div key={a._id} style={{ background: C.card, border: `2px solid ${isOver && !sub ? '#FAEAEA' : diff <= 2 && !isOver ? '#FDF3DC' : C.border}`, borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: sub ? '#EAF3DE' : isOver ? '#FAEAEA' : C.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {sub ? <CheckCircle size={20} color="#3B6D11"/> : <FileText size={18} color={isOver ? '#9B2020' : C.accent} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{a.title}</span>
                  <span style={{ fontSize: 11, background: badge.bg, color: badge.fg, borderRadius: 6, padding: '2px 8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={10} />{badge.label}
                  </span>
                  <span style={{ fontSize: 11, background: C.successBg, color: C.successFg, borderRadius: 6, padding: '2px 8px' }}>{a.subject}</span>
                  {a.pdfUrl && <span style={{ fontSize: 11, background: '#FFF3E0', color: '#E65100', borderRadius: 6, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 3 }}><FileText size={10}/>PDF</span>}
                </div>
                {a.description && <p style={{ fontSize: 13, color: C.text3, margin: '0 0 8px', lineHeight: 1.5 }}>{a.description}</p>}
                <p style={{ fontSize: 12, color: C.text4, margin: '0 0 10px' }}>
                  Due: {due.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · Max Marks: {a.maxMarks}
                </p>

                {/* Teacher PDF */}
                {a.pdfUrl && (
                  <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(a.pdfUrl)}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF3E0', border: '1px solid #FFCC80', color: '#E65100', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginBottom: 10 }}>
                    <Eye size={13}/> View Assignment PDF
                  </a>
                )}

                {/* Submission status & grade */}
                {sub ? (
                  <div style={{ background: '#EAF3DE', border: '1px solid #A8D5A2', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <CheckCircle size={14} color="#3B6D11"/>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#3B6D11' }}>Submitted</span>
                      <span style={{ fontSize: 12, color: '#3B6D11', opacity: .7 }}>{new Date(sub.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                      <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(sub.pdfUrl)}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #A8D5A2', color: '#3B6D11', borderRadius: 7, padding: '4px 10px', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginLeft: 'auto' }}>
                        <Eye size={11}/> My PDF
                      </a>
                    </div>
                    {/* Grade display */}
                    {sub.grade !== null && sub.grade !== undefined && (
                      <div style={{ marginTop: 10, padding: '10px 12px', background: '#fff', borderRadius: 8, border: '1px solid #A8D5A2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: sub.feedback ? 6 : 0 }}>
                          <Award size={14} color="#185FA5"/>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Grade: </span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#185FA5' }}>{sub.grade}</span>
                          <span style={{ fontSize: 12, color: C.text4 }}>/ {a.maxMarks}</span>
                        </div>
                        {sub.feedback && <p style={{ margin: 0, fontSize: 13, color: C.text3, lineHeight: 1.5 }}><strong>Feedback:</strong> {sub.feedback}</p>}
                      </div>
                    )}
                    {sub.grade === null && (
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#3B6D11', opacity: .7 }}>Waiting for teacher to grade...</p>
                    )}
                    {/* Re-submit */}
                    <button onClick={() => onSubmit(a)}
                      style={{ marginTop: 8, background: 'none', border: '1px solid #3B6D11', color: '#3B6D11', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500, fontFamily: "'DM Sans',sans-serif" }}>
                      Re-submit
                    </button>
                  </div>
                ) : (
                  <button onClick={() => onSubmit(a)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.text, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                    <Upload size={14}/> Submit Assignment
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function SubmitModal({ assignment, showNotif, onClose, onSuccess }) {
  const [pdfFile,   setPdfFile]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const submit = async () => {
    if (!pdfFile) return showNotif('Please select a PDF file','error');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', pdfFile);
      await submissionAPI.submit(assignment._id, fd);
      showNotif('Assignment submitted successfully!','success');
      onSuccess();
    } catch(e) { showNotif(e.response?.data?.message || 'Upload failed','error'); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 18, padding: 28, maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>Submit Assignment</h2>
        <p style={{ fontSize: 13, color: C.text4, margin: '0 0 22px' }}>{assignment.title} · Max: {assignment.maxMarks} marks</p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: 8, letterSpacing: '0.5px' }}>UPLOAD YOUR PDF</label>
          {!pdfFile ? (
            <div onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${C.border}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: C.card2 }}>
              <Upload size={28} color={C.text4} style={{ marginBottom: 10 }}/>
              <p style={{ fontSize: 14, fontWeight: 500, color: C.text3, margin: '0 0 4px' }}>Click to select your PDF</p>
              <p style={{ fontSize: 12, color: C.text4, margin: 0 }}>Only PDF files accepted · Max 20MB</p>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) setPdfFile(e.target.files[0]); }}/>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#EAF3DE', border: '1px solid #A8D5A2', borderRadius: 12, padding: '14px 18px' }}>
              <FileText size={22} color="#3B6D11"/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#3B6D11', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdfFile.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#3B6D11', opacity: .7 }}>{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => { setPdfFile(null); if(fileRef.current) fileRef.current.value=''; }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B2020', display: 'flex' }}><XCircle size={18}/></button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={submit} disabled={uploading || !pdfFile}
            style={{ flex: 1, background: pdfFile ? C.text : C.card2, color: pdfFile ? '#fff' : C.text4, border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: pdfFile ? 'pointer' : 'default', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {uploading ? 'Uploading…' : <><Upload size={15}/> Submit PDF</>}
          </button>
          <button onClick={onClose}
            style={{ background: C.card2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
