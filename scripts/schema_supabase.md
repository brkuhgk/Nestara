-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users Table
create table public.users (
    id uuid primary key default uuid_generate_v4(),
    type text check (type in ('tenant', 'maintainer')),
    username text unique not null,
    email text unique not null,
    phone text unique not null,
    name text not null,
    bio text,
    image_url text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Houses Table
create table public.houses (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    address text not null,
    image_url text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- House Members Table
create table public.house_members (
    house_id uuid references houses(id),
    user_id uuid references users(id),
    type text check (type in ('tenant', 'maintainer')),
    status text check (status in ('active', 'pending', 'inactive')),
    joined_at timestamp with time zone default now(),
    primary key (house_id, user_id)
);

-- Topics Table
create table public.topics (
    id uuid primary key default uuid_generate_v4(),
    house_id uuid references houses(id),
    created_by uuid references users(id),
    type text check (type in ('general', 'conflict', 'mentions')),
    description text not null,
    images text[],
    votes integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create indexes
create index idx_house_members_user on house_members(user_id);
create index idx_topics_house on topics(house_id);