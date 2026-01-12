/**
 * 创建启动器项目元素
 */
async function createLauncherItem(widget, widgetIndex, itemIndex) {
    const div = document.createElement('div');
    div.className = 'launcher-item';

    let iconHtml = '<div class="launcher-icon-placeholder" style="width:32px; height:32px; background:#e5e7eb; border-radius:6px;"></div>';
    
    // 优先使用配置中指定的图标
    if (widget.icon) {
        // 如果是 Font Awesome 图标类名
        if (widget.icon.startsWith('fa-') || widget.icon.startsWith('fas ') || widget.icon.startsWith('fab ')) {
            iconHtml = `<i class="${widget.icon}" style="font-size: 24px; color: #555;"></i>`;
        } else {
            // 否则假定为图片路径
            iconHtml = `<img src="${widget.icon}" alt="${widget.name}">`;
        }
    } else if (widget.target) {
        // 尝试从系统获取图标
        try {
            const iconDataUrl = await window.electronAPI.getFileIcon(widget.target);
            if (iconDataUrl) {
                iconHtml = `<img src="${iconDataUrl}" alt="${widget.name}">`;
            } else {
                // 如果获取失败，尝试根据协议提供内置默认图标
                if (widget.target.startsWith('classisland://')) {
                    iconHtml = `<img src="icons/ci.png" alt="${widget.name}">`;
                } else if (widget.target.startsWith('secrandom://')) {
                    iconHtml = `<img src="icons/secrandom.png" alt="${widget.name}">`;
                }
            }
        } catch (err) {
            console.error('获取图标失败:', err);
            // 出错时的兜底
            if (widget.target.startsWith('classisland://')) {
                iconHtml = `<img src="icons/ci.png" alt="${widget.name}">`;
            } else if (widget.target.startsWith('secrandom://')) {
                iconHtml = `<img src="icons/secrandom.png" alt="${widget.name}">`;
            }
        }
    }

    div.innerHTML = `
        <div class="launcher-icon">
            ${iconHtml}
        </div>
        <div class="launcher-info">
            <div class="launcher-name">${widget.name}</div>
        </div>
    `;

    div.onclick = () => {
        window.electronAPI.launchApp(widget.target, widget.args || []);
    };

    // 添加右键菜单
    div.oncontextmenu = (e) => {
        e.preventDefault();
        e.stopPropagation(); // 防止冒泡到 wrapper 触发默认菜单
        window.electronAPI.showContextMenu({
            widgetIndex: widgetIndex,
            itemIndex: itemIndex,
            target: widget.target
        });
    };

    return div;
}

/**
 * 创建音量滑块元素
 */
async function createVolumeSlider(widget) {
    const container = document.createElement('div');
    container.className = 'volume-slider-container';

    let currentVol = 0;
    try {
        currentVol = await window.electronAPI.getVolume();
    } catch (err) {
        console.error('获取音量失败:', err);
    }

    container.innerHTML = `

        <div class="volume-slider-row">
            <div class="volume-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
            </div>
            <div class="slider-wrapper">
                <input type="range" class="volume-slider" min="0" max="100" value="${currentVol}">
                <div class="slider-fill" style="width: ${currentVol}%"></div>
            </div>
            <div class="volume-value">${currentVol}%</div>
        </div>
    `;

    const slider = container.querySelector('.volume-slider');
    const fill = container.querySelector('.slider-fill');
    const valueDisp = container.querySelector('.volume-value');

    slider.oninput = (e) => {
        const val = e.target.value;
        console.log('[Renderer] Slider input:', val);
        fill.style.width = `${val}%`;
        valueDisp.textContent = `${val}%`;
        window.electronAPI.setVolume(parseInt(val));
    };

    return container;
}

/**
 * 创建文件列表组件
 * 专门用于显示文件夹内容（如"最近使用"）
 * 采用紧凑的垂直列表布局，模仿 Windows 资源管理器详情视图
 */
async function createFilesWidget(widget) {
    const container = document.createElement('div');
    const layout = widget.layout || 'vertical';

    // 添加 compact-files 类以应用紧凑样式
    container.className = `launcher-group layout-${layout} compact-files`;

    let files = [];
    try {
        // 调用主进程接口获取文件列表
        files = await window.electronAPI.getFilesInFolder(widget.folder_path, widget.max_count);
    } catch (err) {
        console.error('获取文件列表失败:', err);
        return container;
    }

    for (const file of files) {
        // 去除 .lnk 后缀显示，使界面更整洁
        let displayName = file.name;
        if (displayName.toLowerCase().endsWith('.lnk')) {
            displayName = displayName.slice(0, -4);
        }

        // 构造显示配置
        const itemConfig = {
            name: displayName,
            target: file.path
        };

        // 复用通用的启动器项目创建逻辑
        // 注意：文件列表是动态生成的，不对应 config 中的 targets，所以不传递 index
        // 这意味着文件列表中的项目暂时不支持右键删除（因为它们是读取文件夹生成的）
        const item = await createLauncherItem(itemConfig, -1, -1);
        
        // 覆盖右键菜单，只提供“打开所在位置”
        item.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.electronAPI.showContextMenu({
                target: file.path
                // 不传递 index，主进程就不会显示“删除”选项
            });
        };
        
        container.appendChild(item);
    }

    return container;
}

/**
 * 创建拖拽启动组件
 * 允许用户拖拽文件到此组件上，并使用配置的命令处理该文件
 */
async function createDragToLaunchWidget(widget) {
    const div = document.createElement('div');
    div.className = 'launcher-item drag-to-launch';
    div.title = widget.name || "Drag files here to send";

    // 尝试提取可执行文件路径以获取图标
    let exePath = widget.targets;
    if (typeof exePath === 'string') {
        const placeholderIndex = exePath.indexOf('{{source}}');
        let potentialPath = placeholderIndex > -1 ? exePath.substring(0, placeholderIndex).trim() : exePath;

        // 去除首尾引号
        if (potentialPath.startsWith('"') && potentialPath.endsWith('"')) {
            potentialPath = potentialPath.substring(1, potentialPath.length - 1);
        } else if (potentialPath.startsWith('"')) {
            // 只有前引号的情况？尝试找到下一个引号
            const nextQuote = potentialPath.indexOf('"', 1);
            if (nextQuote > -1) {
                potentialPath = potentialPath.substring(1, nextQuote);
            }
        }
        // 注意：我们移除在那段"如果是无引号路径则截取到第一个空格"的逻辑
        // 因为 "C:\Program Files\..." 这种路径非常常见且可能没有引号包裹
        // 假设用户配置正确，{{source}} 之前的部分就是路径

        exePath = potentialPath;
    }

    let iconHtml = '<div class="launcher-icon-placeholder" style="width:32px; height:32px; background:#e5e7eb; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size: 20px;">📤</div>';

    if (exePath) {
        try {
            const iconDataUrl = await window.electronAPI.getFileIcon(exePath);
            if (iconDataUrl) {
                iconHtml = `<img src="${iconDataUrl}" alt="${widget.name || 'Drop Target'}">`;
            }
        } catch (err) {
            console.error('获取图标失败:', err);
        }
    }

    div.innerHTML = `
        <div class="launcher-icon">
            ${iconHtml}
        </div>
        <div class="launcher-info">
            <div class="launcher-name">${widget.name || 'Drop to Send'}</div>
        </div>
    `;

    // 显隐控制逻辑
    const showAllTime = widget.show_all_time !== false;

    if (!showAllTime) {
        div.style.display = 'none';

        // 使用全局管理器来处理自动显隐
        if (!window._dragToLaunchManager) {
            window._dragToLaunchManager = {
                elements: [],
                dragCounter: 0,

                show() {
                    this.elements.forEach(el => {
                        if (el && el.style) el.style.display = 'flex';
                    });
                },

                hide() {
                    this.elements.forEach(el => {
                        if (el && el.style) el.style.display = 'none';
                    });
                }
            };

            // 全局事件监听器（只添加一次）
            document.addEventListener('dragenter', (e) => {
                if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
                    window._dragToLaunchManager.dragCounter++;
                    if (window._dragToLaunchManager.dragCounter === 1) {
                        window._dragToLaunchManager.show();
                    }
                }
            });

            document.addEventListener('dragleave', (e) => {
                window._dragToLaunchManager.dragCounter--;
                if (window._dragToLaunchManager.dragCounter <= 0) {
                    window._dragToLaunchManager.dragCounter = 0;
                    window._dragToLaunchManager.hide();
                }
            });

            document.addEventListener('drop', (e) => {
                window._dragToLaunchManager.dragCounter = 0;
                window._dragToLaunchManager.hide();
            });
        }

        // 将当前元素添加到管理器
        window._dragToLaunchManager.elements.push(div);
    }

    // 拖拽事件处理
    div.ondragover = (e) => {
        e.preventDefault();
        // 不阻止冒泡，让全局管理器能正确跟踪拖拽状态
        div.classList.add('drag-over');
    };

    div.ondragleave = (e) => {
        e.preventDefault();
        // 不阻止冒泡，让全局管理器能正确跟踪拖拽状态
        div.classList.remove('drag-over');
    };

    div.ondrop = (e) => {
        e.preventDefault();
        // 标记事件已被处理，防止 renderer.js 中的 drop 事件再次处理（例如添加快捷方式）
        window._dragHandled = true;
        
        div.classList.remove('drag-over');

        // 注意：显隐逻辑现在由全局管理器处理，这里不需要手动操作

        if (e.dataTransfer.files.length > 0) {
            for (const file of e.dataTransfer.files) {
                // 使用 preload 暴露的接口获取真实路径
                const filePath = window.electronAPI.getFilePath(file);
                if (!filePath) {
                    console.error('无法获取文件路径', file);
                    continue;
                }

                const safeFilePath = `"${filePath}"`;

                // 处理命令模版
                let rawCommandTemplate = widget.targets;
                let finalCommand = rawCommandTemplate;

                if (rawCommandTemplate.includes('{{source}}')) {
                    // 智能处理前半部分的可执行程序路径
                    const parts = rawCommandTemplate.split('{{source}}');
                    let exePart = parts[0].trim();
                    const suffixPart = parts[1];

                    // 如果 exe 部分没有被引号包裹且包含空格，则添加引号
                    // 简单的检查：如果包含空格，且不以 " 开头，且不以 " 结尾（排除已经包裹的情况）
                    if (exePart.includes(' ') && !exePart.startsWith('"') && !exePart.endsWith('"')) {
                        exePart = `"${exePart}"`;
                    }

                    finalCommand = `${exePart} ${safeFilePath} ${suffixPart}`;
                } else {
                    // 如果没有 placeholder，直接追加 (不太常见)
                    finalCommand = `${rawCommandTemplate} ${safeFilePath}`;
                }

                console.log('Executing command:', finalCommand);
                window.electronAPI.executeCommand(finalCommand);
            }
        }
    };

    return div;
}

/**
 * 核心渲染函数
 * 负责遍历配置并渲染所有小组件
 */
async function renderWidgets(widgets) {
    const container = document.getElementById('widget-container');
    container.innerHTML = ''; // 清空现有内容

    for (let i = 0; i < widgets.length; i++) {
        const widget = widgets[i];
        
        // 渲染普通启动器组 (快捷方式网格/列表)
        if (widget.type === 'launcher' && Array.isArray(widget.targets)) {
            const group = document.createElement('div');
            const layout = widget.layout || 'vertical';
            group.className = `launcher-group layout-${layout}`;

            for (let j = 0; j < widget.targets.length; j++) {
                const targetConfig = widget.targets[j];
                const item = await createLauncherItem(targetConfig, i, j);
                group.appendChild(item);
            }
            container.appendChild(group);

            // 渲染音量调节滑块
        } else if (widget.type === 'volume_slider') {
            const slider = await createVolumeSlider(widget);
            container.appendChild(slider);

            // 渲染文件列表 (最近文件等)
        } else if (widget.type === 'files') {
            const filesWidget = await createFilesWidget(widget);
            container.appendChild(filesWidget);

            // 渲染拖拽启动组件
        } else if (widget.type === 'drag_to_launch') {
            const item = await createDragToLaunchWidget(widget);
            const wrapper = document.createElement('div');
            wrapper.className = 'launcher-group layout-vertical'; // 使用默认布局 wrapper
            wrapper.appendChild(item);
            container.appendChild(wrapper);
        }
    }
}
