import { useState } from 'react';
import './CodeBlock.css';

/* ═══════════════════════════════════════════════════════
   JAVASCRIPT RUNNER
═══════════════════════════════════════════════════════ */
function runJavaScript(code) {
  const lines = [];
  const fakeConsole = {
    log: (...args) => lines.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
    error: (...args) => lines.push('❌ ' + args.join(' ')),
    warn: (...args) => lines.push('⚠️ ' + args.join(' ')),
    info: (...args) => lines.push('ℹ️ ' + args.join(' ')),
  };
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', code);
    fn(fakeConsole);
    if (lines.length === 0) lines.push('✓ Code ran with no output.');
  } catch (e) {
    lines.push(`❌ ${e.name}: ${e.message}`);
  }
  return lines.join('\n');
}

/* ═══════════════════════════════════════════════════════
   PYTHON RUNNER — Skulpt (in-browser Python 3)
═══════════════════════════════════════════════════════ */
function runPython(code, onOutput, onDone, onError) {
  import('skulpt').then((Sk) => {
    let output = '';
    Sk.configure({
      output: (text) => { output += text; onOutput(output); },
      read: (x) => {
        if (!Sk.builtinFiles?.files[x]) throw new Error(`File not found: '${x}'`);
        return Sk.builtinFiles.files[x];
      },
    });
    Sk.misceval.asyncToPromise(
      () => Sk.importMainWithBody('<stdin>', false, code, true)
    ).then(() => {
      onDone(output || '✓ Code ran with no output.');
    }).catch((err) => {
      onError(`❌ ${err.toString()}`);
    });
  }).catch(() => onError('❌ Failed to load Python engine.'));
}

/* ═══════════════════════════════════════════════════════
   LANGUAGE CONFIG
═══════════════════════════════════════════════════════ */
const LANG_META = {
  python:     { label: 'Python',     dot: '#4584b6', runnable: true,  isPy: true  },
  py:         { label: 'Python',     dot: '#4584b6', runnable: true,  isPy: true  },
  javascript: { label: 'JavaScript', dot: '#f7df1e', runnable: true,  isPy: false },
  js:         { label: 'JavaScript', dot: '#f7df1e', runnable: true,  isPy: false },
  html:       { label: 'HTML',       dot: '#e96228', runnable: false },
  css:        { label: 'CSS',        dot: '#2965f1', runnable: false },
  bash:       { label: 'Bash',       dot: '#89e051', runnable: false },
  shell:      { label: 'Shell',      dot: '#89e051', runnable: false },
  json:       { label: 'JSON',       dot: '#c678dd', runnable: false },
  sql:        { label: 'SQL',        dot: '#ff6b6b', runnable: false },
  text:       { label: 'Text',       dot: '#555555', runnable: false },
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function CodeBlock({ children, className }) {
  const rawCode = String(children).replace(/\n$/, '');

  const langMatch = className?.match(/language-(\w+)/);
  const langKey = langMatch ? langMatch[1].toLowerCase() : 'text';
  const meta = LANG_META[langKey] || { label: langKey.toUpperCase(), dot: '#555', runnable: false };

  const [code, setCode] = useState(rawCode);
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [termOpen, setTermOpen] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRun = () => {
    setIsRunning(true);
    setOutput({ text: '⟳ Executing...', status: 'running' });
    setTermOpen(true);

    if (meta.isPy) {
      runPython(
        code,
        (partial) => setOutput({ text: partial, status: 'running' }),
        (final)   => { setOutput({ text: final, status: 'success' }); setIsRunning(false); },
        (err)     => { setOutput({ text: err,   status: 'error'   }); setIsRunning(false); }
      );
    } else {
      const result = runJavaScript(code);
      setOutput({ text: result, status: result.startsWith('❌') ? 'error' : 'success' });
      setIsRunning(false);
    }
  };

  const handleReset = () => { setCode(rawCode); setOutput(null); };

  return (
    <div className="cb-root">
      {/* ── Header ── */}
      <div className="cb-header">
        <div className="cb-lang-info">
          <span className="cb-lang-dot" style={{ background: meta.dot }} />
          <span className="cb-lang-label">{meta.label}</span>
          {editMode && <span className="cb-edit-badge">✏️ Edit Mode</span>}
        </div>
        <div className="cb-actions">
          {meta.runnable && (
            <button className={`cb-btn cb-run-btn ${isRunning ? 'running' : ''}`} onClick={handleRun} disabled={isRunning}>
              {isRunning ? <><span className="cb-spinner" /> Running…</> : '▶ Run'}
            </button>
          )}
          <button
            className={`cb-btn cb-edit-btn ${editMode ? 'active' : ''}`}
            onClick={() => { setEditMode(e => !e); setOutput(null); }}
            title={editMode ? 'View code' : 'Edit & Practice'}
          >
            {editMode ? '👁 View' : '✏️ Edit'}
          </button>
          <button className="cb-btn cb-copy-btn" onClick={handleCopy}>
            {copied ? '✓ Copied!' : '⎘ Copy'}
          </button>
          {editMode && code !== rawCode && (
            <button className="cb-btn cb-reset-btn" onClick={handleReset} title="Reset to original">
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Code area: static OR editable ── */}
      {editMode ? (
        <div className="cb-editor-wrap">
          <div className="cb-editor-hint">
            💡 You can edit this code freely and click <strong>▶ Run</strong> to test your changes!
          </div>
          <textarea
            className="cb-textarea"
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            rows={Math.min(Math.max(code.split('\n').length + 1, 5), 30)}
          />
        </div>
      ) : (
        <div className="cb-code-view">
          <pre><code>{code}</code></pre>
        </div>
      )}

      {/* ── Neon Terminal ── */}
      {output && (
        <div className={`cb-terminal cb-term-${output.status}`}>
          {/* Terminal titlebar */}
          <div className="cb-term-bar">
            <div className="cb-term-dots">
              <span style={{ background: '#ff5f57' }} />
              <span style={{ background: '#ffbd2e' }} />
              <span style={{ background: '#28c840' }} />
            </div>
            <span className="cb-term-title">
              {output.status === 'running' ? '● EXECUTING'
                : output.status === 'error' ? '✕ RUNTIME ERROR'
                : '✓ OUTPUT'}
            </span>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <button className="cb-term-btn" onClick={() => setTermOpen(o => !o)}>{termOpen ? '▲' : '▼'}</button>
              <button className="cb-term-btn cb-term-close" onClick={() => setOutput(null)}>✕</button>
            </div>
          </div>
          {termOpen && (
            <div className="cb-term-out">
              <pre>{output.text}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── Practice guide banner ── */}
      {!editMode && meta.runnable && !output && (
        <div className="cb-practice-hint">
          <span>💡 Click <strong>✏️ Edit</strong> to modify this code and practice · Click <strong>▶ Run</strong> to execute</span>
        </div>
      )}
    </div>
  );
}
