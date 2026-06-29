import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { sendToBackground } from '../shared/messages';
import type { UserProfile } from '../shared/types';

const EMPTY_PROFILE: UserProfile = {
  personal: {
    firstName: '', lastName: '', email: '', phone: '',
    location: { city: '', state: '', country: '' },
    linkedIn: '', github: '', portfolio: '',
  },
  experience: [],
  education: [],
  skills: [],
  resumeText: '',
  yearsOfExperience: 0,
};

function Popup() {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    sendToBackground({ type: 'GET_PROFILE' }).then((res) => {
      if (res.type === 'PROFILE' && res.data) setProfile(res.data);
    });
    chrome.storage.local.get('ghost_api_key').then((r) => {
      if (r['ghost_api_key']) setApiKey(r['ghost_api_key'] as string);
    });
  }, []);

  function patch(path: string, value: string) {
    setProfile((prev) => {
      const next = structuredClone(prev);
      const keys = path.split('.');
      let obj: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]!] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]!] = value;
      return next;
    });
    setSaved(false);
  }

  async function save() {
    await Promise.all([
      sendToBackground({ type: 'SET_PROFILE', payload: profile }),
      chrome.storage.local.set({ ghost_api_key: apiKey.trim() }),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.01em' }}>
        Ghost Interface
      </div>

      <Section label="API Key">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#9ca3af', width: '72px', flexShrink: 0 }}>
            Anthropic
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-…"
            style={{
              flex: 1, background: '#1f2937', border: '1px solid #374151',
              borderRadius: '6px', padding: '6px 10px', fontSize: '12px',
              color: '#f9fafb', outline: 'none', fontFamily: 'monospace',
            }}
          />
        </div>
        <div style={{ fontSize: '10px', color: '#4b5563', paddingLeft: '80px' }}>
          Stored locally. Used only for open-ended AI generation.
        </div>
      </Section>

      <Section label="Personal">
        <Row label="First name" value={profile.personal.firstName} onChange={(v) => patch('personal.firstName', v)} />
        <Row label="Last name"  value={profile.personal.lastName}  onChange={(v) => patch('personal.lastName', v)} />
        <Row label="Email"      value={profile.personal.email}     onChange={(v) => patch('personal.email', v)}     type="email" />
        <Row label="Phone"      value={profile.personal.phone}     onChange={(v) => patch('personal.phone', v)}     type="tel" />
        <Row label="City"       value={profile.personal.location.city}    onChange={(v) => patch('personal.location.city', v)} />
        <Row label="State"      value={profile.personal.location.state}   onChange={(v) => patch('personal.location.state', v)} />
        <Row label="Country"    value={profile.personal.location.country} onChange={(v) => patch('personal.location.country', v)} />
        <Row label="LinkedIn"   value={profile.personal.linkedIn}  onChange={(v) => patch('personal.linkedIn', v)} />
        <Row label="GitHub"     value={profile.personal.github}    onChange={(v) => patch('personal.github', v)} />
        <Row label="Portfolio"  value={profile.personal.portfolio} onChange={(v) => patch('personal.portfolio', v)} />
      </Section>

      <Section label="Professional">
        <Row
          label="Years exp"
          value={String(profile.yearsOfExperience || '')}
          onChange={(v) => setProfile((p) => ({ ...p, yearsOfExperience: parseInt(v) || 0 }))}
          type="number"
        />
        <SkillsRow
          value={profile.skills}
          onChange={(skills) => setProfile((p) => ({ ...p, skills }))}
        />
      </Section>

      <Section label="Resume text">
        <textarea
          value={profile.resumeText}
          onChange={(e) => setProfile((p) => ({ ...p, resumeText: e.target.value }))}
          placeholder="Paste your resume text here — used for skill matching and open-ended answers"
          rows={6}
          style={{
            width: '100%', background: '#1f2937', border: '1px solid #374151',
            borderRadius: '6px', padding: '8px 10px', fontSize: '11px',
            color: '#f9fafb', resize: 'vertical', fontFamily: 'system-ui, sans-serif',
            lineHeight: 1.5, boxSizing: 'border-box',
          }}
        />
      </Section>

      <button
        onClick={save}
        style={{
          background: saved ? '#22c55e' : '#2563eb',
          color: '#fff', border: 'none', borderRadius: '8px',
          padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          transition: 'background 200ms',
        }}
      >
        {saved ? 'Saved ✓' : 'Save Profile'}
      </button>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '12px', color: '#9ca3af', width: '72px', flexShrink: 0 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, background: '#1f2937', border: '1px solid #374151',
          borderRadius: '6px', padding: '6px 10px', fontSize: '12px',
          color: '#f9fafb', outline: 'none',
        }}
      />
    </div>
  );
}

function SkillsRow({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');

  function addSkill() {
    const trimmed = input.trim();
    if (!trimmed || value.includes(trimmed)) { setInput(''); return; }
    onChange([...value, trimmed]);
    setInput('');
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); } }}
          placeholder="TypeScript, React… press Enter"
          style={{
            flex: 1, background: '#1f2937', border: '1px solid #374151',
            borderRadius: '6px', padding: '6px 10px', fontSize: '12px',
            color: '#f9fafb', outline: 'none',
          }}
        />
        <button
          onClick={addSkill}
          style={{
            background: '#2563eb', color: '#fff', border: 'none',
            borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer',
          }}
        >+</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {value.map((skill) => (
          <span
            key={skill}
            style={{
              background: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb44',
              borderRadius: '10px', fontSize: '11px', padding: '2px 8px',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            {skill}
            <button
              onClick={() => onChange(value.filter((s) => s !== skill))}
              style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '11px', padding: 0, lineHeight: 1 }}
            >✕</button>
          </span>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
