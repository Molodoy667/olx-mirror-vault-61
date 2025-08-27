-- Example Analytics Query
-- Анализ активности пользователей и объявлений

-- 1. Статистика пользователей по месяцам
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as users_count,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY month 
ORDER BY month DESC;

-- 2. Топ категории по количеству объявлений
SELECT 
  c.name as category_name,
  COUNT(l.*) as listings_count,
  COUNT(l.*) FILTER (WHERE l.status = 'active') as active_listings,
  ROUND(AVG(l.price), 2) as avg_price
FROM categories c
LEFT JOIN listings l ON c.id = l.category_id
GROUP BY c.id, c.name
ORDER BY listings_count DESC
LIMIT 10;

-- 3. Активность по дням недели
SELECT 
  EXTRACT(DOW FROM created_at) as day_of_week,
  CASE 
    WHEN EXTRACT(DOW FROM created_at) = 0 THEN 'Воскресенье'
    WHEN EXTRACT(DOW FROM created_at) = 1 THEN 'Понедельник'
    WHEN EXTRACT(DOW FROM created_at) = 2 THEN 'Вторник'
    WHEN EXTRACT(DOW FROM created_at) = 3 THEN 'Среда'
    WHEN EXTRACT(DOW FROM created_at) = 4 THEN 'Четверг'
    WHEN EXTRACT(DOW FROM created_at) = 5 THEN 'Пятница'
    WHEN EXTRACT(DOW FROM created_at) = 6 THEN 'Суббота'
  END as day_name,
  COUNT(*) as listings_count
FROM listings
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY day_of_week, day_name
ORDER BY day_of_week;

-- 4. Пользователи с наибольшим количеством объявлений
SELECT 
  p.id,
  p.email,
  COUNT(l.*) as total_listings,
  COUNT(l.*) FILTER (WHERE l.status = 'active') as active_listings,
  MAX(l.created_at) as last_listing_date
FROM profiles p
LEFT JOIN listings l ON p.id = l.user_id
GROUP BY p.id, p.email
HAVING COUNT(l.*) > 0
ORDER BY total_listings DESC
LIMIT 20;