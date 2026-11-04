-- Participant self-serve wishlists: participants edit a free-text wishlist
-- from their own assignment link; their Secret Santa sees it on the page.
-- Budget / deadline columns already exist on exchange (unused until now).
alter table participant add column if not exists wishlist_text text;

-- rollback:
-- alter table participant drop column if exists wishlist_text;
