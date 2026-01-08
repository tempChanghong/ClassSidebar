const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', width, height),
    setIgnoreMouse: (ignore, forward) => ipcRenderer.send('set-ignore-mouse', ignore, forward)
});
