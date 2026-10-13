/**
 * HealthContinuum AI — API Client
 * Uses the FastAPI API proxy; failed authentication never falls back to fake local users.
 */

'use strict';

const API_BASE = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && window.location.origin.startsWith('http'))
  ? `${window.location.origin}/api`
  : 'http://127.0.0.1:8000/api';

let CURRENT_PATIENT_ID = (typeof localStorage !== 'undefined' && localStorage.getItem('hc_patient_id')) || '';

function getActivePatientId() {
  if (typeof window !== 'undefined' && window.PATIENT_ID) return window.PATIENT_ID;
  return CURRENT_PATIENT_ID;
}

function setActivePatientId(id) {
  if (!id) return;
  CURRENT_PATIENT_ID = id;
  if (typeof window !== 'undefined') window.PATIENT_ID = id;
  try { localStorage.setItem('hc_patient_id', id); } catch (e) {}
}

// ─── Base REST fetch fallback ────────────────────────────────────────────────
async function getSupabaseClient() {
  if (!window.HC_SUPABASE_READY) throw new Error("Supabase client has not been initialized.");
  const client = await window.HC_SUPABASE_READY;
  if (!client) throw new Error(window.HC_SUPABASE_ERROR?.message || "Supabase is not configured.");
  return client;
}

async function getSessionToken() {
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data?.session?.access_token || "";
  } catch (error) {
    return "";
  }
}

async function apiFetch(path, options = {}) {
  if (typeof window !== "undefined" && window.DEMO_PREVIEW && path !== "/health") {
    return { success: false, error: { code: "DEMO_PREVIEW_READ_ONLY", message: "This is a read-only synthetic preview. Sign in to use real patient data." } };
  }
  try {
    const token = await getSessionToken();
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers = {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const raw = await res.text();
    let json = {};
    try { json = raw ? JSON.parse(raw) : {}; } catch (_) {
      json = { success: false, error: { code: "INVALID_API_RESPONSE", message: "The server returned an unexpected response." } };
    }
    if (!res.ok) {
      const detail = json?.detail;
      return {
        success: false,
        error: {
          code: detail?.code || json?.error?.code || "API_ERROR",
          message: detail?.message || json?.error?.message || json?.message || `Request failed (${res.status}).`,
        },
      };
    }
    return json;
  } catch (err) {
    console.warn(`[API] REST endpoint unreachable: ${path}`, err);
    return { success: false, error: { code: "NETWORK_ERROR", message: "Unable to reach the API. Check deployment and backend configuration." } };
  }
}

// ─── Unified API functions ───────────────────────────────────────────────────
const API = {
  setActivePatientId,
  getActivePatientId,

  /** GET /health / Backend status */
  health: async () => {
    
    return apiFetch('/health');
  },

  /** Supabase email/phone password sign-in, followed by profile bootstrap. */
  login: async (identifier, password = "", rememberMe = true) => {
    try {
      const client = await getSupabaseClient();
      const clean = String(identifier || "").trim();
      const credentials = clean.includes("@") ? { email: clean, password } : (/^\+?[0-9 ()-]{8,}$/.test(clean) ? { phone: clean.replace(/[ ()-]/g, ""), password } : null);
      if (!credentials) return { success: false, error: { code: "INVALID_IDENTIFIER", message: "Sign in with the email address or phone number linked to your Supabase account." } };
      const { data, error } = await client.auth.signInWithPassword(credentials);
      if (error) return { success: false, error: { code: "INVALID_CREDENTIALS", message: error.message } };
      if (!data?.session?.access_token) return { success: false, error: { code: "NO_SESSION", message: "Supabase did not create a sign-in session." } };
      return await API.bootstrapProfile(data.user?.user_metadata?.full_name || null);
    } catch (error) {
      return { success: false, error: { code: "SUPABASE_AUTH_ERROR", message: error.message || "Supabase sign-in failed." } };
    }
  },

  /** Supabase Auth registration. Email confirmation may be required by project settings. */
  register: async (name, email = "", phone = "", password = "") => {
    try {
      const client = await getSupabaseClient();
      if (!String(email || "").trim()) return { success: false, error: { code: "EMAIL_REQUIRED", message: "Enter an email address to create your account." } };
      if (!password || password.length < 8) return { success: false, error: { code: "WEAK_PASSWORD", message: "Use a passcode with at least 8 characters." } };
      const { data, error } = await client.auth.signUp({
        email: String(email).trim(),
        password,
        options: { data: { full_name: String(name || "").trim(), phone: String(phone || "").trim() || null } },
      });
      if (error) return { success: false, error: { code: "REGISTRATION_FAILED", message: error.message } };
      if (!data?.session?.access_token) {
        return { success: false, error: { code: "EMAIL_CONFIRMATION_REQUIRED", message: "Account created. Verify the link sent to your email, then sign in." } };
      }
      return await API.bootstrapProfile(name);
    } catch (error) {
      return { success: false, error: { code: "SUPABASE_AUTH_ERROR", message: error.message || "Supabase registration failed." } };
    }
  },

  /** Start Google OAuth through Supabase; the configured redirect returns to this app. */
  googleAuth: async () => {
    try {
      const client = await getSupabaseClient();
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) return { success: false, error: { code: "OAUTH_FAILED", message: error.message } };
      return { success: true, redirecting: true };
    } catch (error) {
      return { success: false, error: { code: "OAUTH_NOT_CONFIGURED", message: error.message || "Configure Google OAuth in Supabase first." } };
    }
  },

  bootstrapProfile: async (fullName = null) => {
    const body = fullName ? JSON.stringify({ full_name: fullName }) : JSON.stringify({});
    const res = await apiFetch("/auth/profile", { method: "POST", body });
    if (res?.success && res.data?.patient?.id) setActivePatientId(res.data.patient.id);
    return res;
  },

  restoreSession: async () => {
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client.auth.getSession();
      if (error || !data?.session?.access_token) return null;
      return await API.bootstrapProfile(data.session.user?.user_metadata?.full_name || null);
    } catch (_) {
      return null;
    }
  },

  logout: async () => {
    try {
      const client = await getSupabaseClient();
      await client.auth.signOut();
    } finally {
      try { localStorage.removeItem("hc_patient_id"); } catch (_) {}
      try { localStorage.removeItem("hc_auth_user"); } catch (_) {}
      try { localStorage.removeItem("hc_access_token"); } catch (_) {}
      CURRENT_PATIENT_ID = "";
    }
  },

  /** GET /auth/me; profile data is bound to the verified Supabase session. */
  getCurrentUser: async () => apiFetch("/auth/me"),

  /** GET /patients/{id} */
  getPatient: async (id = getActivePatientId()) => {
    
    return apiFetch(`/patients/${id}`);
  },

  /** GET /patients/{id}/summary */
  getHealthSummary: async (id = getActivePatientId()) => {
    return apiFetch(`/patients/${id}/summary`);
  },

  /** GET /patients/{id}/visits */
  getVisits: async (id = getActivePatientId()) => {
    
    return apiFetch(`/patients/${id}/visits`);
  },

  /** POST /patients/{id}/visits */
  createVisit: async (id = getActivePatientId(), payload = {}) => {
    
    return apiFetch(`/patients/${id}/visits`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** GET /patients/{id}/documents */
  getDocuments: async (id = getActivePatientId(), type = null) =>
    apiFetch(`/patients/${encodeURIComponent(id)}/documents${type ? `?document_type=${encodeURIComponent(type)}` : ""}`),

  /** Upload a real file; the API proxy attaches the Supabase session. */
  uploadDocument: async (id = getActivePatientId(), payload = {}) => {
    if (!id) return { success: false, error: { code: "PATIENT_REQUIRED", message: "Sign in before uploading a medical document." } };
    if (typeof File !== "undefined" && (payload.file instanceof File || payload.file instanceof Blob)) {
      const formData = new FormData();
      formData.append("file", payload.file, payload.file.name || payload.file_name || "document.pdf");
      if (payload.document_type) formData.append("document_type", payload.document_type);
      if (payload.visit_id) formData.append("visit_id", payload.visit_id);
      return apiFetch(`/patients/${encodeURIComponent(id)}/documents/upload`, { method: "POST", body: formData });
    }
    return apiFetch(`/patients/${encodeURIComponent(id)}/documents`, { method: "POST", body: JSON.stringify(payload) });
  },

  /** POST /documents/{id}/review */
  reviewDocument: async (docId, reviewPayload = {}) => {
    return apiFetch(`/documents/${docId}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewPayload),
    });
  },


  /** GET /patients/{id}/medications */
  getMedications: async (id = getActivePatientId(), status = null) => {
    
    return apiFetch(`/patients/${id}/medications${status ? `?status=${status}` : ''}`);
  },

  /** GET /patients/{id}/labs */
  getLabs: async (id = getActivePatientId()) => {
    
    return apiFetch(`/patients/${id}/labs`);
  },

  /** GET /patients/{id}/changes */
  getChanges: (id = getActivePatientId(), reviewStatus = null) =>
    apiFetch(`/patients/${id}/changes${reviewStatus ? `?review_status=${reviewStatus}` : ''}`),

  /** GET /changes/{id} */
  getChange: (changeId) => apiFetch(`/changes/${changeId}`),

  /** GET /changes/{id}/evidence */
  getEvidence: (changeId) => apiFetch(`/changes/${changeId}/evidence`),

  /** GET /patients/{id}/decisions */
  getDecisions: (id = getActivePatientId()) => apiFetch(`/patients/${id}/decisions`),

  /** GET /patients/{id}/decision-memory */
  getDecisionMemory: async (id = getActivePatientId()) => {
    
    return apiFetch(`/patients/${id}/decision-memory`);
  },

  /** POST /doctor-access/generate */
  generateAccessCode: async (payload = {}) => {
    const curId = getActivePatientId();
    
    return apiFetch('/doctor-access/generate', {
      method: 'POST',
      body: JSON.stringify({ patient_id: curId, ...payload }),
    });
  },

  /** POST /doctor-access/verify */
  verifyAccessCode: async (code) => {
    
    return apiFetch('/doctor-access/verify', {
      method: 'POST',
      body: JSON.stringify({ access_code: code }),
    });
  },

  /** POST /doctor-access/approve */
  approveAccess: (accessId) =>
    apiFetch('/doctor-access/approve', {
      method: 'POST',
      body: JSON.stringify({ access_id: accessId }),
    }),

  /** POST /doctor-access/revoke */
  revokeAccess: (accessId) => {
    const curId = getActivePatientId();
    return apiFetch('/doctor-access/revoke', {
      method: 'POST',
      body: JSON.stringify({ access_id: accessId, patient_id: curId }),
    });
  },

  /** POST /patients/{id}/companion/ask (legacy) */
  askCompanion: (query, id = getActivePatientId()) =>
    apiFetch(`/patients/${id}/companion/ask`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  /** POST /patients/{id}/companion/chat (production conversational companion) */
  chatCompanion: (query, id = getActivePatientId(), conversationId = null, language = 'en') =>
    apiFetch(`/patients/${id}/companion/chat`, {
      method: 'POST',
      body: JSON.stringify({
        query,
        conversation_id: conversationId,
        language: language || 'en',
      }),
    }),

  /** GET /patients/{id}/conversations */
  getConversations: (id = getActivePatientId()) =>
    apiFetch(`/patients/${id}/conversations`),

  /** GET /patients/{id}/conversations/{convId}/messages */
  getConversationMessages: (convId, id = getActivePatientId()) =>
    apiFetch(`/patients/${id}/conversations/${convId}/messages`),

  /** POST /doctor-access/generate (Patient generates 20-minute demonstration PIN) */
  generateDemoPin: async (patientId = getActivePatientId(), scopes = ["medical_history", "medications", "reports", "changes", "documents"], doctorName = null) => {
    return apiFetch('/doctor-access/generate', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: patientId,
        requested_scopes: scopes,
        doctor_name: doctorName,
      }),
    });
  },

  /** POST /doctor-access/revoke (Patient or doctor revokes demonstration PIN) */
  revokeDemoPin: async (accessId, patientId = getActivePatientId()) => {
    return apiFetch('/doctor-access/revoke', {
      method: 'POST',
      body: JSON.stringify({
        access_id: accessId,
        patient_id: patientId,
      }),
    });
  },

  /** GET /doctor-access/{patient_id} (List access records for patient) */
  getPatientAccessGrants: async (patientId = getActivePatientId()) => {
    return apiFetch(`/doctor-access/${patientId}`);
  },
};

// ─── Backend availability check ──────────────────────────────────────────────
let backendAvailable = false;

async function checkBackend() {
  const res = await API.health();
  backendAvailable = res?.success === true;
  if (backendAvailable) console.info('[API] Backend REST API connected ✓');
  else console.warn('[API] Backend is unavailable; authenticated features are disabled.');
  return backendAvailable;
}

// Export globally
window.API = API;
window.PATIENT_ID = CURRENT_PATIENT_ID;
window.checkBackend = checkBackend;
window.isBackendAvailable = () => backendAvailable;
