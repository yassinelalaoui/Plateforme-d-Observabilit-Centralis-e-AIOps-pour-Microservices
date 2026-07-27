INSERT INTO orders (id, user_id, description, amount, status, created_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'user-1', 'Observability starter order', 49.99, 'CONFIRMED', '2026-07-27T09:00:00Z'),
    ('22222222-2222-2222-2222-222222222222', 'user-1', 'Alerting extension order', 19.50, 'PENDING', '2026-07-27T10:00:00Z'),
    ('33333333-3333-3333-3333-333333333333', 'user-2', 'AIOps sample order', 75.00, 'CONFIRMED', '2026-07-27T11:00:00Z')
ON CONFLICT (id) DO NOTHING;
