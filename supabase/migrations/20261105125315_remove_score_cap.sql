alter table public.game_results
  drop constraint if exists game_results_score_check;

alter table public.game_results
  add constraint game_results_score_check check (score >= 0);
