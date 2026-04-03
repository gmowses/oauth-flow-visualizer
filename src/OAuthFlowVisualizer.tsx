import { useState } from 'react'
import { Sun, Moon, Languages, Key, ChevronRight, Info } from 'lucide-react'

const translations = {
  en: {
    title: 'OAuth 2.0 Flow Visualizer',
    subtitle: 'Step-by-step visual diagrams of OAuth 2.0 authorization flows.',
    selectFlow: 'Select a flow',
    steps: 'Steps',
    actors: 'Actors',
    notes: 'Notes',
    flows: {
      auth_code: 'Authorization Code',
      pkce: 'Authorization Code + PKCE',
      client_creds: 'Client Credentials',
      implicit: 'Implicit (Deprecated)',
      device: 'Device Code',
    },
    builtBy: 'Built by',
    actor: { client: 'Client App', user: 'User / Browser', authserver: 'Authorization Server', resource: 'Resource Server' },
  },
  pt: {
    title: 'Visualizador de Fluxos OAuth 2.0',
    subtitle: 'Diagramas visuais passo a passo dos fluxos de autorizacao OAuth 2.0.',
    selectFlow: 'Selecione um fluxo',
    steps: 'Passos',
    actors: 'Atores',
    notes: 'Observacoes',
    flows: {
      auth_code: 'Authorization Code',
      pkce: 'Authorization Code + PKCE',
      client_creds: 'Client Credentials',
      implicit: 'Implicit (Obsoleto)',
      device: 'Device Code',
    },
    builtBy: 'Criado por',
    actor: { client: 'App Cliente', user: 'Usuario / Browser', authserver: 'Servidor de Autorizacao', resource: 'Servidor de Recursos' },
  }
} as const

type Lang = keyof typeof translations

type Actor = 'user' | 'client' | 'authserver' | 'resource'

interface Step {
  from: Actor
  to: Actor
  label: string
  detail: string
  color: string
}

interface Flow {
  id: string
  accentColor: string
  warning?: string
  steps: Step[]
  notes: string[]
}

const FLOWS: Record<string, Flow> = {
  auth_code: {
    id: 'auth_code',
    accentColor: 'amber',
    steps: [
      { from: 'user', to: 'client', label: '1. User initiates login', detail: 'User clicks "Login with Provider"', color: 'blue' },
      { from: 'client', to: 'authserver', label: '2. Authorization Request', detail: 'GET /authorize?response_type=code&client_id=...&redirect_uri=...&scope=...&state=...', color: 'amber' },
      { from: 'authserver', to: 'user', label: '3. Login & Consent', detail: 'Auth server shows login form and permission consent screen', color: 'green' },
      { from: 'user', to: 'authserver', label: '4. User authenticates & grants', detail: 'User enters credentials and approves requested scopes', color: 'blue' },
      { from: 'authserver', to: 'client', label: '5. Authorization Code', detail: 'Redirect to redirect_uri?code=AUTH_CODE&state=STATE', color: 'amber' },
      { from: 'client', to: 'authserver', label: '6. Token Request', detail: 'POST /token with code, client_id, client_secret, redirect_uri', color: 'green' },
      { from: 'authserver', to: 'client', label: '7. Access + Refresh Token', detail: '{"access_token":"...", "refresh_token":"...", "expires_in":3600}', color: 'purple' },
      { from: 'client', to: 'resource', label: '8. API Request', detail: 'GET /api/resource\nAuthorization: Bearer ACCESS_TOKEN', color: 'red' },
      { from: 'resource', to: 'client', label: '9. Protected Resource', detail: 'Resource server validates token and returns data', color: 'green' },
    ],
    notes: ['client_secret is kept confidential on the backend', 'state parameter prevents CSRF attacks', 'Use PKCE instead for public clients (SPAs, mobile)'],
  },
  pkce: {
    id: 'pkce',
    accentColor: 'amber',
    steps: [
      { from: 'client', to: 'client', label: '1. Generate code_verifier + code_challenge', detail: 'code_verifier = crypto random (43-128 chars)\ncode_challenge = BASE64URL(SHA256(code_verifier))', color: 'purple' },
      { from: 'user', to: 'client', label: '2. User initiates login', detail: 'User clicks "Login with Provider"', color: 'blue' },
      { from: 'client', to: 'authserver', label: '3. Authorization Request', detail: 'GET /authorize?response_type=code&client_id=...&code_challenge=...&code_challenge_method=S256', color: 'amber' },
      { from: 'authserver', to: 'user', label: '4. Login & Consent', detail: 'Auth server shows login form and consent screen; stores code_challenge', color: 'green' },
      { from: 'user', to: 'authserver', label: '5. User authenticates & grants', detail: 'User enters credentials and approves scopes', color: 'blue' },
      { from: 'authserver', to: 'client', label: '6. Authorization Code', detail: 'Redirect to redirect_uri?code=AUTH_CODE&state=STATE', color: 'amber' },
      { from: 'client', to: 'authserver', label: '7. Token Request', detail: 'POST /token with code, client_id, code_verifier (no client_secret!)', color: 'green' },
      { from: 'authserver', to: 'authserver', label: '8. Verify code_verifier', detail: 'SHA256(code_verifier) must match stored code_challenge', color: 'orange' },
      { from: 'authserver', to: 'client', label: '9. Access + Refresh Token', detail: '{"access_token":"...", "refresh_token":"...", "expires_in":3600}', color: 'purple' },
      { from: 'client', to: 'resource', label: '10. API Request', detail: 'GET /api/resource\nAuthorization: Bearer ACCESS_TOKEN', color: 'red' },
    ],
    notes: ['Recommended for SPAs, mobile and native apps', 'No client_secret required - prevents interception attacks', 'code_challenge_method should always be S256'],
  },
  client_creds: {
    id: 'client_creds',
    accentColor: 'amber',
    steps: [
      { from: 'client', to: 'authserver', label: '1. Token Request', detail: 'POST /token\ngrant_type=client_credentials&client_id=...&client_secret=...&scope=...', color: 'amber' },
      { from: 'authserver', to: 'client', label: '2. Access Token', detail: '{"access_token":"...", "expires_in":3600, "token_type":"Bearer"}\nNo refresh_token', color: 'green' },
      { from: 'client', to: 'resource', label: '3. API Request', detail: 'GET /api/resource\nAuthorization: Bearer ACCESS_TOKEN', color: 'red' },
      { from: 'resource', to: 'client', label: '4. Protected Resource', detail: 'Resource server validates token and returns data', color: 'green' },
    ],
    notes: ['Machine-to-machine (M2M) only - no user context', 'No authorization code or user consent step', 'Client secret must be securely stored', 'Re-request token when expired (no refresh token)'],
  },
  implicit: {
    id: 'implicit',
    accentColor: 'amber',
    warning: 'Deprecated. Access tokens are exposed in the URL fragment. Use Authorization Code + PKCE instead.',
    steps: [
      { from: 'user', to: 'client', label: '1. User initiates login', detail: 'User clicks login', color: 'blue' },
      { from: 'client', to: 'authserver', label: '2. Authorization Request', detail: 'GET /authorize?response_type=token&client_id=...&redirect_uri=...&scope=...', color: 'amber' },
      { from: 'authserver', to: 'user', label: '3. Login & Consent', detail: 'Auth server shows login form and consent screen', color: 'green' },
      { from: 'user', to: 'authserver', label: '4. User authenticates & grants', detail: 'User enters credentials and approves scopes', color: 'blue' },
      { from: 'authserver', to: 'client', label: '5. Access Token in URL fragment', detail: 'Redirect to redirect_uri#access_token=TOKEN&token_type=Bearer&expires_in=3600\nNo refresh_token', color: 'red' },
      { from: 'client', to: 'resource', label: '6. API Request', detail: 'GET /api/resource\nAuthorization: Bearer ACCESS_TOKEN', color: 'red' },
    ],
    notes: ['DEPRECATED - do not use in new applications', 'Token in URL fragment is a security risk', 'No refresh_token issued', 'Replaced by Authorization Code + PKCE'],
  },
  device: {
    id: 'device',
    accentColor: 'amber',
    steps: [
      { from: 'client', to: 'authserver', label: '1. Device Authorization Request', detail: 'POST /device/authorize\nclient_id=...&scope=...', color: 'amber' },
      { from: 'authserver', to: 'client', label: '2. Device Code + User Code', detail: '{"device_code":"...", "user_code":"ABCD-1234", "verification_uri":"https://example.com/device", "expires_in":1800, "interval":5}', color: 'green' },
      { from: 'client', to: 'user', label: '3. Display instructions', detail: 'Show: "Go to https://example.com/device and enter code ABCD-1234"', color: 'blue' },
      { from: 'user', to: 'authserver', label: '4. User enters code on another device', detail: 'User visits URL on phone/computer and enters user_code', color: 'blue' },
      { from: 'authserver', to: 'user', label: '5. Login & Consent', detail: 'Auth server authenticates user and shows consent screen', color: 'green' },
      { from: 'user', to: 'authserver', label: '6. User approves', detail: 'User grants the requested permissions', color: 'blue' },
      { from: 'client', to: 'authserver', label: '7. Polling for token', detail: 'POST /token every {interval} seconds\ngrant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=...', color: 'orange' },
      { from: 'authserver', to: 'client', label: '8. Access + Refresh Token (after user approves)', detail: '{"access_token":"...", "refresh_token":"...", "expires_in":3600}', color: 'purple' },
    ],
    notes: ['For devices with limited input (smart TVs, CLIs, IoT)', 'Client polls the token endpoint while waiting for user', 'Authorization_pending and slow_down errors are normal', 'user_code must be short and easy to type'],
  },
}

const ACTOR_COLORS: Record<Actor, string> = {
  user: 'bg-blue-500',
  client: 'bg-purple-500',
  authserver: 'bg-amber-500',
  resource: 'bg-green-500',
}

const ARROW_COLORS: Record<string, string> = {
  blue: 'border-blue-400 text-blue-600 dark:text-blue-300',
  amber: 'border-amber-400 text-amber-600 dark:text-amber-300',
  green: 'border-green-400 text-green-600 dark:text-green-300',
  purple: 'border-purple-400 text-purple-600 dark:text-purple-300',
  red: 'border-red-400 text-red-600 dark:text-red-300',
  orange: 'border-orange-400 text-orange-600 dark:text-orange-300',
}

export default function OAuthFlowVisualizer() {
  const [lang, setLang] = useState<Lang>(() => navigator.language.startsWith('pt') ? 'pt' : 'en')
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [selectedFlow, setSelectedFlow] = useState<string>('auth_code')

  const t = translations[lang]
  const flow = FLOWS[selectedFlow]

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', dark)
  }

  const actors: Actor[] = ['user', 'client', 'authserver', 'resource']

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Key size={18} className="text-white" />
            </div>
            <span className="font-semibold">OAuth 2.0 Flow Visualizer</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/oauth-flow-visualizer" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          {/* Flow selector */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(FLOWS).map(([id]) => (
              <button key={id} onClick={() => setSelectedFlow(id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedFlow === id ? 'bg-amber-500 border-amber-500 text-white' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                {t.flows[id as keyof typeof t.flows]}
              </button>
            ))}
          </div>

          {/* Warning */}
          {flow.warning && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              <Info size={16} className="shrink-0 mt-0.5" />
              <span>{flow.warning}</span>
            </div>
          )}

          {/* Actors legend */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <h2 className="font-semibold text-sm mb-3">{t.actors}</h2>
            <div className="flex flex-wrap gap-3">
              {actors.map(a => (
                <div key={a} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${ACTOR_COLORS[a]}`}></div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{t.actor[a]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="font-semibold mb-4">{t.steps}</h2>
            <div className="space-y-3">
              {flow.steps.map((step, i) => (
                <div key={i} className={`border rounded-lg p-4 ${ARROW_COLORS[step.color]}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${ACTOR_COLORS[step.from]}`}></div>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t.actor[step.from]}</span>
                    <ChevronRight size={14} className="text-zinc-400" />
                    <div className={`w-2.5 h-2.5 rounded-full ${ACTOR_COLORS[step.to]}`}></div>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t.actor[step.to]}</span>
                  </div>
                  <p className="font-semibold text-sm">{step.label}</p>
                  <pre className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap font-mono">{step.detail}</pre>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <h2 className="font-semibold text-sm mb-3">{t.notes}</h2>
            <ul className="space-y-1.5">
              {flow.notes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-amber-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
