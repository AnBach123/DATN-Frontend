<template>
  <div class="blog-page">
    <div class="blog-hero">
      <h1>Bài viết mới</h1>
      <p>Cập nhật mọi thông tin về ẩm thực, chính sách ưu đãi tại nhà hàng</p>
    </div>

    <div class="blog-content">
      <!-- FILTER BAR -->
      <div class="filter-bar">
        <input v-model="search" placeholder="Tìm kiếm..." class="search-box" @input="handleSearch" />
        <div class="category-tabs">
          <button :class="['tab', !activeCategory ? 'active' : '']" @click="filterCategory('')">Tất cả</button>
          <button :class="['tab', activeCategory === 'Tin tức' ? 'active' : '']" @click="filterCategory('Tin tức')">Tin tức</button>
          <button :class="['tab', activeCategory === 'Khuyến mãi' ? 'active' : '']" @click="filterCategory('Khuyến mãi')">Khuyến mãi</button>
          <button :class="['tab', activeCategory === 'Ẩm thực' ? 'active' : '']" @click="filterCategory('Ẩm thực')">Ẩm thực</button>
          <button :class="['tab', activeCategory === 'Sự kiện' ? 'active' : '']" @click="filterCategory('Sự kiện')">Sự kiện</button>
        </div>
        <select v-model="sortBy" class="sort-select" @change="applySortFilter">
          <option value="newest">Mới nhất</option>
          <option value="popular">Nhiều lượt xem</option>
        </select>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="loading-state">Đang tải bài viết...</div>

      <!-- EMPTY -->
      <div v-else-if="filteredPosts.length === 0" class="empty-state">
        <p>Chưa có bài viết nào</p>
      </div>

      <!-- GRID -->
      <div v-else class="posts-grid">
        <router-link
          v-for="post in pagedPosts"
          :key="post.id"
          :to="`/posts/${post.id}`"
          class="post-card"
        >
          <div class="card-image">
            <img v-if="post.thumbnailUrl" :src="post.thumbnailUrl" :alt="post.title" />
            <div v-else class="placeholder-img">
              <span>ByHat</span>
            </div>
            <span class="card-category">{{ post.category || 'Chung' }}</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">{{ post.title }}</h3>
            <p class="card-summary">{{ post.summary || truncate(post.content, 120) }}</p>
            <div class="card-footer">
              <span class="meta-date">{{ formatDate(post.publishedAt || post.createdAt) }}</span>
              <span class="card-readmore">Xem ngay →</span>
            </div>
          </div>
        </router-link>
      </div>

      <!-- PAGINATION -->
      <div class="blog-pagination" v-if="totalPages > 1">
        <button :disabled="page === 1" @click="page--" class="pg-btn">&lsaquo;</button>
        <button v-for="p in totalPages" :key="p" :class="['pg-btn', { active: p === page }]" @click="page = p">{{ p }}</button>
        <button :disabled="page === totalPages" @click="page++" class="pg-btn">&rsaquo;</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getPublishedPosts } from '@/services/blogApi'

type Post = {
  id: number; title: string; summary: string; content: string
  thumbnailUrl: string; category: string; author: string
  isPublished: boolean; viewCount: number
  createdAt: string; publishedAt: string
}

const allPosts = ref<Post[]>([])
const filteredPosts = ref<Post[]>([])
const loading = ref(false)
const search = ref('')
const activeCategory = ref('')
const sortBy = ref('newest')
const page = ref(1)
const PAGE_SIZE = 6

let searchTimeout: ReturnType<typeof setTimeout>

const totalPages = computed(() => Math.ceil(filteredPosts.value.length / PAGE_SIZE))
const pagedPosts = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredPosts.value.slice(start, start + PAGE_SIZE)
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) {
    const m = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})/)
    if (m) return `${m[1]}/${m[2]}/${m[3]}`
    return dateStr
  }
  return d.toLocaleDateString('vi-VN')
}

const truncate = (text: string, len: number) => {
  if (!text) return ''
  const clean = text.replace(/\n/g, ' ')
  return clean.length > len ? clean.substring(0, len) + '...' : clean
}

const applySortFilter = () => {
  let result = [...allPosts.value]
  if (search.value) {
    const kw = search.value.toLowerCase()
    result = result.filter(p => p.title.toLowerCase().includes(kw) || (p.summary || '').toLowerCase().includes(kw))
  }
  if (activeCategory.value) {
    result = result.filter(p => p.category === activeCategory.value)
  }
  if (sortBy.value === 'popular') {
    result.sort((a, b) => b.viewCount - a.viewCount)
  }
  filteredPosts.value = result
  page.value = 1
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(applySortFilter, 400)
}

const filterCategory = (cat: string) => {
  activeCategory.value = cat
  applySortFilter()
}

onMounted(async () => {
  loading.value = true
  try {
    allPosts.value = await getPublishedPosts()
    filteredPosts.value = allPosts.value
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.blog-page { min-height: 100vh; background: #faf8f5; padding-top: 110px; }

.blog-hero {
  background: linear-gradient(135deg, #7a0000, #c0392b);
  color: white; text-align: center; padding: 60px 20px 50px;
}
.blog-hero h1 { font-size: 36px; font-weight: 800; margin-bottom: 8px; }
.blog-hero p { font-size: 16px; opacity: 0.85; }

.blog-content { max-width: 1200px; margin: 0 auto; padding: 30px 20px; }

.filter-bar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 30px; }
.search-box { flex: 1; min-width: 200px; padding: 10px 16px; border: 2px solid #e2e0dc; border-radius: 10px; font-size: 14px; background: white; }
.search-box:focus { outline: none; border-color: #a80000; }
.category-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.tab { padding: 8px 16px; border: 1.5px solid #ddd; border-radius: 999px; background: white; font-size: 13px; font-weight: 600; color: #555; cursor: pointer; transition: 0.2s; }
.tab:hover { border-color: #a80000; color: #a80000; }
.tab.active { background: #a80000; color: white; border-color: #a80000; }
.sort-select { padding: 10px 14px; border: 2px solid #e2e0dc; border-radius: 10px; font-size: 13px; background: white; }

.loading-state, .empty-state { text-align: center; padding: 60px 20px; color: #888; font-size: 16px; }

.posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }

.post-card {
  background: white; border-radius: 16px; overflow: hidden; cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06); transition: transform 0.25s, box-shadow 0.25s;
  text-decoration: none; color: inherit; display: block;
}
.post-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.12); }

.card-image { position: relative; height: 200px; overflow: hidden; }
.card-image img { width: 100%; height: 100%; object-fit: cover; }
.placeholder-img { width: 100%; height: 100%; background: linear-gradient(135deg, #a80000, #e74c3c); display: flex; align-items: center; justify-content: center; }
.placeholder-img span { color: white; font-size: 22px; font-weight: 700; opacity: 0.6; }
.card-category { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.55); color: white; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; backdrop-filter: blur(4px); }

.card-body { padding: 18px; display: flex; flex-direction: column; flex: 1; }
.post-card { display: flex; flex-direction: column; }
.card-title { font-size: 17px; font-weight: 700; color: #2d2d2d; margin-bottom: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-summary { font-size: 13.5px; color: #666; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 14px; }
.card-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #999; margin-top: auto; }
.card-readmore { font-size: 13px; font-weight: 600; color: #a80000; transition: 0.2s; }
.post-card:hover .card-readmore { text-decoration: underline; }

.blog-pagination { display: flex; justify-content: center; gap: 6px; margin-top: 36px; }
.pg-btn { min-width: 38px; height: 38px; border: 1.5px solid #ddd; border-radius: 8px; background: white; color: #555; font-weight: 600; cursor: pointer; transition: 0.2s; }
.pg-btn:hover:not(:disabled) { border-color: #a80000; color: #a80000; }
.pg-btn.active { background: #a80000; color: white; border-color: #a80000; }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 768px) {
  .blog-hero h1 { font-size: 26px; }
  .posts-grid { grid-template-columns: 1fr; }
  .filter-bar { flex-direction: column; }
}
</style>
