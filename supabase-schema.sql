-- CLASS LEGENDS - BANCO DE DADOS INICIAL
-- Rode este arquivo no SQL Editor do Supabase.
-- Este protótipo usa funções SQL para criar e validar usuários sem salvar senha em texto puro.

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  username_normalized text generated always as (lower(username)) stored,
  password_hash text not null,
  email text,
  public_code text not null unique default ('CL-' || upper(substr(md5(random()::text),1,8))),
  first_character_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists players_username_unique
on public.players (username_normalized);

alter table public.players enable row level security;

-- Não permita leitura direta da tabela pelo navegador.
revoke all on public.players from anon, authenticated;

create or replace function public.register_player(
  p_username text,
  p_password text,
  p_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players;
begin
  if length(trim(p_username)) < 3 then
    return jsonb_build_object('ok',false,'message','O nome precisa ter pelo menos 3 caracteres.');
  end if;

  if length(p_password) < 4 then
    return jsonb_build_object('ok',false,'message','A senha precisa ter pelo menos 4 caracteres.');
  end if;

  if exists(select 1 from public.players where username_normalized = lower(trim(p_username))) then
    return jsonb_build_object('ok',false,'message','Esse nome de usuário já existe.');
  end if;

  insert into public.players(username,password_hash,email)
  values(trim(p_username), crypt(p_password, gen_salt('bf')), nullif(trim(p_email),''))
  returning * into v_player;

  return jsonb_build_object(
    'ok',true,
    'player',jsonb_build_object(
      'id',v_player.id,
      'username',v_player.username,
      'email',v_player.email,
      'public_code',v_player.public_code,
      'first_character_id',v_player.first_character_id
    )
  );
end;
$$;

create or replace function public.login_player(
  p_username text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players;
begin
  select * into v_player
  from public.players
  where username_normalized = lower(trim(p_username))
    and password_hash = crypt(p_password, password_hash)
  limit 1;

  if v_player.id is null then
    return jsonb_build_object('ok',false,'message','Usuário ou senha incorretos.');
  end if;

  return jsonb_build_object(
    'ok',true,
    'player',jsonb_build_object(
      'id',v_player.id,
      'username',v_player.username,
      'email',v_player.email,
      'public_code',v_player.public_code,
      'first_character_id',v_player.first_character_id
    )
  );
end;
$$;

create or replace function public.choose_first_character(
  p_player_id uuid,
  p_character_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_character_id not in (
    'guerreiro_1','guerreiro_2',
    'ninja_1','ninja_2',
    'pirata_1','pirata_2',
    'fada_1','fada_2',
    'medico_1','medico_2'
  ) then
    return jsonb_build_object('ok',false,'message','Personagem inválido.');
  end if;

  update public.players
  set first_character_id = p_character_id
  where id = p_player_id
    and first_character_id is null;

  if not found then
    return jsonb_build_object('ok',false,'message','Não foi possível salvar. O personagem talvez já tenha sido escolhido.');
  end if;

  return jsonb_build_object('ok',true);
end;
$$;

grant execute on function public.register_player(text,text,text) to anon, authenticated;
grant execute on function public.login_player(text,text) to anon, authenticated;
grant execute on function public.choose_first_character(uuid,text) to anon, authenticated;
