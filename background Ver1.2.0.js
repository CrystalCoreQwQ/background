// ==UserScript==
// @name         通用背景板
// @namespace    https://github.com/CrystalCoreQwQ/background
// @version      1.2.0
// @description  上传图片/视频裁剪为网页背景，亮度/模糊/饱和度可调，代码框永久透明，右侧侧边栏玻璃质感鼠标靠近自动展开，支持随机背景与每个网站单独设置
// @author       CrystalCore
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_getResourceText
// @resource     cropperCSS https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css
// @require      https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';
    if (window.top !== window.self) return;

    GM_addStyle(GM_getResourceText('cropperCSS'));

    // ======================= IndexedDB 媒体存储 =======================
    const DB_NAME = 'bgMediaDB';
    const STORE_NAME = 'media';

    function openDB() {
        return new Promise((resolve, reject) => {
            const r = indexedDB.open(DB_NAME, 1);
            r.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
            };
            r.onsuccess = e => resolve(e.target.result);
            r.onerror = e => reject(e.target.error);
        });
    }

    async function dbAdd(media) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.add(media);
        return new Promise((res, rej) => {
            tx.oncomplete = () => res(req.result);
            tx.onerror = rej;
            req.onerror = rej;
        });
    }

    async function dbGet(id) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(Number(id));
        return new Promise((res, rej) => {
            req.onsuccess = () => res(req.result);
            req.onerror = rej;
        });
    }

    async function dbDelete(id) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(Number(id));
        return new Promise((res, rej) => {
            tx.oncomplete = res;
            tx.onerror = rej;
        });
    }

    async function dbUpdate(id, updates) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(Number(id));
        getReq.onsuccess = () => {
            const m = getReq.result;
            if (m) Object.assign(m, updates);
            store.put(m);
        };
        return new Promise((res, rej) => {
            tx.oncomplete = res;
            tx.onerror = rej;
        });
    }

    async function dbAllMedia(domain) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        return new Promise((res, rej) => {
            req.onsuccess = () => {
                const all = req.result || [];
                res(domain ? all.filter(m => m.domain === domain) : all);
            };
            req.onerror = rej;
        });
    }

    async function dbClearDomain(domain) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.openCursor();
        req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
                if (cursor.value.domain === domain) cursor.delete();
                cursor.continue();
            }
        };
        return new Promise((res, rej) => {
            tx.oncomplete = res;
            tx.onerror = rej;
        });
    }

    function media2url(media, track) {
        let url;
        if (media.type === 'image') {
            if (typeof media.data === 'string') {
                url = media.data;
            } else {
                url = URL.createObjectURL(new Blob([media.data], { type: media.mime || 'image/jpeg' }));
                if (track) trackObjectUrl(url);
            }
        } else {
            url = URL.createObjectURL(new Blob([media.data], { type: media.mime }));
            if (track) trackObjectUrl(url);
        }
        return url;
    }

    // ======================= 全局样式 =======================
    GM_addStyle(`
        /* ---------- 背景层 ---------- */
        #bg-custom-layer {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
            z-index: -2147483648 !important;
            background-repeat: no-repeat !important;
            background-position: center !important;
            background-size: cover !important;
            transition: filter 0.15s;
            background-color: transparent;
            display: none;
            overflow: hidden !important;
        }
        #bg-custom-layer video {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            display: block !important;
            pointer-events: none !important;
        }

        /* ---------- 代码框永久透明 ---------- */
        pre, code, .code, .syntax-highlighter, .hljs, .sh__code, .prettyprint, .source-code,
        pre[class*="language-"], code[class*="language-"], .token, .highlight,
        .sh_sourceCode, .sh_container, .sh_code_block, .katex, .md-fences,
        .cm-s-default, .CodeMirror, .editor, .monaco-editor, .ace_editor,
        .gatsby-highlight, .chroma, .highlight pre, .linenodiv pre {
            background-color: transparent !important;
            background: transparent !important;
        }

        /* ---------- 通用容器透明 ---------- */
        .main, .main-container, .container, .content, .article, .post, .page,
        .card, .panel, .widget, .box, .section, .wrapper,
        .luogu-main, .problem-card, .solution-card, .discussion-card,
        .am-main, .am-card, .am-panel,
        .comments, .comment-list, .comment-item,
        .sidebar, .aside, .side,
        .footer, .foot {
            background-color: transparent !important;
        }

        /* ---------- 极致透明（始终开启） ---------- */
        .bg-extreme-transparent *:not(#bg-sidebar):not(#bg-sidebar *):not(#bg-sidebar-trigger):not(#bg-custom-layer):not(#bg-cropper-modal):not(#bg-cropper-modal *):not(#bg-toast) {
            background-color: transparent !important;
            background-image: none !important;
        }
        .bg-extreme-transparent *::before,
        .bg-extreme-transparent *::after {
            background-color: transparent !important;
            background-image: none !important;
        }

        /* 覆盖型元素不透明，遮挡下层内容 */
        .bg-extreme-transparent .modal,
        .bg-extreme-transparent .modal-dialog,
        .bg-extreme-transparent .modal-content,
        .bg-extreme-transparent .dropdown-menu,
        .bg-extreme-transparent .popup,
        .bg-extreme-transparent .popover,
        .bg-extreme-transparent .tooltip,
        .bg-extreme-transparent [role="dialog"],
        .bg-extreme-transparent [class*="-modal"]:not([class*="modal-trigger"]):not([class*="modal-open"]):not([class*="modal-backdrop"]),
        .bg-extreme-transparent [class*="-dropdown-menu"],
        .bg-extreme-transparent [class*="-popup"]:not([class*="popup-trigger"]),
        .bg-extreme-transparent .am-modal-dialog,
        .bg-extreme-transparent .am-dropdown-content,
        .bg-extreme-transparent .am-popup {
            background-color: rgba(255, 255, 255, 0.98) !important;
            background-image: none !important;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        .bg-extreme-transparent header,
        .bg-extreme-transparent nav,
        .bg-extreme-transparent .top-bar,
        .bg-extreme-transparent .navbar,
        .bg-extreme-transparent .header {
            background-color: rgba(255, 255, 255, var(--bg-nav-opacity, 0.85)) !important;
        }
        .bg-extreme-transparent footer,
        .bg-extreme-transparent .footer {
            background-color: rgba(255, 255, 255, var(--bg-footer-opacity, 0.75)) !important;
        }

        /* ================= 右侧侧边栏（玻璃质感 · 极致透明 · 遮盖下方） ================= */
        #bg-sidebar-trigger {
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 14px;
            height: 90px;
            background: rgba(45, 122, 255, 0.32);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border-radius: 8px 0 0 8px;
            z-index: 999998;
            cursor: pointer;
            transition: background 0.2s, width 0.2s;
            box-shadow: -2px 0 8px rgba(45, 122, 255, 0.18);
        }
        #bg-sidebar-trigger::after {
            content: '◀';
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            font-size: 10px;
            font-weight: bold;
        }
        #bg-sidebar-trigger:hover {
            background: rgba(45, 122, 255, 0.65);
            width: 18px;
        }

        #bg-sidebar {
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%) translateX(110%);
            width: 300px;
            max-height: 85vh;
            overflow-y: auto;
            background: rgba(255, 255, 255, 0.55);
            backdrop-filter: blur(32px) saturate(180%);
            -webkit-backdrop-filter: blur(32px) saturate(180%);
            border-radius: 16px 0 0 16px;
            border-left: 1px solid rgba(255, 255, 255, 0.55);
            box-shadow: -6px 0 30px rgba(0, 0, 0, 0.18);
            z-index: 999999;
            padding: 16px 14px;
            transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
            font-size: 13px;
            color: #2c3e50;
        }
        #bg-sidebar.open {
            transform: translateY(-50%) translateX(0);
        }
        #bg-sidebar::-webkit-scrollbar { width: 6px; }
        #bg-sidebar::-webkit-scrollbar-thumb { background: rgba(120, 120, 120, 0.5); border-radius: 3px; }

        #bg-sidebar .bg-sidebar-header {
            font-size: 16px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 14px;
            color: #2c3e50;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
        }
        #bg-sidebar .bg-sidebar-section {
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(220, 220, 220, 0.6);
        }
        #bg-sidebar .bg-sidebar-section:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        #bg-sidebar .bg-section-title {
            font-size: 11px;
            font-weight: 600;
            color: #666;
            margin: 14px 0 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(220, 220, 220, 0.6);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        #bg-sidebar .bg-slider-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 8px 0;
        }
        #bg-sidebar .bg-slider-row label {
            min-width: 56px;
            font-size: 12px;
            color: #444;
            text-align: right;
        }
        #bg-sidebar .bg-slider-row input[type="range"] {
            flex: 1;
            -webkit-appearance: none;
            height: 6px;
            border-radius: 3px;
            background: rgba(200, 200, 200, 0.7);
            outline: none;
        }
        #bg-sidebar .bg-slider-row input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #2d7aff;
            border: 2px solid #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            cursor: pointer;
        }
        #bg-sidebar .bg-slider-row .bg-val {
            min-width: 42px;
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            color: #2980b9;
            background: rgba(234, 244, 251, 0.7);
            padding: 3px 6px;
            border-radius: 6px;
        }
        #bg-sidebar .bg-toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 8px 0;
        }
        #bg-sidebar .bg-toggle-row label {
            font-size: 12px;
            color: #444;
        }
        #bg-sidebar .bg-toggle-btn {
            padding: 6px 14px;
            border: none;
            border-radius: 6px;
            background: rgba(240, 240, 240, 0.85);
            color: #333;
            cursor: pointer;
            font-size: 12px;
            min-width: 70px;
            transition: background 0.2s;
        }
        #bg-sidebar .bg-toggle-btn:hover { background: rgba(224, 224, 224, 0.9); }
        #bg-sidebar .bg-toggle-btn.on { background: #2d7aff; color: #fff; }
        #bg-sidebar .bg-sidebar-btn {
            width: 100%;
            padding: 10px 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            background: rgba(245, 245, 245, 0.85);
            color: #333;
            transition: background 0.2s;
        }
        #bg-sidebar .bg-sidebar-btn:hover { background: rgba(232, 232, 232, 0.9); }
        #bg-sidebar .bg-btn-primary {
            background: #2d7aff;
            color: #fff;
        }
        #bg-sidebar .bg-btn-primary:hover { background: #1a5fdb; }
        #bg-sidebar .bg-sidebar-footer {
            display: flex;
            gap: 8px;
        }
        #bg-sidebar .bg-sidebar-footer .bg-sidebar-btn {
            flex: 1;
            font-size: 12px;
            padding: 9px 6px;
        }

        /* ---------- 媒体列表 ---------- */
        #bg-sidebar .bg-media-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 10px;
            max-height: 170px;
            overflow-y: auto;
            padding: 2px;
        }
        #bg-sidebar .bg-media-empty {
            display: block;
            width: 100%;
            text-align: center;
            font-size: 12px;
            color: #888;
            padding: 10px 0;
        }
        #bg-sidebar .bg-media-item {
            position: relative;
            width: 50px;
            height: 50px;
            border-radius: 6px;
            overflow: hidden;
            border: 2px solid transparent;
            cursor: pointer;
            box-sizing: border-box;
            transition: border-color 0.2s, transform 0.2s;
        }
        #bg-sidebar .bg-media-item:hover { transform: scale(1.04); }
        #bg-sidebar .bg-media-item.active { border-color: #2d7aff; }
        #bg-sidebar .bg-media-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        #bg-sidebar .bg-media-video-icon {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            background: #e0e0e0;
        }
        #bg-sidebar .bg-media-delete {
            position: absolute;
            top: 0;
            right: 0;
            width: 18px;
            height: 18px;
            background: rgba(231, 76, 60, 0.9);
            color: #fff;
            border: none;
            font-size: 12px;
            line-height: 1;
            padding: 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
            border-radius: 0 0 0 4px;
        }
        #bg-sidebar .bg-media-loop {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 18px;
            height: 18px;
            background: rgba(0, 0, 0, 0.55);
            color: #fff;
            border: none;
            font-size: 10px;
            line-height: 1;
            padding: 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
            border-radius: 0 4px 0 0;
        }

        /* ================= Toast ================= */
        #bg-toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 1000002;
            padding: 12px 20px;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: opacity 0.3s;
            opacity: 0;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
        }

        /* ================= 裁剪弹窗 ================= */
        #bg-cropper-modal {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000000;
        }
        #bg-cropper-modal .bg-cropper-container {
            background: #fff;
            border-radius: 8px;
            padding: 20px;
            max-width: 95vw;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        }
        #bg-cropper-modal .bg-cropper-header {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 12px;
            text-align: center;
        }
        #bg-cropper-modal .bg-image-wrapper { max-width: 80vw; max-height: 60vh; }
        #bg-cropper-modal .bg-image-wrapper img { max-width: 100%; max-height: 100%; display: block; }
        #bg-cropper-modal .bg-cropper-actions { margin-top: 10px; text-align: right; }
        #bg-cropper-modal .bg-cropper-actions button {
            padding: 8px 16px;
            margin-left: 8px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #bg-cropper-modal .bg-cancel-btn { background: #f0f0f0; }
        #bg-cropper-modal .bg-confirm-btn { background: #2d7aff; color: #fff; }
    `);

    const htmlBodyStyle = document.createElement('style');
    htmlBodyStyle.id = 'bg-html-body-style';
    htmlBodyStyle.textContent = `
        .bg-active html, .bg-active body {
            background-color: transparent !important;
            background-image: none !important;
        }
    `;
    document.head.appendChild(htmlBodyStyle);

    // ======================= 存储 =======================
    const STORE_KEY = 'bgSettingsV3';
    const LEGACY_KEY = 'bgSettingsV2';
    const DEFAULT_DOMAIN = 'default';

    function getCurrentDomain() {
        return window.location.hostname || DEFAULT_DOMAIN;
    }

    function getAllSettings() {
        let settings = GM_getValue(STORE_KEY, null);
        if (!settings) {
            const old = GM_getValue(LEGACY_KEY, null);
            if (old && typeof old === 'object') {
                Object.keys(old).forEach(domain => {
                    const s = old[domain];
                    if (s && typeof s === 'object') {
                        delete s.extremeMode;
                        if (s.blur === 0 || s.blur === undefined) s.blur = 4;
                        if (s.saturation === undefined) s.saturation = 100;
                        if (s.navOpacity === undefined) s.navOpacity = 0.85;
                        if (s.cardOpacity === undefined) s.cardOpacity = 0.88;
                        if (s.footerOpacity === undefined) s.footerOpacity = 0.75;
                    }
                });
                settings = old;
                GM_setValue(STORE_KEY, settings);
                console.log('[背景] 已迁移旧设置到 V3');
            } else {
                settings = { [DEFAULT_DOMAIN]: {} };
            }
        }
        return settings;
    }

    function saveAllSettings(settings) {
        GM_setValue(STORE_KEY, settings);
    }

    function getCurrentSettings() {
        const settings = getAllSettings();
        const domain = getCurrentDomain();
        const base = settings[domain] || settings[DEFAULT_DOMAIN] || {};
        return {
            currentBgId: base.currentBgId !== undefined ? base.currentBgId : null,
            bright: base.bright !== undefined ? base.bright : 100,
            blur: base.blur !== undefined ? base.blur : 4,
            saturation: base.saturation !== undefined ? base.saturation : 100,
            enabled: base.enabled !== undefined ? base.enabled : false,
            navOpacity: base.navOpacity !== undefined ? base.navOpacity : 0.85,
            cardOpacity: base.cardOpacity !== undefined ? base.cardOpacity : 0.88,
            footerOpacity: base.footerOpacity !== undefined ? base.footerOpacity : 0.75,
            randomBg: base.randomBg !== undefined ? base.randomBg : true
        };
    }

    function saveCurrentSettings(newSettings) {
        const settings = getAllSettings();
        const domain = getCurrentDomain();
        settings[domain] = { ...(settings[domain] || {}), ...newSettings };
        saveAllSettings(settings);
    }

    async function migrateLegacyImages() {
        const settings = getAllSettings();
        let changed = false;
        for (const domain of Object.keys(settings)) {
            const base = settings[domain];
            if (base && base.image && !base.currentBgId) {
                try {
                    const id = await dbAdd({
                        domain,
                        type: 'image',
                        data: base.image,
                        mime: 'image/jpeg',
                        lastUsed: Date.now()
                    });
                    base.currentBgId = id;
                    delete base.image;
                    changed = true;
                } catch (e) {
                    console.error('[背景] 旧图片迁移失败', e);
                }
            } else if (base && base.image) {
                delete base.image;
                changed = true;
            }
        }
        if (changed) saveAllSettings(settings);
    }

    // ======================= 全局变量 =======================
    let bgLayer = null;
    let sidebarEl = null;
    let sidebarTrigger = null;
    let closeTimer = null;
    let backgroundEnabled = false;
    let activeObjectUrls = [];
    let saving = false;

    const state = {
        bright: 100,
        blur: 4,
        saturation: 100,
        navOpacity: 0.85,
        cardOpacity: 0.88,
        footerOpacity: 0.75
    };

    // ======================= ObjectURL 管理 =======================
    function trackObjectUrl(url) {
        activeObjectUrls.push(url);
        return url;
    }
    function revokeObjectUrls() {
        activeObjectUrls.forEach(u => URL.revokeObjectURL(u));
        activeObjectUrls = [];
    }

    // ======================= Toast =======================
    function toast(msg, type = 'info', duration = 2000) {
        let el = document.getElementById('bg-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'bg-toast';
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.style.background = type === 'ok' ? '#2ecc71' : (type === 'warn' ? '#e67e22' : '#2d7aff');
        el.style.opacity = '1';
        clearTimeout(el._timer);
        el._timer = setTimeout(() => { el.style.opacity = '0'; }, duration);
    }

    // ======================= 初始化 =======================
    async function init() {
        if (document.getElementById('bg-sidebar')) return;

        if (!document.getElementById('bg-custom-layer')) {
            bgLayer = document.createElement('div');
            bgLayer.id = 'bg-custom-layer';
            document.documentElement.insertBefore(bgLayer, document.documentElement.firstChild);
        } else {
            bgLayer = document.getElementById('bg-custom-layer');
        }

        await migrateLegacyImages();

        createSidebar();
        bindSidebarEvents();
        await loadSettingsToUI();
        await refreshMediaList();
        observeDOM();

        window.addEventListener('beforeunload', (e) => {
            if (saving) {
                e.preventDefault();
                e.returnValue = '背景保存中，离开可能丢失数据';
            }
        });
    }

    // ======================= 侧边栏 =======================
    function createSidebar() {
        sidebarTrigger = document.createElement('div');
        sidebarTrigger.id = 'bg-sidebar-trigger';
        document.body.appendChild(sidebarTrigger);

        sidebarEl = document.createElement('div');
        sidebarEl.id = 'bg-sidebar';
        sidebarEl.innerHTML = `
            <div class="bg-sidebar-header">🎨 背景设置</div>

            <div class="bg-section-title">媒体管理 (<span id="bg-media-count">0</span>)</div>
            <div class="bg-sidebar-section">
                <button class="bg-sidebar-btn bg-btn-primary" id="bg-upload-btn">📁 上传图片 / 视频</button>
                <input type="file" id="bg-file-input" accept="image/*,video/mp4,video/webm" style="display:none;">
                <div class="bg-media-list" id="bg-media-list"><span class="bg-media-empty">暂无媒体</span></div>
            </div>

            <div class="bg-section-title">图片效果</div>
            <div class="bg-sidebar-section">
                <div class="bg-slider-row">
                    <label>亮度</label>
                    <input type="range" id="bg-brightness-slider" min="0" max="200" step="1" value="100">
                    <span class="bg-val" id="bg-brightness-val">100%</span>
                </div>
                <div class="bg-slider-row">
                    <label>模糊</label>
                    <input type="range" id="bg-blur-slider" min="0" max="20" step="1" value="4">
                    <span class="bg-val" id="bg-blur-val">4px</span>
                </div>
                <div class="bg-slider-row">
                    <label>饱和度</label>
                    <input type="range" id="bg-saturation-slider" min="0" max="200" step="5" value="100">
                    <span class="bg-val" id="bg-saturation-val">100%</span>
                </div>
            </div>

            <div class="bg-section-title">区域透明度</div>
            <div class="bg-sidebar-section">
                <div class="bg-slider-row">
                    <label>导航栏</label>
                    <input type="range" id="bg-nav-slider" min="10" max="100" step="1" value="85">
                    <span class="bg-val" id="bg-nav-val">85%</span>
                </div>
                <div class="bg-slider-row">
                    <label>卡片</label>
                    <input type="range" id="bg-card-slider" min="10" max="100" step="1" value="88">
                    <span class="bg-val" id="bg-card-val">88%</span>
                </div>
                <div class="bg-slider-row">
                    <label>页脚</label>
                    <input type="range" id="bg-footer-slider" min="10" max="100" step="1" value="75">
                    <span class="bg-val" id="bg-footer-val">75%</span>
                </div>
            </div>

            <div class="bg-section-title">其它</div>
            <div class="bg-sidebar-section">
                <div class="bg-toggle-row">
                    <label>随机背景</label>
                    <button class="bg-toggle-btn on" id="bg-random-btn">开启</button>
                </div>
                <div class="bg-toggle-row">
                    <label>背景开关</label>
                    <button class="bg-toggle-btn" id="bg-toggle-bg-btn">关闭</button>
                </div>
            </div>

            <div class="bg-sidebar-section bg-sidebar-footer">
                <button class="bg-sidebar-btn" id="bg-reset-btn">🔄 重置</button>
                <button class="bg-sidebar-btn" id="bg-set-default-btn">⭐ 设为默认</button>
            </div>
        `;
        document.body.appendChild(sidebarEl);

        sidebarTrigger.addEventListener('mouseenter', openSidebar);
        sidebarEl.addEventListener('mouseenter', openSidebar);
        sidebarTrigger.addEventListener('mouseleave', scheduleClose);
        sidebarEl.addEventListener('mouseleave', scheduleClose);
    }

    function openSidebar() {
        clearTimeout(closeTimer);
        sidebarEl.classList.add('open');
    }

    function scheduleClose() {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => sidebarEl.classList.remove('open'), 400);
    }

    // ======================= 事件绑定 =======================
    function bindSidebarEvents() {
        const fileInput = document.getElementById('bg-file-input');

        document.getElementById('bg-upload-btn').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.type.startsWith('image/')) {
                showCropper(file);
            } else if (file.type.startsWith('video/')) {
                await handleVideoUpload(file);
            } else {
                toast('请选择图片或视频文件', 'warn');
            }
            e.target.value = '';
        });

        bindSlider('bg-brightness-slider', 'bg-brightness-val',
            v => v + '%',
            v => { state.bright = v; applyFiltersLive(); },
            () => saveCurrentUI());

        bindSlider('bg-blur-slider', 'bg-blur-val',
            v => v + 'px',
            v => { state.blur = v; applyFiltersLive(); },
            () => saveCurrentUI());

        bindSlider('bg-saturation-slider', 'bg-saturation-val',
            v => v + '%',
            v => { state.saturation = v; applyFiltersLive(); },
            () => saveCurrentUI());

        bindSlider('bg-nav-slider', 'bg-nav-val',
            v => v + '%',
            v => { state.navOpacity = v / 100; updateOpacityVars(); },
            () => saveCurrentUI());
        bindSlider('bg-card-slider', 'bg-card-val',
            v => v + '%',
            v => { state.cardOpacity = v / 100; updateOpacityVars(); },
            () => saveCurrentUI());
        bindSlider('bg-footer-slider', 'bg-footer-val',
            v => v + '%',
            v => { state.footerOpacity = v / 100; updateOpacityVars(); },
            () => saveCurrentUI());

        document.getElementById('bg-random-btn').addEventListener('click', toggleRandomBg);
        document.getElementById('bg-toggle-bg-btn').addEventListener('click', toggleBackground);
        document.getElementById('bg-reset-btn').addEventListener('click', resetCurrentDomain);
        document.getElementById('bg-set-default-btn').addEventListener('click', () => {
            if (confirm('将当前设置（不含媒体）设为全局默认？')) setAsDefault();
        });
    }

    function bindSlider(sliderId, valId, fmt, onInput, onChange) {
        const slider = document.getElementById(sliderId);
        const valEl = document.getElementById(valId);
        slider.addEventListener('input', () => {
            const v = parseInt(slider.value, 10);
            valEl.textContent = fmt(v);
            onInput(v);
        });
        slider.addEventListener('change', onChange);
    }

    function updateOpacityVars() {
        const root = document.documentElement.style;
        root.setProperty('--bg-nav-opacity', state.navOpacity);
        root.setProperty('--bg-card-opacity', state.cardOpacity);
        root.setProperty('--bg-footer-opacity', state.footerOpacity);
    }

    function applyFiltersLive() {
        if (!bgLayer) return;
        bgLayer.style.filter = `brightness(${state.bright}%) blur(${state.blur}px) saturate(${state.saturation}%)`;
    }

    // ======================= 设置 UI 同步 =======================
    async function loadSettingsToUI() {
        const s = getCurrentSettings();
        state.bright = s.bright;
        state.blur = s.blur;
        state.saturation = s.saturation;
        state.navOpacity = s.navOpacity;
        state.cardOpacity = s.cardOpacity;
        state.footerOpacity = s.footerOpacity;

        const setS = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        const setT = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
        setS('bg-brightness-slider', s.bright);   setT('bg-brightness-val', s.bright + '%');
        setS('bg-blur-slider', s.blur);           setT('bg-blur-val', s.blur + 'px');
        setS('bg-saturation-slider', s.saturation); setT('bg-saturation-val', s.saturation + '%');
        setS('bg-nav-slider', Math.round(s.navOpacity * 100));   setT('bg-nav-val', Math.round(s.navOpacity * 100) + '%');
        setS('bg-card-slider', Math.round(s.cardOpacity * 100)); setT('bg-card-val', Math.round(s.cardOpacity * 100) + '%');
        setS('bg-footer-slider', Math.round(s.footerOpacity * 100)); setT('bg-footer-val', Math.round(s.footerOpacity * 100) + '%');

        const randomBtn = document.getElementById('bg-random-btn');
        if (randomBtn) {
            randomBtn.textContent = s.randomBg ? '开启' : '关闭';
            randomBtn.classList.toggle('on', s.randomBg);
        }

        updateToggleBgBtn();
        applyFiltersLive();
        updateOpacityVars();

        await applyCurrentBackground();
    }

    function updateToggleBgBtn() {
        const btn = document.getElementById('bg-toggle-bg-btn');
        if (!btn) return;
        const enabled = getCurrentSettings().enabled;
        btn.textContent = enabled ? '开启' : '关闭';
        btn.classList.toggle('on', enabled);
    }

    function saveCurrentUI() {
        saveCurrentSettings({
            bright: state.bright,
            blur: state.blur,
            saturation: state.saturation,
            navOpacity: state.navOpacity,
            cardOpacity: state.cardOpacity,
            footerOpacity: state.footerOpacity
        });
    }

    // ======================= 背景应用 =======================
    async function applyCurrentBackground() {
        const s = getCurrentSettings();
        const all = await dbAllMedia(getCurrentDomain());
        const shouldActivate = s.enabled && all.length > 0;

        backgroundEnabled = shouldActivate;
        updateToggleBgBtn();

        if (!shouldActivate) {
            hideBackground();
            document.documentElement.classList.remove('bg-active');
            document.documentElement.classList.remove('bg-extreme-transparent');
            return;
        }

        document.documentElement.classList.add('bg-active');
        document.documentElement.classList.add('bg-extreme-transparent');

        const media = await selectMedia(s, all);
        if (media) renderMedia(media);
    }

    async function selectMedia(s, all) {
        if (!all || !all.length) return null;
        if (!s.randomBg && s.currentBgId) {
            const found = all.find(m => m.id == s.currentBgId);
            if (found) return found;
        }
        const now = Date.now();
        const weights = all.map(m => Math.max(1, now - (m.lastUsed || 0)));
        const total = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;
        let picked = all[0];
        for (let i = 0; i < all.length; i++) {
            rand -= weights[i];
            if (rand <= 0) { picked = all[i]; break; }
        }
        await dbUpdate(picked.id, { lastUsed: now });
        saveCurrentSettings({ currentBgId: picked.id });
        return picked;
    }

    function renderMedia(media) {
        revokeObjectUrls();
        bgLayer.innerHTML = '';
        bgLayer.style.display = 'block';

        if (media.type === 'image') {
            const url = media2url(media, true);
            bgLayer.style.backgroundImage = `url('${url}')`;
        } else {
            bgLayer.style.backgroundImage = 'none';
            const url = media2url(media, true);
            const v = document.createElement('video');
            v.src = url;
            v.autoplay = true;
            v.muted = true;
            v.playsInline = true;
            v.loop = media.loop !== false;
            bgLayer.appendChild(v);
        }
        applyFiltersLive();
    }

    function hideBackground() {
        revokeObjectUrls();
        if (!bgLayer) return;
        bgLayer.innerHTML = '';
        bgLayer.style.backgroundImage = 'none';
        bgLayer.style.display = 'none';
    }

    // ======================= 媒体列表 =======================
    async function refreshMediaList() {
        const list = document.getElementById('bg-media-list');
        const countEl = document.getElementById('bg-media-count');
        if (!list) return;

        const all = await dbAllMedia(getCurrentDomain());
        const s = getCurrentSettings();
        if (countEl) countEl.textContent = all.length;

        if (!all.length) {
            list.innerHTML = '<span class="bg-media-empty">暂无媒体</span>';
            return;
        }

        list.innerHTML = all.map(m => {
            const active = (s.currentBgId != null && m.id == s.currentBgId) ? ' active' : '';
            if (m.type === 'image') {
                return `<div class="bg-media-item${active}" data-id="${m.id}">
                    <img src="${m.data}" alt="">
                    <button class="bg-media-delete" data-delete="${m.id}" title="删除">×</button>
                </div>`;
            }
            const loopIcon = m.loop !== false ? '🔁' : '▶';
            return `<div class="bg-media-item${active}" data-id="${m.id}">
                <div class="bg-media-video-icon">🎥</div>
                <button class="bg-media-delete" data-delete="${m.id}" title="删除">×</button>
                <button class="bg-media-loop" data-loop="${m.id}" title="循环播放">${loopIcon}</button>
            </div>`;
        }).join('');

        list.querySelectorAll('.bg-media-item').forEach(item => {
            item.addEventListener('click', async e => {
                if (e.target.closest('.bg-media-delete') || e.target.closest('.bg-media-loop')) return;
                const id = Number(item.dataset.id);
                saveCurrentSettings({ currentBgId: id, enabled: true, randomBg: false });
                await loadSettingsToUI();
                await refreshMediaList();
                toast('已切换背景', 'ok');
            });
        });

        list.querySelectorAll('.bg-media-delete').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                const id = btn.dataset.delete;
                if (!confirm('确定删除此媒体？')) return;
                await dbDelete(id);
                const s2 = getCurrentSettings();
                if (s2.currentBgId == id) {
                    saveCurrentSettings({ currentBgId: null });
                }
                await applyCurrentBackground();
                await refreshMediaList();
                toast('已删除', 'ok');
            });
        });

        list.querySelectorAll('.bg-media-loop').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                const id = btn.dataset.loop;
                const m = await dbGet(id);
                if (m && m.type === 'video') {
                    const newLoop = m.loop === false;
                    await dbUpdate(id, { loop: newLoop });
                    btn.textContent = newLoop ? '🔁' : '▶';
                    if (getCurrentSettings().currentBgId == id) {
                        await applyCurrentBackground();
                    }
                }
            });
        });
    }

    // ======================= 切换 =======================
    async function toggleRandomBg() {
        const s = getCurrentSettings();
        const newValue = !s.randomBg;
        saveCurrentSettings({ randomBg: newValue });
        const btn = document.getElementById('bg-random-btn');
        if (btn) {
            btn.textContent = newValue ? '开启' : '关闭';
            btn.classList.toggle('on', newValue);
        }
        await applyCurrentBackground();
        toast('随机背景：' + (newValue ? '开启' : '关闭'));
    }

    async function toggleBackground() {
        const s = getCurrentSettings();
        if (!s.enabled) {
            const all = await dbAllMedia(getCurrentDomain());
            if (all.length === 0) {
                toast('请先上传背景图片或视频', 'warn');
                return;
            }
            saveCurrentSettings({ enabled: true });
        } else {
            saveCurrentSettings({ enabled: false });
        }
        await applyCurrentBackground();
    }

    async function resetCurrentDomain() {
        if (!confirm('确定重置当前网站的背景？所有媒体与设置将被清除。')) return;
        await dbClearDomain(getCurrentDomain());
        const settings = getAllSettings();
        delete settings[getCurrentDomain()];
        saveAllSettings(settings);
        backgroundEnabled = false;
        hideBackground();
        document.documentElement.classList.remove('bg-active');
        document.documentElement.classList.remove('bg-extreme-transparent');
        await loadSettingsToUI();
        await refreshMediaList();
        toast('已重置', 'ok');
    }

    function setAsDefault() {
        const current = getCurrentSettings();
        const settings = getAllSettings();
        const copy = {
            bright: current.bright,
            blur: current.blur,
            saturation: current.saturation,
            navOpacity: current.navOpacity,
            cardOpacity: current.cardOpacity,
            footerOpacity: current.footerOpacity,
            randomBg: current.randomBg
        };
        settings[DEFAULT_DOMAIN] = { ...(settings[DEFAULT_DOMAIN] || {}), ...copy };
        saveAllSettings(settings);
        toast('已设为全局默认', 'ok');
    }

    // ======================= DOM 观察（动态代码框透明） =======================
    function observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.matches && node.matches('pre, code, .code, .hljs, .sh__code, .sh_sourceCode')) {
                            node.style.setProperty('background-color', 'transparent', 'important');
                        }
                        if (node.querySelectorAll) {
                            node.querySelectorAll('pre, code, .code, .hljs, .sh__code, .sh_sourceCode').forEach(el => {
                                el.style.setProperty('background-color', 'transparent', 'important');
                            });
                        }
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ======================= 视频上传 =======================
    async function handleVideoUpload(file) {
        saving = true;
        try {
            const buf = await file.arrayBuffer();
            const id = await dbAdd({
                domain: getCurrentDomain(),
                type: 'video',
                data: buf,
                mime: file.type,
                loop: true,
                lastUsed: Date.now()
            });
            saveCurrentSettings({ currentBgId: id, enabled: true, randomBg: false });
            await loadSettingsToUI();
            await refreshMediaList();
            toast('视频背景已应用', 'ok');
        } catch (e) {
            console.error(e);
            toast('视频保存失败：' + e.message, 'warn');
        } finally {
            saving = false;
        }
    }

    // ======================= 图片裁剪 =======================
    function showCropper(file) {
        const modal = document.createElement('div');
        modal.id = 'bg-cropper-modal';
        modal.innerHTML = `
            <div class="bg-cropper-container">
                <div class="bg-cropper-header">✂️ 裁剪区域（比例锁定为当前窗口）</div>
                <div class="bg-image-wrapper"><img id="bg-crop-image" src=""></div>
                <div class="bg-cropper-actions">
                    <button class="bg-cancel-btn" id="bg-crop-cancel">取消</button>
                    <button class="bg-confirm-btn" id="bg-crop-confirm">确认裁剪</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const reader = new FileReader();
        reader.onload = (e) => {
            const imgSrc = e.target.result;
            const img = document.getElementById('bg-crop-image');
            img.src = imgSrc;
            img.onload = () => {
                const aspect = window.innerWidth / window.innerHeight;
                const cropper = new Cropper(img, {
                    aspectRatio: aspect,
                    viewMode: 1,
                    dragMode: 'move',
                    autoCropArea: 0.8,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    background: false
                });

                document.getElementById('bg-crop-confirm').addEventListener('click', async () => {
                    saving = true;
                    try {
                        const maxW = Math.min(2560, window.innerWidth * 2);
                        const maxH = Math.round(maxW / aspect);
                        const canvas = cropper.getCroppedCanvas({
                            maxWidth: maxW,
                            maxHeight: maxH,
                            fillColor: '#fff',
                            imageSmoothingQuality: 'high'
                        });

                        let quality = 0.92;
                        let dataURL;
                        do {
                            dataURL = canvas.toDataURL('image/jpeg', quality);
                            quality -= 0.05;
                        } while (dataURL.length > 3_500_000 && quality > 0.6);

                        const id = await dbAdd({
                            domain: getCurrentDomain(),
                            type: 'image',
                            data: dataURL,
                            mime: 'image/jpeg',
                            lastUsed: Date.now()
                        });

                        if (state.blur === 0) {
                            state.blur = 4;
                            const blurSlider = document.getElementById('bg-blur-slider');
                            const blurVal = document.getElementById('bg-blur-val');
                            if (blurSlider) blurSlider.value = 4;
                            if (blurVal) blurVal.textContent = '4px';
                        }

                        saveCurrentSettings({ currentBgId: id, enabled: true, randomBg: false });
                        await loadSettingsToUI();
                        await refreshMediaList();
                        toast('背景已应用', 'ok');
                    } catch (err) {
                        console.error(err);
                        toast('裁剪失败：' + err.message, 'warn');
                    } finally {
                        saving = false;
                        modal.remove();
                        cropper.destroy();
                    }
                });

                document.getElementById('bg-crop-cancel').addEventListener('click', () => {
                    modal.remove();
                    cropper.destroy();
                });

                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                        cropper.destroy();
                    }
                });
            };
        };
        reader.readAsDataURL(file);
    }

    // ======================= 启动 =======================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init());
    } else {
        init();
    }
})();
