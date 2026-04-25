import { useState, useEffect, useRef } from 'react';
import { HelpCircle, Clock, CheckCircle, XCircle, Award } from 'lucide-react';
import { C, Btn, Spinner, Empty } from '../components/UI';
import { quizAPI } from '../utils/api';


export default function StudentQuizTab({ showNotif }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taking,  setTaking]  = useState(null); // quiz being taken
  const [result,  setResult]  = useState(null); // result after submit

  const load = () => {
    setLoading(true);
    quizAPI.getStudentList()
      .then(r => setQuizzes(r.data.quizzes))
      .catch(() => showNotif('Failed to load quizzes', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startQuiz = async quiz => {
    try {
      const r = await quizAPI.getQuizToTake(quiz._id);
      setTaking(r.data.quiz);
    } catch (e) {
      showNotif(e.response?.data?.message || 'Cannot start quiz', 'error');
    }
  };

  const handleSubmit = async ({ answers, timeTaken }) => {
    try {
      const r = await quizAPI.submitQuiz(taking._id, { answers, timeTaken });
      setResult({ ...r.data, quiz: taking });
      setTaking(null);
      load();
    } catch (e) {
      showNotif(e.response?.data?.message || 'Submit failed', 'error');
    }
  };

  if (taking) return <TakeQuiz quiz={taking} onSubmit={handleSubmit} onCancel={() => setTaking(null)} />;
  if (result)  return <QuizResult data={result} onBack={() => setResult(null)} />;

  return (
    <div style={{ padding: '24px 20px', maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>My Quizzes</h2>
        <p style={{ fontSize: 13, color: C.text4, margin: '4px 0 0' }}>Take online tests assigned by your teacher</p>
      </div>

      {loading ? <Spinner /> : quizzes.length === 0 ? (
        <Empty icon={HelpCircle} title="No quizzes available" sub="Your teacher hasn't published any quizzes yet" />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {quizzes.map(q => (
            <div key={q._id} style={{ background: C.card, border: `1px solid ${q.attempted ? C.border : C.accent}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: q.attempted ? C.successBg : '#EAF0FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {q.attempted ? <CheckCircle size={20} color={C.successFg} /> : <HelpCircle size={20} color={C.info} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{q.title}</span>
                  <span style={{ fontSize: 11, background: '#EAF0FB', color: C.info, borderRadius: 6, padding: '2px 8px' }}>{q.subject}</span>
                </div>
                <div style={{ fontSize: 12, color: C.text4, display: 'flex', gap: 14 }}>
                  <span>{q.questions.length} questions</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />{q.duration} min</span>
                  {q.attempted && <span style={{ color: q.myPct >= 75 ? C.successFg : q.myPct >= 50 ? '#8A6300' : '#9B2020', fontWeight: 600 }}>Your score: {q.myPct}%</span>}
                </div>
              </div>
              {!q.attempted ? (
                <Btn onClick={() => startQuiz(q)} style={{ flexShrink: 0, fontSize: 13 }}>Start Quiz</Btn>
              ) : (
                <span style={{ fontSize: 12, color: C.text4, flexShrink: 0 }}>Completed</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function TakeQuiz({ quiz, onSubmit, onCancel }) {
  const [answers,  setAnswers]  = useState(Array(quiz.questions.length).fill(null));
  const [current,  setCurrent]  = useState(0);
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60);
  const [confirming, setConfirming] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); handleSubmit(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = () => {
    const timeTaken = Math.round((Date.now() - startRef.current) / 1000);
    const finalAnswers = answers.map(a => a === null ? -1 : a);
    onSubmit({ answers: finalAnswers, timeTaken });
  };

  const q = quiz.questions[current];
  const answered = answers.filter(a => a !== null).length;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerColor = timeLeft < 60 ? C.danger : timeLeft < 180 ? '#8A6300' : C.text;

  return (
    <div style={{ padding: '20px', maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16, color: C.text }}>{quiz.title}</div>
          <div style={{ fontSize: 12, color: C.text4 }}>{answered}/{quiz.questions.length} answered</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: timeLeft < 60 ? '#FAEAEA' : C.card2, borderRadius: 10, padding: '8px 16px' }}>
          <Clock size={16} color={timerColor} />
          <span style={{ fontWeight: 700, fontSize: 18, color: timerColor, fontFamily: 'monospace' }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: C.accent, borderRadius: 2, width: `${(current / quiz.questions.length) * 100}%`, transition: 'width .3s' }} />
      </div>

      {/* Question */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.text4, fontWeight: 600, marginBottom: 12 }}>QUESTION {current + 1} OF {quiz.questions.length}</div>
        <p style={{ fontSize: 16, fontWeight: 500, color: C.text, lineHeight: 1.6, marginBottom: 24 }}>{q.question}</p>

        <div style={{ display: 'grid', gap: 10 }}>
          {q.options.map((opt, oi) => {
            const selected = answers[current] === oi;
            return (
              <button key={oi} onClick={() => setAnswers(p => p.map((a, i) => i === current ? oi : a))}
                style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: 10, border: `2px solid ${selected ? C.accent : C.border}`, background: selected ? C.successBg : C.card2, color: selected ? C.successFg : C.text, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: selected ? 600 : 400, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${selected ? C.accent : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: selected ? C.accent : C.text4, flexShrink: 0 }}>
                  {String.fromCharCode(65 + oi)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0}
          style={{ padding: '9px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: current === 0 ? C.text4 : C.text, cursor: current === 0 ? 'default' : 'pointer', fontSize: 13 }}>
          Previous
        </button>

        {/* Question dots */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 300, justifyContent: 'center' }}>
          {quiz.questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${i === current ? C.accent : C.border}`, background: answers[i] !== null ? C.successBg : i === current ? C.accent : C.card2, color: i === current ? '#fff' : answers[i] !== null ? C.successFg : C.text4, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {i + 1}
            </button>
          ))}
        </div>

        {current < quiz.questions.length - 1 ? (
          <button onClick={() => setCurrent(p => Math.min(quiz.questions.length - 1, p + 1))}
            style={{ padding: '9px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.accent, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            Next
          </button>
        ) : (
          <Btn onClick={() => setConfirming(true)} style={{ fontSize: 13 }}>Submit Quiz</Btn>
        )}
      </div>

      {/* Confirm submit */}
      {confirming && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.card, borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 8 }}>Submit Quiz?</h3>
            <p style={{ fontSize: 13, color: C.text4, marginBottom: 20 }}>
              {answered < quiz.questions.length ? `You have ${quiz.questions.length - answered} unanswered questions. ` : ''}
              You cannot change answers after submission.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirming(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card2, color: C.text, cursor: 'pointer', fontSize: 14 }}>Review</button>
              <Btn onClick={handleSubmit} style={{ flex: 1 }}>Submit</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function QuizResult({ data, onBack }) {
  const { score, total, percentage, quiz } = data;
  const grade = percentage >= 90 ? 'Excellent!' : percentage >= 75 ? 'Great job!' : percentage >= 50 ? 'Good effort!' : 'Keep practicing!';
  const color = percentage >= 75 ? C.successFg : percentage >= 50 ? '#8A6300' : C.danger;

  return (
    <div style={{ padding: '24px 20px', maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '36px 28px', marginBottom: 20 }}>
        <Award size={48} color={color} style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>{grade}</h2>
        <div style={{ fontSize: 52, fontWeight: 800, color, marginBottom: 8 }}>{percentage}%</div>
        <p style={{ fontSize: 15, color: C.text3, marginBottom: 24 }}>You scored {score} out of {total}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.successFg }}>{score}</div>
            <div style={{ fontSize: 12, color: C.text4 }}>Correct</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.danger }}>{total - score}</div>
            <div style={{ fontSize: 12, color: C.text4 }}>Wrong</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{total}</div>
            <div style={{ fontSize: 12, color: C.text4 }}>Total</div>
          </div>
        </div>
      </div>
      <Btn onClick={onBack} style={{ width: '100%' }}>Back to Quizzes</Btn>
    </div>
  );
}
