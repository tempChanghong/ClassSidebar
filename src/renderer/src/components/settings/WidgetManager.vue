<template>
  <div class="space-y-6">
    <!-- Widget List -->
    <div class="space-y-3">
      <div
        v-for="(widget, index) in store.config?.widgets"
        :key="index"
        class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group"
      >
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            <component :is="getWidgetIcon(widget.type)" class="w-5 h-5" />
          </div>
          <div>
            <div class="font-medium text-slate-900">{{ getWidgetName(widget) }}</div>
            <div class="text-xs text-slate-500 capitalize">{{ widget.type.replace('_', ' ') }}</div>
          </div>
        </div>

        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click="moveWidget(index, 'up')"
            class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-30"
            :disabled="index === 0"
            title="上移"
          >
            <ArrowUp class="w-4 h-4" />
          </button>
          <button
            @click="moveWidget(index, 'down')"
            class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-30"
            :disabled="!store.config?.widgets || index === store.config.widgets.length - 1"
            title="下移"
          >
            <ArrowDown class="w-4 h-4" />
          </button>
          <div class="w-px h-4 bg-slate-200 mx-1"></div>
          <button
            @click="editWidget(index)"
            class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
            title="编辑"
          >
            <Edit2 class="w-4 h-4" />
          </button>
          <button
            @click="deleteWidget(index)"
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
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-lg font-semibold text-slate-900">
            {{ isEditing ? '编辑组件' : '添加组件' }}
          </h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto space-y-5">
          <!-- Type Selection -->
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700">组件类型</label>
            <select
              v-model="editingWidget.type"
              class="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500"
              :disabled="isEditing"
            >
              <option value="launcher">启动器 (Launcher)</option>
              <option value="volume_slider">音量条 (Volume)</option>
              <option value="files">文件夹 (Files)</option>
              <option value="drag_to_launch">拖拽启动 (Drag to Launch)</option>
            </select>
          </div>

          <!-- Dynamic Fields based on Type -->

          <!-- Launcher Fields -->
          <template v-if="editingWidget.type === 'launcher'">
             <div class="space-y-1.5">
               <label class="text-sm font-medium text-slate-700">布局模式</label>
               <select v-model="editingWidget.layout" class="w-full rounded-lg border-slate-300 text-sm">
                 <option value="grid">网格 (Grid)</option>
                 <option value="vertical">列表 (Vertical)</option>
               </select>
             </div>

             <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
               <div class="flex justify-between items-center mb-3">
                 <span class="text-sm font-medium text-slate-700">应用列表</span>
                 <button @click="addLauncherItem" class="text-xs text-blue-600 hover:underline">+ 添加应用</button>
               </div>
               <div class="space-y-3 max-h-48 overflow-y-auto pr-1">
                 <div
                   v-for="(item, idx) in editingWidget.targets"
                   :key="idx"
                   class="flex gap-2 items-start p-2 bg-white rounded border border-slate-200"
                 >
                   <div class="flex-1 space-y-2">
                     <input v-model="item.name" placeholder="名称" class="w-full text-xs rounded border-slate-200 px-2 py-1" />
                     <div class="flex gap-2">
                       <select v-model="item.type" class="text-xs rounded border-slate-200 w-20">
                         <option value="app">App</option>
                         <option value="url">URL</option>
                         <option value="command">Cmd</option>
                       </select>
                       <input
                         v-if="item.type === 'url'"
                         v-model="item.url"
                         placeholder="https://..."
                         class="flex-1 text-xs rounded border-slate-200 px-2 py-1"
                       />
                       <input
                         v-else-if="item.type === 'command'"
                         v-model="item.command"
                         placeholder="Command..."
                         class="flex-1 text-xs rounded border-slate-200 px-2 py-1"
                       />
                       <input
                         v-else
                         v-model="item.target"
                         placeholder="Path/Exe..."
                         class="flex-1 text-xs rounded border-slate-200 px-2 py-1"
                       />
                     </div>
                   </div>
                   <button @click="removeLauncherItem(idx)" class="text-slate-400 hover:text-red-500 mt-1">
                     <X class="w-3 h-3" />
                   </button>
                 </div>
               </div>
             </div>
          </template>

          <!-- Files Fields -->
          <template v-if="editingWidget.type === 'files'">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">文件夹路径</label>
              <div class="flex gap-2">
                <input v-model="editingWidget.folder_path" type="text" class="flex-1 rounded-lg border-slate-300 text-sm" />
                <button @click="selectFolder" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">
                  <FolderOpen class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">最大显示数量</label>
              <input v-model.number="editingWidget.max_count" type="number" class="w-full rounded-lg border-slate-300 text-sm" />
            </div>
          </template>

          <!-- Drag to Launch Fields -->
          <template v-if="editingWidget.type === 'drag_to_launch'">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">命令模板</label>
              <input
                v-model="editingWidget.command_template"
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
import { ref } from 'vue'
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
  X
} from 'lucide-vue-next'

const store = useSidebarStore()

// Modal State
const showModal = ref(false)
const isEditing = ref(false)
const editingIndex = ref(-1)
const editingWidget = ref<WidgetConfig>({ type: 'launcher' })

// Icons Mapping
const getWidgetIcon = (type: string) => {
  switch (type) {
    case 'launcher': return AppWindow
    case 'volume_slider': return Volume2
    case 'files': return FolderOpen
    case 'drag_to_launch': return MousePointerClick
    default: return AppWindow
  }
}

const getWidgetName = (widget: WidgetConfig) => {
  if (widget.name) return widget.name
  switch (widget.type) {
    case 'launcher': return `启动器 (${widget.targets?.length || 0})`
    case 'volume_slider': return '系统音量'
    case 'files': return widget.folder_path ? widget.folder_path.split('\\').pop() : '文件夹'
    case 'drag_to_launch': return '拖拽启动'
    default: return '未知组件'
  }
}

// Actions
const moveWidget = (index: number, direction: 'up' | 'down') => {
  store.moveWidget(index, direction)
}

const deleteWidget = (index: number) => {
  if (confirm('确定要删除这个组件吗？')) {
    store.removeWidget(index)
  }
}

const openAddModal = () => {
  isEditing.value = false
  editingIndex.value = -1
  editingWidget.value = {
    type: 'launcher',
    layout: 'grid',
    targets: []
  }
  showModal.value = true
}

const editWidget = (index: number) => {
  if (!store.config?.widgets[index]) return
  isEditing.value = true
  editingIndex.value = index
  // Deep copy to avoid direct mutation
  editingWidget.value = JSON.parse(JSON.stringify(store.config.widgets[index]))
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveWidget = async () => {
  if (isEditing.value) {
    await store.updateWidget(editingIndex.value, editingWidget.value)
  } else {
    await store.addWidget(editingWidget.value)
  }
  closeModal()
}

// Launcher Specific Actions
const addLauncherItem = () => {
  if (!editingWidget.value.targets) editingWidget.value.targets = []
  editingWidget.value.targets.push({
    name: 'New App',
    type: 'app', // default
    target: ''
  })
}

const removeLauncherItem = (idx: number) => {
  if (editingWidget.value.targets) {
    editingWidget.value.targets.splice(idx, 1)
  }
}

const selectFolder = async () => {
  // 这里需要主进程支持 openDirectory，目前 openFileDialog 只支持文件
  // 暂时留空或复用 openFileDialog
  const path = await window.electronAPI.openFileDialog()
  if (path) {
     // 简单的处理：如果是文件，取其父目录
     // 理想情况是修改 main process 支持 openDirectory
     editingWidget.value.folder_path = path
  }
}
</script>
