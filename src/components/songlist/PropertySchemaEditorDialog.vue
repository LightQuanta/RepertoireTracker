<script setup lang="ts">
import type { SongProperty } from '@/config/song'
import {
  ElButton,
  ElCheckbox,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { types } from '@/config/song'
import PropertyEditorComponent from './PropertyEditorComponent.vue'

const props = defineProps<{
  visible: boolean
  properties: SongProperty[]
  songs: Record<string, any>[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:properties': [value: SongProperty[]]
}>()

const editingProperties = ref<SongProperty[]>([])

watch(() => props.visible, (val) => {
  if (val) {
    editingProperties.value = JSON.parse(JSON.stringify(props.properties))
  }
})

function handleClose() {
  emit('update:visible', false)
}

function handleSave() {
  emit('update:properties', editingProperties.value)
  handleClose()
}

const typeLabels: Record<PropertyKey, string> = {
  string: '文本',
  integer: '整数',
  float: '浮点数',
  boolean: '布尔',
  tags: '标签',
  date: '日期',
}

// 单个属性编辑
const propertyFormVisible = ref(false)
const editingProperty = ref<SongProperty | null>(null)
const isNewProperty = ref(false)
const propertyForm = ref<SongProperty>({
  id: '',
  displayName: '',
  type: 'string',
  optional: false,
  show: true,
  default: undefined,
  searchWeight: 0,
})
// 编辑前的原始值，用于检测变更
const originalFormValues = ref<{ id: string, type: string }>({ id: '', type: '' })

function openNewProperty() {
  isNewProperty.value = true
  propertyForm.value = {
    id: '',
    displayName: '',
    type: 'string',
    optional: false,
    show: true,
    default: undefined,
    searchWeight: 0,
  }
  originalFormValues.value = { id: '', type: 'string' }
  propertyFormVisible.value = true
}

function openEditProperty(property: SongProperty) {
  isNewProperty.value = false
  editingProperty.value = property
  propertyForm.value = JSON.parse(JSON.stringify(property))
  originalFormValues.value = { id: property.id, type: property.type }
  propertyFormVisible.value = true
}

async function savePropertyForm() {
  const form = propertyForm.value
  if (!form.id.trim()) {
    ElMessage.warning('属性ID不能为空')
    return
  }
  if (!form.displayName.trim()) {
    ElMessage.warning('显示名称不能为空')
    return
  }

  const existingIndex = editingProperties.value.findIndex(p => p.id === form.id)

  if (isNewProperty.value) {
    if (existingIndex !== -1) {
      ElMessage.warning(`属性ID "${form.id}" 已存在`)
      return
    }
    editingProperties.value.push({ ...form })
  }
  else {
    const oldId = editingProperty.value?.id

    if (oldId && oldId !== form.id) {
      if (existingIndex !== -1) {
        ElMessage.warning(`属性ID "${form.id}" 已存在`)
        return
      }
      try {
        await ElMessageBox.confirm(
          `属性ID从"${oldId}"变更为"${form.id}"会导致现有歌曲中该属性的数据读取失效，请确认已做好数据迁移准备。`,
          '警告：属性ID变更',
          { confirmButtonText: '确认变更', cancelButtonText: '取消', type: 'warning' },
        )
      }
      catch {
        return
      }
    }

    if (form.type !== originalFormValues.value.type) {
      try {
        await ElMessageBox.confirm(
          `属性类型从"${typeLabels[originalFormValues.value.type] ?? originalFormValues.value.type}"变更为"${typeLabels[form.type] ?? form.type}"，可能导致已有数据解析异常。请确认已做好数据迁移准备。`,
          '警告：属性类型变更',
          { confirmButtonText: '确认变更', cancelButtonText: '取消', type: 'warning' },
        )
      }
      catch {
        return
      }
    }

    const index = editingProperties.value.findIndex(p => p.id === oldId)
    if (index !== -1) {
      editingProperties.value[index] = { ...form }
    }
  }

  propertyFormVisible.value = false
}

async function deleteProperty(property: SongProperty) {
  try {
    await ElMessageBox.confirm(`确定要删除属性"${property.displayName}"吗？已填写的歌曲数据不会被自动删除。`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    editingProperties.value = editingProperties.value.filter(p => p.id !== property.id)
  }
  catch {
    // 用户取消
  }
}

// TODO 允许调整属性排序
</script>

<template>
  <ElDialog
    :model-value="visible" title="自定义属性管理" width="780px" align-center
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="mb-4 flex items-center justify-between">
      <span class="text-13px text-#667085">
        管理歌曲的自定义属性字段，共 {{ editingProperties.length }} 个属性
      </span>
      <ElButton type="primary" size="small" @click="openNewProperty">
        新增属性
      </ElButton>
    </div>

    <ElTable :data="editingProperties" border stripe row-key="id" max-height="420" class="w-full">
      <ElTableColumn label="属性ID" prop="id" min-width="110" />
      <ElTableColumn label="显示名称" prop="displayName" min-width="100" />
      <ElTableColumn label="类型" width="80">
        <template #default="{ row }">
          <ElTag size="small" effect="plain">
            {{ typeLabels[row.type] ?? row.type }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="可选" width="60" align="center">
        <template #default="{ row }">
          <ElTag v-if="row.optional" size="small" type="warning">
            是
          </ElTag>
          <span v-else class="text-#98a2b3">否</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="是否显示" width="60" align="center">
        <template #default="{ row }">
          <ElTag v-if="row.show !== false" size="small" type="success">
            是
          </ElTag>
          <span v-else class="text-#98a2b3">否</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="搜索权重" width="65" align="center" prop="searchWeight" />
      <ElTableColumn label="操作" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <ElButton size="small" type="primary" link @click="openEditProperty(row)">
            编辑
          </ElButton>
          <ElButton size="small" type="danger" link @click="deleteProperty(row)">
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <template #footer>
      <div class="flex justify-end gap-3">
        <ElButton @click="handleClose">
          取消
        </ElButton>
        <ElButton type="primary" @click="handleSave">
          保存
        </ElButton>
      </div>
    </template>
  </ElDialog>

  <!-- 单个属性编辑弹窗 -->
  <ElDialog
    :model-value="propertyFormVisible" :title="isNewProperty ? '新增属性' : '编辑属性'" width="520px" align-center
    @update:model-value="propertyFormVisible = $event"
  >
    <ElForm :model="propertyForm" label-width="100px" class="py-2">
      <ElFormItem label="属性ID" required>
        <ElInput v-model="propertyForm.id" placeholder="唯一标识符，如 title" />
      </ElFormItem>
      <ElFormItem label="显示名称" required>
        <ElInput v-model="propertyForm.displayName" placeholder="如 标题" />
      </ElFormItem>
      <ElFormItem label="属性类型">
        <ElSelect v-model="propertyForm.type" class="w-full">
          <ElOption v-for="t in types" :key="t" :value="t" :label="typeLabels[t]" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="是否可选">
        <ElCheckbox v-model="propertyForm.optional" :label="propertyForm.optional ? '可选' : '必填'" />
      </ElFormItem>
      <ElFormItem label="是否显示">
        <ElCheckbox v-model="propertyForm.show" :label="propertyForm.show ? '显示' : '隐藏'" />
      </ElFormItem>
      <ElFormItem label="搜索权重">
        <ElInputNumber v-model="propertyForm.searchWeight" :min="0" :max="999" class="w-full" />
      </ElFormItem>
      <ElFormItem label="默认值">
        <div v-if="propertyForm.optional" class="text-13px text-#98a2b3">
          可选属性无需默认值
        </div>
        <PropertyEditorComponent
          v-else :property="propertyForm" :model-value="propertyForm.default"
          @update:model-value="propertyForm.default = $event"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="flex justify-end gap-3">
        <ElButton @click="propertyFormVisible = false">
          取消
        </ElButton>
        <ElButton type="primary" @click="savePropertyForm">
          确定
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
