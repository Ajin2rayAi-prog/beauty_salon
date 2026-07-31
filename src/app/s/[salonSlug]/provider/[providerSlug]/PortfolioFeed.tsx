"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, Send, Loader2, Camera } from "lucide-react";
import toast from "react-hot-toast";
import { toJalali } from "@/lib/utils";

type Comment = { id: string; authorName: string; text: string; createdAt: string };
type Post = {
  id: string; imageUrl: string; caption: string | null; likes: number; createdAt: string;
  line: { id: string; name: string } | null; comments: Comment[];
};

const LIKED_KEY = "bs_liked_posts";
const NAME_KEY = "bs_guest_name";

export function PortfolioFeed({
  providerName, providerPhoto, initialPosts,
}: {
  providerName: string; providerPhoto: string; initialPosts: Post[];
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>("all");
  const [guestName, setGuestName] = useState("");

  // restore per-visitor like state + saved name from localStorage
  useEffect(() => {
    try {
      const l = JSON.parse(localStorage.getItem(LIKED_KEY) || "[]") as string[];
      setLiked(Object.fromEntries(l.map((id) => [id, true])));
      setGuestName(localStorage.getItem(NAME_KEY) || "");
    } catch { /* ignore */ }
  }, []);

  const lineTags = useMemo(() => {
    const map = new Map<string, string>();
    posts.forEach((p) => { if (p.line) map.set(p.line.id, p.line.name); });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [posts]);

  const shown = filter === "all" ? posts : posts.filter((p) => p.line?.id === filter);

  function persistLiked(next: Record<string, boolean>) {
    try { localStorage.setItem(LIKED_KEY, JSON.stringify(Object.keys(next).filter((k) => next[k]))); } catch { /* ignore */ }
  }
  // PLACEHOLDER_LOGIC
  async function toggleLike(post: Post) {
    const isLiked = !!liked[post.id];
    const nextLiked = { ...liked, [post.id]: !isLiked };
    setLiked(nextLiked);
    persistLiked(nextLiked);
    // optimistic count
    setPosts((list) => list.map((p) => (p.id === post.id ? { ...p, likes: Math.max(0, p.likes + (isLiked ? -1 : 1)) } : p)));
    try {
      const res = await fetch("/api/public/portfolio/like", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, liked: !isLiked }),
      });
      const data = await res.json();
      if (res.ok) setPosts((list) => list.map((p) => (p.id === post.id ? { ...p, likes: data.likes } : p)));
    } catch { /* keep optimistic value */ }
  }

  return (
    <div className="space-y-6">
      {lineTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>همه</FilterChip>
          {lineTags.map((t) => (
            <FilterChip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)}>{t.name}</FilterChip>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="card p-12 text-center text-white/45">
          <Camera size={30} className="mx-auto text-white/30" />
          <p className="mt-3">پستی برای نمایش نیست.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-md space-y-6">
          {shown.map((p) => (
            <PostCard
              key={p.id} post={p} providerName={providerName} providerPhoto={providerPhoto}
              liked={!!liked[p.id]} onLike={() => toggleLike(p)}
              guestName={guestName} setGuestName={setGuestName}
              onCommented={(c) => setPosts((list) => list.map((x) => (x.id === p.id ? { ...x, comments: [...x.comments, c] } : x)))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${active ? "bg-rose-gradient text-white" : "bg-white/[0.05] text-white/55 hover:text-white/85"}`}>
      {children}
    </button>
  );
}
// PLACEHOLDER_CARD
function PostCard({
  post, providerName, providerPhoto, liked, onLike, guestName, setGuestName, onCommented,
}: {
  post: Post; providerName: string; providerPhoto: string; liked: boolean; onLike: () => void;
  guestName: string; setGuestName: (v: string) => void; onCommented: (c: Comment) => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/public/portfolio/comment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioId: post.id, authorName: guestName.trim() || "مهمان", text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      onCommented(data.comment);
      setText("");
      try { if (guestName.trim()) localStorage.setItem(NAME_KEY, guestName.trim()); } catch { /* ignore */ }
    } catch (err: any) {
      toast.error(err.message || "خطا در ثبت دیدگاه");
    } finally { setSending(false); }
  }

  return (
    <article className="card overflow-hidden p-0">
      <div className="flex items-center gap-3 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={providerPhoto} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-rose-400/40" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{providerName}</p>
          {post.line && <p className="text-[11px] text-white/45">{post.line.name}</p>}
        </div>
      </div>
      <div className="aspect-square overflow-hidden bg-black/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.imageUrl} alt={post.caption ?? ""} className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center gap-4 px-3 pt-3 text-sm">
        <button onClick={onLike} className="flex items-center gap-1.5 transition active:scale-90" aria-label="لایک">
          <Heart size={20} className={liked ? "fill-rose-500 text-rose-500" : "text-white/70 hover:text-rose-300"} />
          {post.likes.toLocaleString("fa-IR")}
        </button>
        <span className="flex items-center gap-1.5 text-white/70"><MessageCircle size={19} /> {post.comments.length.toLocaleString("fa-IR")}</span>
        <span className="mr-auto text-[11px] text-white/40">{toJalali(post.createdAt)}</span>
      </div>
      {post.caption && <p className="px-3 pt-2 text-sm leading-6"><b className="font-bold">{providerName}</b>{" "}<span className="text-white/80">{post.caption}</span></p>}
      <div className="space-y-2 px-3 py-3">
        {post.comments.map((c) => (
          <p key={c.id} className="text-sm leading-6"><b className="font-bold">{c.authorName}</b>{" "}<span className="text-white/75">{c.text}</span></p>
        ))}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-white/[0.06] p-3">
        <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="نام" className="input w-24 py-2 text-xs" />
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="دیدگاه بگذارید…" className="input flex-1 py-2 text-xs" />
        <button disabled={sending || !text.trim()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-gradient text-white disabled:opacity-40" aria-label="ارسال">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>
    </article>
  );
}
