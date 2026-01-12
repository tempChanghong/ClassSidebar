const { app, BrowserWindow, screen, ipcMain, shell, Menu, MenuItem, dialog } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const { getExePathFromProtocol, getSystemVolume, setSystemVolume } = require('./main-utils');

let mainWindow;
let settingsWindow = null; // 设置窗口


function getIsAdmin() {
  try {
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function getConfigSync() {
  const configPath = path.join(__dirname, 'data', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error('解析配置文件失败:', e);
    }
  }
  return { widgets: [], transforms: { display: 0, height: 64, posy: 0 } };
}

let config = getConfigSync();

function saveConfig(newConfig) {
  try {
    const configPath = path.join(__dirname, 'data', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
    config = newConfig; // 更新内存中的配置
    // 通知主窗口配置已更新
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('config-updated', newConfig);
    }
    return true;
  } catch (err) {
    console.error('保存配置失败:', err);
    return false;
  }
}

function createWindow() {
  const transforms = config.transforms || { display: 0, height: 64, posy: 0 };
  const displays = screen.getAllDisplays();
  const targetDisplay = (transforms.display < displays.length)
    ? displays[transforms.display]
    : screen.getPrimaryDisplay();

  const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = targetDisplay.bounds;
  const initialHeight = 100;
  let yPos = screenY + transforms.posy - (initialHeight / 2);

  if (yPos < screenY) yPos = screenY;
  else if (yPos + initialHeight > screenY + screenHeight) yPos = screenY + screenHeight - initialHeight;

  // 恢复初始宽度为较小值，完全依赖 resize 来控制交互区域
  const initialWidth = 50;

  mainWindow = new BrowserWindow({
    width: initialWidth, height: initialHeight, x: screenX, y: yPos,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: true, movable: false, resizable: false, hasShadow: false,
    type: 'toolbar',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.setVisibleOnAllWorkspaces(true);

  // 这里的 flag 控制是否强制置顶。
  // 当拖拽文件时，我们暂时取消置顶，以便让操作系统的拖拽缩略图能显示在窗口之上
  let shouldAlwaysOnTop = true;

  const topInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (shouldAlwaysOnTop) {
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        mainWindow.moveTop();
      }
    } else clearInterval(topInterval);
  }, 200);

  mainWindow.loadFile('index.html');
  
  // 保持 DevTools 开启以便调试
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
  
  mainWindow.on('ready-to-show', () => mainWindow.show());
  mainWindow.on('blur', () => {
    if (shouldAlwaysOnTop) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  });

  ipcMain.on('set-always-on-top', (event, flag) => {
    shouldAlwaysOnTop = flag;
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(flag, 'screen-saver');
    }
  });
}

ipcMain.on('resize-window', (event, width, height, y) => {
  if (mainWindow) {
    const transforms = config.transforms || { display: 0, height: 64, posy: 0 };
    const displays = screen.getAllDisplays();
    const targetDisplay = (transforms.display < displays.length) ? displays[transforms.display] : screen.getPrimaryDisplay();
    const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = targetDisplay.bounds;

    let newY = (typeof y === 'number') ? y : Math.floor(screenY + transforms.posy - height / 2);
    if (newY < screenY) newY = screenY;
    else if (newY + height > screenY + screenHeight) newY = screenY + screenHeight - height;

    let newX = screenX;
    if (newX + width > screenX + screenWidth) newX = screenX + screenWidth - width;

    mainWindow.setBounds({
      width: Math.floor(width), height: Math.floor(height),
      x: Math.floor(newX), y: Math.floor(newY)
    });
  }
});

ipcMain.on('set-ignore-mouse', (event, ignore, forward) => {
  if (mainWindow) {
      if (!ignore) {
          mainWindow.setIgnoreMouseEvents(false);
      }
  }
});

ipcMain.handle('get-config', async () => {
  config = getConfigSync();
  const displays = screen.getAllDisplays();
  const targetDisplay = (config.transforms?.display < displays.length) ? displays[config.transforms.display] : screen.getPrimaryDisplay();
  return { ...config, displayBounds: targetDisplay.bounds };
});

ipcMain.handle('save-config', async (event, newConfig) => {
  if (saveConfig(newConfig)) {
      return { success: true };
  } else {
      return { success: false, error: 'Failed to save config' };
  }
});

// 获取应用版本
ipcMain.handle('get-app-version', () => app.getVersion());

// 获取开机自启状态
ipcMain.handle('get-login-item-settings', () => {
  return app.getLoginItemSettings();
});

// 设置开机自启
ipcMain.handle('set-login-item-settings', (event, settings) => {
  app.setLoginItemSettings(settings);
  return app.getLoginItemSettings();
});

// 打开文件选择对话框
ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(settingsWindow || mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Applications', extensions: ['exe', 'lnk', 'url', 'bat', 'cmd'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

function resolveWindowsEnv(pathStr) {
  if (!pathStr) return '';
  return pathStr.replace(/%([^%]+)%/g, (_, n) => process.env[n] || '');
}

function resolveExecutablePath(target) {
    let cleanPath = target.replace(/^"|"$/g, '');
    cleanPath = resolveWindowsEnv(cleanPath);
    
    if (fs.existsSync(cleanPath)) return cleanPath;
    
    // 尝试使用 where 命令查找
    try {
        const output = execSync(`where "${cleanPath}"`, { encoding: 'utf8' });
        const foundPath = output.split('\r\n')[0].trim();
        if (foundPath && fs.existsSync(foundPath)) return foundPath;
    } catch (e) {
        // 忽略错误
    }
    
    return null;
}

// 处理右键菜单请求
ipcMain.on('show-context-menu', (event, itemData) => {
    const menu = new Menu();
    
    // 只有当 itemData 包含必要信息时才显示管理选项
    if (itemData && typeof itemData.widgetIndex === 'number' && typeof itemData.itemIndex === 'number') {
        const { widgetIndex, itemIndex, target } = itemData;
        
        // --- 内置组件子功能 ---
        if (target) {
            const lowerTarget = target.toLowerCase();
            
            // ClassIsland 扩展功能
            if (lowerTarget.includes('classisland')) {
                menu.append(new MenuItem({
                    label: 'CI 换课',
                    click: () => {
                        shell.openExternal('classisland://app/class-swap')
                            .catch(e => console.error('启动 CI 换课失败:', e));
                    }
                }));
                menu.append(new MenuItem({ type: 'separator' }));
            }
            
            // SecRandom 扩展功能
            if (lowerTarget.includes('secrandom')) {
                menu.append(new MenuItem({
                    label: '随机点名',
                    click: () => {
                        shell.openExternal('secrandom://pumping')
                            .catch(e => console.error('启动随机点名失败:', e));
                    }
                }));
                menu.append(new MenuItem({ type: 'separator' }));
            }
        }
        // --------------------

        menu.append(new MenuItem({
            label: '打开所在位置',
            click: () => {
                if (target) {
                    const fullPath = resolveExecutablePath(target);
                    console.log('[Main] Showing item in folder:', target, '->', fullPath);
                    
                    if (fullPath) {
                        shell.showItemInFolder(fullPath);
                    } else {
                        console.error('[Main] Path does not exist:', target);
                    }
                }
            }
        }));
        
        menu.append(new MenuItem({ type: 'separator' }));
        
        menu.append(new MenuItem({
            label: '删除',
            click: () => {
                // 执行删除逻辑
                if (config.widgets[widgetIndex] && 
                    config.widgets[widgetIndex].targets && 
                    config.widgets[widgetIndex].targets[itemIndex]) {
                    
                    // 从数组中移除
                    config.widgets[widgetIndex].targets.splice(itemIndex, 1);
                    
                    // 保存配置
                    saveConfig(config);
                }
            }
        }));
    } else if (itemData && itemData.target) {
        // 针对文件列表等只有 target 的情况
        menu.append(new MenuItem({
            label: '打开所在位置',
            click: () => {
                const fullPath = resolveExecutablePath(itemData.target);
                console.log('[Main] Showing item in folder:', itemData.target, '->', fullPath);
                if (fullPath) {
                    shell.showItemInFolder(fullPath);
                }
            }
        }));
    } else {
        // 如果是在空白处或其他地方点击，显示通用菜单
        menu.append(new MenuItem({
            label: '设置',
            click: () => {
                createSettingsWindow();
            }
        }));
        
        menu.append(new MenuItem({
            label: '退出应用',
            click: () => {
                app.quit();
            }
        }));
    }
    
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});

ipcMain.on('launch-app', async (event, target, args) => {
  if (target.includes('://')) {
    shell.openExternal(target).catch(e => console.error('打开 URI 失败:', e));
    return;
  }

  // 如果没有参数，优先尝试用默认关联程序打开（支持打开各种文档、图片、快捷方式等）
  if (!args || args.length === 0) {
    // openPath 返回 Promise<string>，如果为空字符串则成功
    const error = await shell.openPath(target);
    if (error) {
      console.error('shell.openPath 失败, 尝试 spawn:', error);
      // 如果 openPath 失败，回退到 spawn 尝试（虽然对于非可执行文件 spawn 也很可能失败）
      spawn(target, args || [], { detached: true, stdio: 'ignore' }).unref();
    }
  } else {
    spawn(target, args, { detached: true, stdio: 'ignore' }).unref();
  }
});

ipcMain.handle('get-file-icon', async (event, filePath) => {
  try {
    let resolvedPath = filePath;

    // 优先处理协议
    if (filePath.includes('://')) {
      const protocol = filePath.split('://')[0];
      resolvedPath = getExePathFromProtocol(protocol);
      if (!resolvedPath) {
          console.warn(`[Main] Protocol ${protocol} not found.`);
          return null;
      }
    } else {
        // 处理快捷方式
        if (resolvedPath.toLowerCase().endsWith('.lnk')) {
            try {
                const shortcut = shell.readShortcutLink(resolvedPath);
                if (shortcut.target) {
                    resolvedPath = shortcut.target;
                }
            } catch (e) {
                console.warn('解析快捷方式失败:', e);
            }
        }

        if (!path.isAbsolute(resolvedPath)) {
          try {
            // 优先检查系统目录下的常用工具，解决 where 命令可能找不到的问题
            const systemRoot = process.env.SystemRoot || 'C:\\Windows';
            let system32 = path.join(systemRoot, 'System32');
            
            // 如果是 32 位进程运行在 64 位系统上，尝试使用 Sysnative 访问真正的 System32
            if (process.arch === 'ia32' && process.env.PROCESSOR_ARCHITEW6432) {
                const sysnative = path.join(systemRoot, 'Sysnative');
                if (fs.existsSync(sysnative)) {
                    system32 = sysnative;
                }
            }
            
            const knownTools = {
                'taskmgr': path.join(system32, 'Taskmgr.exe'),
                'taskmgr.exe': path.join(system32, 'Taskmgr.exe'),
                'cmd': path.join(system32, 'cmd.exe'),
                'cmd.exe': path.join(system32, 'cmd.exe'),
                'calc': path.join(system32, 'calc.exe'),
                'calc.exe': path.join(system32, 'calc.exe'),
                'control': path.join(system32, 'control.exe'),
                'control.exe': path.join(system32, 'control.exe'),
                'notepad': path.join(system32, 'notepad.exe'),
                'notepad.exe': path.join(system32, 'notepad.exe'),
                'explorer': path.join(systemRoot, 'explorer.exe'),
                'explorer.exe': path.join(systemRoot, 'explorer.exe')
            };

            const lowerName = resolvedPath.toLowerCase();
            if (knownTools[lowerName] && fs.existsSync(knownTools[lowerName])) {
                resolvedPath = knownTools[lowerName];
            } else {
                // 如果不是已知工具，尝试使用 where 查找
                let output = '';
                try {
                    output = execSync(`where "${resolvedPath}"`, { encoding: 'utf8' });
                } catch (e) {
                    // 如果查找失败且没有扩展名，尝试添加 .exe
                    if (!path.extname(resolvedPath)) {
                        try {
                            output = execSync(`where "${resolvedPath}.exe"`, { encoding: 'utf8' });
                        } catch (e2) {
                            throw e;
                        }
                    } else {
                        throw e;
                    }
                }
                resolvedPath = output.split('\r\n')[0].trim();
            }
          } catch (e) { 
              // ignore
          }
        }
    }
    
    const icon = await app.getFileIcon(resolvedPath, { size: 'large' });
    return icon.toDataURL();
  } catch (err) { 
      console.error('获取图标失败:', filePath, err);
      return null; 
  }
});

ipcMain.handle('get-volume', () => getSystemVolume());
ipcMain.on('set-volume', (e, val) => {
  console.log('[Main] Received set-volume request:', val);
  setSystemVolume(val);
});

ipcMain.on('execute-command', (event, command) => {
  const { exec } = require('child_process');
  exec(command, (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
    }
  });
});

ipcMain.handle('get-files-in-folder', async (event, folderPath, maxCount) => {
  try {
    const resolvedPath = resolveWindowsEnv(folderPath);
    if (!fs.existsSync(resolvedPath)) {
      console.warn('Folder does not exist:', resolvedPath);
      return [];
    }

    // 读取目录
    const files = fs.readdirSync(resolvedPath);

    // 按修改时间倒序排列，以便优先显示最近的项目
    // "Recent" 文件夹通常比较特殊，但 fs.readdir 仅提供文件名
    // 我们需要获取文件状态来进行排序
    const fileStats = files.map(file => {
      const fullPath = path.join(resolvedPath, file);
      try {
        const stats = fs.statSync(fullPath);
        return { name: file, path: fullPath, mtime: stats.mtime, isDirectory: stats.isDirectory() };
      } catch (e) {
        return null; // 跳过我们无法获取状态的文件
      }
    }).filter(f => f !== null && !f.isDirectory && !f.name.startsWith('desktop.ini')); // 过滤掉 desktop.ini 和目录（如果我们只需要文件）

    // 按时间倒序排列
    fileStats.sort((a, b) => b.mtime - a.mtime);

    // 截取到最大数量
    const result = fileStats.slice(0, maxCount || 100);

    return result;
  } catch (err) {
    console.error('Error listing files:', err);
    return [];
  }
});

// 添加快捷方式
ipcMain.handle('add-shortcut', async (event, filePath) => {
  try {
    const fileName = path.basename(filePath);
    // 移除扩展名作为默认名称
    let name = fileName.replace(/\.[^/.]+$/, "");
    
    // 查找第一个 launcher 类型的 widget
    let launcherWidget = config.widgets.find(w => w.type === 'launcher');
    
    // 如果没有 launcher，创建一个新的
    if (!launcherWidget) {
      launcherWidget = {
        type: 'launcher',
        layout: 'grid',
        targets: []
      };
      config.widgets.push(launcherWidget);
    }
    
    // 确保 targets 是数组
    if (!Array.isArray(launcherWidget.targets)) {
      launcherWidget.targets = [];
    }
    
    // 添加新项目
    launcherWidget.targets.push({
      name: name,
      target: filePath
    });
    
    // 保存配置
    saveConfig(config);
    
    return { success: true };
  } catch (err) {
    console.error('添加快捷方式失败:', err);
    return { success: false, error: err.message };
  }
});

// 创建设置窗口
function createSettingsWindow() {
  // 如果设置窗口已经存在，则聚焦它
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: '设置',
    frame: true,
    transparent: false,
    alwaysOnTop: false,
    skipTaskbar: false,
    resizable: true,
    minimizable: true,
    maximizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true // 隐藏菜单栏
  });
  
  settingsWindow.setMenuBarVisibility(false);

  // 加载设置页面（暂时先加载一个简单的HTML）
  settingsWindow.loadFile('settings.html');

  // 窗口关闭时清理引用
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  // 开发时可以打开开发者工具
  // settingsWindow.webContents.openDevTools();
}

// 监听打开设置窗口的请求
ipcMain.on('open-settings', () => {
  createSettingsWindow();
});


app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
