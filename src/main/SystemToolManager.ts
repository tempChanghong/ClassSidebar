import { spawn, exec } from 'child_process';
import fs from 'fs';
import { ipcMain, IpcMainEvent, IpcMainInvokeEvent, Menu, MenuItem, BrowserWindow } from 'electron';
import { shell } from 'electron';

export class SystemToolManager {
    constructor() {
        // 移除构造函数中的 registerIpc 调用，改为显式调用
    }

    registerIpc() {
        try {
            ipcMain.handle('system:check-capability', (_: IpcMainInvokeEvent, toolName: string) => {
                return this.checkCapability(toolName);
            });
        } catch (e) {
            console.warn('[SystemToolManager] system:check-capability handler might be already registered', e);
        }

        ipcMain.removeAllListeners('system:execute-tool');
        ipcMain.on('system:execute-tool', (_: IpcMainEvent, toolName: string) => {
            this.executeTool(toolName);
        });

        // 新增：显示工具箱菜单
        ipcMain.removeAllListeners('system:show-toolbox-menu');
        ipcMain.on('system:show-toolbox-menu', (event: IpcMainEvent) => {
            this.showToolboxMenu(event);
        });
        
        console.log('[SystemToolManager] IPC handlers registered.');
    }

    checkCapability(tool: string): boolean {
        if (tool === 'gpedit') {
            const systemRoot = process.env.SystemRoot || 'C:\\Windows';
            const gpeditPath = `${systemRoot}\\System32\\gpedit.msc`;
            return fs.existsSync(gpeditPath);
        }
        return true;
    }

    showToolboxMenu(event: IpcMainEvent) {
        const menu = new Menu();
        
        const tools = [
            { id: 'taskmgr', label: '任务管理器', icon: undefined },
            { id: 'show-desktop', label: '返回桌面', icon: undefined },
            { id: 'multitask', label: '多任务视图', icon: undefined },
            { type: 'separator' },
            { id: 'terminal', label: '终端 (Terminal)', icon: undefined },
            { id: 'control-panel', label: '控制面板', icon: undefined },
            { type: 'separator' },
            { id: 'regedit', label: '注册表编辑器', icon: undefined },
            { id: 'services', label: '服务', icon: undefined },
            { id: 'devmgmt', label: '设备管理器', icon: undefined },
        ];

        if (this.checkCapability('gpedit')) {
            tools.push({ id: 'gpedit', label: '组策略编辑器', icon: undefined });
        }

        tools.forEach((tool: any) => {
            if (tool.type === 'separator') {
                menu.append(new MenuItem({ type: 'separator' }));
            } else {
                menu.append(new MenuItem({
                    label: tool.label,
                    click: () => {
                        this.executeTool(tool.id);
                    }
                }));
            }
        });

        const win = BrowserWindow.fromWebContents(event.sender);
        menu.popup({ window: win || undefined });
    }

    executeTool(tool: string) {
        console.log(`[SystemToolManager] Executing tool: ${tool}`);
        try {
            switch (tool) {
                case 'taskmgr':
                    spawn('taskmgr', [], { detached: true, stdio: 'ignore' }).unref();
                    break;
                case 'show-desktop':
                    // 方法1: 使用 explorer shell 命令 (更可靠)
                    // shell:::{3080F90D-D7AD-11D9-BD98-0000947B0257} 是显示桌面的 CLSID
                    spawn('explorer.exe', ['shell:::{3080F90D-D7AD-11D9-BD98-0000947B0257}'], { 
                        detached: true, 
                        stdio: 'ignore' 
                    }).unref();
                    break;
                case 'multitask':
                    // 模拟 Win+Tab 键
                    // 使用 PowerShell 发送键盘快捷键
                    // 注意：SendKeys 语法中 ^ 是 Ctrl, % 是 Alt, + 是 Shift, # 是 Win (但 WScript.Shell 不支持 Win 键)
                    // Win+Tab 比较特殊，通常无法通过简单的 SendKeys 触发。
                    
                    // 最终方案：使用 robotjs (需要编译) 或者 简单的 C# 代码片段 via PowerShell。
                    // 鉴于环境限制，我们尝试使用 PowerShell + Add-Type 调用 user32.dll keybd_event
                    
                    const psScript = `
                    $code = @'
                    [DllImport("user32.dll")]
                    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
                    '@
                    $win32 = Add-Type -MemberDefinition $code -Name "Win32" -Namespace Win32 -PassThru
                    
                    # VK_LWIN = 0x5B
                    # VK_TAB = 0x09
                    # KEYEVENTF_KEYUP = 0x0002
                    
                    $win32::keybd_event(0x5B, 0, 0, 0) # Win Down
                    $win32::keybd_event(0x09, 0, 0, 0) # Tab Down
                    Start-Sleep -Milliseconds 200
                    $win32::keybd_event(0x09, 0, 0x0002, 0) # Tab Up
                    $win32::keybd_event(0x5B, 0, 0x0002, 0) # Win Up
                    `;
                    
                    // 关键修改：使用 shell: true 确保 PowerShell 能够正确执行
                    // 添加 -WindowStyle Hidden 隐藏窗口
                    spawn('powershell', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', psScript], {
                        detached: true, 
                        stdio: 'ignore',
                        shell: true 
                    }).unref();
                    break;
                case 'control-panel':
                    spawn('control', [], { detached: true, stdio: 'ignore' }).unref();
                    break;
                case 'terminal':
                    const child = spawn('wt', [], { detached: true, stdio: 'ignore' });
                    child.on('error', () => {
                        console.warn('Windows Terminal not found, falling back to cmd');
                        spawn('cmd', ['/c', 'start', 'cmd'], { detached: true, stdio: 'ignore', shell: true }).unref();
                    });
                    child.unref();
                    break;
                case 'gpedit':
                    if (this.checkCapability('gpedit')) {
                        // gpedit.msc 需要 mmc 运行
                        this.runCommand('mmc', ['gpedit.msc']);
                    }
                    break;
                case 'regedit':
                    // regedit 会自动请求提权
                    this.runCommand('regedit');
                    break;
                case 'services':
                    this.runCommand('mmc', ['services.msc']);
                    break;
                case 'devmgmt':
                    this.runCommand('mmc', ['devmgmt.msc']);
                    break;
                default:
                    console.warn(`Unknown tool: ${tool}`);
            }
        } catch (e) {
            console.error(`Failed to execute tool ${tool}:`, e);
        }
    }

    private runCommand(exe: string, args: string[] = []) {
        console.log(`[SystemToolManager] Running command: ${exe} ${args.join(' ')}`);
        // 使用 shell: true 可以更好地处理系统路径和权限提升请求
        const child = spawn(exe, args, {
            detached: true,
            stdio: 'ignore',
            shell: true 
        });
        
        child.on('error', (err) => {
            console.error(`[SystemToolManager] Failed to start ${exe}:`, err);
        });
        
        child.unref();
    }
}

export const systemToolManager = new SystemToolManager();
