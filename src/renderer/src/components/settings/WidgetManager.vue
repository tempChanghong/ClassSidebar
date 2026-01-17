<template>
  <div class="space-y-6">
    <!-- Widget List -->
    <div class="space-y-3">
      <div
        v-for="(widget, index) in store.config?.widgets"
        :key="widget.id || index"
        class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group"
      >
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
            <img v-if="widget.icon" :src="widget.icon" class="w-full h-full object-contain" />
            <component v-else :is="getWidgetIcon(widget.type)" class="w-5 h-5" />
          </div>
          <div>
            <div class="font-medium text-slate-900">{{ getWidgetName(widget) }}</div>
            <div class="text-xs text-slate-500 capitalize flex items-center gap-2">
              <span class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">{{ widget.type }}</span>
              <span v-if="widget.type === 'launcher'" class="truncate max-w-[150px]">{{ widget.target }}</span>
              <span v-else-if="widget.type === 'url'" class="truncate max-w-[150px]">{{ widget.url }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click="store.moveWidget(index, 'up')"
            class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-30"
            :disabled="index === 0"
            title="上移"
          >
            <ArrowUp class="w-4 h-4" />
          </button>
          <button
            @click="store.moveWidget(index, 'down')"
            class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-30"
            :disabled="!store.config?.widgets || index === store.config.widgets.length - 1"
            title="下移"
          >
            <ArrowDown class="w-4 h-4" />
          </button>
          <div class="w-px h-4 bg-slate-200 mx-1"></div>
          <button
            @click="openEditModal(widget)"
            class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
            title="编辑"
          >
            <Edit2 class="w-4 h-4" />
          </button>
          <button
            @click="deleteWidget(widget.id)"
            class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
            title="删除"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!store.config?.widgets?.length"
        class="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50"
      >
        <p class="text-slate-500 text-sm">暂无组件，点击下方按钮添加</p>
      </div>
    </div>

    <!-- Add Button -->
    <button
      @click="openAddModal"
      class="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 font-medium"
    >
      <Plus class="w-5 h-5" />
      添加新组件
    </button>

    <!-- Edit/Add Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-lg font-semibold text-slate-900">
            {{ isEditing ? '编辑组件' : '添加组件' }}
          </h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-200/50 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto space-y-5">

          <!-- Type Selection -->
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700">组件类型</label>
            <select
              v-model="form.type"
              class="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500 py-2"
              :disabled="isEditing"
            >
              <option value="launcher">启动器 (Launcher)</option>
              <option value="url">网页链接 (URL)</option>
              <option value="command">系统命令 (Command)</option>
              <option value="volume_slider">音量控制 (Volume)</option>
              <option value="files">文件夹 (Files)</option>
              <option value="drag_to_launch">拖拽启动 (Drag to Launch)</option>
            </select>
          </div>

          <!-- Common Fields -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">显示名称</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="My Widget"
                class="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">图标</label>
              <div class="flex gap-2">
                <div class="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                   <img v-if="form.icon" :src="form.icon" class="w-full h-full object-contain" />
                   <component v-else :is="getWidgetIcon(form.type)" class="w-5 h-5 text-slate-400" />
                </div>
                <button
                  @click="selectIcon"
                  class="flex-1 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs text-slate-600 transition-colors"
                >
                  选择图标...
                </button>
              </div>
            </div>
          </div>

          <!-- Dynamic Fields -->

          <!-- Launcher -->
          <template v-if="form.type === 'launcher'">
             <div class="space-y-1.5">
               <label class="text-sm font-medium text-slate-700">目标路径 (Target)</label>
               <div class="flex gap-2">
                 <input
                   v-model="form.target"
                   type="text"
                   placeholder="C:\Windows\System32\notepad.exe"
                   class="flex-1 rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                 />
                 <button @click="selectTarget" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">
                   <FolderOpen class="w-4 h-4" />
                 </button>
               </div>
             </div>
             <div class="space-y-1.5">
               <label class="text-sm font-medium text-slate-700">参数 (Arguments)</label>
               <input
                 v-model="argsString"
                 type="text"
                 placeholder="--arg1 --arg2"
                 class="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500"
               />
               <p class="text-xs text-slate-500">多个参数请用空格分隔</p>
             </div>
             <!-- Layout Option -->
             <div class="space-y-1.5">
               <label class="text-sm font-medium text-slate-700">布局模式</label>
               <select v-model="form.layout" class="w-full rounded-lg border-slate-300 text-sm">
                 <option value="vertical">垂直列表 (Vertical)</option>
                 <option value="grid">网格布局 (Grid)</option>
               </select>
             </div>
          </template>

          <!-- URL -->
          <template v-if="form.type === 'url'">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">链接地址 (URL)</label>
              <input
                v-model="form.url"
                type="url"
                placeholder="https://example.com"
                class="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </template>

          <!-- Command -->
          <template v-if="form.type === 'command'">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">命令内容</label>
              <textarea
                v-model="form.command"
                rows="3"
                placeholder="echo 'Hello World'"
                class="w-full rounded-lg border-slate-300 text-sm font-mono focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">Shell 环境</label>
              <select v-model="form.shell" class="w-full rounded-lg border-slate-300 text-sm">
                <option value="cmd">CMD</option>
                <option value="powershell">PowerShell</option>
                <option value="bash">Bash</option>
              </select>
            </div>
          </template>

          <!-- Files -->
          <template v-if="form.type === 'files'">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">文件夹路径</label>
              <div class="flex gap-2">
                <input v-model="form.folder_path" type="text" class="flex-1 rounded-lg border-slate-300 text-sm" />
                <button @click="selectFolder" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">
                  <FolderOpen class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">最大显示数量</label>
              <input v-model.number="form.max_count" type="number" class="w-full rounded-lg border-slate-300 text-sm" />
            </div>
          </template>

          <!-- Drag to Launch -->
          <template v-if="form.type === 'drag_to_launch'">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">命令模板</label>
              <input
                v-model="form.command_template"
                type="text"
                placeholder='"{path}"'
                class="w-full rounded-lg border-slate-300 text-sm font-mono"
              />
              <p class="text-xs text-slate-500">使用 {path} 代表拖入的文件路径</p>
            </div>
          </template>

        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="saveWidget"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSidebarStore } from '../../stores/sidebarStore'
import type { WidgetConfig } from '../../../../main/store'
import {
  AppWindow,
  Volume2,
  FolderOpen,
  MousePointerClick,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  X,
  Globe,
  Terminal
} from 'lucide-vue-next'

const store = useSidebarStore()

// --- State ---
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

// Form Data (使用 any 以简化动态字段绑定，但在提交时会校验)
const form = ref<any>({
  type: 'launcher',
  name: '',
  icon: '',
  target: '',
  args: [],
  layout: 'vertical', // Default layout
  url: '',
  command: '',
  shell: 'cmd',
  folder_path: '',
  max_count: 10,
  command_template: '"{path}"'
})

// Helper for args array <-> string
const argsString = computed({
  get: () => Array.isArray(form.value.args) ? form.value.args.join(' ') : '',
  set: (val) => { form.value.args = val.split(' ').filter(s => s.trim().length > 0) }
})

// --- Icons ---
const getWidgetIcon = (type: string) => {
  switch (type) {
    case 'launcher': return AppWindow
    case 'url': return Globe
    case 'command': return Terminal
    case 'volume_slider': return Volume2
    case 'files': return FolderOpen
    case 'drag_to_launch': return MousePointerClick
    default: return AppWindow
  }
}

const getWidgetName = (widget: WidgetConfig) => {
  if (widget.name) return widget.name
  switch (widget.type) {
    case 'launcher': return widget.target ? widget.target.split('\\').pop() : 'Application'
    case 'url': return 'Web Link'
    case 'command': return 'System Command'
    case 'volume_slider': return 'System Volume'
    case 'files': return 'Folder View'
    case 'drag_to_launch': return 'Drag to Launch'
    default: return 'Widget'
  }
}

// --- Actions ---
const deleteWidget = (id: string) => {
  if (confirm('确定要删除这个组件吗？')) {
    store.removeWidget(id)
  }
}

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  // Reset form
  form.value = {
    type: 'launcher',
    name: '',
    icon: '',
    target: '',
    args: [],
    layout: 'vertical',
    url: '',
    command: '',
    shell: 'cmd',
    folder_path: '',
    max_count: 10,
    command_template: '"{path}"'
  }
  showModal.value = true
}

const openEditModal = (widget: WidgetConfig) => {
  isEditing.value = true
  editingId.value = widget.id
  // Clone data to form
  form.value = JSON.parse(JSON.stringify(widget))
  // Ensure defaults for optional fields
  if (!form.value.args) form.value.args = []
  if (!form.value.shell) form.value.shell = 'cmd'
  if (!form.value.layout) form.value.layout = 'vertical'
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveWidget = async () => {
  // Construct the final widget object based on type
  const base = {
    type: form.value.type,
    name: form.value.name,
    icon: form.value.icon
  }

  let specificConfig = {}
  switch (form.value.type) {
    case 'launcher':
      specificConfig = {
        target: form.value.target,
        args: form.value.args,
        layout: form.value.layout
      }
      break
    case 'url':
      specificConfig = { url: form.value.url }
      break
    case 'command':
      specificConfig = { command: form.value.command, shell: form.value.shell }
      break
    case 'files':
      specificConfig = { folder_path: form.value.folder_path, max_count: form.value.max_count }
      break
    case 'drag_to_launch':
      specificConfig = { command_template: form.value.command_template }
      break
  }

  const finalWidget = { ...base, ...specificConfig }

  if (isEditing.value && editingId.value) {
    await store.updateWidget(editingId.value, finalWidget)
  } else {
    await store.addWidget(finalWidget as any)
  }
  closeModal()
}

// --- File Selection ---
const selectTarget = async () => {
  const path = await window.electronAPI.openFileDialog({ properties: ['openFile'] })
  if (path) {
    form.value.target = path
    // Auto-fill name if empty
    if (!form.value.name) {
      const filename = path.split(/[/\\]/).pop()
      if (filename) form.value.name = filename.replace(/\.[^/.]+$/, "")
    }
    // Auto-load icon
    try {
      const icon = await window.electronAPI.getFileIcon(path)
      if (icon) form.value.icon = icon
    } catch (e) { /* ignore */ }
  }
}

const selectFolder = async () => {
  const path = await window.electronAPI.openFileDialog({ properties: ['openDirectory'] })
  if (path) form.value.folder_path = path
}

const selectIcon = async () => {
  const path = await window.electronAPI.openFileDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'ico', 'svg', 'webp'] },
      { name: 'Executables', extensions: ['exe', 'lnk'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (path) {
     // For now, we just use the file path as icon source if it's an image,
     // or try to extract icon if it's an exe.
     // In a real app, you might want to copy the image to app data.
     if (path.endsWith('.exe') || path.endsWith('.lnk')) {
        const icon = await window.electronAPI.getFileIcon(path)
        if (icon) form.value.icon = icon
     } else {
        // Assume it's an image
        form.value.icon = `file://${path}`
     }
  }
}
</script>
