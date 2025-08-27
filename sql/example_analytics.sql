-- Приклад Аналітичного Запиту
-- Аналіз активності користувачів та оголошень

-- 1. Статистика користувачів по місяцях
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as users_count,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY month 
ORDER BY month DESC;

-- 2. Топ категорії за кількістю оголошень
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

-- 3. Активність по днях тижня
SELECT 
  EXTRACT(DOW FROM created_at) as day_of_week,
  CASE 
    WHEN EXTRACT(DOW FROM created_at) = 0 THEN 'Неділя'
    WHEN EXTRACT(DOW FROM created_at) = 1 THEN 'Понеділок'
    WHEN EXTRACT(DOW FROM created_at) = 2 THEN 'Вівторок'
    WHEN EXTRACT(DOW FROM created_at) = 3 THEN 'Середа'
    WHEN EXTRACT(DOW FROM created_at) = 4 THEN 'Четвер'
    WHEN EXTRACT(DOW FROM created_at) = 5 THEN "П'ятниця"
    WHEN EXTRACT(DOW FROM created_at) = 6 THEN 'Субота'
  END as day_name,
  COUNT(*) as listings_count
FROM listings
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY day_of_week, day_name
ORDER BY day_of_week;

-- 4. Користувачі з найбільшою кількістю оголошень
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