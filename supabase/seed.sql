-- Urbanfix v3.0 — demo seed data
-- Run after 0001_init.sql.

-- Categories -----------------------------------------------------------------
insert into public.categories (id, label, icon) values
  ('flooding',    'Flooding',            'droplet'),
  ('pothole',     'Pothole / Road',      'road'),
  ('streetlight', 'Streetlight Outage',  'bulb'),
  ('garbage',     'Garbage / Sanitation','trash'),
  ('graffiti',    'Graffiti / Vandalism','spray'),
  ('water',       'Water / Sewage',      'pipe'),
  ('other',       'Other',               'pin')
on conflict (id) do nothing;

-- Zones (simple bounding boxes — example values around a demo city) -----------
insert into public.zones (id, label, min_lat, min_lng, max_lat, max_lng) values
  ('zone-1', 'Zone 1 - Downtown', 40.70, -74.02, 40.73, -73.98),
  ('zone-2', 'Zone 2 - North',    40.73, -74.02, 40.78, -73.98),
  ('zone-3', 'Zone 3 - East',     40.70, -73.98, 40.75, -73.93),
  ('zone-4', 'Zone 4 - West',     40.70, -74.06, 40.75, -74.02)
on conflict (id) do nothing;

-- Institutions ---------------------------------------------------------------
insert into public.institutions (id, name, official_email_domain, category_coverage, zone_coverage, status) values
  ('11111111-1111-1111-1111-111111111111', 'City Public Works',      'publicworks.gov', array['pothole','streetlight','water'], array['zone-1','zone-2','zone-3','zone-4'], 'approved'),
  ('22222222-2222-2222-2222-222222222222', 'Sanitation Department',  'sanitation.gov',  array['garbage','graffiti'],            array['zone-1','zone-2','zone-3','zone-4'], 'approved'),
  ('33333333-3333-3333-3333-333333333333', 'Flood & Water Response', 'floodresponse.gov', array['flooding','water'],            array['zone-1','zone-3'],                   'approved')
on conflict (id) do nothing;

-- Note: demo reports are created through the app so they carry a real
-- civilian_user_id. See docs/demo-script.md for the seeding walkthrough.
