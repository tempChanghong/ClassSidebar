<template>
  <div class="space-y-6">
    <!-- Tabs -->
    <div class="flex space-x-1 bg-slate-100 p-1 rounded-xl">
      <button
        v-for="tab in ['current', 'library']"
        :key="tab"
        @click="activeTab = tab"
        class="flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200"
        :class="activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
      >
        {{ tab === 'current' ? '当前组件' : '组件库' }}
      </button>
    </div>

    <!-- Tab Content: Current Widgets -->
    <div v-if="activeTab === 'current'" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <!-- Widget List -->
      <div class="space-y-3">
        <div
          v-for="(widget, index) in store.config?.widgets"
          :key="widget.id || index"
          class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
              <img v-if="widget.icon && !widget.icon.startsWith('fa-')" :src="widget.icon" class="w-full h-full object-contain" />
              <i v-else-if="widget.icon && widget.icon.startsWith('fa-')" :class="widget.icon"></i>
              <component v-else :is="getWidgetIcon(widget.type)" class="w-5 h-5" />
            </div>
            <div>
              <div class="font-medium text-slate-900">{{ getWidgetName(widget) }}</div>
              <div class="text-xs text-slate-500 capitalize flex items-center gap-2">
                <span class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">{{ widget.type }}</span>
                <span v-if="widget.type === 'launcher'" class="truncate max-w-[150px]">{{ widget.target }}</span>
                <span v-else-if="widget.type === 'url'" class="truncate max-w-[150px]">{{ widget.url }}</span>
                <span v-else-if="widget.type === 'drawer'" class="truncate max-w-[150px]">{{ (widget as any).children?.length || 0 }} items</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <BaseButton
              variant="ghost"
              size="icon"
              @click="store.moveWidget(index, 'up')"
              :disabled="index === 0"
              title="上移"
              class="text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30"
            >
              <ArrowUp class="w-4 h-4" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="icon"
              @click="store.moveWidget(index, 'down')"
              :disabled="!store.config?.widgets || index === store.config.widgets.length - 1"
              title="下移"
              class="text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30"
            >
              <ArrowDown class="w-4 h-4" />
            </BaseButton>
            <div class="w-px h-4 bg-slate-200 mx-1"></div>
            <BaseButton
              variant="ghost"
              size="icon"
              @click="openEditModal(widget)"
              title="编辑"
              class="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            >
              <Edit2 class="w-4 h-4" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="icon"
              @click="deleteWidget(widget.id)"
              title="删除"
              class="text-slate-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 class="w-4 h-4" />
            </BaseButton>
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
      <BaseButton
        variant="ghost"
        block
        @click="openAddModal"
        class="border-2 border-dashed border-slate-300"
      >
        <Plus class="w-5 h-5 mr-2" />
        自定义添加
      </BaseButton>
    </div>

    <!-- Tab Content: Widget Library -->
    <div v-else class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div class="grid grid-cols-1 gap-4">
        <div v-for="preset in widgetPresets" :key="preset.id" class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 overflow-hidden">
               <img v-if="isImage(preset.iconPath)" :src="preset.iconPath" class="w-full h-full object-contain" />
               <component v-else :is="getPresetIcon(preset)" class="w-6 h-6" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-semibold text-slate-900">{{ preset.displayName }}</h3>
                  <p class="text-xs text-slate-500 mt-1">{{ preset.description }}</p>
                </div>

                <!-- Add Button (Group) -->
                <BaseButton
                  v-if="preset.type === 'group'"
                  size="sm"
                  variant="primary"
                  @click="addPresetGroup(preset)"
                >
                  <Plus class="w-3 h-3 mr-1" />
                  添加整组
                </BaseButton>
                <!-- Add Button (Single Item) -->
                <BaseButton
                  v-else
                  size="sm"
                  variant="primary"
                  @click="addPresetItem(preset)"
                >
                  <Plus class="w-3 h-3 mr-1" />
                  添加
                </BaseButton>
              </div>

              <!-- Children List (for Groups) -->
              <div v-if="preset.type === 'group' && preset.children" class="mt-4 space-y-2">
                <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">包含组件</div>
                <div class="grid grid-cols-1 gap-2">
                  <div
                    v-for="child in preset.children"
                    :key="child.id"
                    class="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div class="flex items-center gap-2 overflow-hidden">
                      <div class="w-6 h-6 rounded bg-white flex items-center justify-center text-slate-500 border border-slate-100 shrink-0">
                        <component :is="getPresetIcon(child)" class="w-3 h-3" />
                      </div>
                      <span class="text-sm text-slate-700 truncate">{{ child.displayName }}</span>
                    </div>
                    <BaseButton
                      variant="ghost"
                      size="icon"
                      @click="addPresetItem(child)"
                      title="单独添加此组件"
                      class="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Plus class="w-3 h-3" />
                    </BaseButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit/Add Modal -->
    <BaseModal v-model="showModal" :title="isEditing ? '编辑组件' : '添加组件'">
      <div class="space-y-5">

        <!-- Type Selection -->
        <div class="space-y-1.5">
          <BaseSelect
            label="组件类型"
            v-model="form.type"
            :options="typeOptions"
            :disabled="isEditing"
          />
        </div>

        <!-- Common Fields -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <BaseInput
              label="显示名称"
              v-model="form.name"
              placeholder="My Widget"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700">图标</label>
            <div class="flex gap-2">
              <div class="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden shrink-0">
                 <img v-if="form.icon" :src="form.icon" class="w-full h-full object-contain" />
                 <component v-else :is="getWidgetIcon(form.type)" class="w-5 h-5 text-slate-400" />
              </div>
              <BaseButton
                variant="secondary"
                size="sm"
                @click="selectIcon"
                class="flex-1 text-xs text-slate-600"
              >
                选择图标...
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Dynamic Fields -->

        <!-- Launcher -->
        <template v-if="form.type === 'launcher'">
           <div class="space-y-1.5">
             <div class="flex gap-2 items-end">
               <BaseInput
                 label="目标路径 (Target)"
                 v-model="form.target"
                 placeholder="C:\Windows\System32\notepad.exe"
                 class="flex-1"
               />
               <BaseButton variant="secondary" @click="selectTarget">
                 <FolderOpen class="w-4 h-4" />
               </BaseButton>
             </div>
           </div>
           <div class="space-y-1.5">
             <BaseInput
               label="参数 (Arguments)"
               v-model="argsString"
               placeholder="--arg1 --arg2"
             />
             <p class="text-xs text-slate-500">多个参数请用空格分隔</p>
           </div>
        </template>

        <!-- URL -->
        <template v-if="form.type === 'url'">
          <div class="space-y-1.5">
            <BaseInput
              label="链接地址 (URL)"
              v-model="form.url"
              type="url"
              placeholder="https://example.com"
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
            <BaseSelect
              label="Shell 环境"
              v-model="form.shell"
              :options="shellOptions"
            />
          </div>
        </template>

        <!-- Files -->
        <template v-if="form.type === 'files'">
          <div class="space-y-1.5">
            <div class="flex gap-2 items-end">
              <BaseInput
                label="文件夹路径"
                v-model="form.folder_path"
                class="flex-1"
              />
              <BaseButton variant="secondary" @click="selectFolder">
                <FolderOpen class="w-4 h-4" />
              </BaseButton>
            </div>
          </div>
          <div class="space-y-1.5">
            <BaseInput
              label="最大显示数量"
              v-model.number="form.max_count"
              type="number"
            />
          </div>
        </template>

        <!-- Drag to Launch -->
        <template v-if="form.type === 'drag_to_launch'">
          <div class="space-y-1.5">
            <BaseInput
              label="命令模板"
              v-model="form.command_template"
              placeholder='"{path}"'
              class="font-mono"
            />
            <p class="text-xs text-slate-500">使用 {path} 代表拖入的文件路径</p>
          </div>
        </template>

        <!-- System Tools -->
        <template v-if="form.type === 'system_tools'">
          <div class="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">
            此组件将显示一组常用的系统工具，如任务管理器、注册表编辑器等。
          </div>
        </template>

        <!-- Drawer -->
        <template v-if="form.type === 'drawer'">
          <div class="p-3 bg-amber-50 text-amber-700 text-sm rounded-lg">
            抽屉组件可以容纳多个子组件。目前仅支持通过"组件库"添加预设内容，或创建空抽屉后手动管理（暂未开放手动添加子项UI）。
          </div>
        </template>

        <!-- Layout Option (Common for supported types) -->
        <div v-if="['launcher', 'url', 'command', 'system_tools', 'drawer'].includes(form.type)" class="space-y-1.5 pt-2 border-t border-slate-100">
           <BaseSelect
             label="布局模式"
             v-model="form.layout"
             :options="layoutOptions"
           />
           <p class="text-xs text-slate-500 mt-1">
             {{ form.layout === 'grid' ? '显示为小图标，每行显示多个。' : '显示为长条形，占据整行宽度。' }}
           </p>
        </div>

      </div>

      <template #footer>
        <BaseButton
          variant="ghost"
          @click="closeModal"
          class="text-slate-600 hover:text-slate-800"
        >
          取消
        </BaseButton>
        <BaseButton
          variant="primary"
          @click="saveWidget"
        >
          保存
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSidebarStore } from '../../stores/sidebarStore'
import type { WidgetConfig } from '../../../../main/store'
import { widgetPresets, type WidgetPreset } from '../../config/widgetPresets'
import BaseButton from '../ui/BaseButton.vue'
import BaseInput from '../ui/BaseInput.vue'
import BaseSelect from '../ui/BaseSelect.vue'
import BaseModal from '../ui/BaseModal.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
  Globe,
  Terminal,
  Settings,
  Folder,
  Zap,
  PlayCircle,
  RefreshCw,
  User
} from 'lucide-vue-next'

const store = useSidebarStore()

// --- State ---
const activeTab = ref('current')
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
  layout: 'grid', // Default layout
  url: '',
  command: '',
  shell: 'cmd',
  folder_path: '',
  max_count: 10,
  command_template: '"{path}"',
  children: [] // For drawer
})

const typeOptions = [
  { value: 'launcher', label: '启动器 (Launcher)' },
  { value: 'url', label: '网页链接 (URL)' },
  { value: 'command', label: '系统命令 (Command)' },
  { value: 'volume_slider', label: '音量控制 (Volume)' },
  { value: 'files', label: '文件夹 (Files)' },
  { value: 'drag_to_launch', label: '拖拽启动 (Drag to Launch)' },
  { value: 'system_tools', label: '系统工具箱 (System Tools)' },
  { value: 'drawer', label: '抽屉容器 (Drawer)' }
]

const shellOptions = [
  { value: 'cmd', label: 'CMD' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'bash', label: 'Bash' }
]

const layoutOptions = [
  { value: 'grid', label: '网格布局 (Grid) - 紧凑图标' },
  { value: 'vertical', label: '垂直列表 (Vertical) - 详细信息' }
]

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
    case 'system_tools': return Settings
    case 'drawer': return Folder
    default: return AppWindow
  }
}

const isImage = (path: string) => {
  return path && (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.ico') || path.endsWith('.svg'))
}

// Removed getIconPath as we now import images directly in widgetPresets.ts
// If we still need to handle user-selected files, we assume they are absolute paths or file:// URLs

const getPresetIcon = (preset: WidgetPreset) => {
  // Map preset icon paths to Lucide components for now
  // In a real app, these might be actual image paths
  if (preset.iconPath === 'classisland-icon') return RefreshCw // Placeholder
  if (preset.iconPath === 'secrandom-icon') return Zap // Placeholder
  if (preset.iconPath === 'refresh-cw') return RefreshCw
  if (preset.iconPath === 'user') return User
  if (preset.iconPath === 'zap') return Zap
  if (preset.iconPath === 'play-circle') return PlayCircle
  if (preset.iconPath === 'tool') return Settings

  return Folder
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
    case 'system_tools': return 'System Tools'
    case 'drawer': return 'Toolbox Drawer'
    default: return 'Widget'
  }
}

// --- Actions ---
const deleteWidget = (id: string) => {
  ElMessageBox.confirm(
    '确定要删除这个组件吗？此操作无法撤销。',
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      store.removeWidget(id)
      ElMessage({
        type: 'success',
        message: '组件已删除',
      })
    })
    .catch(() => {
      // cancel
    })
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
    layout: 'grid',
    url: '',
    command: '',
    shell: 'cmd',
    folder_path: '',
    max_count: 10,
    command_template: '"{path}"',
    children: []
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
  if (!form.value.layout) form.value.layout = 'grid'
  if (!form.value.children) form.value.children = []
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
    icon: form.value.icon,
    layout: form.value.layout // Common layout property
  }

  let specificConfig = {}
  switch (form.value.type) {
    case 'launcher':
      specificConfig = {
        target: form.value.target,
        args: form.value.args
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
    case 'system_tools':
      specificConfig = {} // No specific config for now
      break
    case 'drawer':
      specificConfig = { children: form.value.children || [] }
      break
  }

  const finalWidget = { ...base, ...specificConfig }

  try {
    if (isEditing.value && editingId.value) {
      await store.updateWidget(editingId.value, finalWidget)
      ElMessage.success('组件已更新')
    } else {
      await store.addWidget(finalWidget as any)
      ElMessage.success('组件已添加')
    }
    closeModal()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

// --- Preset Actions ---

// Helper to convert a preset item to a widget config
const presetToWidgetConfig = (preset: WidgetPreset): any => {
  if (preset.type === 'group') return null

  // Resolve icon path for the widget config
  let icon = preset.defaultConfig?.icon
  if (isImage(preset.iconPath)) {
      // Use the imported image path directly
      icon = preset.iconPath
  }

  return {
    type: preset.widgetType,
    name: preset.displayName,
    icon: icon,
    ...preset.defaultConfig
  }
}

const addPresetItem = async (preset: WidgetPreset) => {
  const widgetConfig = presetToWidgetConfig(preset)
  if (widgetConfig) {
    try {
      await store.addWidget(widgetConfig)
      ElMessage.success(`已添加 ${preset.displayName}`)
    } catch (e) {
      ElMessage.error('添加失败')
    }
  }
}

const addPresetGroup = async (preset: WidgetPreset) => {
  if (preset.type !== 'group' || !preset.children) return

  // Resolve icon for the drawer
  let drawerIcon = ''
  if (isImage(preset.iconPath)) {
      drawerIcon = preset.iconPath
  }

  // Create a drawer widget
  const drawerConfig = {
    type: 'drawer',
    name: preset.displayName,
    icon: drawerIcon,
    children: preset.children.map(child => presetToWidgetConfig(child)).filter(Boolean)
  }

  try {
    await store.addWidget(drawerConfig as any)
    ElMessage.success(`已添加 ${preset.displayName} (抽屉)`)
  } catch (e) {
    ElMessage.error('添加失败')
  }
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
