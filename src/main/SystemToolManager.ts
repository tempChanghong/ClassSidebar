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
                    // 方案 1: 使用 VBScript SendKeys (不支持 Win 键，放弃)
                    // 方案 2: 使用 PowerShell + user32.dll (容易被杀软拦截，且不稳定)
                    // 方案 3: 使用 explorer.exe shell:::{...} (最安全，最稳定)
                    
                    // 任务视图 (Task View) 的 CLSID 是 {3080F90E-D7AD-11D9-BD98-0000947B0257}
                    // 注意：显示桌面是 {3080F90D-...}，任务视图是 {3080F90E-...} (最后一位 D -> E)
                    
                    spawn('explorer.exe', ['shell:::{3080F90E-D7AD-11D9-BD98-0000947B0257}'], { 
                        detached: true, 
                        stdio: 'ignore'
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
