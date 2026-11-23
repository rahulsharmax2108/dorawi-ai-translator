import React, { useState } from 'react';
import { Settings, Check, AlertCircle, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: () => void;
  isKeyConfigured: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
}) => {
  const [keyInput, setKeyInput] = useState(api.getSavedApiKey());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      api.setApiKey(keyInput);
      const health = await api.getHealth();
      setTestResult({ success: true, message: 'Gemini 2.0 Flash API configured successfully!' });
      setTimeout(() => {
        onKeySaved();
        onClose();
      }, 700);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Error updating API key.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    api.setApiKey('');
    setKeyInput('');
    setTestResult({ success: true, message: 'Reset to server-managed environment configuration.' });
    onKeySaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg neu-flat rounded-3xl p-7 text-slate-800 shadow-2xl">
        <button
          onClick={onClose}
          className="neu-btn absolute top-5 right-5 p-2 text-slate-500 hover:text-slate-800 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3.5 neu-pressed text-indigo-600 rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">API & Model Settings</h3>
            <p className="text-xs text-slate-500 font-medium">Google Gemini 2.0 Flash & text-embedding-004</p>
          </div>
        </div>

        <div className="space-y-4 my-5">
          <div className="p-4 neu-pressed rounded-2xl text-xs text-slate-600 leading-relaxed font-medium">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                Optionally supply a custom Google Gemini API Key. It is persisted securely in your browser's <code className="font-bold text-indigo-700">localStorage</code> and transmitted via encrypted headers.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Gemini API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy... (or leave blank to use server .env)"
              className="neu-input w-full px-4 py-3 rounded-2xl text-sm font-mono text-slate-800 placeholder-slate-400"
            />
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                testResult.success
                  ? 'neu-pressed text-emerald-800 border-l-4 border-emerald-500'
                  : 'neu-pressed text-rose-800 border-l-4 border-rose-500'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 font-medium">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold transition"
            >
              Get API key from Google AI Studio <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {keyInput && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-500 hover:text-rose-600 transition font-bold"
              >
                Reset to default
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="neu-btn px-4 py-2.5 text-xs font-bold text-slate-600 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={testing}
            className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
          >
            {testing ? 'Verifying...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};
