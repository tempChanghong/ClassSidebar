const { app, BrowserWindow, screen, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

/**
 * 主进程：控制应用程序生命周期及原生功能
 */

let mainWindow;

/**
 * 检查是否具有管理员权限 (Windows)
 */
function getIsAdmin() {
  try {
    const { execSync } = require('child_process');
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 获取配置文件内容 (同步版本，用于初始化)
 */
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

/**
 * 从 URI 协议中解析出关联的可执行文件路径
 * @param {string} protocol 协议名，例如 'classisland'
 */
function getExePathFromProtocol(protocol) {
  try {
    const { execSync } = require('child_process');
    const regPath = `HKEY_CLASSES_ROOT\\${protocol}\\shell\\open\\command`;
    const output = execSync(`reg query "${regPath}" /ve`, { encoding: 'utf8' });

    // 使用正则表达式匹配 REG_SZ 后的内容
    const match = output.match(/\s+REG_SZ\s+(.*)/);
    if (match) {
      let command = match[1].trim();
      let exePath = '';
      if (command.startsWith('"')) {
        const endQuoteIndex = command.indexOf('"', 1);
        if (endQuoteIndex !== -1) {
          exePath = command.substring(1, endQuoteIndex);
        }
      } else {
        exePath = command.split(' ')[0];
      }
      if (exePath && fs.existsSync(exePath)) {
        return exePath;
      }
    }
  } catch (e) {
    console.error(`查询协议 ${protocol} 失败:`, e.message);
  }
  return null;
}

/**
 * 创建主窗口
 */
function createWindow() {
  const transforms = config.transforms || { display: 0, height: 64, posy: 0 };
  const displays = screen.getAllDisplays();
  const targetDisplay = (transforms.display < displays.length)
    ? displays[transforms.display]
    : screen.getPrimaryDisplay();

  const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = targetDisplay.bounds;

  // 使用配置的 posy
  const initialHeight = 100; // 初始窗口留一点余量
  let yPos = screenY + transforms.posy - (initialHeight / 2);

  // 边界检查：确保窗口不会超出屏幕垂直范围
  if (yPos < screenY) {
    yPos = screenY;
  } else if (yPos + initialHeight > screenY + screenHeight) {
    yPos = screenY + screenHeight - initialHeight;
  }

  mainWindow = new BrowserWindow({
    width: 20,
    height: initialHeight,
    x: screenX,
    y: yPos,
    frame: false,             // 无边框窗口
    transparent: true,         // 背景透明
    alwaysOnTop: true,         // 始终置顶
    skipTaskbar: true,         // 不在任务栏显示
    movable: false,            // 禁止手动移动
    resizable: false,          // 禁止手动缩放
    hasShadow: false,          // 禁用阴影
    // 在某些平台上，置顶需要更高级别的设置才能穿透全屏应用或任务栏
    type: 'toolbar',           // 工具栏窗口类型
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 引入预加载脚本
      contextIsolation: true,  // 开启上下文隔离
      nodeIntegration: false,  // 禁用 Node 集成以提高安全性
    }
  });

  // 跨工作区显示（多虚拟桌面）
  mainWindow.setVisibleOnAllWorkspaces(true);

  // 增强置顶逻辑：每隔 200ms 强制将自己设置为最顶层
  const topInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const shouldBeOnTop = true;
      if (shouldBeOnTop) {
        // 使用更高优先级的 level 偏移，并配合 moveTop 强行置顶
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        mainWindow.moveTop();
      }
    } else {
      clearInterval(topInterval);
    }
  }, 200);

  mainWindow.loadFile('index.html');

  // 权限检查提示
  const isAdmin = getIsAdmin();
  console.log('-----------------------------------');
  console.log(`[系统] 权限等级: ${isAdmin ? '【管理员】' : '【普通用户】'}`);
  if (!isAdmin) {
    console.warn('[警告] 当前非管理员权限，可能无法遮盖任务管理器等高权限窗口');
  }
  console.log('-----------------------------------');

  // 当窗口准备好时显示，并可选择打开开发者工具
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  // 失去焦点时，强制重新置顶一次，防止被某些应用覆盖
  mainWindow.on('blur', () => {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  });
}

/**
 * 监听窗口调整请求
 */
ipcMain.on('resize-window', (event, width, height, y) => {
  if (mainWindow) {
    const transforms = config.transforms || { display: 0, height: 64, posy: 0 };
    const displays = screen.getAllDisplays();
    const targetDisplay = (transforms.display < displays.length)
      ? displays[transforms.display]
      : screen.getPrimaryDisplay();
    const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = targetDisplay.bounds;

    // 如果没传 y，则使用 config.posy 计算默认 y
    let newY = (typeof y === 'number')
      ? y
      : Math.floor(screenY + transforms.posy - height / 2);

    // 边界检查：确保窗口不会超出屏幕垂直范围
    if (newY < screenY) {
      newY = screenY;
    } else if (newY + height > screenY + screenHeight) {
      newY = screenY + screenHeight - height;
    }

    // 确保窗口不会超出屏幕水平范围
    let newX = screenX;
    if (newX + width > screenX + screenWidth) {
      newX = screenX + screenWidth - width;
    }

    mainWindow.setBounds({
      width: Math.floor(width),
      height: Math.floor(height),
      x: Math.floor(newX),
      y: Math.floor(newY)
    });
  }
});

/**
 * 监听设置鼠标穿透请求
 */
ipcMain.on('set-ignore-mouse', (event, ignore, forward) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: forward || false });
  }
});

/**
 * 保存配置文件
 */
function saveConfig(newConfig) {
  const configPath = path.join(__dirname, 'data', 'config.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 4), 'utf8');
  } catch (e) {
    console.error('保存配置文件失败:', e);
  }
}

/**
 * 获取配置文件内容
 */
ipcMain.handle('get-config', async () => {
  // 重新读取以确保获取最新数据
  config = getConfigSync();

  // 附加当前选定显示器的边界信息
  const displays = screen.getAllDisplays();
  const transforms = config.transforms || { display: 0 };
  const targetDisplay = (transforms.display < displays.length)
    ? displays[transforms.display]
    : screen.getPrimaryDisplay();

  return {
    ...config,
    displayBounds: targetDisplay.bounds
  };
});

/**
 * 启动外部应用程序
 */
ipcMain.on('launch-app', (event, target, args) => {
  console.log(`正在启动应用: ${target}，参数: ${args}`);

  // 检查是否为 URI 格式 (例如 classisland://)
  if (target.includes('://')) {
    shell.openExternal(target).catch(err => {
      console.error('打开 URI 失败:', err);
    });
    return;
  }

  spawn(target, args, {
    detached: true,
    stdio: 'ignore'
  }).unref();
});

/**
 * 获取文件图标并转为 Data URL
 */
ipcMain.handle('get-file-icon', async (event, filePath) => {
  try {
    let resolvedPath = filePath;

    // 如果是 URI 格式 (例如 classisland://app/test)
    if (filePath.includes('://')) {
      const protocol = filePath.split('://')[0];
      resolvedPath = getExePathFromProtocol(protocol);

      if (!resolvedPath) {
        console.warn(`无法为协议 ${protocol} 定位可执行文件`);
        return null;
      }
      console.log(`[图标] 通过协议 ${protocol} 定位到: ${resolvedPath}`);
    } else if (!path.isAbsolute(filePath)) {
      try {
        const { execSync } = require('child_process');
        // 使用 Windows 'where' 命令查找完整路径
        const output = execSync(`where ${filePath}`, { encoding: 'utf8' });
        const paths = output.split('\r\n').filter(p => p.trim() !== '');
        if (paths.length > 0) {
          resolvedPath = paths[0];
        }
      } catch (e) {
        // 'where' 失败时的降级方案
        const commonLocations = [
          path.join(process.env.WINDIR, filePath),
          path.join(process.env.WINDIR, 'System32', filePath)
        ];
        for (const loc of commonLocations) {
          if (fs.existsSync(loc)) {
            resolvedPath = loc;
            break;
          }
        }
      }
    }

    console.log(`图标解析路径: ${resolvedPath}`);
    const icon = await app.getFileIcon(resolvedPath, { size: 'large' });
    return icon.toDataURL();
  } catch (err) {
    console.error(`读取图标失败 (${filePath}):`, err);
    return null;
  }
});

/**
 * 获取系统音量
 */
/**
 * 获取系统音量
 */
ipcMain.handle('get-volume', async () => {
  return new Promise((resolve) => {
    const script = `
      $code = @'
      using System;
      using System.Runtime.InteropServices;
      [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
      public interface IAudioEndpointVolume {
          int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
          int GetMasterVolumeLevelScalar(out float pfLevel);
      }
      [Guid("D6660639-824D-4AC8-B9CD-491F02F16260"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
      public interface IMMDevice {
          int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
      }
      [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
      public interface IMMDeviceEnumerator {
          int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
      }
      [Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] public class MMDeviceEnumerator { }
      public class AudioHelper {
          public static float GetVolume() {
              IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)new MMDeviceEnumerator();
              IMMDevice device;
              enumerator.GetDefaultAudioEndpoint(0, 0, out device);
              object interfaceObj;
              Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
              device.Activate(ref iid, 7, IntPtr.Zero, out interfaceObj);
              IAudioEndpointVolume vol = (IAudioEndpointVolume)interfaceObj;
              float v;
              vol.GetMasterVolumeLevelScalar(out v);
              return v;
          }
      }
'@
      Add-Type -TypeDefinition $code
      [Math]::Round([AudioHelper]::GetVolume() * 100)
    `;
    const ps = spawn('powershell.exe', ['-NoProfile', '-Command', script]);
    let output = '';
    ps.stdout.on('data', (data) => { output += data.toString(); });
    ps.on('close', () => {
      resolve(parseInt(output.trim()) || 0);
    });
    ps.on('error', (err) => {
      resolve(0);
    });
    setTimeout(() => { if (!ps.killed) ps.kill(); resolve(0); }, 3000);
  });
});

/**
 * 设置系统音量
 * @param {number} value 音量值 (0-100)
 */
ipcMain.on('set-volume', (event, value) => {
  const volume = value / 100;
  const script = `
    $code = @'
    using System;
    using System.Runtime.InteropServices;
    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioEndpointVolume {
        int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
        int GetMasterVolumeLevelScalar(out float pfLevel);
    }
    [Guid("D6660639-824D-4AC8-B9CD-491F02F16260"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice {
        int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
    }
    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator {
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
    }
    [Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] public class MMDeviceEnumerator { }
    public class AudioHelper {
        public static void SetVolume(float level) {
            IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)new MMDeviceEnumerator();
            IMMDevice device;
            enumerator.GetDefaultAudioEndpoint(0, 0, out device);
            object interfaceObj;
            Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
            device.Activate(ref iid, 7, IntPtr.Zero, out interfaceObj);
            IAudioEndpointVolume vol = (IAudioEndpointVolume)interfaceObj;
            Guid g = Guid.Empty;
            vol.SetMasterVolumeLevelScalar(level, ref g);
        }
    }
'@
    Add-Type -TypeDefinition $code
    [AudioHelper]::SetVolume(${volume})
  `;
  spawn('powershell.exe', ['-NoProfile', '-Command', script]);
});

// Electron 应用生命周期管理
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
