/* Products Desktop Editor — Editor logic
 * 4-tab editor: Photos, Variations, Prices, Description
 * Opens a single .prod file.
 */

var state = {
    filepath: null,
    product: null,
    activeTab: 'photos',
    priceHistory: [],
    loading: false,
    error: '',
    success: '',
    modified: false,
};

function setState(updates) {
    Object.assign(state, updates);
    render();
}

function escapeHtml(s) {
    if (typeof s !== 'string') return s;
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ========================================================================
// INIT
// ========================================================================

document.addEventListener('DOMContentLoaded', function() {
    bindEvents();
    render();
    // Check if launched with a .prod file from argv (file association)
    checkLaunchFile();
});

async function checkLaunchFile() {
    try {
        var data = await fetch('/api/launch-file').then(function(r) { return r.json(); });
        if (data && data.data && data.data.path) {
            openProductFile(data.data.path);
        }
    } catch (err) {
        // silent
    }
}

function bindEvents() {
    // Open file buttons
    document.getElementById('btn-open-file').addEventListener('click', function() {
        openFilePicker();
    });
    document.getElementById('btn-open-file-dialog').addEventListener('click', function() {
        openFileDialog();
    });

    // Top bar actions
    document.getElementById('btn-close-file').addEventListener('click', handleCloseFile);
    document.getElementById('btn-save').addEventListener('click', handleSave);
    document.getElementById('btn-save-as').addEventListener('click', handleSaveAs);

    // Tab switching
    document.getElementById('tabs').addEventListener('click', function(e) {
        var btn = e.target.closest('.tab-btn');
        if (!btn) return;
        var tab = btn.dataset.tab;
        if (tab && tab !== state.activeTab) {
            setState({ activeTab: tab });
        }
    });

    // Drag & drop
    document.body.addEventListener('dragover', function(e) { e.preventDefault(); });
    document.body.addEventListener('drop', function(e) {
        e.preventDefault();
        var files = e.dataTransfer.files;
        if (files && files.length > 0) {
            var path = files[0].path;
            if (path.endsWith('.prod')) {
                openProductFile(path);
            }
        }
    });
}

// ========================================================================
// FILE OPERATIONS
// ========================================================================

async function openFilePicker() {
    try {
        var result = await api.openFileDialog();
        if (result && result.path) {
            openProductFile(result.path);
        }
    } catch (err) {
        setState({ error: 'Failed to open file dialog: ' + err.message });
    }
}

async function openFileDialog() {
    openFilePicker();
}

async function openProductFile(filepath) {
    setState({ loading: true, error: '' });
    try {
        var product = await api.openProduct(filepath);
        var history = await api.getPriceHistory(filepath);
        // Ensure variation_groups exists
        if (!product.variation_groups) {
            product.variation_groups = [];
        }
        setState({
            filepath: filepath,
            product: product,
            priceHistory: history || [],
            loading: false,
            modified: false,
            activeTab: 'photos',
        });
    } catch (err) {
        setState({ loading: false, error: 'Failed to open file: ' + err.message });
    }
}

function handleCloseFile() {
    if (state.modified) {
        if (!confirm('You have unsaved changes. Close anyway?')) return;
    }
    setState({ filepath: null, product: null, priceHistory: [], modified: false });
}

async function handleSave() {
    if (!state.filepath || !state.product) return;
    try {
        var product = state.product;
        var result = await api.saveProduct(state.filepath, {
            title: product.title,
            code: product.code,
            description: product.description,
            variation_groups: product.variation_groups,
        });
        setState({ product: result, modified: false, success: '✅ Saved' });
    } catch (err) {
        setState({ error: 'Save failed: ' + err.message });
    }
}

async function handleSaveAs() {
    try {
        var result = await api.saveFileAs();
    } catch (err) {
        setState({ error: 'Save As failed: ' + err.message });
        return;
    }
    if (!result || !result.path) return;
    // Future: implement copy + save to new path
    setState({ success: 'Save As dialog closed' });
}

// ========================================================================
// RENDER
// ========================================================================

function render() {
    var startPage = document.getElementById('start-page');
    var editorView = document.getElementById('editor-view');
    var errorEl = document.getElementById('app-error');

    if (state.filepath && state.product) {
        startPage.style.display = 'none';
        editorView.style.display = 'flex';
        renderTopBar();
        renderTabs();
        renderActiveTab();
    } else {
        startPage.style.display = 'flex';
        editorView.style.display = 'none';
        // Show error on start page if any
        var startError = document.getElementById('start-error');
        if (!startError) {
            startError = document.createElement('p');
            startError.id = 'start-error';
            startError.style.cssText = 'color:var(--accent-red);font-size:13px';
            document.getElementById('start-page').appendChild(startError);
        }
        startError.textContent = state.error || '';
        if (state.error) {
            setTimeout(function() { setState({ error: '' }); }, 3000);
        }
    }
}

function renderTopBar() {
    var p = state.product;
    if (!p) return;
    var filename = state.filepath.split('/').pop() || state.filepath;
    document.getElementById('editor-filename').textContent = filename;
    var modEl = document.getElementById('editor-modified');
    modEl.style.display = state.modified ? '' : 'none';
    document.getElementById('editor-icon').textContent = p.photos && p.photos.length > 0 ? '' : '📦';
    var successEl = document.getElementById('editor-success');
    if (state.success) {
        if (!successEl) {
            successEl = document.createElement('span');
            successEl.id = 'editor-success';
            successEl.style.cssText = 'font-size:11px;color:var(--accent-green);margin-right:8px';
            document.getElementById('editor-topbar').insertBefore(
                successEl, document.getElementById('btn-close-file')
            );
        }
        successEl.textContent = state.success;
        setTimeout(function() { if (state.success) setState({ success: '' }); }, 3000);
    } else if (successEl) {
        successEl.textContent = '';
    }
}

function renderTabs() {
    var tabsEl = document.getElementById('tabs');
    tabsEl.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
    });
}

function renderActiveTab() {
    var container = document.getElementById('tab-content');
    if (state.activeTab === 'photos') renderPhotosTab(container);
    else if (state.activeTab === 'variations') renderVariationsTab(container);
    else if (state.activeTab === 'prices') renderPricesTab(container);
    else if (state.activeTab === 'description') renderDescriptionTab(container);
}

// ========================================================================
// PHOTOS TAB
// ========================================================================

function renderPhotosTab(container) {
    var p = state.product;
    if (!p) return;

    var html = '<div class="photo-grid">';
    if (p.photos && p.photos.length > 0) {
        p.photos.forEach(function(photo, idx) {
            html += '<div class="photo-item" data-photo-index="' + idx + '">';
            html += '<img src="' + photo + '" alt="Photo ' + (idx + 1) + '" loading="lazy">';
            html += '<button class="remove-btn" data-action="remove-photo" data-index="' + idx + '" title="Remove photo">✕</button>';
            html += '</div>';
        });
    }
    html += '<div class="photo-upload" id="photo-upload-btn">';
    html += '<span style="font-size:24px">➕</span>';
    html += '<span>Add Photo</span>';
    html += '</div>';
    html += '</div>';
    html += '<p style="font-size:11px;color:var(--text-muted);margin-top:8px">📸 ' + (p.photoCount || 0) + ' photo(s)</p>';

    container.innerHTML = html;

    // Wire up remove buttons
    container.querySelectorAll('[data-action="remove-photo"]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            var idx = parseInt(btn.dataset.index);
            try {
                var result = await api.removePhoto(state.filepath, idx);
                setState({ product: result });
            } catch (err) {
                setState({ error: 'Remove failed: ' + err.message });
            }
        });
    });

    // Wire up upload button
    document.getElementById('photo-upload-btn').addEventListener('click', function() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';
        input.onchange = async function() {
            if (input.files && input.files[0]) {
                try {
                    var result = await api.addPhoto(state.filepath, input.files[0].path);
                    setState({ product: result });
                } catch (err) {
                    setState({ error: 'Add photo failed: ' + err.message });
                }
            }
        };
        input.click();
    });
}

// ========================================================================
// VARIATIONS TAB — Group Editor
// ========================================================================

function buildCombinations(groups) {
    if (!groups || groups.length === 0) return [];
    // Check for empty group
    for (var i = 0; i < groups.length; i++) {
        if (!groups[i].values || groups[i].values.length === 0) return [];
    }
    var total = 1;
    for (var i = 0; i < groups.length; i++) {
        total *= groups[i].values.length;
    }
    var result = [];
    for (var idx = 0; idx < total; idx++) {
        var values = [];
        var remain = idx;
        // Last group cycles fastest
        for (var gi = groups.length - 1; gi >= 0; gi--) {
            var vals = groups[gi].values;
            var vIdx = remain % vals.length;
            values.unshift(vals[vIdx]);
            remain = Math.floor(remain / vals.length);
        }
        // Build label
        var parts = values.filter(function(v) { return v !== ''; });
        var label = parts.join(' / ');
        result.push({ values: values, label: label });
    }
    return result;
}

function renderVariationsTab(container) {
    var p = state.product;
    if (!p) return;

    var groups = p.variation_groups || [];
    var combinations = buildCombinations(groups);

    var html = '';

    // ── Section: Group Editor ──
    html += '<div class="section-header">Variation Groups</div>';
    html += '<div class="variation-groups-container">';

    if (groups.length === 0) {
        html += '<div class="empty-tab">No variation groups defined. Add groups like Color, Size, or Material.</div>';
    } else {
        groups.forEach(function(group, gi) {
            html += '<div class="variation-group-card" data-group-index="' + gi + '">';
            html += '<div class="variation-group-header">';
            html += '<input type="text" class="variation-group-name" value="' + escapeHtml(group.name) + '" placeholder="Group name (e.g. Color)" data-gi="' + gi + '" />';
            html += '<button class="btn btn-xs btn-danger" data-action="delete-group" data-gi="' + gi + '" title="Delete group">✕</button>';
            html += '</div>';
            html += '<div class="variation-group-toggle">';
            html += '<label>';
            html += '<input type="checkbox" class="variation-affects-price" data-gi="' + gi + '" ' + (group.affects_price !== false ? 'checked' : '') + ' />';
            html += ' Affects price';
            html += '</label>';
            html += '</div>';
            html += '<div class="variation-group-values">';
            // Values as chips
            if (group.values && group.values.length > 0) {
                group.values.forEach(function(val, vi) {
                    html += '<div class="variation-chip" data-gi="' + gi + '" data-vi="' + vi + '">';
                    html += '<input type="text" class="variation-chip-input" value="' + escapeHtml(val) + '" placeholder="Value" data-gi="' + gi + '" data-vi="' + vi + '" />';
                    html += '<button class="variation-chip-remove" data-action="remove-value" data-gi="' + gi + '" data-vi="' + vi + '">✕</button>';
                    html += '</div>';
                });
            }
            // Add value button
            html += '<button class="btn btn-xs btn-primary variation-add-value-btn" data-gi="' + gi + '">+ Value</button>';
            html += '</div>'; // .variation-group-values
            html += '</div>'; // .variation-group-card
        });
    }

    html += '<button class="btn btn-sm btn-primary" id="add-group-btn">➕ Add Group</button>';
    html += '</div>'; // .variation-groups-container

    // ── Section: Combinations Preview ──
    html += '<div id="combinations-section">';
    html += '<div class="section-header" style="margin-top:20px">Generated SKUs</div>';

    if (combinations.length === 0) {
        html += '<div class="empty-tab">No SKU combinations to display. Add values to variation groups above.</div>';
    } else {
        html += '<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">' + combinations.length + ' SKU combination(s)</p>';
        html += '<table class="combinations-table">';
        html += '<thead><tr>';
        // Group name headers
        groups.forEach(function(g) {
            var hdr = g.name || '(unnamed)';
            html += '<th>' + escapeHtml(hdr) + '</th>';
        });
        html += '<th>Combination</th>';
        html += '</tr></thead><tbody>';

        combinations.forEach(function(comb) {
            html += '<tr>';
            comb.values.forEach(function(v) {
                html += '<td>' + escapeHtml(v) + '</td>';
            });
            html += '<td>' + escapeHtml(comb.label) + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';
    }
    html += '</div>';

    container.innerHTML = html;
    wireVariationsTab(container);
}

function renderCombinationsTable() {
    var container = document.getElementById('tab-content');
    var combosSection = container && container.querySelector('#combinations-section');
    if (!combosSection) return;

    var groups = state.product.variation_groups || [];
    var combinations = buildCombinations(groups);

    var html = '';
    html += '<div class="section-header" style="margin-top:20px">Generated SKUs</div>';

    if (combinations.length === 0) {
        html += '<div class="empty-tab">No SKU combinations to display. Add values to variation groups above.</div>';
    } else {
        html += '<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">' + combinations.length + ' SKU combination(s)</p>';
        html += '<table class="combinations-table">';
        html += '<thead><tr>';
        groups.forEach(function(g) {
            var hdr = g.name || '(unnamed)';
            html += '<th>' + escapeHtml(hdr) + '</th>';
        });
        html += '<th>Combination</th>';
        html += '</tr></thead><tbody>';

        combinations.forEach(function(comb) {
            html += '<tr>';
            comb.values.forEach(function(v) {
                html += '<td>' + escapeHtml(v) + '</td>';
            });
            html += '<td>' + escapeHtml(comb.label) + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';
    }

    combosSection.innerHTML = html;
}

function wireVariationsTab(container) {
    // Group name change — update model only, no re-render
    container.querySelectorAll('.variation-group-name').forEach(function(input) {
        input.addEventListener('input', function() {
            var gi = parseInt(input.dataset.gi);
            var groups = state.product.variation_groups;
            groups[gi].name = input.value;
            state.modified = true;
            renderCombinationsTable();
        });
    });

    // Affects-price toggle
    container.querySelectorAll('.variation-affects-price').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var gi = parseInt(cb.dataset.gi);
            var groups = state.product.variation_groups;
            groups[gi].affects_price = cb.checked;
            state.modified = true;
            renderCombinationsTable();
        });
    });

    // Value chip input change — update model only, no full re-render
    container.querySelectorAll('.variation-chip-input').forEach(function(input) {
        input.addEventListener('input', function() {
            var gi = parseInt(input.dataset.gi);
            var vi = parseInt(input.dataset.vi);
            var groups = state.product.variation_groups;
            groups[gi].values[vi] = input.value;
            state.modified = true;
            renderCombinationsTable();
        });
    });

    // Remove value from group
    container.querySelectorAll('[data-action="remove-value"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var gi = parseInt(btn.dataset.gi);
            var vi = parseInt(btn.dataset.vi);
            var groups = state.product.variation_groups;
            groups[gi].values.splice(vi, 1);
            setState({ modified: true });
        });
    });

    // Add value to group
    container.querySelectorAll('.variation-add-value-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var gi = parseInt(btn.dataset.gi);
            var groups = state.product.variation_groups;
            groups[gi].values.push('');
            setState({ modified: true });
        });
    });

    // Delete group
    container.querySelectorAll('[data-action="delete-group"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var gi = parseInt(btn.dataset.gi);
            var groups = state.product.variation_groups;
            groups.splice(gi, 1);
            setState({ modified: true });
        });
    });

    // Add new group
    var addBtn = document.getElementById('add-group-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            var groups = state.product.variation_groups;
            groups.push({ name: '', values: [''] });
            setState({ modified: true });
        });
    }
}

// ========================================================================
// PRICES TAB
// ========================================================================

function renderPricesTab(container) {
    var p = state.product;
    if (!p) return;

    // Build combinations from price-affecting groups only
    var groups = p.variation_groups || [];
    var affectedGroups = groups.filter(function(g) { return g.affects_price !== false; });
    var priceCombos = buildCombinations(affectedGroups);
    if (priceCombos.length === 0) {
        priceCombos = [{ values: [], label: 'Base' }];
    }

    var history = state.priceHistory || [];

    var html = '';
    html += '<div class="section-header">Add Price</div>';
    html += '<div class="add-price-form">';
    html += '<div class="form-group"><label>Price</label><input type="number" id="new-price-input" step="0.01" placeholder="0.00" /></div>';
    html += '<div class="form-group"><label>Currency</label><input type="text" id="new-currency-input" value="USD" maxlength="3" style="width:60px" /></div>';
    html += '<div class="form-group"><label>Variation</label><select id="new-variation-select">';
    html += '<option value="">— All —</option>';
    priceCombos.forEach(function(c) {
        html += '<option value="' + escapeHtml(c.label) + '">' + escapeHtml(c.label) + '</option>';
    });
    html += '</select></div>';
    html += '<button class="btn btn-primary" id="add-price-btn" style="margin-bottom:2px">➕ Add</button>';
    html += '</div>';

    html += '<div class="section-header">Price History</div>';
    if (history.length === 0) {
        html += '<div class="empty-tab">No prices recorded yet.</div>';
    } else {
        html += '<table class="price-table">';
        html += '<thead><tr><th>Date</th><th>Variation</th><th>Price</th><th>Currency</th></tr></thead><tbody>';
        // Show newest first
        for (var i = history.length - 1; i >= 0; i--) {
            var rec = history[i];
            var dateStr = rec.date ? rec.date.slice(0, 10) : new Date(rec.timestamp * 1000).toISOString().slice(0, 10);
            html += '<tr>';
            html += '<td>' + escapeHtml(dateStr) + '</td>';
            html += '<td>' + escapeHtml(rec.variation || '—') + '</td>';
            html += '<td>' + rec.price.toFixed(2) + '</td>';
            html += '<td>' + escapeHtml(rec.currency || 'USD') + '</td>';
            html += '</tr>';
        }
        html += '</tbody></table>';
    }

    container.innerHTML = html;

    document.getElementById('add-price-btn').addEventListener('click', async function() {
        var price = parseFloat(document.getElementById('new-price-input').value);
        if (isNaN(price) || price <= 0) {
            setState({ error: 'Enter a valid price' });
            return;
        }
        var currency = document.getElementById('new-currency-input').value.trim().toUpperCase() || 'USD';
        var variation = document.getElementById('new-variation-select').value;
        try {
            var newHistory = await api.addPrice(state.filepath, currency, variation, price);
            setState({ priceHistory: newHistory });
            document.getElementById('new-price-input').value = '';
        } catch (err) {
            setState({ error: 'Add price failed: ' + err.message });
        }
    });
}

// ========================================================================
// DESCRIPTION TAB
// ========================================================================

function renderDescriptionTab(container) {
    var p = state.product;
    if (!p) return;

    var isEditing = container.dataset.editing === 'true';

    var html = '';
    html += '<div class="section-header">Product Description</div>';

    if (!isEditing) {
        html += '<div class="description-content" id="description-view">';
        html += renderMarkdown(p.description || '');
        html += '</div>';
        html += '<div style="margin-top:12px;display:flex;gap:8px">';
        html += '<button class="btn btn-sm btn-primary" id="desc-edit-btn">✏️ Edit</button>';
        html += '</div>';
    } else {
        html += '<textarea id="description-editor" rows="12" style="width:100%;padding:10px;font-size:14px;font-family:var(--font-mono);resize:vertical">';
        html += escapeHtml(p.description || '');
        html += '</textarea>';
        html += '<div style="margin-top:8px;display:flex;gap:8px">';
        html += '<button class="btn btn-sm btn-primary" id="desc-save-btn">💾 Save</button>';
        html += '<button class="btn btn-sm" id="desc-cancel-btn">Cancel</button>';
        html += '<span style="font-size:11px;color:var(--text-muted);margin-left:8px">Supports Markdown</span>';
        html += '</div>';
    }

    container.innerHTML = html;

    if (!isEditing) {
        document.getElementById('desc-edit-btn').addEventListener('click', function() {
            container.dataset.editing = 'true';
            renderDescriptionTab(container);
        });
    } else {
        document.getElementById('desc-save-btn').addEventListener('click', function() {
            var newDesc = document.getElementById('description-editor').value;
            state.product.description = newDesc;
            setState({ modified: true, success: 'Description updated (save to persist)' });
            container.dataset.editing = 'false';
            renderDescriptionTab(container);
        });
        document.getElementById('desc-cancel-btn').addEventListener('click', function() {
            container.dataset.editing = 'false';
            renderDescriptionTab(container);
        });
    }
}

// Simple Markdown renderer
function renderMarkdown(text) {
    if (!text) return '<span style="color:var(--text-muted)">No description.</span>';
    var html = escapeHtml(text);

    // Code blocks (```...```)
    html = html.replace(/```([\s\S]*?)```/g, function(m, code) {
        return '<pre><code>' + code + '</code></pre>';
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers (###, ##, #)
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold & italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Line breaks → paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');

    return html;
}

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

async function _showConfirmDialog(msg) {
    return confirm(msg);
}
