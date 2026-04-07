-- 研修制度50周年 師匠マッチング — 初期スキーマ
-- Supabase SQL エディタまたは migration で実行

create table if not exists public.jrs (
  id text primary key,
  last text not null,
  first text not null,
  nick text not null unique,
  year text not null check (year in ('1', '2')),
  spec1 text not null,
  spec2 text not null,
  spec3 text not null,
  mentor text,
  created_at timestamptz not null default now()
);

create table if not exists public.obs (
  id text primary key,
  last text not null,
  first text not null,
  spec text not null,
  msg text,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  ob_id text not null references public.obs (id) on delete cascade,
  jr_id text not null references public.jrs (id) on delete cascade,
  created_at timestamptz not null default now(),
  viewed_at timestamptz,
  primary key (ob_id, jr_id)
);

create index if not exists likes_jr_id_idx on public.likes (jr_id);
create index if not exists likes_ob_id_idx on public.likes (ob_id);

-- 直接の anon / authenticated アクセスは使わず、Next.js の service_role のみ運用する想定
alter table public.jrs enable row level security;
alter table public.obs enable row level security;
alter table public.likes enable row level security;

-- 既定ポリシーなし = service_role は RLS をバイパス、他ロールはアクセス不可

comment on table public.jrs is '研修医（実名は API 層で秘匿し OB には公開しない）';
comment on table public.obs is 'OB プロフィール';
comment on table public.likes is 'OB から JR へのいいね（viewed_at でマイページ新着管理）';
