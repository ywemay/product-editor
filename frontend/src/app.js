/* Products Desktop Editor — API client */

async function apiCall(method, url, body) {
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Request failed');
    return data.data;
}

const api = {
    openProduct:        (p) => apiCall('POST', '/api/open', { path: p }),
    saveProduct:        (p, product) => apiCall('POST', '/api/save', { path: p, product }),
    addPrice:           (p, currency, variation, price) => apiCall('POST', '/api/price/add', { path: p, currency, variation, price }),
    getPriceHistory:    (p) => apiCall('POST', '/api/price/history', { path: p }),
    addPhoto:           (p, photoPath) => apiCall('POST', '/api/photo/add', { path: p, photoPath }),
    removePhoto:        (p, index) => apiCall('POST', '/api/photo/remove', { path: p, index }),
    openFileDialog:     () => apiCall('GET', '/api/open-file'),
    saveFileAs:         () => apiCall('GET', '/api/save-file-as'),
};
