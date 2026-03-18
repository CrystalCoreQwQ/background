// ==UserScript==
// @name         通用背景板
// @namespace    https://github.com/CrystalCoreQwQ/background
// @version      1.0
// @description  上传图片裁剪为网页背景，亮度/模糊可调，智能文字颜色，代码框永久透明，极致覆盖，支持每个网站单独设置，悬浮球双击展开/收缩
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

(function() {
    'use strict';
    if (window.top !== window.self) return;

    // ---------- 加载Cropper样式 ----------
    GM_addStyle(GM_getResourceText('cropperCSS'));

    // ---------- 全局样式：背景层 + 代码框透明 + 极致透明 + 环绕小球面板 ----------
    GM_addStyle(`
        /* 彻底移除html和body的背景 */
        html, body {
            background-color: transparent !important;
            background-image: none !important;
        }
        /* 背景层挂载在html下 */
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
        }

        /* ===== 代码框永久透明 ===== */
        pre, code, .code, .syntax-highlighter, .hljs, .sh__code, .prettyprint, .source-code,
        pre[class*="language-"], code[class*="language-"], .token, .highlight,
        .sh_sourceCode, .sh_container, .sh_code_block, .katex, .md-fences,
        .cm-s-default, .CodeMirror, .editor, .monaco-editor, .ace_editor,
        .gatsby-highlight, .chroma, .highlight pre, .linenodiv pre {
            background-color: transparent !important;
            background: transparent !important;
        }

        /* ===== 基础透明（通用容器） ===== */
        .main, .main-container, .container, .content, .article, .post, .page,
        .card, .panel, .widget, .box, .section, .wrapper,
        .luogu-main, .problem-card, .solution-card, .discussion-card,
        .am-main, .am-card, .am-panel,
        .comments, .comment-list, .comment-item,
        .sidebar, .aside, .side,
        .footer, .foot {
            background-color: transparent !important;
        }

        /* ===== 极致透明模式 ===== */
        .bg-extreme-transparent *:not(#bg-master-panel):not(#bg-master-panel *):not(#bg-custom-layer) {
            background-color: transparent !important;
            background-image: none !important;
        }
        .bg-extreme-transparent *::before,
        .bg-extreme-transparent *::after {
            background-color: transparent !important;
            background-image: none !important;
        }

        /* ===== 环绕小球面板样式 ===== */
        #bg-master-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            user-select: none;
        }
        /* 中心球 */
        #bg-center-ball {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #2d7aff;
            box-shadow: 0 6px 20px rgba(45,122,255,0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            color: white;
            position: relative;
            z-index: 10;
        }
        /* 环绕小球容器 */
        #bg-orbit {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        /* 单个环绕球 */
        .bg-orbit-ball {
            position: absolute;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: #2d7aff;
            cursor: pointer;
            transition: all 0.3s ease;
            pointer-events: auto;
            opacity: 0;
            transform: scale(0);
            left: 50%;
            top: 50%;
            margin-left: -20px;
            margin-top: -20px;
        }
        .bg-orbit-ball.show {
            opacity: 1;
            transform: scale(1);
        }
        .bg-orbit-ball:hover {
            background: #2d7aff;
            color: white;
            transform: scale(1.1);
        }
        /* 工具提示 - 显示在下方，避免遮挡 */
        .bg-orbit-ball::after {
            content: attr(data-tooltip);
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
            margin-top: 6px;
            z-index: 100;
        }
        .bg-orbit-ball:hover::after {
            opacity: 1;
        }
        .bg-orbit-ball::before {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 5px;
            border-style: solid;
            border-color: transparent transparent rgba(0,0,0,0.8) transparent;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
            margin-top: -4px;
        }
        .bg-orbit-ball:hover::before {
            opacity: 1;
        }
        /* 更多面板 */
        #bg-more-panel {
            position: absolute;
            top: 60px;
            right: 0;
            background: #ffffffdd;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(200,200,200,0.5);
            border-radius: 12px;
            padding: 10px;
            display: none;
            flex-direction: column;
            gap: 5px;
            min-width: 120px;
            z-index: 20;
        }
        .bg-more-btn {
            background: #f0f0f0;
            border: none;
            border-radius: 20px;
            padding: 5px 12px;
            font-size: 12px;
            cursor: pointer;
            text-align: left;
        }
        .bg-more-btn:hover {
            background: #2d7aff;
            color: white;
        }
    `);

    // ---------- 存储结构 ----------
    const STORE_KEY = 'bgSettingsV2';
    const DEFAULT_DOMAIN = 'default';

    function getCurrentDomain() {
        return window.location.hostname;
    }

    function getAllSettings() {
        let settings = GM_getValue(STORE_KEY, null);
        if (!settings) {
            const oldImage = GM_getValue('bgImageData', null);
            const oldBright = GM_getValue('bgBrightness', 100);
            const oldBlur = GM_getValue('bgBlur', 0);
            const oldEnabled = GM_getValue('bgEnabled', true);
            const oldTextColorMode = GM_getValue('bgTextColorMode', 'auto');
            const oldExtremeMode = GM_getValue('bgExtremeMode', true);
            if (oldImage !== null) {
                settings = {
                    [DEFAULT_DOMAIN]: {
                        image: oldImage,
                        bright: oldBright,
                        blur: oldBlur,
                        enabled: oldEnabled,
                        textColorMode: oldTextColorMode,
                        extremeMode: oldExtremeMode
                    }
                };
                GM_setValue(STORE_KEY, settings);
                GM_setValue('bgImageData', null);
                GM_setValue('bgBrightness', null);
                GM_setValue('bgBlur', null);
                GM_setValue('bgEnabled', null);
                GM_setValue('bgTextColorMode', null);
                GM_setValue('bgExtremeMode', null);
                console.log('[背景] 已迁移旧版本设置');
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
        if (settings[domain]) {
            console.log(`[背景] 加载 ${domain} 的独立设置`);
            return { ...settings[domain] };
        } else if (settings[DEFAULT_DOMAIN]) {
            console.log(`[背景] ${domain} 无独立设置，使用默认`);
            return { ...settings[DEFAULT_DOMAIN] };
        } else {
            console.log(`[背景] 无任何设置，返回空`);
            return {};
        }
    }

    function saveCurrentSettings(newSettings) {
        const settings = getAllSettings();
        const domain = getCurrentDomain();
        settings[domain] = { ...(settings[domain] || {}), ...newSettings };
        saveAllSettings(settings);
        console.log(`[背景] 已保存设置到 ${domain}`, newSettings);
    }

    function setAsDefault() {
        const current = getCurrentSettings();
        const settings = getAllSettings();
        settings[DEFAULT_DOMAIN] = current;
        const domain = getCurrentDomain();
        delete settings[domain];
        saveAllSettings(settings);
        loadSettingsToUI();
        console.log('[背景] 已设为全局默认');
    }

    function applyToAllSites() {
        const current = getCurrentSettings();
        const settings = getAllSettings();
        settings[DEFAULT_DOMAIN] = current;
        Object.keys(settings).forEach(domain => {
            if (domain !== DEFAULT_DOMAIN) {
                settings[domain] = { ...current };
            }
        });
        saveAllSettings(settings);
        loadSettingsToUI();
        console.log('[背景] 已应用到所有网站');
    }

    // ---------- 全局变量 ----------
    let bgLayer = null;
    let textColorStyle = null;
    let currentTextColorMode = 'auto';
    let extremeModeEnabled = true;
    let panelState = {
        expanded: false,
        left: null,
        top: null
    };
    let isDragging = false;
    let dragStarted = false;

    // 环绕小球配置
    const orbitBalls = [
        { icon: '📁', tooltip: '上传背景', action: 'upload' },
        { icon: '☀️+', tooltip: '亮度 +10%', action: 'brightUp' },
        { icon: '☀️-', tooltip: '亮度 -10%', action: 'brightDown' },
        { icon: '🌀+', tooltip: '模糊 +1', action: 'blurUp' },
        { icon: '🌀-', tooltip: '模糊 -1', action: 'blurDown' },
        { icon: '🎨', tooltip: '文字颜色', action: 'textColor' },
        { icon: '🔮', tooltip: '极致透明', action: 'extremeToggle' },
        { icon: '⚙️', tooltip: '更多', action: 'more' }
    ];

    const moreButtons = [
        { label: '⭐ 设为全局默认', action: 'setDefault' },
        { label: '🌐 应用到所有', action: 'applyAll' },
        { label: '🧹 手动透明', action: 'forceTransparent' },
        { label: '🔍 调试遮罩', action: 'debug' }
    ];

    // ---------- 初始化 ----------
    function init() {
        if (document.getElementById('bg-master-panel')) return;

        if (!document.getElementById('bg-custom-layer')) {
            bgLayer = document.createElement('div');
            bgLayer.id = 'bg-custom-layer';
            document.documentElement.insertBefore(bgLayer, document.documentElement.firstChild);
        } else {
            bgLayer = document.getElementById('bg-custom-layer');
        }

        loadPanelState();

        const panel = document.createElement('div');
        panel.id = 'bg-master-panel';
        if (panelState.left !== null && panelState.top !== null) {
            panel.style.left = panelState.left + 'px';
            panel.style.top = panelState.top + 'px';
            panel.style.right = 'auto';
        }

        panel.innerHTML = `
            <div id="bg-center-ball">🎨</div>
            <div id="bg-orbit"></div>
            <div id="bg-more-panel"></div>
            <input type="file" id="bg-file-input" accept="image/*" style="display: none;">
        `;
        document.body.appendChild(panel);

        // 创建环绕球
        orbitBalls.forEach((ball, index) => {
            const ballEl = document.createElement('div');
            ballEl.className = 'bg-orbit-ball';
            ballEl.setAttribute('data-tooltip', ball.tooltip);
            ballEl.setAttribute('data-action', ball.action);
            ballEl.textContent = ball.icon;
            ballEl.style.display = 'none';
            document.getElementById('bg-orbit').appendChild(ballEl);
        });

        moreButtons.forEach(btn => {
            const btnEl = document.createElement('button');
            btnEl.className = 'bg-more-btn';
            btnEl.textContent = btn.label;
            btnEl.setAttribute('data-action', btn.action);
            document.getElementById('bg-more-panel').appendChild(btnEl);
        });

        loadSettingsToUI();
        bindEvents(panel);
        observeDOM();
    }

    function loadPanelState() {
        const stored = GM_getValue('bgPanelState', null);
        if (stored) panelState = stored;
    }

    function savePanelState() {
        GM_setValue('bgPanelState', panelState);
    }

    // 展开动画
    function expandPanel() {
        if (panelState.expanded) return;
        panelState.expanded = true;
        savePanelState();

        const orbit = document.getElementById('bg-orbit');
        const balls = orbit.children;
        for (let i = 0; i < balls.length; i++) {
            balls[i].style.display = 'flex';
            balls[i].style.opacity = '0';
            balls[i].style.transform = 'scale(0)';
            balls[i].style.left = '50%';
            balls[i].style.top = '50%';
        }

        const radius = 80;
        const count = balls.length;
        const baseDelay = 50;

        for (let i = 0; i < count; i++) {
            const ball = balls[i];
            const angle = (i / count) * 2 * Math.PI;
            const finalX = 50 + radius * Math.cos(angle) - 20;
            const finalY = 50 + radius * Math.sin(angle) - 20;

            setTimeout(() => {
                ball.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
                ball.style.opacity = '1';
                ball.style.transform = 'scale(1)';
                ball.style.left = finalX + 'px';
                ball.style.top = finalY + 'px';
            }, baseDelay * i);
        }
    }

    // 收缩动画
    function collapsePanel() {
        if (!panelState.expanded) return;
        panelState.expanded = false;
        savePanelState();

        const orbit = document.getElementById('bg-orbit');
        const balls = orbit.children;
        document.getElementById('bg-more-panel').style.display = 'none';

        const count = balls.length;
        const baseDelay = 50;

        for (let i = count - 1; i >= 0; i--) {
            const ball = balls[i];
            setTimeout(() => {
                ball.style.transition = 'all 0.2s ease';
                ball.style.opacity = '0';
                ball.style.transform = 'scale(0)';
                ball.style.left = '50%';
                ball.style.top = '50%';
            }, baseDelay * (count - 1 - i));
        }

        setTimeout(() => {
            for (let i = 0; i < balls.length; i++) {
                balls[i].style.display = 'none';
            }
        }, baseDelay * count + 200);
    }

    function togglePanel() {
        if (panelState.expanded) collapsePanel();
        else expandPanel();
    }

    function loadSettingsToUI() {
        const settings = getCurrentSettings();
        const image = settings.image || null;
        if (image) bgLayer.style.backgroundImage = `url('${image}')`;
        else bgLayer.style.backgroundImage = 'none';

        window._bgBright = settings.bright !== undefined ? settings.bright : 100;
        window._bgBlur = settings.blur !== undefined ? settings.blur : 0;
        window._bgEnabled = settings.enabled !== undefined ? settings.enabled : true;
        applyFilter(window._bgBright, window._bgBlur);

        const textMode = settings.textColorMode || 'auto';
        setTextColorMode(textMode, false);

        const extreme = settings.extremeMode !== undefined ? settings.extremeMode : true;
        if (extreme) {
            document.documentElement.classList.add('bg-extreme-transparent');
        } else {
            document.documentElement.classList.remove('bg-extreme-transparent');
        }
        extremeModeEnabled = extreme;
    }

    function saveCurrentUI() {
        let image = bgLayer.style.backgroundImage;
        if (image && image !== 'none' && image.startsWith('url("')) {
            image = image.slice(5, -2);
        } else {
            image = null;
        }
        const settings = {
            image: image,
            bright: window._bgBright !== undefined ? window._bgBright : 100,
            blur: window._bgBlur !== undefined ? window._bgBlur : 0,
            enabled: window._bgEnabled !== undefined ? window._bgEnabled : true,
            textColorMode: currentTextColorMode,
            extremeMode: extremeModeEnabled
        };
        if (!settings.image) delete settings.image;
        saveCurrentSettings(settings);
    }

    function applyFilter(bright, blur) {
        if (bgLayer) bgLayer.style.filter = `brightness(${bright}%) blur(${blur}px)`;
    }

    function setTextColorMode(mode, save = true) {
        currentTextColorMode = mode;
        if (save) saveCurrentUI();
        applyTextColor();
    }

    async function applyTextColor() {
        if (currentTextColorMode === 'auto') {
            const imgData = bgLayer.style.backgroundImage;
            if (imgData && imgData !== 'none' && imgData.startsWith('url("')) {
                const url = imgData.slice(5, -2);
                const color = await analyzeImageBrightness(url);
                setTextColor(color);
            } else {
                if (textColorStyle) textColorStyle.remove();
                textColorStyle = null;
            }
        } else {
            const color = currentTextColorMode === 'white' ? '#ffffff' : '#000000';
            setTextColor(color);
        }
    }

    function setTextColor(color) {
        if (textColorStyle) textColorStyle.remove();
        textColorStyle = document.createElement('style');
        textColorStyle.textContent = `
            html body, html p, html h1, html h2, html h3, html h4, html h5, html h6,
            html li, html a, html span, html div, html button, html input, html textarea,
            html select, html option, html label, html td, html th, html caption,
            html article, html section, html aside, html nav, html header, html footer {
                color: ${color} !important;
            }
            html a {
                color: ${color === '#000000' ? '#0066cc' : '#99ccff'} !important;
            }
        `;
        document.head.appendChild(textColorStyle);
    }

    function analyzeImageBrightness(dataURL) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const startX = Math.floor(img.width * 0.25);
                const startY = Math.floor(img.height * 0.25);
                const sampleWidth = Math.floor(img.width * 0.5);
                const sampleHeight = Math.floor(img.height * 0.5);
                const imageData = ctx.getImageData(startX, startY, sampleWidth, sampleHeight);
                const data = imageData.data;
                let sum = 0;
                for (let i = 0; i < data.length; i += 4) {
                    sum += data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
                }
                const avg = sum / (sampleWidth * sampleHeight);
                const textColor = avg > 128 ? '#000000' : '#ffffff';
                resolve(textColor);
            };
            img.src = dataURL;
        });
    }

    function forceCodeTransparent() {
        document.querySelectorAll('pre, code, .code, .hljs, .sh__code, .sh_sourceCode').forEach(el => {
            el.style.setProperty('background', 'transparent', 'important');
            el.style.setProperty('background-color', 'transparent', 'important');
        });
    }

    function observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
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

    function bindEvents(panel) {
        const centerBall = document.getElementById('bg-center-ball');
        const orbit = document.getElementById('bg-orbit');
        const morePanel = document.getElementById('bg-more-panel');
        const fileInput = document.getElementById('bg-file-input');

        let offsetX, offsetY;

        function startDrag(e) {
            if (e.target !== centerBall) return;
            if (panelState.expanded) return;
            isDragging = true;
            dragStarted = false;
            const rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            centerBall.style.cursor = 'grabbing';
            e.preventDefault();
        }

        function onDrag(e) {
            if (!isDragging) return;
            dragStarted = true;
            let left = e.clientX - offsetX;
            let top = e.clientY - offsetY;
            left = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, left));
            top = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, top));
            panel.style.left = left + 'px';
            panel.style.top = top + 'px';
            panel.style.right = 'auto';
            panelState.left = left;
            panelState.top = top;
        }

        function stopDrag() {
            if (isDragging) {
                isDragging = false;
                centerBall.style.cursor = 'pointer';
                savePanelState();
            }
            dragStarted = false; // 重置拖拽标记
        }

        centerBall.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);

        // 双击中心球切换展开/收缩
        centerBall.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            togglePanel();
        });

        // 点击事件委托（提高响应速度）
        orbit.addEventListener('click', (e) => {
            const ball = e.target.closest('.bg-orbit-ball');
            if (!ball) return;
            const action = ball.getAttribute('data-action');
            handleAction(action);
        });

        morePanel.addEventListener('click', (e) => {
            const btn = e.target.closest('.bg-more-btn');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            handleAction(action);
        });

        // 点击外部关闭更多面板
        document.addEventListener('click', (e) => {
            if (!morePanel.contains(e.target) && !e.target.closest('[data-action="more"]')) {
                morePanel.style.display = 'none';
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            showCropper(file);
            e.target.value = '';
        });

        function handleAction(action) {
            switch (action) {
                case 'upload': fileInput.click(); break;
                case 'brightUp': adjustBrightness(10); break;
                case 'brightDown': adjustBrightness(-10); break;
                case 'blurUp': adjustBlur(1); break;
                case 'blurDown': adjustBlur(-1); break;
                case 'textColor': cycleTextColor(); break;
                case 'extremeToggle': toggleExtreme(); break;
                case 'more': toggleMorePanel(); break;
                case 'setDefault': if (confirm('设为全局默认？')) setAsDefault(); morePanel.style.display = 'none'; break;
                case 'applyAll': if (confirm('应用到所有网站？')) applyToAllSites(); morePanel.style.display = 'none'; break;
                case 'forceTransparent': forceCodeTransparent(); morePanel.style.display = 'none'; break;
                case 'debug': toggleDebug(); morePanel.style.display = 'none'; break;
            }
        }

        function adjustBrightness(delta) {
            let bright = window._bgBright || 100;
            bright = Math.min(200, Math.max(0, bright + delta));
            window._bgBright = bright;
            applyFilter(bright, window._bgBlur || 0);
            saveCurrentUI();
        }

        function adjustBlur(delta) {
            let blur = window._bgBlur || 0;
            blur = Math.min(20, Math.max(0, blur + delta));
            window._bgBlur = blur;
            applyFilter(window._bgBright || 100, blur);
            saveCurrentUI();
        }

        function cycleTextColor() {
            const modes = ['auto', 'white', 'black'];
            const currentIndex = modes.indexOf(currentTextColorMode);
            const next = modes[(currentIndex + 1) % modes.length];
            setTextColorMode(next, true);
        }

        function toggleExtreme() {
            extremeModeEnabled = !extremeModeEnabled;
            if (extremeModeEnabled) {
                document.documentElement.classList.add('bg-extreme-transparent');
            } else {
                document.documentElement.classList.remove('bg-extreme-transparent');
            }
            saveCurrentUI();
        }

        function toggleMorePanel() {
            morePanel.style.display = morePanel.style.display === 'flex' ? 'none' : 'flex';
        }

        function toggleDebug() {
            bgLayer.style.backgroundColor = bgLayer.style.backgroundColor === 'rgba(255, 0, 0, 0.2)' ? 'transparent' : 'rgba(255, 0, 0, 0.2)';
        }
    }

    function showCropper(file) {
        const modal = document.createElement('div');
        modal.id = 'bg-cropper-modal';
        modal.innerHTML = `
            <div class="bg-cropper-container">
                <div class="bg-cropper-header">✂️ 裁剪区域（比例锁定为当前窗口）</div>
                <div class="bg-image-wrapper">
                    <img id="bg-crop-image" src="">
                </div>
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
                    background: false,
                });

                document.getElementById('bg-crop-confirm').addEventListener('click', async () => {
                    const maxWidth = Math.min(2560, window.innerWidth * 2);
                    const maxHeight = Math.round(maxWidth / aspect);
                    const canvas = cropper.getCroppedCanvas({
                        maxWidth: maxWidth,
                        maxHeight: maxHeight,
                        fillColor: '#fff',
                        imageSmoothingQuality: 'high',
                    });

                    let quality = 0.95;
                    let dataURL;
                    do {
                        dataURL = canvas.toDataURL('image/jpeg', quality);
                        quality -= 0.05;
                    } while (dataURL.length > 3_500_000 && quality > 0.6);

                    bgLayer.style.backgroundImage = `url('${dataURL}')`;
                    console.log('[背景] 新图片已应用，尺寸：', canvas.width, 'x', canvas.height);

                    if (currentTextColorMode === 'auto') {
                        const color = await analyzeImageBrightness(dataURL);
                        setTextColor(color);
                    }

                    window._bgEnabled = true;
                    saveCurrentUI();

                    modal.remove();
                    cropper.destroy();
                });

                document.getElementById('bg-crop-cancel').addEventListener('click', () => {
                    modal.remove();
                    cropper.destroy();
                });
            };
        };
        reader.readAsDataURL(file);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
