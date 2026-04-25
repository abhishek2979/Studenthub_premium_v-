// frontend/src/pages/PremiumPage.jsx
import { useState, useEffect } from 'react';
import { Crown, Video, Radio, Check, Zap, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { Btn, Spinner, C } from '../components/UI';
import { premiumAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  gold:   '#F59E0B',
  purple: '#8B5CF6',
  green:  '#10B981',
  red:    '#EF4444',
  bg:     '#F8F7F4',
  card:   '#FFFFFF',
  border: '#E8E4DC',
  text:   '#1C1917',
  muted:  '#78716C',
};

function PlanCard({ plan, currentPlan, premiumExpiry, onSelect, loading }) {
  const isPremium2   = plan.id === 'premium2';
  const isActive     = currentPlan === plan.id;
  const isUpgrade    = currentPlan === 'premium1' && isPremium2;
  const accentColor  = isPremium2 ? COLORS.purple : COLORS.gold;

  return (
    <div style={{
      background:   COLORS.card,
      border:       `2px solid ${isActive ? accentColor : COLORS.border}`,
      borderRadius: 16,
      padding:      28,
      flex:         1,
      minWidth:     260,
      maxWidth:     380,
      position:     'relative',
      boxShadow:    isActive ? `0 4px 20px ${accentColor}33` : '0 2px 8px rgba(0,0,0,.06)',
      transition:   'box-shadow .2s',
    }}>
      {isPremium2 && (
        <div style={{
          position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
          background:`linear-gradient(135deg,${COLORS.purple},#A78BFA)`,
          color:'#fff', fontSize:11, fontWeight:700, padding:'4px 14px',
          borderRadius:20, letterSpacing:'0.5px',
        }}>MOST POPULAR</div>
      )}

      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <div style={{
          width:40, height:40, borderRadius:10,
          background:`linear-gradient(135deg,${accentColor}22,${accentColor}44)`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {isPremium2 ? <Radio size={20} color={accentColor}/> : <Video size={20} color={accentColor}/>}
        </div>
        <div>
          <div style={{ fontWeight:700, fontSize:16, color:COLORS.text }}>{plan.name}</div>
          <div style={{ fontSize:12, color:COLORS.muted }}>{plan.tagline}</div>
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <span style={{ fontSize:36, fontWeight:800, color:COLORS.text }}>₹{plan.price}</span>
        <span style={{ color:COLORS.muted, fontSize:14 }}>/month</span>
      </div>

      <ul style={{ listStyle:'none', padding:0, margin:'0 0 24px 0' }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8 }}>
            <Check size={14} color={COLORS.green} style={{ marginTop:2, flexShrink:0 }}/>
            <span style={{ fontSize:13, color:COLORS.text }}>{f}</span>
          </li>
        ))}
      </ul>

      {isActive ? (
        <div style={{
          background:`${COLORS.green}15`, border:`1px solid ${COLORS.green}40`,
          borderRadius:10, padding:'10px 14px', textAlign:'center',
          color:COLORS.green, fontWeight:600, fontSize:13,
        }}>
          ✓ Active until {new Date(premiumExpiry).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
        </div>
      ) : (
        <button
          onClick={() => onSelect(plan.id)}
          disabled={loading}
          style={{
            width:'100%', padding:'12px 0', borderRadius:10, border:'none',
            background:`linear-gradient(135deg,${accentColor},${isPremium2?'#A78BFA':'#FCD34D'})`,
            color:'#fff', fontWeight:700, fontSize:14, cursor: loading?'not-allowed':'pointer',
            opacity: loading ? 0.7 : 1, transition:'opacity .2s',
          }}
        >
          {loading ? <Spinner size={16}/> : isUpgrade ? 'Upgrade to Premium 2' : `Get ${plan.name}`}
        </button>
      )}
    </div>
  );
}

function PaymentModal({ plan, onClose, onSuccess }) {
  const [step, setStep]   = useState('confirm'); // confirm → paying → done
  const [error, setError] = useState('');

  const handlePay = async () => {
    setStep('paying');
    setError('');
    try {
      // 1. Initiate payment (get order ID)
      const initRes = await premiumAPI.initiatePayment({ plan });
      const { orderId, amount, paymentId } = initRes.data;

      
      // const options = {
      //   key: initRes.data.razorpayKeyId,
      //   amount, currency: 'INR', order_id: orderId,
      //   name: 'StudentHub Premium',
      //   handler: async (response) => {
      //     await premiumAPI.verifyPayment({ paymentId, ...response, plan });
      //     onSuccess();
      //   },
      // };
      // new window.Razorpay(options).open();
      // return;
      
      // Mock payment (dev): auto-verify after 1.5s delay
      await new Promise(r => setTimeout(r, 1500));
      await premiumAPI.verifyPayment({
        paymentId,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpayOrderId:   orderId,
        razorpaySignature: 'mock_sig',
        plan,
      });

      setStep('done');
      setTimeout(onSuccess, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
      setStep('confirm');
    }
  };

  const planLabels = { premium1:'Premium 1', premium2:'Premium 2' };
  const planPrices = { premium1: 499, premium2: 999 };

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:1000, padding:16,
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{
        background:COLORS.card, borderRadius:20, padding:32,
        maxWidth:420, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)',
      }}>
        {step === 'done' ? (
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
            <div style={{ fontSize:20, fontWeight:700, color:COLORS.text, marginBottom:8 }}>
              {planLabels[plan]} Activated!
            </div>
            <div style={{ color:COLORS.muted, fontSize:14 }}>Redirecting to your dashboard…</div>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <Crown size={22} color={COLORS.gold}/>
              <div style={{ fontWeight:700, fontSize:18, color:COLORS.text }}>
                Confirm Payment
              </div>
            </div>

            <div style={{
              background:COLORS.bg, borderRadius:12, padding:16, marginBottom:20,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ color:COLORS.muted, fontSize:13 }}>Plan</span>
                <span style={{ fontWeight:600, color:COLORS.text }}>{planLabels[plan]}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ color:COLORS.muted, fontSize:13 }}>Duration</span>
                <span style={{ fontWeight:600, color:COLORS.text }}>1 Month</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', borderTop:`1px solid ${COLORS.border}`, paddingTop:8 }}>
                <span style={{ fontWeight:700, color:COLORS.text }}>Total</span>
                <span style={{ fontWeight:800, fontSize:18, color:COLORS.text }}>₹{planPrices[plan]}</span>
              </div>
            </div>

            {error && (
              <div style={{
                background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10,
                padding:'10px 14px', marginBottom:16, display:'flex', gap:8, alignItems:'center',
                color:COLORS.red, fontSize:13,
              }}>
                <AlertCircle size={14}/> {error}
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} style={{
                flex:1, padding:'12px 0', borderRadius:10,
                border:`1px solid ${COLORS.border}`, background:COLORS.card,
                color:COLORS.text, fontWeight:600, cursor:'pointer', fontSize:14,
              }}>Cancel</button>
              <button onClick={handlePay} disabled={step==='paying'} style={{
                flex:2, padding:'12px 0', borderRadius:10, border:'none',
                background:`linear-gradient(135deg,${COLORS.gold},#FCD34D)`,
                color:'#fff', fontWeight:700, cursor:step==='paying'?'not-allowed':'pointer',
                fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
                {step==='paying'
                  ? <><Spinner size={16}/> Processing…</>
                  : <><CreditCard size={16}/> Pay ₹{planPrices[plan]}</>
                }
              </button>
            </div>

            <div style={{ textAlign:'center', marginTop:14, color:COLORS.muted, fontSize:11 }}>
              <Clock size={10} style={{ verticalAlign:'middle', marginRight:3 }}/>
              Subscription renews monthly · Cancel anytime
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PremiumPage() {
  const { user, setUser } = useAuth();
  const [plans,    setPlans]    = useState([]);
  const [status,   setStatus]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);  // plan id for payment modal

  useEffect(() => {
    Promise.all([premiumAPI.getPlans(), premiumAPI.getStatus()])
      .then(([planRes, statusRes]) => {
        setPlans(planRes.data.plans);
        setStatus(statusRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSuccess = async () => {
    const statusRes = await premiumAPI.getStatus();
    setStatus(statusRes.data);
    setSelected(null);
    // Refresh user in context so sidebar badge updates
    const meRes = await authAPI.getMe();
    setUser(meRes.data.user);
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
      <Spinner size={32}/>
    </div>
  );

  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 16px' }}>
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <div style={{
          width:56, height:56, borderRadius:16,
          background:`linear-gradient(135deg,${COLORS.gold}33,${COLORS.gold}66)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 14px',
        }}>
          <Crown size={28} color={COLORS.gold}/>
        </div>
        <h1 style={{ fontSize:28, fontWeight:800, color:COLORS.text, margin:'0 0 8px' }}>
          Upgrade to Premium
        </h1>
        <p style={{ color:COLORS.muted, fontSize:15, margin:0 }}>
          Unlock video lectures and live classes for your students
        </p>
      </div>

      {/* Current plan badge */}
      {status?.premiumActive && (
        <div style={{
          background:`${COLORS.green}15`, border:`1px solid ${COLORS.green}30`,
          borderRadius:12, padding:'12px 20px', marginBottom:28,
          display:'flex', alignItems:'center', gap:10,
          color:COLORS.green, fontSize:13, fontWeight:600,
        }}>
          <Zap size={16}/>
          You are on <strong>{status.premiumPlan === 'premium2' ? 'Premium 2' : 'Premium 1'}</strong>
          &nbsp;— valid until {new Date(status.premiumExpiry).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display:'flex', gap:20, flexWrap:'wrap', justifyContent:'center' }}>
        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlan={status?.premiumPlan}
            premiumExpiry={status?.premiumExpiry}
            onSelect={setSelected}
            loading={false}
          />
        ))}
      </div>

      {/* FAQ */}
      <div style={{ marginTop:48, background:COLORS.card, borderRadius:16, padding:24, border:`1px solid ${COLORS.border}` }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:COLORS.text, marginBottom:16 }}>Frequently Asked Questions</h3>
        {[
          ['Can I upgrade from Premium 1 to Premium 2?', 'Yes! Pay the difference and your plan upgrades immediately.'],
          ['What video formats are supported?', 'MP4, MOV, AVI, MKV and WebM files up to 500 MB each.'],
          ['How do live lectures work?', 'Schedule a class with a Google Meet / Zoom link. Students see it on their dashboard and can join directly.'],
          ['Is auto-renewal supported?', 'Currently manual renewal. You\'ll get notified before expiry.'],
        ].map(([q,a]) => (
          <div key={q} style={{ marginBottom:14 }}>
            <div style={{ fontWeight:600, fontSize:13, color:COLORS.text, marginBottom:3 }}>{q}</div>
            <div style={{ fontSize:13, color:COLORS.muted }}>{a}</div>
          </div>
        ))}
      </div>

      {/* Payment modal */}
      {selected && (
        <PaymentModal
          plan={selected}
          onClose={() => setSelected(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
