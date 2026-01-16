import { execSync } from 'child_process'
import * as fs from 'fs'
import loudness from 'loudness'

// 获取是否管理员
export function getIsAdmin(): boolean {
    try {
        execSync('net session', { stdio: 'ignore' })
        return true
    } catch (e) {
        return false
    }
}

// 解析 Windows 环境变量路径
export function resolveWindowsEnv(pathStr: string): string {
    if (!pathStr) return ''
    return pathStr.replace(/%([^%]+)%/g, (_, n: string) => process.env[n] || '')
}

// 解析可执行文件路径
export function resolveExecutablePath(target: string): string | null {
    let cleanPath = target.replace(/^"|"$/g, '')
    cleanPath = resolveWindowsEnv(cleanPath)

    if (fs.existsSync(cleanPath)) return cleanPath

    try {
        const output = execSync(`where "${cleanPath}"`, { encoding: 'utf8' })
        const foundPath = output.split('\r\n')[0].trim()
        if (foundPath && fs.existsSync(foundPath)) return foundPath
    } catch (e) {
        // ignore
    }
    return null
}

// 从协议获取 Exe 路径 (原 main-utils.js 逻辑)
export function getExePathFromProtocol(protocol: string): string {
    try {
        // 简化的注册表查询逻辑，需要根据实际 main-utils 内容调整
        const cmd = `reg query HKCR\\${protocol}\\shell\\open\\command /ve`
        const output = execSync(cmd, { encoding: 'utf8' })
        const match = output.match(/REG_SZ\s+(.*)/)
        if (match && match[1]) {
            let cmdLine = match[1].trim()
            if (cmdLine.startsWith('"')) {
                return cmdLine.split('"')[1]
            } else {
                // 修复：对于没有引号包裹的路径，可能包含空格，不能简单 split(' ')[0]
                // 尝试查找 .exe 的位置
                const exeIndex = cmdLine.toLowerCase().indexOf('.exe')
                if (exeIndex !== -1) {
                    return cmdLine.substring(0, exeIndex + 4)
                }
                // 如果没有 .exe，回退到 split
                return cmdLine.split(' ')[0]
            }
        }
    } catch (e) {
        console.error(`Failed to resolve protocol ${protocol}`, e)
    }
    return ''
}

export async function getSystemVolume(): Promise<number> {
    return await loudness.getVolume()
}

export async function setSystemVolume(val: number): Promise<void> {
    await loudness.setVolume(val)
}
