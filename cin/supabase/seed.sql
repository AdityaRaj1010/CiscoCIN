-- CIN — Civic Intelligence Network
-- Seed Data: St. Xavier's College (`xaviers`) and Devgaon Panchayat (`devgaon`)

-- 1. Insert Tenants
INSERT INTO tenants (slug, name, sector, body_type, constituency_label, features, branding)
VALUES
  (
    'xaviers',
    'St. Xavier''s College',
    'education',
    'Students'' Union',
    'Department',
    ARRAY['proposals', 'voting', 'tally', 'budgeting'],
    '{
      "logoText": "SX",
      "primaryColor": "#2f4bd8",
      "primaryStrong": "#2338b0",
      "primarySoft": "#eaeeff",
      "primaryForeground": "#ffffff",
      "accentColor": "#d99b1c",
      "accentSoft": "#fdf3dc",
      "accentForeground": "#2a2109"
    }'::jsonb
  ),
  (
    'devgaon',
    'Devgaon Panchayat',
    'government',
    'Gram Sabha',
    'Ward',
    ARRAY['proposals', 'voting', 'tally'],
    '{
      "logoText": "दे",
      "primaryColor": "#177a4a",
      "primaryStrong": "#0f5e39",
      "primarySoft": "#e3f5ea",
      "primaryForeground": "#ffffff",
      "accentColor": "#c85a2b",
      "accentSoft": "#fbe9df",
      "accentForeground": "#2c130a"
    }'::jsonb
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  features = EXCLUDED.features,
  branding = EXCLUDED.branding;

-- 2. Insert Users
INSERT INTO users (id, tenant_slug, name, role, constituency, avatar_initials)
VALUES
  -- St. Xavier's College
  ('xa-u1', 'xaviers', 'Aditi Rao', '3rd yr · Computer Science', 'Computer Science', 'AR'),
  ('xa-u2', 'xaviers', 'Kabir Menon', 'Union President', 'Economics', 'KM'),
  ('xa-u3', 'xaviers', 'Sara Fernandes', '2nd yr · Mass Media', 'Mass Media', 'SF'),
  ('xa-u4', 'xaviers', 'Rohan Iyer', '4th yr · Physics', 'Physics', 'RI'),
  -- Devgaon Panchayat
  ('dv-u1', 'devgaon', 'Sunita Devi', 'Ward member', 'Ward 3 · Rampara', 'SD'),
  ('dv-u2', 'devgaon', 'Ramesh Patil', 'Sarpanch', 'Ward 1 · Devgaon Khurd', 'RP'),
  ('dv-u3', 'devgaon', 'Imran Shaikh', 'Resident', 'Ward 5 · Naya Basti', 'IS'),
  ('dv-u4', 'devgaon', 'Lakshmi Naidu', 'Resident', 'Ward 2 · Talav Side', 'LN')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Proposals
INSERT INTO proposals (id, tenant_slug, title, summary, body, author_id, author_name, constituency, stage, seed_votes_by_constituency, budget_ask, tags, created_at)
VALUES
  -- St. Xavier's College
  (
    'xa-p1', 'xaviers',
    'Extend the central library to 24 hours during exams',
    'Keep the main reading hall open overnight for the three weeks around semester finals.',
    'During finals the 8pm closing pushes students to crowded hostel common rooms. A rotating security shift and existing card-access already cover the building after hours. We propose a two-week pilot for the winter finals, with a headcount review before making it permanent.',
    'xa-u1', 'Aditi Rao', 'Computer Science', 'trigger',
    '{"Computer Science": 84, "Economics": 41, "Mass Media": 33, "Physics": 52, "Commerce": 28}'::jsonb,
    120000, ARRAY['academics', 'facilities'], '2026-06-18T00:00:00Z'
  ),
  (
    'xa-p2', 'xaviers',
    'On-campus counsellor available every weekday',
    'Move from the current twice-a-week visiting counsellor to a full-time presence.',
    'Wait times for the visiting counsellor have stretched past two weeks. A full-time counsellor, funded partly from the wellness budget, would cut that to same-week appointments and support exam-season demand.',
    'xa-u3', 'Sara Fernandes', 'Mass Media', 'trust',
    '{"Computer Science": 47, "Economics": 38, "Mass Media": 66, "Physics": 29, "Commerce": 44}'::jsonb,
    480000, ARRAY['wellbeing'], '2026-06-25T00:00:00Z'
  ),
  (
    'xa-p3', 'xaviers',
    'Reusable steel plates at every canteen counter',
    'Phase out disposable plates and cut the campus''s single-use waste.',
    'The canteen goes through thousands of disposable plates a week. A one-time investment in steel crockery and a dishwashing station pays back within a semester and removes most of our cafeteria waste.',
    'xa-u4', 'Rohan Iyer', 'Physics', 'notice',
    '{"Computer Science": 22, "Economics": 19, "Mass Media": 24, "Physics": 31, "Commerce": 17}'::jsonb,
    90000, ARRAY['sustainability', 'canteen'], '2026-07-01T00:00:00Z'
  ),
  (
    'xa-p4', 'xaviers',
    'Split the annual fest budget with a student-run vote',
    'Let departments allocate a share of the fest budget via participatory budgeting.',
    'Instead of the organising committee deciding the whole fest budget, put 30% of it to a participatory vote across departments — headliner, workshops, sports, or socials. Departments propose line items and everyone allocates points.',
    'xa-u2', 'Kabir Menon', 'Economics', 'notice',
    '{"Computer Science": 35, "Economics": 58, "Mass Media": 40, "Physics": 26, "Commerce": 39}'::jsonb,
    750000, ARRAY['budget', 'events'], '2026-07-03T00:00:00Z'
  ),
  (
    'xa-p5', 'xaviers',
    'Campus-wide Wi-Fi upgrade for the hostel blocks',
    'The hostel network drops every evening — upgrade the access points.',
    'Evening peak load makes the hostel Wi-Fi unusable for anything but messaging. An audit of dead zones plus new access points in the two older blocks would fix the worst of it.',
    'xa-u1', 'Aditi Rao', 'Computer Science', 'trigger',
    '{"Computer Science": 96, "Economics": 52, "Mass Media": 48, "Physics": 61, "Commerce": 45}'::jsonb,
    640000, ARRAY['infrastructure'], '2026-05-30T00:00:00Z'
  ),
  (
    'xa-p6', 'xaviers',
    'Gender-neutral washrooms in the arts building',
    'Convert two single-stall washrooms to gender-neutral in the arts wing.',
    'A small, low-cost signage-and-fixtures change in the arts building''s existing single-stall washrooms. Reviewed with facilities; no structural work required.',
    'xa-u3', 'Sara Fernandes', 'Mass Media', 'trust',
    '{"Computer Science": 31, "Economics": 27, "Mass Media": 43, "Physics": 22, "Commerce": 20}'::jsonb,
    60000, ARRAY['inclusion', 'facilities'], '2026-06-28T00:00:00Z'
  ),
  (
    'xa-p7', 'xaviers',
    'Weekend shuttle to the metro station',
    'A Saturday shuttle loop from campus to the nearest metro line.',
    'Students without vehicles are stranded on weekends. A single shuttle running a morning and evening loop to the metro would cover most of the demand at a modest per-semester cost.',
    'xa-u4', 'Rohan Iyer', 'Physics', 'trigger',
    '{"Computer Science": 54, "Economics": 49, "Mass Media": 37, "Physics": 58, "Commerce": 41}'::jsonb,
    300000, ARRAY['transport'], '2026-06-12T00:00:00Z'
  ),
  -- Devgaon Panchayat
  (
    'dv-p1', 'devgaon',
    'Streetlights on the Rampara approach road',
    'The 800m approach to Rampara has no lighting — install solar poles.',
    'The unlit stretch between the main road and Rampara is unsafe after dark, especially for women and schoolchildren returning in winter. Solar poles avoid new wiring and cut recurring electricity cost.',
    'dv-u1', 'Sunita Devi', 'Ward 3 · Rampara', 'trigger',
    '{"Ward 1 · Devgaon Khurd": 38, "Ward 2 · Talav Side": 44, "Ward 3 · Rampara": 91, "Ward 4 · Bazaar": 29, "Ward 5 · Naya Basti": 52}'::jsonb,
    NULL, ARRAY['safety', 'infrastructure'], '2026-06-20T00:00:00Z'
  ),
  (
    'dv-p2', 'devgaon',
    'Repair the Talav Side drainage before monsoon',
    'Clear and reline the drain that floods the market lane every year.',
    'Every monsoon the Talav Side lane floods because the drain is silted and broken in two sections. Desilting and relining before the rains would prevent the annual waterlogging that shuts the market.',
    'dv-u4', 'Lakshmi Naidu', 'Ward 2 · Talav Side', 'trust',
    '{"Ward 1 · Devgaon Khurd": 41, "Ward 2 · Talav Side": 78, "Ward 3 · Rampara": 33, "Ward 4 · Bazaar": 47, "Ward 5 · Naya Basti": 36}'::jsonb,
    NULL, ARRAY['drainage', 'monsoon'], '2026-06-27T00:00:00Z'
  ),
  (
    'dv-p3', 'devgaon',
    'Weekly mobile health clinic for the outer wards',
    'A visiting clinic one day a week for wards far from the PHC.',
    'Residents in Naya Basti and Rampara travel 12km to the primary health centre for routine checkups. A weekly mobile clinic rotating between the outer wards would cover antenatal visits and basic care.',
    'dv-u3', 'Imran Shaikh', 'Ward 5 · Naya Basti', 'notice',
    '{"Ward 1 · Devgaon Khurd": 29, "Ward 2 · Talav Side": 34, "Ward 3 · Rampara": 45, "Ward 4 · Bazaar": 22, "Ward 5 · Naya Basti": 63}'::jsonb,
    NULL, ARRAY['health'], '2026-07-02T00:00:00Z'
  ),
  (
    'dv-p4', 'devgaon',
    'Fix the hand pump at the Devgaon Khurd school',
    'The school''s only hand pump has been dry for two months.',
    'The primary school hand pump failed and children carry water from home. A borewell deepening and new pump head would restore supply. Quotes already collected from two local contractors.',
    'dv-u2', 'Ramesh Patil', 'Ward 1 · Devgaon Khurd', 'trigger',
    '{"Ward 1 · Devgaon Khurd": 72, "Ward 2 · Talav Side": 30, "Ward 3 · Rampara": 26, "Ward 4 · Bazaar": 24, "Ward 5 · Naya Basti": 33}'::jsonb,
    NULL, ARRAY['water', 'school'], '2026-05-28T00:00:00Z'
  ),
  (
    'dv-p5', 'devgaon',
    'Twice-weekly waste collection in the Bazaar ward',
    'Market waste piles up — add a second collection day.',
    'The Bazaar ward generates far more waste than a single weekly pickup can handle, and it spills into the drains. A second collection day and two more bins at the market would keep it clean.',
    'dv-u1', 'Sunita Devi', 'Ward 4 · Bazaar', 'notice',
    '{"Ward 1 · Devgaon Khurd": 21, "Ward 2 · Talav Side": 28, "Ward 3 · Rampara": 19, "Ward 4 · Bazaar": 55, "Ward 5 · Naya Basti": 24}'::jsonb,
    NULL, ARRAY['sanitation'], '2026-07-04T00:00:00Z'
  ),
  (
    'dv-p6', 'devgaon',
    'Resurface the Talav–Bazaar connecting road',
    'The 1.2km link road is broken and floods the shortcut to the market.',
    'The connecting road between Talav Side and the Bazaar is potholed end to end, and vendors lose a full day''s trade when it floods. Resurfacing with a raised camber would fix drainage and access together.',
    'dv-u4', 'Lakshmi Naidu', 'Ward 2 · Talav Side', 'trigger',
    '{"Ward 1 · Devgaon Khurd": 36, "Ward 2 · Talav Side": 61, "Ward 3 · Rampara": 30, "Ward 4 · Bazaar": 58, "Ward 5 · Naya Basti": 27}'::jsonb,
    NULL, ARRAY['roads'], '2026-06-15T00:00:00Z'
  ),
  (
    'dv-p7', 'devgaon',
    'Evening adult-literacy classes at the panchayat hall',
    'Use the empty hall for three evening literacy sessions a week.',
    'The panchayat hall sits empty after 6pm. Volunteer-run literacy classes three evenings a week would serve adults who missed schooling, with a small honorarium for the teachers.',
    'dv-u3', 'Imran Shaikh', 'Ward 5 · Naya Basti', 'trust',
    '{"Ward 1 · Devgaon Khurd": 25, "Ward 2 · Talav Side": 31, "Ward 3 · Rampara": 34, "Ward 4 · Bazaar": 23, "Ward 5 · Naya Basti": 49}'::jsonb,
    NULL, ARRAY['education'], '2026-06-30T00:00:00Z'
  )
ON CONFLICT (id) DO NOTHING;
