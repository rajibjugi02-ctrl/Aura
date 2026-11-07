-- AuraGlass Production Database Schema for Supabase
-- Copy and run this in your Supabase Project -> SQL Editor to enable full multi-device database persistence!

-- 1. Profiles
create table if not exists public.profiles (
  id text primary key,
  name text,
  username text unique,
  avatar text,
  bio text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Posts
create table if not exists public.posts (
  id text primary key,
  author_id text not null,
  author_name text,
  author_username text,
  author_avatar text,
  media jsonb not null default '[]'::jsonb,
  caption text,
  music_track jsonb,
  likes_count integer default 0,
  comments_count integer default 0,
  reposts_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Comments
create table if not exists public.post_comments (
  id text primary key,
  post_id text references public.posts(id) on delete cascade,
  author_id text not null,
  author_username text,
  author_avatar text,
  text text not null,
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Stories
create table if not exists public.stories (
  id text primary key,
  user_id text not null,
  username text,
  user_avatar text,
  media_url text not null,
  type text default 'image',
  music_track jsonb,
  views_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Reels
create table if not exists public.reels (
  id text primary key,
  media_url text not null,
  type text default 'video',
  author jsonb not null,
  caption text,
  audio_track jsonb,
  likes_count integer default 0,
  comments_count integer default 0,
  reposts_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Messages
create table if not exists public.messages (
  id text primary key,
  conversation_id text not null,
  sender_id text not null,
  recipient_id text,
  content text,
  image_url text,
  timestamp text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.stories enable row level security;
alter table public.reels enable row level security;
alter table public.messages enable row level security;

-- Policies for public reading & writing
create policy "Allow all profiles" on public.profiles for all using (true) with check (true);
create policy "Allow all posts" on public.posts for all using (true) with check (true);
create policy "Allow all comments" on public.post_comments for all using (true) with check (true);
create policy "Allow all stories" on public.stories for all using (true) with check (true);
create policy "Allow all reels" on public.reels for all using (true) with check (true);
create policy "Allow all messages" on public.messages for all using (true) with check (true);
