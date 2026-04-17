function getStoredUser() {
    try {
        const raw = localStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function buildHeaders(includeJson = true) {
    const headers = {};
    if (includeJson) {
        headers['Content-Type'] = 'application/json';
    }

    const currentUser = getStoredUser();
    if (currentUser && currentUser.id && currentUser.role) {
        headers['X-User-Id'] = String(currentUser.id);
        headers['X-User-Role'] = String(currentUser.role);
        headers['X-User-Name'] = String(currentUser.username || '');
    }

    return headers;
}

async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: buildHeaders(true)
    };

    if (data !== null && data !== undefined) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        return response.json();
    }

    const text = await response.text();
    return { success: response.ok, message: text };
}

const API = {
    auth: { login: (u, p) => apiCall('/auth/login', 'POST', { username: u, password: p }) },
    users: {
        getAll: () => apiCall('/users'),
        create: (u) => apiCall('/users', 'POST', u),
        update: (id, d) => apiCall(`/users/${id}`, 'PUT', d),
        delete: (id) => apiCall(`/users/${id}`, 'DELETE')
    },
    sections: { getAll: () => apiCall('/sections') },
    problems: {
        getAll: (sid = null) => apiCall(sid ? `/problems?section_id=${sid}` : '/problems'),
        create: (p) => apiCall('/problems', 'POST', p),
        update: (id, d) => apiCall(`/problems/${id}`, 'PUT', d),
        delete: (id) => apiCall(`/problems/${id}`, 'DELETE')
    },
    reports: {
        getAll: () => apiCall('/reports'),
        getMine: () => apiCall('/reports/mine'),
        create: (r) => apiCall('/reports', 'POST', r),
        updateStatus: (id, s) => apiCall(`/reports/${id}/status`, 'PUT', { status: s }),
        delete: (id) => apiCall(`/reports/${id}`, 'DELETE')
    }
};
