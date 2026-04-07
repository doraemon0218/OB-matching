-- OB: パスワードハッシュ・卒業年度・所属・氏名ユニーク

alter table public.obs add column if not exists password_hash text not null default '';
alter table public.obs add column if not exists grad_year text not null default '';
alter table public.obs add column if not exists affiliation text not null default '';

create unique index if not exists obs_last_first_unique on public.obs (last, first);
