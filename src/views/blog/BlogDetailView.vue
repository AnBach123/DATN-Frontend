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
        <span class="current">{{ post.category || 'Chi tiết' }}</span>
      </div>

      <div class="detail-layout">
        <!-- LEFT: BÀI VIẾT CHÍNH -->
        <main class="detail-main">
          <span class="post-category">{{ post.category || 'Chung' }}</span>
          <h1 class="post-title">{{ post.title }}</h1>
          <div class="post-meta">
            <span class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {{ formatDate(post.publishedAt || post.createdAt) }}
            </span>
          </div>
          <div v-if="post.thumbnailUrl" class="post-hero-image">
            <img :src="post.thumbnailUrl" :alt="post.title" />
          </div>
          <article class="post-content" v-html="renderContent(post.content)"></article>
        </main>

        <!-- RIGHT: SIDEBAR -->
        <aside class="detail-sidebar">
          <!-- TIN MỚI NHẤT -->
          <div class="sidebar-section">
            <h3 class="sidebar-title">Tin mới nhất</h3>
            <div v-if="latestPosts.length === 0" class="sidebar-empty">Chưa có bài viết</div>
            <router-link
              v-for="item in latestPosts"
              :key="item.id"
              :to="`/posts/${item.id}`"
              class="sidebar-post"
              :class="{ active: item.id === post.id }"
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

      <!-- BÀI VIẾT KHÁC (DƯỚI NỘI DUNG CHÍNH) -->
      <div class="related-section" v-if="otherPosts.length > 0">
        <h2 class="related-title">Bài viết khác</h2>
        <div class="related-grid">
          <router-link
            v-for="item in otherPosts"
            :key="item.id"
            :to="`/posts/${item.id}`"
            class="related-card"
          >
            <div class="related-image">
              <img v-if="item.thumbnailUrl" :src="item.thumbnailUrl" :alt="item.title" />
              <div v-else class="related-placeholder">ByHat</div>
              <span class="related-category">{{ item.category || 'Chung' }}</span>
            </div>
            <div class="related-body">
              <h4>{{ item.title }}</h4>
              <p>{{ item.summary || truncate(item.content, 80) }}</p>
              <span class="related-date">{{ formatDate(item.publishedAt || item.createdAt) }}</span>
            </div>
          </router-link>
        </div>
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
const latestPosts = ref<Post[]>([])
const otherPosts = ref<Post[]>([])
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

const truncate = (text: string, len: number) => {
  if (!text) return ''
  const clean = text.replace(/\n/g, ' ')
  return clean.length > len ? clean.substring(0, len) + '...' : clean
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

    const allPosts: Post[] = await getPublishedPosts()
    const others = allPosts.filter((p: Post) => p.id !== id)

    // Sidebar: 5 bài mới nhất có ảnh
    latestPosts.value = allPosts.filter((p: Post) => p.thumbnailUrl).slice(0, 5)

    // Dưới bài viết: các bài khác có ảnh (trừ bài hiện tại), tối đa 6
    otherPosts.value = others.filter((p: Post) => p.thumbnailUrl).slice(0, 6)
  } catch (e) {
    console.error('Lỗi tải bài viết:', e)
  } finally {
    loading.value = false
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

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
  padding-top: 90px;
}

.loading-wrap {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 50vh; color: #888; font-size: 16px; gap: 12px;
}
.back-link { color: #a80000; font-weight: 600; text-decoration: none; }
.back-link:hover { text-decoration: underline; }

.detail-container { max-width: 1200px; margin: 0 auto; padding: 24px 20px 60px; }

/* BREADCRUMB */
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 24px; color: #888; }
.breadcrumb a { color: #a80000; text-decoration: none; font-weight: 500; }
.breadcrumb a:hover { text-decoration: underline; }
.breadcrumb .sep { color: #ccc; }
.breadcrumb .current { color: #555; }

/* LAYOUT 2 CỘT */
.detail-layout { display: grid; grid-template-columns: 1fr 320px; gap: 36px; align-items: start; }

/* ===== MAIN ===== */
.detail-main {
  padding: 0;
}
.post-category {
  display: inline-block; background: #fff0f0; color: #a80000;
  padding: 5px 16px; border-radius: 999px; font-size: 12px; font-weight: 700; margin-bottom: 16px;
}
.post-title { font-size: 28px; font-weight: 800; color: #1a1a1a; line-height: 1.4; margin-bottom: 16px; }
.post-meta {
  display: flex; flex-wrap: wrap; gap: 20px; font-size: 13px; color: #888;
  margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;
}
.meta-item { display: flex; align-items: center; gap: 6px; }
.post-hero-image { margin-bottom: 28px; border-radius: 12px; overflow: hidden; }
.post-hero-image img { width: 100%; max-height: 420px; object-fit: cover; display: block; }
.post-content { font-size: 15.5px; line-height: 1.9; color: #333; word-break: break-word; }
.post-content :deep(strong) { color: #1a1a1a; font-weight: 700; }

/* ===== SIDEBAR ===== */
.detail-sidebar { position: sticky; top: 90px; }

.sidebar-section {
  background: white; border-radius: 16px; padding: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}
.sidebar-title {
  font-size: 16px; font-weight: 700; color: #1a1a1a;
  margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #a80000;
}
.sidebar-empty { font-size: 13px; color: #aaa; text-align: center; padding: 20px 0; }

.sidebar-post {
  display: flex; gap: 10px; padding: 10px 6px; border-radius: 8px;
  text-decoration: none; color: inherit; transition: background 0.2s;
  border-bottom: 1px solid #f5f5f5;
}
.sidebar-post:last-child { border-bottom: none; }
.sidebar-post:hover { background: #faf5f5; }
.sidebar-post.active { background: #fff0f0; }

.sidebar-thumb { width: 72px; height: 50px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.sidebar-thumb img { width: 100%; height: 100%; object-fit: cover; }
.sidebar-thumb-placeholder {
  width: 100%; height: 100%; background: linear-gradient(135deg, #a80000, #e74c3c);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 10px; font-weight: 700; opacity: 0.7;
}
.sidebar-info { flex: 1; min-width: 0; }
.sidebar-info h4 {
  font-size: 13px; font-weight: 600; color: #2d2d2d; line-height: 1.4;
  margin: 0 0 3px; display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.sidebar-date { font-size: 11px; color: #aaa; }

/* ===== BÀI VIẾT KHÁC (GRID DƯỚI) ===== */
.related-section {
  margin-top: 48px;
}
.related-title {
  font-size: 22px; font-weight: 800; color: #1a1a1a;
  margin-bottom: 24px; padding-bottom: 12px; border-bottom: 3px solid #a80000;
  display: inline-block;
}
.related-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;
}
.related-card {
  background: white; border-radius: 14px; overflow: hidden; text-decoration: none; color: inherit;
  box-shadow: 0 3px 14px rgba(0,0,0,0.06); transition: transform 0.25s, box-shadow 0.25s;
  display: block;
}
.related-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.1); }

.related-image { position: relative; height: 160px; overflow: hidden; }
.related-image img { width: 100%; height: 100%; object-fit: cover; }
.related-placeholder {
  width: 100%; height: 100%; background: linear-gradient(135deg, #a80000, #e74c3c);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 18px; font-weight: 700; opacity: 0.6;
}
.related-category {
  position: absolute; top: 10px; left: 10px;
  background: rgba(0,0,0,0.5); color: white; padding: 3px 10px;
  border-radius: 999px; font-size: 11px; font-weight: 600; backdrop-filter: blur(4px);
}

.related-body { padding: 14px; }
.related-body h4 {
  font-size: 15px; font-weight: 700; color: #2d2d2d; margin: 0 0 6px; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.related-body p {
  font-size: 13px; color: #777; line-height: 1.5; margin: 0 0 8px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.related-date { font-size: 11px; color: #aaa; }

/* RESPONSIVE */
@media (max-width: 900px) {
  .detail-layout { grid-template-columns: 1fr; }
  .detail-sidebar { position: static; }
  .detail-main { padding: 0; }
  .post-title { font-size: 22px; }
  .related-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 576px) {
  .related-grid { grid-template-columns: 1fr; }
}
</style>
