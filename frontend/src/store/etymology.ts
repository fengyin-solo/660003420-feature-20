import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { COGNATE_SETS, LANGUAGE_FAMILIES, buildGraph } from '../mock/data'
export { LANGUAGE_FAMILIES, COGNATE_SETS }

const STORAGE_KEY = 'etymology-view-state'

interface SavedView {
  x: number
  y: number
  k: number
  selectedId: string | null
}

function loadSavedView(): Partial<SavedView> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function persistView(patch: Partial<SavedView>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadSavedView(), ...patch }))
  } catch {
    /* 存储不可用时静默忽略 */
  }
}

export const useEtymologyStore = defineStore('etymology', () => {
  const graph = ref(buildGraph())
  const saved = loadSavedView()

  const selectedNode = ref<any>(
    saved.selectedId ? graph.value.nodes.find(n => n.id === saved.selectedId) ?? null : null
  )
  const searchQuery = ref('')
  const selectedFamily = ref('all')

  const filteredCognates = computed(() =>
    COGNATE_SETS.filter(cs => {
      const q = searchQuery.value.toLowerCase()
      const matchSearch = !q || cs.root.toLowerCase().includes(q) || cs.meaning.includes(q) || Object.values(cs.languages).some((w: string) => w.toLowerCase().includes(q))
      const matchFamily = selectedFamily.value === 'all' || cs.family === selectedFamily.value
      return matchSearch && matchFamily
    })
  )

  // 选中节点变化时持久化其 id，刷新后可恢复选中状态
  watch(selectedNode, (node) => {
    persistView({ selectedId: node ? node.id : null })
  })

  function loadViewTransform(): { x: number; y: number; k: number } | null {
    const { x, y, k } = loadSavedView()
    if (typeof x === 'number' && typeof y === 'number' && typeof k === 'number') return { x, y, k }
    return null
  }

  function saveViewTransform(t: { x: number; y: number; k: number }) {
    persistView({ x: t.x, y: t.y, k: t.k })
  }

  return { graph, selectedNode, searchQuery, selectedFamily, filteredCognates, loadViewTransform, saveViewTransform }
})
