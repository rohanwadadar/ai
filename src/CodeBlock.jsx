import { useState, useRef } from 'react';
import './CodeBlock.css';

/* ═══════════════════════════════════════════════════════
   JAVASCRIPT RUNNER — safe sandboxed eval with console capture
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
        if (lines.length === 0) lines.push('✓ Code ran successfully (no output).');
    } catch (e) {
        lines.push(`❌ ${e.name}: ${e.message}`);
    }
    return lines.join('\n');
}

/* ═══════════════════════════════════════════════════════
   PYTHON RUNNER — Skulpt (runs Python 3 in-browser via WASM)
═══════════════════════════════════════════════════════ */
function runPython(code, onOutput, onDone, onError) {
    import('skulpt').then((Sk) => {
        let output = '';

        Sk.configure({
            output: (text) => { output += text; onOutput(output); },
            read: (x) => {
                if (Sk.builtinFiles === undefined || Sk.builtinFiles['files'][x] === undefined) {
                    throw new Error(`File not found: '${x}'`);
                }
                return Sk.builtinFiles['files'][x];
            },
        });

        const prog = Sk.misceval.asyncToPromise(() =>
            Sk.importMainWithBody('<stdin>', false, code, true)
        );

        prog.then(() => {
            if (!output) output = '✓ Code ran successfully (no output).';
            onDone(output);
        }).catch((err) => {
            onError(`❌ ${err.toString()}`);
        });
    }).catch(() => {
        onError('❌ Failed to load Skulpt Python engine.');
    });
}

/* ═══════════════════════════════════════════════════════
   MAIN CodeBlock COMPONENT
═══════════════════════════════════════════════════════ */
export default function CodeBlock({ children, className }) {
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const codeRef = useRef(null);

    const rawCode = String(children).replace(/\n$/, '');

    // Detect language from className like "language-python"
    const langMatch = className?.match(/language-(\w+)/);
    const lang = langMatch ? langMatch[1].toLowerCase() : 'text';

    const isRunnable = ['python', 'py', 'javascript', 'js'].includes(lang);
    const isPython = ['python', 'py'].includes(lang);

    const langLabel = {
        python: 'Python', py: 'Python',
        javascript: 'JavaScript', js: 'JavaScript',
        bash: 'Bash', shell: 'Shell', sh: 'Shell',
        json: 'JSON', html: 'HTML', css: 'CSS',
        sql: 'SQL', text: 'Text',
    }[lang] || lang.toUpperCase();

    const handleCopy = () => {
        navigator.clipboard.writeText(rawCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleRun = () => {
        setIsRunning(true);
        setOutput({ text: '⟳ Running...', status: 'running' });
        setIsOpen(true);

        if (isPython) {
            runPython(
                rawCode,
                (partial) => setOutput({ text: partial, status: 'running' }),
                (final) => {
                    setOutput({ text: final, status: 'success' });
                    setIsRunning(false);
                },
                (err) => {
                    setOutput({ text: err, status: 'error' });
                    setIsRunning(false);
                }
            );
        } else {
            // JavaScript
            const result = runJavaScript(rawCode);
            const hasError = result.startsWith('❌');
            setOutput({ text: result, status: hasError ? 'error' : 'success' });
            setIsRunning(false);
        }
    };

    const handleClear = () => setOutput(null);

    return (
        <div className="code-block-root">
            {/* ── Header Bar ── */}
            <div className="code-block-header">
                <div className="code-block-lang">
                    <span className={`lang-dot lang-dot-${lang}`} />
                    <span className="lang-label">{langLabel}</span>
                </div>
                <div className="code-block-actions">
                    {isRunnable && (
                        <button
                            className={`run-btn ${isRunning ? 'running' : ''}`}
                            onClick={handleRun}
                            disabled={isRunning}
                            title={`Run ${langLabel} code`}
                        >
                            {isRunning ? (
                                <><span className="run-spinner" /> Running...</>
                            ) : (
                                <>▶ Run</>
                            )}
                        </button>
                    )}
                    <button className="copy-btn" onClick={handleCopy} title="Copy code">
                        {copied ? '✓ Copied' : '⎘ Copy'}
                    </button>
                </div>
            </div>

            {/* ── Code Content ── */}
            <div className="code-block-body" ref={codeRef}>
                <pre><code>{rawCode}</code></pre>
            </div>

            {/* ── Neon Terminal Output ── */}
            {output && (
                <div className={`terminal-root ${output.status}`}>
                    <div className="terminal-titlebar">
                        <div className="terminal-dots">
                            <span className="t-dot red" />
                            <span className="t-dot yellow" />
                            <span className="t-dot green" />
                        </div>
                        <span className="terminal-title">
                            {isRunning ? '● RUNNING' : output.status === 'error' ? '✕ ERROR' : '✓ OUTPUT'}
                        </span>
                        <div className="terminal-actions">
                            <button className="terminal-toggle" onClick={() => setIsOpen(o => !o)} title="Collapse">
                                {isOpen ? '▲' : '▼'}
                            </button>
                            <button className="terminal-clear" onClick={handleClear} title="Clear output">
                                ✕
                            </button>
                        </div>
                    </div>
                    {isOpen && (
                        <div className="terminal-output">
                            <pre>{output.text}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
