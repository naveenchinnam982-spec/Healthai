/**
 * HealthContinuum AI — API Client
 * Uses the FastAPI API proxy; failed authentication never falls back to fake local users.
 */

'use strict';

const API_BASE = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && window.location.origin.startsWith('http'))
  ? `${window.location.origin}/api`
  : 'http://127.0.0.1:8000/api';

let CURRENT_PATIENT_ID = (typeof localStorage !== 'undefined' && localStorage.getItem('hc_patient_id')) || 'pat-ramesh-001';

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
async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(typeof localStorage !== 'undefined' && localStorage.getItem('hc_access_token') ? { Authorization: 'Bearer ' + localStorage.getItem('hc_access_token') } : {}), ...options.headers },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      console.warn(`[API] ${options.method || 'GET'} ${path} → ${res.status}`, json);
    }
    return json;
  } catch (err) {
    console.debug(`[API] REST endpoint unreachable: ${path}`);
    return { success: false, error: { code: 'NETWORK_ERROR', message: err.message } };
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

  /** POST /auth/login — no local/demo token fallback. */
  login: async (identifier, password = '', rememberMe = true) => {
    const res = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password, remember_me: rememberMe }) });
    if (res?.success && res.data?.patient?.id) {
      setActivePatientId(res.data.patient.id);
      try { localStorage.setItem('hc_access_token', res.data.access_token || ''); } catch (e) {}
    }
    return res;
  },

  /** POST /auth/register — no local/demo token fallback. */
  register: async (name, email = '', phone = '', password = '') => {
    const res = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, phone, password }) });
    if (res?.success && res.data?.patient?.id) {
      setActivePatientId(res.data.patient.id);
      try { localStorage.setItem('hc_access_token', res.data.access_token || ''); } catch (e) {}
    }
    return res;
  },

  /** Google auth must use configured Supabase OAuth; never trust a client-supplied email. */
  googleAuth: async () => ({ success: false, error: { code: 'OAUTH_NOT_CONFIGURED', message: 'Google sign-in is not configured yet. Please use email and password.' } }),

  /** GET /auth/me */
  getCurrentUser: async (token) => {
    return apiFetch(`/auth/me${token ? `?token=${encodeURIComponent(token)}` : ''}`);
  },

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
  getDocuments: async (id = getActivePatientId(), type = null) => {
    
    return apiFetch(`/patients/${id}/documents${type ? `?document_type=${type}` : ''}`);
  },

  /** POST /patients/{id}/documents/upload or /patients/{id}/documents */
  uploadDocument: async (id = getActivePatientId(), payload = {}) => {
    // Check if real File object is provided
    if (payload.file instanceof File || payload.file instanceof Blob) {
      try {
        const formData = new FormData();
        formData.append('file', payload.file, payload.file.name || payload.file_name || 'document.pdf');
        formData.append('patient_id', id);
        if (payload.document_type) formData.append('document_type', payload.document_type);
        if (payload.visit_id) formData.append('visit_id', payload.visit_id);

        const res = await fetch(`${API_BASE}/patients/${id}/documents/upload`, {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (json && json.success) return json;
      } catch (err) {
        console.warn('[API] Multipart upload failed, falling back to JSON:', err);
      }
    }

    

    return apiFetch(`/patients/${id}/documents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
