const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
  auth: () => ipcRenderer.invoke('auth'),
  dietSearch: (args) => ipcRenderer.invoke('dietSearch', args),
  visionRecog: (args) => ipcRenderer.invoke('visionRecog', args),
  recommend: (args) => ipcRenderer.invoke('recommend', args),
  share: (args) => ipcRenderer.invoke('share', args),
  export: (args) => ipcRenderer.invoke('export', args),
  storageGet: (key) => ipcRenderer.invoke('storage:get', key),
  storageSet: (key, value) => ipcRenderer.invoke('storage:set', key, value),
  fileStore: (path) => ipcRenderer.invoke('file:store', { path })
  ,exportAnalysisPdf: () => ipcRenderer.invoke('pdf:export')
  ,llmAnalyze: (prompt) => ipcRenderer.invoke('llm:analyze', { prompt })
  ,analysisSave: (payload) => ipcRenderer.invoke('analysis:save', payload)
  ,llmPlan: (prompt) => ipcRenderer.invoke('llm:plan', { prompt })
  ,planSave: (payload) => ipcRenderer.invoke('plan:save', payload)
})