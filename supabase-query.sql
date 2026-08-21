-- USERS & CHARACTERS
create table characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  class text not null, -- warrior/mage/rogue/cleric
  level int default 1,
  exp int default 0,
  might int default 5,
  wisdom int default 5,
  grace int default 5,
  current_hp int default 25,
  current_mp int default 10,
  gold int default 50,
  ap_current int default 50,
  ap_last_reset timestamp default now(),
  ascension_count int default 0,
  ascension_points int default 0,
  current_area_id uuid, -- will be linked later to areas(id) once created
  last_login timestamp default now(),
  created_at timestamp default now()
);

-- AREAS (WORLD)
create table areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier int not null,
  min_level int not null,
  max_level int not null,
  danger_rating int not null,
  is_procedural boolean default false,
  flavor_text_pool jsonb, -- array of strings
  created_at timestamp default now()
);

-- ADD FK
alter table characters add constraint fk_characters_area foreign key (current_area_id) references areas(id);

-- MONSTERS
create table monsters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_tier int not null,
  base_hp int not null,
  base_attack int not null,
  base_defense int not null,
  exp_reward int not null,
  gold_reward_min int not null,
  gold_reward_max int not null,
  special_ability text,
  flavor_description text,
  loot_table jsonb -- array of {item_id, drop_rate}
);

-- AREA_MONSTER_POOL (many-to-many)
create table area_monster_pool (
  area_id uuid references areas(id),
  monster_id uuid references monsters(id),
  primary key (area_id, monster_id)
);

-- ITEMS (master item database)
create table items (
  id uuid primary key default gen_random_uuid(),
  base_name text not null,
  category text not null, -- weapon/armor/accessory/consumable/material/quest_item
  subcategory text, -- sword/axe/helmet/ring/potion/etc
  rarity text not null, -- common/uncommon/rare/epic/legendary/mythic
  base_stat_bonus jsonb, -- {"might": 5, "attack": 10, etc}
  unique_effect text, -- for legendary/mythic items
  sell_value int default 1,
  is_generated boolean default false, -- true if procedurally named
  created_at timestamp default now()
);

-- CHARACTER_INVENTORY
create table character_inventory (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) not null,
  item_id uuid references items(id) not null,
  quantity int default 1,
  is_equipped boolean default false,
  equipment_slot text, -- weapon/helmet/chestplate/etc, null if not equipped
  generated_name text, -- final procedural name if applicable
  acquired_at timestamp default now()
);

-- NPCS
create table npcs (
  id uuid primary key default gen_random_uuid(),
  area_id uuid references areas(id),
  name text not null,
  npc_type text not null, -- vendor/quest_giver/trainer/wanderer
  dialog_tree jsonb,
  vendor_stock jsonb -- array of {item_id, price, stock_quantity} if type=vendor
);

-- QUESTS
create table quests (
  id uuid primary key default gen_random_uuid(),
  npc_id uuid references npcs(id),
  quest_type text not null, -- kill/fetch/explore/boss
  title text not null,
  description text not null,
  target_data jsonb, -- {"monster_id": xxx, "quantity": 10} or similar
  reward_gold int,
  reward_exp int,
  reward_item_id uuid references items(id),
  is_procedural boolean default false,
  is_repeatable boolean default false
);

-- CHARACTER_QUEST_PROGRESS
create table character_quest_progress (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) not null,
  quest_id uuid references quests(id) not null,
  progress_current int default 0,
  progress_required int not null,
  status text default 'active', -- active/completed/turned_in
  started_at timestamp default now(),
  completed_at timestamp
);

-- COMBAT_LOG (history, opsional tapi bagus untuk fitur "replay")
create table combat_log (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) not null,
  monster_id uuid references monsters(id) not null,
  result text not null, -- victory/defeat/fled
  exp_gained int,
  gold_gained int,
  items_gained jsonb,
  full_log_text text, -- narasi combat lengkap turn-by-turn
  created_at timestamp default now()
);

-- CRAFTING_RECIPES
create table crafting_recipes (
  id uuid primary key default gen_random_uuid(),
  result_item_id uuid references items(id) not null,
  required_materials jsonb not null, -- [{item_id, quantity}]
  required_crafting_level int default 1,
  success_rate numeric default 0.85
);

-- CHARACTER_ACHIEVEMENTS
create table character_achievements (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) not null,
  achievement_key text not null,
  unlocked_at timestamp default now()
);

-- ROW LEVEL SECURITY
alter table characters enable row level security;
create policy "Users can view own character" on characters for select using (auth.uid() = user_id);
create policy "Users can insert own character" on characters for insert with check (auth.uid() = user_id);
create policy "Users can update own character" on characters for update using (auth.uid() = user_id);
create policy "Users can delete own character" on characters for delete using (auth.uid() = user_id);

alter table character_inventory enable row level security;
create policy "Users can view own inventory" on character_inventory for select using (auth.uid() = (select user_id from characters where characters.id = character_inventory.character_id));
create policy "Users can insert own inventory" on character_inventory for insert with check (auth.uid() = (select user_id from characters where characters.id = character_inventory.character_id));
create policy "Users can update own inventory" on character_inventory for update using (auth.uid() = (select user_id from characters where characters.id = character_inventory.character_id));
create policy "Users can delete own inventory" on character_inventory for delete using (auth.uid() = (select user_id from characters where characters.id = character_inventory.character_id));

alter table character_quest_progress enable row level security;
create policy "Users can view own quest progress" on character_quest_progress for select using (auth.uid() = (select user_id from characters where characters.id = character_quest_progress.character_id));
create policy "Users can insert own quest progress" on character_quest_progress for insert with check (auth.uid() = (select user_id from characters where characters.id = character_quest_progress.character_id));
create policy "Users can update own quest progress" on character_quest_progress for update using (auth.uid() = (select user_id from characters where characters.id = character_quest_progress.character_id));
create policy "Users can delete own quest progress" on character_quest_progress for delete using (auth.uid() = (select user_id from characters where characters.id = character_quest_progress.character_id));

alter table combat_log enable row level security;
create policy "Users can view own combat log" on combat_log for select using (auth.uid() = (select user_id from characters where characters.id = combat_log.character_id));
create policy "Users can insert own combat log" on combat_log for insert with check (auth.uid() = (select user_id from characters where characters.id = combat_log.character_id));

alter table character_achievements enable row level security;
create policy "Users can view own achievements" on character_achievements for select using (auth.uid() = (select user_id from characters where characters.id = character_achievements.character_id));
create policy "Users can insert own achievements" on character_achievements for insert with check (auth.uid() = (select user_id from characters where characters.id = character_achievements.character_id));

-- PUBLIC TABLES (Read Only for Users)
alter table areas enable row level security;
create policy "Everyone can view areas" on areas for select using (true);

alter table monsters enable row level security;
create policy "Everyone can view monsters" on monsters for select using (true);

alter table area_monster_pool enable row level security;
create policy "Everyone can view area_monster_pool" on area_monster_pool for select using (true);

alter table items enable row level security;
create policy "Everyone can view items" on items for select using (true);

alter table npcs enable row level security;
create policy "Everyone can view npcs" on npcs for select using (true);

alter table quests enable row level security;
create policy "Everyone can view quests" on quests for select using (true);

alter table crafting_recipes enable row level security;
create policy "Everyone can view crafting_recipes" on crafting_recipes for select using (true);
