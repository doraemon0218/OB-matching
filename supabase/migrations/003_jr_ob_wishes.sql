-- 研修医が「お話ししたいOB先生」を選択するテーブル
-- 空 = 特に希望なし

create table if not exists public.jr_ob_wishes (
  jr_id  text not null references public.jrs (id) on delete cascade,
  ob_id  text not null references public.obs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (jr_id, ob_id)
);

create index if not exists jr_ob_wishes_jr_id_idx on public.jr_ob_wishes (jr_id);
create index if not exists jr_ob_wishes_ob_id_idx on public.jr_ob_wishes (ob_id);

alter table public.jr_ob_wishes enable row level security;

comment on table public.jr_ob_wishes is '研修医が面談を希望するOB（空 = 特に希望なし）';
