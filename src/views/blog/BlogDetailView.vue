<template>
  <div class="blog-detail-page">
    <!-- LOADING -->
    <div v-if="loading" class="loading-wrap">
      <p>Đang tải bài viết...</p>
    </div>

    <!-- ERROR -->
    <div v-else-if="!post" class="loading-wrap">
      <p>Không tìm thấy bài viết</p>
      <router-link to="/posts" class="back-link">Quay lại danh sách</router-link>
    </div>

    <!-- CONTENT -->
    <div v-else class="detail-container">
      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <router-link to="/posts">Bài viết</router-link>
        <span class="sep">/</span>
        <span v-if="post.category" class="current">{{ post.category }}</span>
        <span v-else class="current">Chi tiết</span>
      </div>

      <div class="detail-layout">
        <!-- LEFT: BÀI VIẾT CHÍNH -->
        <main class="detail-main">
          <!-- CATEGORY -->
          <span class="post-category">{{ post.category || 'Chung' }}</span>

          <!-- TITLE -->
          <h1 class="post-title">{{ post.title }}</h1>

          <!-- META -->
          <div class="post-meta">
            <span class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {{ formatDate(post.publishedAt || post.createdAt) }}
            </span>
          </div>

          <!-- HERO IMAGE -->
          <div v-if="post.thumbnailUrl" class="post-hero-image">
            <img :src="post.thumbnailUrl" :alt="post.title" />
          </div>

          <!-- CONTENT -->
          <article class="post-content" v-html="renderContent(post.content)"></article>
        </main>

        <!-- RIGHT: SIDEBAR -->
        <aside class="detail-sidebar">
          <div class="sidebar-section">
            <h3 class="sidebar-title">Bài viết khác</h3>
            <div v-if="relatedPosts.length === 0" class="sidebar-empty">Chưa có bài viết khác</div>
            <router-link
              v-for="item in relatedPosts"
              :key="item.id"
              :to="`/posts/${item.id}`"
              class="sidebar-post"
            >
              <div class="sidebar-thumb">
                <img v-if="item.thumbnailUrl" :src="item.thumbnailUrl" :alt="item.title" />
                <div v-else class="sidebar-thumb-placeholder">ByHat</div>
              </div>
              <div class="sidebar-info">
                <h4>{{ item.title }}</h4>
                <span class="sidebar-date">{{ formatDate(item.publishedAt || item.createdAt) }}</span>
              </div>
            </router-link>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getPostDetail, getPublishedPosts } from '@/services/blogApi'

type Post = {
  id: number; title: string; summary: string; content: string
  thumbnailUrl: string; category: string; author: string
  isPublished: boolean; viewCount: number
  createdAt: string; publishedAt: string
}

const route = useRoute()
const post = ref<Post | null>(null)
const relatedPosts = ref<Post[]>([])
const loading = ref(true)

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

const renderContent = (content: string) => {
  if (!content) return ''
  return content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

const loadPost = async (id: number) => {
  loading.value = true
  post.value = null
  try {
    post.value = await getPostDetail(id)

    // Load sidebar: bài viết khác (loại trừ bài hiện tại)
    const allPosts = await getPublishedPosts()
    relatedPosts.value = allPosts
      .filter((p: Post) => p.id !== id)
      .slice(0, 6)
  } catch (e) {
    console.error('Lỗi tải bài viết:', e)
  } finally {
    loading.value = false
  }

  // Scroll lên đầu trang
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Watch route param thay đổi (click sidebar post khác)
watch(() => route.params.id, (newId) => {
  if (newId) loadPost(Number(newId))
})

onMounted(() => {
  loadPost(Number(route.params.id))
})
</script>

<style scoped>
.blog-detail-page {
  min-height: 100vh;
  background: #faf8f5;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: #888;
  font-size: 16px;
  gap: 12px;
}

.back-link {
  color: #a80000;
  font-weight: 600;
  text-decoration: none;
}
.back-link:hover { text-decoration: underline; }

.detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

/* BREADCRUMB */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 24px;
  color: #888;
}
.breadcrumb a {
  color: #a80000;
  text-decoration: none;
  font-weight: 500;
}
.breadcrumb a:hover { text-decoration: underline; }
.breadcrumb .sep { color: #ccc; }
.breadcrumb .current { color: #555; }

/* LAYOUT: 2 CỘT */
.detail-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 40px;
  align-items: start;
}

/* ===== MAIN CONTENT ===== */
.detail-main {
  background: white;
  border-radius: 16px;
  padding: 36px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.post-category {
  display: inline-block;
  background: #fff0f0;
  color: #a80000;
  padding: 5px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 16px;
}

.post-title {
  font-size: 28px;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 16px;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 13px;
  color: #888;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-hero-image {
  margin-bottom: 28px;
  border-radius: 12px;
  overflow: hidden;
}
.post-hero-image img {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  display: block;
}

.post-content {
  font-size: 15.5px;
  line-height: 1.9;
  color: #333;
  word-break: break-word;
}

.post-content :deep(strong) {
  color: #1a1a1a;
  font-weight: 700;
}

/* ===== SIDEBAR ===== */
.detail-sidebar {
  position: sticky;
  top: 90px;
}

.sidebar-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.sidebar-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 2px solid #a80000;
}

.sidebar-empty {
  font-size: 13px;
  color: #aaa;
  text-align: center;
  padding: 20px 0;
}

.sidebar-post {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s;
  border-radius: 8px;
}
.sidebar-post:last-child { border-bottom: none; }
.sidebar-post:hover {
  background: #faf5f5;
}

.sidebar-thumb {
  width: 80px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.sidebar-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sidebar-thumb-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #a80000, #e74c3c);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: 700;
  opacity: 0.7;
}

.sidebar-info {
  flex: 1;
  min-width: 0;
}
.sidebar-info h4 {
  font-size: 13.5px;
  font-weight: 600;
  color: #2d2d2d;
  line-height: 1.4;
  margin: 0 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.sidebar-date {
  font-size: 11px;
  color: #aaa;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
  .detail-sidebar {
    position: static;
  }
  .detail-main {
    padding: 24px;
  }
  .post-title {
    font-size: 22px;
  }
}
</style>
