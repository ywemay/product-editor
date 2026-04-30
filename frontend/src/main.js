/* Products Desktop Editor — Editor logic
 * 2-tab editor: Product (photos + description + prices), Variations
 * No start screen — always show editor with empty state when no file open.
 */

var state = {
    filepath: null,
    product: null,
    activeTab: 'product',
    priceHistory: [],
    combinationEnabled: {},
    loading: false,
    error: '',
    success: '',
    modified: false,
    settings: { currency: 'CNY', language: 'en' },
    lang: null,
    langCode: 'en',
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
// LOCALIZATION
// ========================================================================

var l10n = {
    en: {
        noFile: 'No file open',
        open: 'Open',
        openFile: 'Open a .prod file to start editing',
        dragDrop: 'Drag & drop a .prod file or click Open',
        save: 'Save',
        saveAs: 'Save As...',
        close: 'Close',
        share: 'Share',
        email: 'Email',
        copyToClipboard: 'Copy info to clipboard',
        copied: 'Copied!',
        shareTitle: 'Share Product',
        exportPhoto: 'Export photo',
        addPrice: 'Add Price',
        product: 'Product',
        variations: 'Variations',
        productInfo: 'Product Info',
        title: 'Title',
        code: 'Code',
        unit: 'Unit',
        photos: 'Photos',
        addPhoto: 'Add Photo',
        description: 'Description',
        edit: 'Edit',
        cancel: 'Cancel',
        priceHistory: 'Price History',
        noPrices: 'No prices recorded yet.',
        variationGroups: 'Variation Groups',
        addGroup: 'Add Group',
        addValue: 'Value',
        affectsPrice: 'Affects price',
        generatedSKUs: 'Generated SKUs',
        skuCombinations: 'SKU combination(s)',
        noSKU: 'No SKU combinations to display. Add values to variation groups above.',
        noVariationGroups: 'No variation groups defined. Add groups like Color, Size, or Material.',
        date: 'Date',
        variation: 'Variation',
        price: 'Price',
        currency: 'Currency',
        actions: 'Actions',
        all: 'All',
        base: 'Base',
        modified: 'Modified',
        saved: 'Saved',
        settings: 'Settings',
        defaultCurrency: 'Default Currency',
        language: 'Language',
        saveSettings: 'Save',
        confirmClose: 'You have unsaved changes. Close anyway?',
        confirmOpen: 'You have unsaved changes. Open another file anyway?',
        removePhoto: 'Remove photo',
        unsavedChanges: 'You have unsaved changes.',
        noDescription: 'No description.',
        photosCount: 'photo(s)',
        editPrice: 'Edit price',
        deletePrice: 'Delete this price entry?',
        editPricePrompt: 'Edit price:',
        editCurrencyPrompt: 'Edit currency (3 letters):',
        invalidCurrency: 'Currency must be 3 letters',
        invalidPrice: 'Invalid price',
        movePhotoLeft: 'Move left',
        movePhotoRight: 'Move right',
        deleteGroup: 'Delete group',
    },
    zh: {
        noFile: '未打开文件',
        open: '打开',
        openFile: '打开 .prod 文件开始编辑',
        dragDrop: '拖放 .prod 文件或点击打开',
        save: '保存',
        saveAs: '另存为...',
        close: '关闭',
        share: '分享',
        email: '邮件',
        copyToClipboard: '复制信息到剪贴板',
        copied: '已复制！',
        shareTitle: '分享产品',
        exportPhoto: '导出照片',
        addPrice: '添加价格',
        product: '产品',
        variations: '规格',
        productInfo: '产品信息',
        title: '标题',
        code: '编码',
        unit: '单位',
        photos: '照片',
        addPhoto: '添加照片',
        description: '描述',
        edit: '编辑',
        cancel: '取消',
        priceHistory: '价格历史',
        noPrices: '暂无价格记录。',
        variationGroups: '规格组',
        addGroup: '添加组',
        addValue: '值',
        affectsPrice: '影响价格',
        generatedSKUs: '生成的SKU',
        skuCombinations: '个SKU组合',
        noSKU: '暂无SKU组合。请在规格组中添加值。',
        noVariationGroups: '暂无规格组。请添加如颜色、尺寸或材质的组。',
        date: '日期',
        variation: '规格',
        price: '价格',
        currency: '货币',
        actions: '操作',
        all: '全部',
        base: '基础',
        modified: '已修改',
        saved: '已保存',
        settings: '设置',
        defaultCurrency: '默认货币',
        language: '语言',
        saveSettings: '保存',
        confirmClose: '有未保存的更改，确定关闭吗？',
        confirmOpen: '有未保存的更改，确定打开其他文件吗？',
        removePhoto: '删除照片',
        unsavedChanges: '有未保存的更改。',
        noDescription: '暂无描述。',
        photosCount: '张照片',
        editPrice: '编辑价格',
        deletePrice: '删除此价格记录？',
        editPricePrompt: '编辑价格：',
        editCurrencyPrompt: '编辑货币（3个字母）：',
        invalidCurrency: '货币必须是3个字母',
        invalidPrice: '无效价格',
        movePhotoLeft: '左移',
        movePhotoRight: '右移',
        deleteGroup: '删除组',
    },
    ru: {
        noFile: 'Файл не открыт',
        open: 'Открыть',
        openFile: 'Откройте .prod файл для редактирования',
        dragDrop: 'Перетащите .prod файл или нажмите Открыть',
        save: 'Сохранить',
        saveAs: 'Сохранить как...',
        close: 'Закрыть',
        share: 'Поделиться',
        email: 'Email',
        copyToClipboard: 'Скопировать в буфер',
        copied: 'Скопировано!',
        shareTitle: 'Поделиться товаром',
        exportPhoto: 'Экспорт фото',
        addPrice: 'Добавить цену',
        product: 'Товар',
        variations: 'Вариации',
        productInfo: 'Информация о товаре',
        title: 'Название',
        code: 'Код',
        unit: 'Ед. изм.',
        photos: 'Фото',
        addPhoto: 'Добавить фото',
        description: 'Описание',
        edit: 'Редактировать',
        cancel: 'Отмена',
        priceHistory: 'История цен',
        noPrices: 'Цены еще не записаны.',
        variationGroups: 'Группы вариаций',
        addGroup: 'Добавить группу',
        addValue: 'Значение',
        affectsPrice: 'Влияет на цену',
        generatedSKUs: 'Сгенерированные SKU',
        skuCombinations: 'SKU комбинаций',
        noSKU: 'Нет SKU комбинаций. Добавьте значения в группы вариаций.',
        noVariationGroups: 'Группы вариаций не определены. Добавьте группы, например Цвет, Размер или Материал.',
        date: 'Дата',
        variation: 'Вариация',
        price: 'Цена',
        currency: 'Валюта',
        actions: 'Действия',
        all: 'Все',
        base: 'Базовая',
        modified: 'Изменено',
        saved: 'Сохранено',
        settings: 'Настройки',
        defaultCurrency: 'Валюта по умолчанию',
        language: 'Язык',
        saveSettings: 'Сохранить',
        confirmClose: 'Есть несохраненные изменения. Закрыть?',
        confirmOpen: 'Есть несохраненные изменения. Открыть другой файл?',
        removePhoto: 'Удалить фото',
        unsavedChanges: 'Есть несохраненные изменения.',
        noDescription: 'Нет описания.',
        photosCount: 'фото',
        editPrice: 'Редактировать цену',
        deletePrice: 'Удалить эту запись цены?',
        editPricePrompt: 'Редактировать цену:',
        editCurrencyPrompt: 'Редактировать валюту (3 буквы):',
        invalidCurrency: 'Валюта должна содержать 3 буквы',
        invalidPrice: 'Неверная цена',
        movePhotoLeft: 'Сдвинуть влево',
        movePhotoRight: 'Сдвинуть вправо',
        deleteGroup: 'Удалить группу',
    },
};

function applyLanguage(code) {
    var lang = l10n[code] || l10n.en;
    state.lang = lang;
    state.langCode = code;
    // Re-render to apply new strings
    if (state.filepath && state.product) {
        render();
    } else {
        // Update static elements
        document.getElementById('editor-filename').textContent = lang.noFile;
        document.getElementById('btn-open-file').textContent = '📂 ' + lang.open;
        var container = document.getElementById('tab-content');
        if (container && !state.filepath) {
            container.innerHTML = '<div class="editor-empty-state">' +
                '<div>📦</div>' +
                '<p>' + escapeHtml(lang.openFile) + '</p>' +
                '<p class="small">' + escapeHtml(lang.dragDrop) + '</p>' +
                '</div>';
        }
    }
}

// ========================================================================
// SETTINGS
// ========================================================================

async function loadSettingsAndApply() {
    try {
        var s = await api.getSettings();
        state.settings = s || { currency: 'CNY', language: 'en' };
        // Apply language
        applyLanguage(state.settings.language);
        // Set default currency in top bar
        var currInput = document.getElementById('tb-currency-input');
        if (currInput) currInput.value = s.currency || 'CNY';
    } catch (err) {
        state.settings = { currency: 'CNY', language: 'en' };
    }
}

async function openSettings() {
    try {
        var s = await api.getSettings();
        document.getElementById('settings-currency').value = s.currency || 'CNY';
        document.getElementById('settings-language').value = s.language || 'en';
        document.getElementById('settings-modal').style.display = 'flex';
    } catch (err) {
        setState({ error: 'Failed to load settings: ' + err.message });
    }
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

async function handleSettingsSave() {
    var settings = {
        currency: document.getElementById('settings-currency').value,
        language: document.getElementById('settings-language').value,
    };
    try {
        await api.saveSettings(settings);
        closeSettings();
        // Apply language immediately
        applyLanguage(settings.language);
        // Update top bar currency field
        var currInput = document.getElementById('tb-currency-input');
        if (currInput) currInput.value = settings.currency;
        setState({ success: (state.lang || l10n.en).saved });
    } catch (err) {
        setState({ error: 'Failed to save settings: ' + err.message });
    }
}

// ========================================================================
// INIT
// ========================================================================

document.addEventListener('DOMContentLoaded', function() {
    bindEvents();
    loadSettingsAndApply();
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

    // Settings
    document.getElementById('btn-settings').addEventListener('click', openSettings);
    document.getElementById('settings-cancel-btn').addEventListener('click', closeSettings);
    document.getElementById('settings-save-btn').addEventListener('click', handleSettingsSave);

    // Top bar actions
    document.getElementById('btn-close-file').addEventListener('click', handleCloseFile);
    document.getElementById('btn-save').addEventListener('click', handleSave);
    document.getElementById('btn-save-as').addEventListener('click', handleSaveAs);
    document.getElementById('btn-send').addEventListener('click', handleSend);
    document.getElementById('tb-add-price-btn').addEventListener('click', handleTopbarAddPrice);

    // Tab switching
    document.getElementById('tabs').addEventListener('click', function(e) {
        var btn = e.target.closest('.tab-btn');
        if (!btn) return;
        var tab = btn.dataset.tab;
        if (tab && tab !== state.activeTab) {
            setState({ activeTab: tab });
        }
    });

    // Drag & drop — handles .prod files AND image files
    document.body.addEventListener('dragover', function(e) { e.preventDefault(); });
    document.body.addEventListener('drop', function(e) {
        e.preventDefault();
        var files = e.dataTransfer.files;
        if (files && files.length > 0) {
            var path = files[0].path;
            if (path.endsWith('.prod')) {
                // If modified, confirm close first
                if (state.modified && state.filepath) {
                    if (!confirm((state.lang || l10n.en).confirmOpen)) return;
                }
                openProductFile(path);
            } else if (path.match(/\.(jpg|jpeg|png|webp)$/i)) {
                // Image file dropped — add as photo if product is open
                if (state.filepath && state.product) {
                    api.addPhoto(state.filepath, path).then(function(result) {
                        setState({ product: result });
                    }).catch(function(err) {
                        setState({ error: 'Failed to add dropped photo: ' + err.message });
                    });
                }
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
            // If modified, confirm close first
            if (state.modified && state.filepath) {
                if (!confirm((state.lang || l10n.en).confirmOpen)) return;
            }
            openProductFile(result.path);
        }
    } catch (err) {
        setState({ error: 'Failed to open file dialog: ' + err.message });
    }
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
        // Build initial combinationEnabled map (all enabled by default)
        var groups = product.variation_groups || [];
        var combos = buildCombinations(groups);
        var ce = {};
        combos.forEach(function(c) {
            ce[c.label] = true;
        });

        // Set default currency in top bar from settings
        var currInput = document.getElementById('tb-currency-input');
        if (currInput) currInput.value = (state.settings && state.settings.currency) || 'CNY';

        setState({
            filepath: filepath,
            product: product,
            priceHistory: history || [],
            combinationEnabled: ce,
            loading: false,
            modified: false,
            activeTab: 'product',
        });
    } catch (err) {
        setState({ loading: false, error: 'Failed to open file: ' + err.message });
    }
}

function handleCloseFile() {
    if (state.modified) {
        if (!confirm((state.lang || l10n.en).confirmClose)) return;
    }
    setState({
        filepath: null,
        product: null,
        priceHistory: [],
        modified: false,
        combinationEnabled: {},
    });
}

async function handleSave() {
    if (!state.filepath || !state.product) return;
    try {
        var product = state.product;
        var result = await api.saveProduct(state.filepath, {
            title: product.title,
            code: product.code,
            unit: product.unit,
            description: product.description,
            variation_groups: product.variation_groups,
        });
        setState({ product: result, modified: false, success: '✅ ' + (state.lang || l10n.en).saved });
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
// TOP BAR: ADD PRICE
// ========================================================================

async function handleTopbarAddPrice() {
    var price = parseFloat(document.getElementById('tb-price-input').value);
    if (isNaN(price) || price <= 0) {
        setState({ error: 'Enter a valid price' });
        return;
    }
    var currency = document.getElementById('tb-currency-input').value.trim().toUpperCase() || 'USD';
    var variation = document.getElementById('tb-variation-select').value;
    try {
        var newHistory = await api.addPrice(state.filepath, currency, variation, price);
        setState({ priceHistory: newHistory });
        document.getElementById('tb-price-input').value = '';
        // Refresh the product tab if visible
        if (state.activeTab === 'product') {
            renderProductTab(document.getElementById('tab-content'));
        }
    } catch (err) {
        setState({ error: 'Add price failed: ' + err.message });
    }
}

// ========================================================================
// RENDER
// ========================================================================

function render() {
    var editorView = document.getElementById('editor-view');
    editorView.style.display = 'flex';
    renderTopBar();
    if (state.filepath && state.product) {
        document.getElementById('tabs').style.display = 'flex';
        renderTabs();
        renderActiveTab();
    } else {
        document.getElementById('tabs').style.display = 'none';
        var lang = state.lang || l10n.en;
        var container = document.getElementById('tab-content');
        container.innerHTML = '<div class="editor-empty-state">' +
            '<div>📦</div>' +
            '<p>' + escapeHtml(lang.openFile) + '</p>' +
            '<p class="small">' + escapeHtml(lang.dragDrop) + '</p>' +
            '</div>';
    }
}

function renderTopBar() {
    var p = state.product;
    var hasFile = !!(state.filepath && p);
    var lang = state.lang || l10n.en;

    var filenameEl = document.getElementById('editor-filename');
    var modifiedEl = document.getElementById('editor-modified');
    var iconEl = document.getElementById('editor-icon');
    var openBtn = document.getElementById('btn-open-file');
    var closeBtn = document.getElementById('btn-close-file');
    var saveBtn = document.getElementById('btn-save');
    var saveAsBtn = document.getElementById('btn-save-as');
    var sendBtn = document.getElementById('btn-send');
    var divider = document.getElementById('tb-divider');
    var priceForm = document.getElementById('topbar-price-form');

    if (hasFile) {
        var filename = state.filepath.split('/').pop() || state.filepath;
        filenameEl.textContent = filename;
        modifiedEl.style.display = state.modified ? '' : 'none';
        iconEl.textContent = p.photos && p.photos.length > 0 ? '' : '📦';

        openBtn.style.display = '';
        closeBtn.style.display = '';
        saveBtn.style.display = '';
        saveAsBtn.style.display = '';
        sendBtn.style.display = '';
        divider.style.display = '';
        priceForm.style.display = 'flex';

        // Update variation dropdown in top bar price form
        updateTopbarPriceVariationDropdown();
    } else {
        filenameEl.textContent = lang.noFile;
        modifiedEl.style.display = 'none';
        iconEl.textContent = '📦';

        openBtn.style.display = '';
        closeBtn.style.display = 'none';
        saveBtn.style.display = 'none';
        saveAsBtn.style.display = 'none';
        sendBtn.style.display = 'none';
        divider.style.display = 'none';
        priceForm.style.display = 'none';
    }

    // Show error/success messages
    var successEl = document.getElementById('editor-success');
    if (state.success) {
        if (!successEl) {
            successEl = document.createElement('span');
            successEl.id = 'editor-success';
            successEl.style.cssText = 'font-size:11px;color:var(--accent-green);margin-right:8px';
            var refNode = openBtn.nextSibling || openBtn;
            document.getElementById('editor-topbar').insertBefore(successEl, refNode);
        }
        successEl.textContent = state.success;
        setTimeout(function() { if (state.success) setState({ success: '' }); }, 3000);
    } else if (successEl) {
        successEl.textContent = '';
    }
}

function updateTopbarPriceVariationDropdown() {
    var select = document.getElementById('tb-variation-select');
    if (!select) return;
    var p = state.product;
    if (!p) return;

    var lang = state.lang || l10n.en;

    // Build combinations from enabled, price-affecting groups only
    var groups = p.variation_groups || [];
    var affectedGroups = groups.filter(function(g) { return g.affects_price !== false; });
    var priceCombos = buildCombinations(affectedGroups);
    if (priceCombos.length === 0) {
        priceCombos = [{ values: [], label: lang.base }];
    }

    // Only show enabled combinations
    var enabledCombos = priceCombos.filter(function(c) {
        return state.combinationEnabled[c.label] !== false;
    });
    if (enabledCombos.length === 0) {
        enabledCombos = [{ values: [], label: lang.base }];
    }

    // Preserve current selection
    var curVal = select.value;
    select.innerHTML = '<option value="">' + escapeHtml(lang.all) + '</option>';
    enabledCombos.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c.label;
        opt.textContent = c.label;
        select.appendChild(opt);
    });
    if (curVal) {
        select.value = curVal;
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
    if (state.activeTab === 'product') renderProductTab(container);
    else if (state.activeTab === 'variations') renderVariationsTab(container);
}

// ========================================================================
// PRODUCT TAB — Combined Photos + Prices + Description
// ========================================================================

function renderProductTab(container) {
    var p = state.product;
    if (!p) return;
    var lang = state.lang || l10n.en;

    var html = '';

    // ── Title / Code / Unit bar (always shown) ──
    html += '<div class="section-header">' + escapeHtml(lang.productInfo) + '</div>';
    html += '<div class="form-row" style="margin-bottom:16px">';
    html += '<div class="form-group"><label>' + escapeHtml(lang.title) + '</label><input type="text" id="prod-title-input" value="' + escapeHtml(p.title || '') + '" style="width:100%" /></div>';
    html += '<div class="form-group"><label>' + escapeHtml(lang.code) + '</label><input type="text" id="prod-code-input" value="' + escapeHtml(p.code || '') + '" style="width:200px" /></div>';
    html += '<div class="form-group"><label>' + escapeHtml(lang.unit) + '</label><input type="text" id="prod-unit-input" value="' + escapeHtml(p.unit || '') + '" style="width:150px" placeholder="e.g. kg, pcs, m" /></div>';
    html += '</div>';

    // ── Photos ──
    html += '<div class="section-header">' + escapeHtml(lang.photos) + '</div>';
    html += '<div class="photo-grid">';
    if (p.photos && p.photos.length > 0) {
        p.photos.forEach(function(photo, idx) {
            html += '<div class="photo-item" data-photo-index="' + idx + '">';
            html += '<img src="' + photo + '" alt="Photo ' + (idx + 1) + '" loading="lazy">';
            html += '<button class="remove-btn" data-action="remove-photo" data-index="' + idx + '" title="' + escapeHtml(lang.removePhoto) + '">✕</button>';
            html += '<button class="photo-export-btn" data-action="export-photo" data-index="' + idx + '" title="' + escapeHtml(lang.exportPhoto) + '">⬇️</button>';
            if (idx > 0) {
                html += '<button class="photo-move-left" data-action="move-photo" data-index="' + idx + '" data-direction="-1" title="' + escapeHtml(lang.movePhotoLeft) + '">◀</button>';
            }
            if (idx < p.photos.length - 1) {
                html += '<button class="photo-move-right" data-action="move-photo" data-index="' + idx + '" data-direction="1" title="' + escapeHtml(lang.movePhotoRight) + '">▶</button>';
            }
            html += '</div>';
        });
    }
    html += '<div class="photo-upload" id="photo-upload-btn">';
    html += '<span style="font-size:24px">➕</span>';
    html += '<span>' + escapeHtml(lang.addPhoto) + '</span>';
    html += '</div>';
    html += '</div>';
    html += '<p style="font-size:11px;color:var(--text-muted);margin-top:8px">📸 ' + (p.photoCount || 0) + ' ' + escapeHtml(lang.photosCount) + '</p>';

    // ── Description ──
    html += '<div class="section-header" style="margin-top:20px">' + escapeHtml(lang.description) + '</div>';
    html += '<div class="description-content" id="description-view">';
    html += renderMarkdown(p.description || '', lang);
    html += '</div>';
    html += '<div style="margin-top:8px;display:flex;gap:8px">';
    html += '<button class="btn btn-sm btn-primary" id="desc-edit-btn">✏️ ' + escapeHtml(lang.edit) + '</button>';
    html += '</div>';

    // ── Price History ──
    var history = state.priceHistory || [];
    html += '<div class="section-header" style="margin-top:20px">' + escapeHtml(lang.priceHistory) + '</div>';
    if (history.length === 0) {
        html += '<div class="empty-tab">' + escapeHtml(lang.noPrices) + '</div>';
    } else {
        html += '<table class="price-table">';
        html += '<thead><tr><th>' + escapeHtml(lang.date) + '</th><th>' + escapeHtml(lang.variation) + '</th><th>' + escapeHtml(lang.price) + '</th><th>' + escapeHtml(lang.currency) + '</th><th>' + escapeHtml(lang.actions) + '</th></tr></thead><tbody>';
        for (var i = history.length - 1; i >= 0; i--) {
            var rec = history[i];
            var dateStr = rec.date ? rec.date.slice(0, 10) : new Date(rec.timestamp * 1000).toISOString().slice(0, 10);
            html += '<tr>';
            html += '<td>' + escapeHtml(dateStr) + '</td>';
            html += '<td>' + escapeHtml(rec.variation || '—') + '</td>';
            html += '<td>' + rec.price.toFixed(2) + '</td>';
            html += '<td>' + escapeHtml(rec.currency || 'USD') + '</td>';
            html += '<td>';
            html += '<button class="btn btn-xs" data-action="edit-price" data-index="' + i + '" title="' + escapeHtml(lang.editPrice) + '">✏️</button> ';
            html += '<button class="btn btn-xs btn-danger" data-action="delete-price" data-index="' + i + '" title="' + escapeHtml(lang.deletePrice) + '">🗑️</button>';
            html += '</td>';
            html += '</tr>';
        }
        html += '</tbody></table>';
    }

    container.innerHTML = html;
    wireProductTab(container);
}

function wireProductTab(container) {
    var lang = state.lang || l10n.en;

    // Title input
    var titleInput = document.getElementById('prod-title-input');
    if (titleInput) {
        titleInput.addEventListener('input', function() {
            state.product.title = this.value;
            state.modified = true;
        });
    }

    // Code input
    var codeInput = document.getElementById('prod-code-input');
    if (codeInput) {
        codeInput.addEventListener('input', function() {
            state.product.code = this.value;
            state.modified = true;
        });
    }

    // Unit input
    var unitInput = document.getElementById('prod-unit-input');
    if (unitInput) {
        unitInput.addEventListener('input', function() {
            state.product.unit = this.value;
            state.modified = true;
        });
    }

    // Remove photo buttons
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

    // Move photo buttons
    container.querySelectorAll('[data-action="move-photo"]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            var idx = parseInt(btn.dataset.index);
            var dir = parseInt(btn.dataset.direction);
            try {
                var result = await api.movePhoto(state.filepath, idx, dir);
                setState({ product: result });
            } catch (err) {
                setState({ error: 'Move failed: ' + err.message });
            }
        });
    });

    // Export photo buttons
    container.querySelectorAll('[data-action="export-photo"]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            var idx = parseInt(btn.dataset.index);
            try {
                var result = await api.exportPhoto(state.filepath, idx);
                if (result && result.data) {
                    var a = document.createElement('a');
                    a.href = 'data:' + result.mime + ';base64,' + result.data;
                    a.download = result.filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setState({ success: '✅ Exported ' + result.filename });
                }
            } catch (err) {
                setState({ error: 'Export failed: ' + err.message });
            }
        });
    });

    // Upload photo
    var uploadBtn = document.getElementById('photo-upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
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

    // Description edit button — open editor overlay/modal
    var editBtn = document.getElementById('desc-edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            var descView = document.getElementById('description-view');
            if (!descView) return;
            var currentText = state.product.description || '';
            descView.innerHTML = '<textarea id="description-editor" rows="10" style="width:100%;padding:10px;font-size:14px;font-family:var(--font-mono);resize:vertical">' +
                escapeHtml(currentText) +
                '</textarea>' +
                '<div style="margin-top:8px;display:flex;gap:8px">' +
                '<button class="btn btn-sm btn-primary" id="desc-save-btn">💾 ' + escapeHtml(lang.save) + '</button>' +
                '<button class="btn btn-sm" id="desc-cancel-btn">' + escapeHtml(lang.cancel) + '</button>' +
                '<span style="font-size:11px;color:var(--text-muted);margin-left:8px">Supports Markdown</span>' +
                '</div>';

            document.getElementById('desc-save-btn').addEventListener('click', function() {
                var newDesc = document.getElementById('description-editor').value;
                state.product.description = newDesc;
                state.modified = true;
                setState({ success: 'Description updated (save to persist)' });
                // Re-render product tab to show rendered markdown
                renderProductTab(document.getElementById('tab-content'));
            });
            document.getElementById('desc-cancel-btn').addEventListener('click', function() {
                renderProductTab(document.getElementById('tab-content'));
            });
        });
    }

    // Edit price buttons
    container.querySelectorAll('[data-action="edit-price"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var idx = parseInt(btn.dataset.index);
            var rec = state.priceHistory[idx];
            var newPrice = prompt(lang.editPricePrompt, rec.price.toFixed(2));
            if (newPrice === null) return;
            var newCurrency = prompt(lang.editCurrencyPrompt, rec.currency || 'USD');
            if (newCurrency === null) return;
            newCurrency = newCurrency.trim().toUpperCase();
            if (newCurrency.length !== 3) { setState({ error: lang.invalidCurrency }); return; }
            var priceVal = parseFloat(newPrice);
            if (isNaN(priceVal) || priceVal <= 0) { setState({ error: lang.invalidPrice }); return; }
            api.editPrice(state.filepath, idx, priceVal, newCurrency).then(function(newHistory) {
                setState({ priceHistory: newHistory });
            }).catch(function(err) {
                setState({ error: 'Edit failed: ' + err.message });
            });
        });
    });

    // Full image view on click
    container.querySelectorAll('.photo-item img').forEach(function(img) {
        img.addEventListener('click', function() {
            showFullImageView(this.src);
        });
    });

    // Delete price buttons
    container.querySelectorAll('[data-action="delete-price"]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            var idx = parseInt(btn.dataset.index);
            if (!confirm(lang.deletePrice)) return;
            try {
                var newHistory = await api.deletePrice(state.filepath, idx);
                setState({ priceHistory: newHistory });
            } catch (err) {
                setState({ error: 'Delete failed: ' + err.message });
            }
        });
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
    var lang = state.lang || l10n.en;

    var groups = p.variation_groups || [];
    var combinations = buildCombinations(groups);

    var html = '';

    // ── Section: Group Editor ──
    html += '<div class="section-header">' + escapeHtml(lang.variationGroups) + '</div>';
    html += '<div class="variation-groups-container">';

    if (groups.length === 0) {
        html += '<div class="empty-tab">' + escapeHtml(lang.noVariationGroups) + '</div>';
    } else {
        groups.forEach(function(group, gi) {
            html += '<div class="variation-group-card" data-group-index="' + gi + '">';
            html += '<div class="variation-group-header">';
            html += '<input type="text" class="variation-group-name" value="' + escapeHtml(group.name) + '" placeholder="Group name (e.g. Color)" data-gi="' + gi + '" />';
            html += '<button class="btn btn-xs btn-danger" data-action="delete-group" data-gi="' + gi + '" title="' + escapeHtml(lang.deleteGroup) + '">✕</button>';
            html += '</div>';
            html += '<div class="variation-group-toggle">';
            html += '<label>';
            html += '<input type="checkbox" class="variation-affects-price" data-gi="' + gi + '" ' + (group.affects_price !== false ? 'checked' : '') + ' />';
            html += ' ' + escapeHtml(lang.affectsPrice);
            html += '</label>';
            html += '</div>';
            html += '<div class="variation-group-values">';
            // Values as chips
            if (group.values && group.values.length > 0) {
                group.values.forEach(function(val, vi) {
                    html += '<div class="variation-chip" data-gi="' + gi + '" data-vi="' + vi + '">';
                    html += '<input type="text" class="variation-chip-input" value="' + escapeHtml(val) + '" placeholder="' + escapeHtml(lang.addValue) + '" data-gi="' + gi + '" data-vi="' + vi + '" />';
                    html += '<button class="variation-chip-remove" data-action="remove-value" data-gi="' + gi + '" data-vi="' + vi + '">✕</button>';
                    html += '</div>';
                });
            }
            // Add value button
            html += '<button class="btn btn-xs btn-primary variation-add-value-btn" data-gi="' + gi + '">+ ' + escapeHtml(lang.addValue) + '</button>';
            html += '</div>'; // .variation-group-values
            html += '</div>'; // .variation-group-card
        });
    }

    html += '<button class="btn btn-sm btn-primary" id="add-group-btn">➕ ' + escapeHtml(lang.addGroup) + '</button>';
    html += '</div>'; // .variation-groups-container

    // ── Section: Combinations Preview ──
    html += '<div id="combinations-section">';
    html += '<div class="section-header" style="margin-top:20px">' + escapeHtml(lang.generatedSKUs) + '</div>';

    if (combinations.length === 0) {
        html += '<div class="empty-tab">' + escapeHtml(lang.noSKU) + '</div>';
    } else {
        html += '<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">' + combinations.length + ' ' + escapeHtml(lang.skuCombinations) + '</p>';
        html += '<table class="combinations-table">';
        html += '<thead><tr>';
        html += '<th></th>'; // enable/disable column
        groups.forEach(function(g) {
            var hdr = g.name || '(unnamed)';
            html += '<th>' + escapeHtml(hdr) + '</th>';
        });
        html += '<th>Combination</th>';
        html += '</tr></thead><tbody>';

        combinations.forEach(function(comb) {
            var enabled = state.combinationEnabled[comb.label] !== false;
            var rowClass = enabled ? '' : ' class="combo-disabled"';
            html += '<tr' + rowClass + '>';
            html += '<td><input type="checkbox" class="combo-enabled-toggle" data-combo="' + escapeHtml(comb.label) + '" ' + (enabled ? 'checked' : '') + ' title="Enable/disable this SKU combination" /></td>';
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

function wireVariationsTab(container) {
    // Group name change — update model only, no full re-render
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

    // Combo enable toggle
    container.querySelectorAll('.combo-enabled-toggle').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var combo = cb.dataset.combo;
            state.combinationEnabled[combo] = cb.checked;
            // Re-render the combinations table to update styling
            renderCombinationsTable();
            // Also update the top bar variation dropdown
            updateTopbarPriceVariationDropdown();
        });
    });
}

function renderCombinationsTable() {
    var container = document.getElementById('tab-content');
    var combosSection = container && container.querySelector('#combinations-section');
    if (!combosSection) return;

    var groups = state.product.variation_groups || [];
    var combinations = buildCombinations(groups);
    var lang = state.lang || l10n.en;

    var html = '';
    html += '<div class="section-header" style="margin-top:20px">' + escapeHtml(lang.generatedSKUs) + '</div>';

    if (combinations.length === 0) {
        html += '<div class="empty-tab">' + escapeHtml(lang.noSKU) + '</div>';
    } else {
        html += '<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">' + combinations.length + ' ' + escapeHtml(lang.skuCombinations) + '</p>';
        html += '<table class="combinations-table">';
        html += '<thead><tr>';
        html += '<th></th>';
        groups.forEach(function(g) {
            var hdr = g.name || '(unnamed)';
            html += '<th>' + escapeHtml(hdr) + '</th>';
        });
        html += '<th>Combination</th>';
        html += '</tr></thead><tbody>';

        combinations.forEach(function(comb) {
            var enabled = state.combinationEnabled[comb.label] !== false;
            var rowClass = enabled ? '' : ' class="combo-disabled"';
            html += '<tr' + rowClass + '>';
            html += '<td><input type="checkbox" class="combo-enabled-toggle" data-combo="' + escapeHtml(comb.label) + '" ' + (enabled ? 'checked' : '') + ' title="Enable/disable this SKU combination" /></td>';
            comb.values.forEach(function(v) {
                html += '<td>' + escapeHtml(v) + '</td>';
            });
            html += '<td>' + escapeHtml(comb.label) + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';
    }

    combosSection.innerHTML = html;

    // Wire combo toggle
    combosSection.querySelectorAll('.combo-enabled-toggle').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var combo = cb.dataset.combo;
            state.combinationEnabled[combo] = cb.checked;
            renderCombinationsTable();
            updateTopbarPriceVariationDropdown();
        });
    });
}

// ========================================================================
// MARKDOWN RENDERER
// ========================================================================

// Simple Markdown renderer
function renderMarkdown(text, lang) {
    if (!lang) lang = state.lang || l10n.en;
    if (!text) return '<span style="color:var(--text-muted)">' + escapeHtml(lang.noDescription) + '</span>';
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
// FULL IMAGE VIEWER
// ========================================================================

function showFullImageView(src) {
    // Remove any existing full-image overlay
    var existing = document.getElementById('full-image-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'full-image-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:999;cursor:zoom-out';

    var img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);transition:transform 0.2s';
    img.style.cursor = 'zoom-in';

    var zoomLevel = 1;
    overlay.appendChild(img);

    // Click overlay to close
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    // Click image to toggle zoom
    img.addEventListener('click', function(e) {
        e.stopPropagation();
        if (zoomLevel === 1) {
            zoomLevel = 2;
            img.style.transform = 'scale(2)';
            img.style.cursor = 'zoom-out';
        } else {
            zoomLevel = 1;
            img.style.transform = 'scale(1)';
            img.style.cursor = 'zoom-in';
        }
    });

    // Scroll to zoom
    overlay.addEventListener('wheel', function(e) {
        e.preventDefault();
        zoomLevel += e.deltaY > 0 ? -0.2 : 0.2;
        zoomLevel = Math.max(0.5, Math.min(5, zoomLevel));
        img.style.transform = 'scale(' + zoomLevel + ')';
        if (zoomLevel <= 1) {
            img.style.cursor = 'zoom-in';
        } else {
            img.style.cursor = 'zoom-out';
        }
    });

    // Close with Escape
    var keyHandler = function(e) {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }
    };
    document.addEventListener('keydown', keyHandler);

    document.body.appendChild(overlay);
}

// ========================================================================
// HANDLE SEND (Share)
// ========================================================================

async function handleSend() {
    // Show share modal
    var lang = state.lang || l10n.en;

    // Build product summary for sharing
    var p = state.product;
    var subject = 'Product: ' + (p.title || p.code || 'Untitled');
    var body = 'Product: ' + (p.title || '') + '\nCode: ' + (p.code || '') + '\nDescription:\n' + (p.description || '') + '\n\nOpen the attached .prod file to view full details.';

    var shareModal = document.createElement('div');
    shareModal.className = 'modal-overlay';
    shareModal.style.display = 'flex';
    shareModal.id = 'share-modal';
    shareModal.addEventListener('click', function(e) {
        if (e.target === shareModal) shareModal.remove();
    });

    var mailtoUrl = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

    shareModal.innerHTML = '<div class="modal" onclick="event.stopPropagation()">' +
        '<h3>' + escapeHtml('📤 Share') + '</h3>' +
        '<p style="margin-bottom:16px;color:var(--text-secondary);font-size:13px">' + escapeHtml(state.filepath || '') + '</p>' +
        '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<button class="btn" id="share-email-btn" style="justify-content:center">📧 ' + escapeHtml('Email') + '</button>' +
        '<button class="btn" id="share-copy-btn" style="justify-content:center">📋 ' + escapeHtml('Copy info to clipboard') + '</button>' +
        '</div>' +
        '<div class="modal-actions"><button class="btn" onclick="document.getElementById(\'share-modal\').remove()">' + escapeHtml(lang.close) + '</button></div>' +
        '</div>';

    document.body.appendChild(shareModal);

    // Wire email button — opens via OS through Python backend
    setTimeout(function() {
        var emailBtn = document.getElementById('share-email-btn');
        if (emailBtn) {
            emailBtn.addEventListener('click', function() {
                var mailtoUrl = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
                api.openUrl(mailtoUrl);
            });
        }
        var copyBtn = document.getElementById('share-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                var info = 'Product: ' + (p.title || '') + '\nCode: ' + (p.code || '') + '\nFile: ' + (state.filepath || '');
                navigator.clipboard.writeText(info).then(function() {
                    copyBtn.textContent = '✅ Copied!';
                    setTimeout(function() { copyBtn.textContent = '📋 Copy info to clipboard'; }, 2000);
                });
            });
        }
    }, 100);
}

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

async function _showConfirmDialog(msg) {
    return confirm(msg);
}
