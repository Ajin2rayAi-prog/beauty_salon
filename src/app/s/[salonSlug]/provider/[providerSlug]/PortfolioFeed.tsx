"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, Send, Loader2, Camera, X } from "lucide-react";
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
  const [openId, setOpenId] = useState<string | null>(null);
  const [me, setMe] = useState<{ name: string } | null>(null);

  // restore per-visitor like state + saved name from localStorage
  useEffect(() => {
    try {
      const l = JSON.parse(localStorage.getItem(LIKED_KEY) || "[]") as string[];
      setLiked(Object.fromEntries(l.map((id) => [id, true])));
      setGuestName(localStorage.getItem(NAME_KEY) || "");
    } catch { /* ignore */ }
  }, []);

  // detect a logged-in session (no SessionProvider needed on public pages)
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => { if (alive && s?.user?.name) setMe({ name: s.user.name }); })
      .catch(() => { /* ignore */ });
    return () => { alive = false; };
  }, []);

  // lock body scroll while a post is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = openId ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [openId]);

  const lineTags = useMemo(() => {
    const map = new Map<string, string>();
    posts.forEach((p) => { if (p.line) map.set(p.line.id, p.line.name); });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [posts]);

  const shown = filter === "all" ? posts : posts.filter((p) => p.line?.id === filter);
  const openPost = openId ? posts.find((p) => p.id === openId) ?? null : null;

  function persistLiked(next: Record<string, boolean>) {
    try { localStorage.setItem(LIKED_KEY, JSON.stringify(Object.keys(next).filter((k) => next[k]))); } catch { /* ignore */ }
  }

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

  function onCommented(postId: string, c: Comment) {
    setPosts((list) => list.map((x) => (x.id === postId ? { ...x, comments: [...x.comments, c] } : x)));
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
        // Instagram-style profile grid: 4 across on desktop, no vertical feed.
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-4">
          {shown.map((p) => (
            <button
              key={p.id} type="button" onClick={() => setOpenId(p.id)}
              className="group relative aspect-square overflow-hidden rounded-xl bg-black/20 focus:outline-none focus:ring-2 focus:ring-rose-400/70"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={p.caption ?? ""} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" />
              {/* hover overlay with like + comment counts (desktop) */}
              <span className="absolute inset-0 flex items-center justify-center gap-5 bg-black/45 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
                <span className="flex items-center gap-1.5"><Heart size={18} className="fill-white" /> {p.likes.toLocaleString("fa-IR")}</span>
                <span className="flex items-center gap-1.5"><MessageCircle size={18} className="fill-white" /> {p.comments.length.toLocaleString("fa-IR")}</span>
              </span>
              {p.comments.length > 0 && (
                <span className="absolute bottom-1.5 left-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white sm:hidden">
                  <MessageCircle size={13} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {openPost && (
        <PostModal
          post={openPost} providerName={providerName} providerPhoto={providerPhoto}
          liked={!!liked[openPost.id]} onLike={() => toggleLike(openPost)}
          me={me} guestName={guestName} setGuestName={setGuestName}
          onCommented={(c) => onCommented(openPost.id, c)}
          onClose={() => setOpenId(null)}
        />
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
function PostModal({
  post, providerName, providerPhoto, liked, onLike, me, guestName, setGuestName, onCommented, onClose,
}: {
  post: Post; providerName: string; providerPhoto: string; liked: boolean; onLike: () => void;
  me: { name: string } | null; guestName: string; setGuestName: (v: string) => void;
  onCommented: (c: Comment) => void; onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/public/portfolio/comment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioId: post.id, authorName: me ? "" : guestName.trim() || "مهمان", text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      setText("");
      if (data.pending) {
        // guest comment: hidden until the salon approves it
        toast.success("دیدگاه شما ثبت شد و پس از تأیید نمایش داده می‌شود");
      } else {
        onCommented(data.comment);
      }
      try { if (!me && guestName.trim()) localStorage.setItem(NAME_KEY, guestName.trim()); } catch { /* ignore */ }
    } catch (err: any) {
      toast.error(err.message || "خطا در ثبت دیدگاه");
    } finally { setSending(false); }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm animate-fade-up sm:p-6" onClick={onClose}>
      <div
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#150b1f] shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="بستن" className="absolute left-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white/80 transition hover:bg-black/70 hover:text-white">
          <X size={17} />
        </button>

        {/* image */}
        <div className="aspect-square w-full shrink-0 bg-black/30 md:aspect-auto md:w-[55%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt={post.caption ?? ""} className="h-full w-full object-cover" />
        </div>

        {/* details */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-white/[0.06] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={providerPhoto} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-rose-400/40" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{providerName}</p>
              {post.line && <p className="text-[11px] text-white/45">{post.line.name}</p>}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {post.caption && (
              <p className="text-sm leading-6"><b className="font-bold">{providerName}</b>{" "}<span className="text-white/80">{post.caption}</span></p>
            )}
            {post.comments.length === 0 ? (
              <p className="text-[12px] text-white/35">هنوز دیدگاهی ثبت نشده — اولین نفر باشید.</p>
            ) : post.comments.map((c) => (
              <p key={c.id} className="text-sm leading-6"><b className="font-bold">{c.authorName}</b>{" "}<span className="text-white/75">{c.text}</span></p>
            ))}
          </div>

          <div className="flex items-center gap-4 border-t border-white/[0.06] px-3 pt-3 text-sm">
            <button onClick={onLike} className="flex items-center gap-1.5 transition active:scale-90" aria-label="لایک">
              <Heart size={22} className={liked ? "fill-rose-500 text-rose-500" : "text-white/70 hover:text-rose-300"} />
              {post.likes.toLocaleString("fa-IR")}
            </button>
            <span className="flex items-center gap-1.5 text-white/70"><MessageCircle size={20} /> {post.comments.length.toLocaleString("fa-IR")}</span>
            <span className="mr-auto text-[11px] text-white/40">{toJalali(post.createdAt)}</span>
          </div>

          <form onSubmit={submit} className="space-y-2 border-t border-white/[0.06] p-3">
            {me ? (
              <p className="text-[11px] text-white/45">دیدگاه به‌نام <b className="font-bold text-white/70">{me.name}</b></p>
            ) : (
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="نام شما (اختیاری)" className="input w-full py-2 text-xs" />
            )}
            <div className="flex items-center gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="دیدگاه بگذارید…" className="input min-w-0 flex-1 py-2 text-sm" />
              <button disabled={sending || !text.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-gradient text-white disabled:opacity-40" aria-label="ارسال">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
