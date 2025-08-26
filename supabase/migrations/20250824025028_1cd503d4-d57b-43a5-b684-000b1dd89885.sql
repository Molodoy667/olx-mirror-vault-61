-- Clear existing categories and add OLX categories with subcategories
DELETE FROM categories;

-- Insert main categories from OLX
INSERT INTO categories (name, name_uk, slug, icon, color, parent_id, order_index) VALUES
('Допомога', 'Допомога', 'dopomoga', 'Heart', '#ef4444', NULL, 1),
('Дитячий світ', 'Дитячий світ', 'detskiy-mir', 'Baby', '#ec4899', NULL, 2),
('Нерухомість', 'Нерухомість', 'nedvizhimost', 'Home', '#3b82f6', NULL, 3),
('Авто', 'Авто', 'transport', 'Car', '#ef4444', NULL, 4),
('Запчастини', 'Запчастини', 'zapchasti-dlya-transporta', 'Package', '#06b6d4', NULL, 5),
('Робота', 'Робота', 'rabota', 'Briefcase', '#10b981', NULL, 6),
('Тварини', 'Тварини', 'zhivotnye', 'PawPrint', '#f59e0b', NULL, 7),
('Дім і сад', 'Дім і сад', 'dom-i-sad', 'Sofa', '#14b8a6', NULL, 8),
('Електроніка', 'Електроніка', 'elektronika', 'Smartphone', '#6366f1', NULL, 9),
('Бізнес та послуги', 'Бізнес та послуги', 'uslugi', 'Wrench', '#6b7280', NULL, 10),
('Житло подобово', 'Житло подобово', 'zhytlo-podobovo', 'Building', '#8b5cf6', NULL, 11),
('Мода і стиль', 'Мода і стиль', 'moda-i-stil', 'Shirt', '#d946ef', NULL, 12),
('Хобі, відпочинок і спорт', 'Хобі, відпочинок і спорт', 'hobbi-otdyh-i-sport', 'Gamepad2', '#f97316', NULL, 13),
('Віддам даром', 'Віддам даром', 'viddam-darom', 'Gift', '#84cc16', NULL, 14),
('Обмін', 'Обмін', 'obmen', 'ArrowRightLeft', '#22d3ee', NULL, 15);

-- Insert subcategories for Нерухомість
INSERT INTO categories (name, name_uk, slug, icon, color, parent_id, order_index) VALUES
('Квартири', 'Квартири', 'kvartiry', 'Building2', '#3b82f6', (SELECT id FROM categories WHERE slug = 'nedvizhimost'), 1),
('Будинки', 'Будинки', 'doma', 'Home', '#3b82f6', (SELECT id FROM categories WHERE slug = 'nedvizhimost'), 2),
('Земельні ділянки', 'Земельні ділянки', 'zemelni-dilyanky', 'TreePine', '#3b82f6', (SELECT id FROM categories WHERE slug = 'nedvizhimost'), 3),
('Гаражі та машиномісця', 'Гаражі та машиномісця', 'garazhi', 'Car', '#3b82f6', (SELECT id FROM categories WHERE slug = 'nedvizhimost'), 4),
('Комерційна нерухомість', 'Комерційна нерухомість', 'kommercheskaya', 'Building', '#3b82f6', (SELECT id FROM categories WHERE slug = 'nedvizhimost'), 5);

-- Insert subcategories for Авто
INSERT INTO categories (name, name_uk, slug, icon, color, parent_id, order_index) VALUES
('Легкові автомобілі', 'Легкові автомобілі', 'legkovye-avtomobili', 'Car', '#ef4444', (SELECT id FROM categories WHERE slug = 'transport'), 1),
('Мотоцикли і мототехніка', 'Мотоцикли і мототехніка', 'motocikly', 'Bike', '#ef4444', (SELECT id FROM categories WHERE slug = 'transport'), 2),
('Вантажні автомобілі', 'Вантажні автомобілі', 'gruzovye-avtomobili', 'Truck', '#ef4444', (SELECT id FROM categories WHERE slug = 'transport'), 3),
('Автобуси', 'Автобуси', 'avtobusy', 'Bus', '#ef4444', (SELECT id FROM categories WHERE slug = 'transport'), 4),
('Причепи', 'Причепи', 'pricepy', 'Trailer', '#ef4444', (SELECT id FROM categories WHERE slug = 'transport'), 5);

-- Insert subcategories for Електроніка
INSERT INTO categories (name, name_uk, slug, icon, color, parent_id, order_index) VALUES
('Телефони і аксесуари', 'Телефони і аксесуари', 'telefony', 'Smartphone', '#6366f1', (SELECT id FROM categories WHERE slug = 'elektronika'), 1),
('Комп''ютери та ноутбуки', 'Комп''ютери та ноутбуки', 'kompyutery', 'Laptop', '#6366f1', (SELECT id FROM categories WHERE slug = 'elektronika'), 2),
('Фото та відео техніка', 'Фото та відео техніка', 'foto-video', 'Camera', '#6366f1', (SELECT id FROM categories WHERE slug = 'elektronika'), 3),
('ТВ і відео техніка', 'ТВ і відео техніка', 'tv-video', 'Tv', '#6366f1', (SELECT id FROM categories WHERE slug = 'elektronika'), 4),
('Аудіо техніка', 'Аудіо техніка', 'audio', 'Headphones', '#6366f1', (SELECT id FROM categories WHERE slug = 'elektronika'), 5);

-- Insert subcategories for Дім і сад
INSERT INTO categories (name, name_uk, slug, icon, color, parent_id, order_index) VALUES
('Меблі', 'Меблі', 'mebli', 'Sofa', '#14b8a6', (SELECT id FROM categories WHERE slug = 'dom-i-sad'), 1),
('Побутова техніка', 'Побутова техніка', 'bytovaya-tehnika', 'Refrigerator', '#14b8a6', (SELECT id FROM categories WHERE slug = 'dom-i-sad'), 2),
('Посуд і кухонні приналежності', 'Посуд і кухонні приналежності', 'posuda', 'ChefHat', '#14b8a6', (SELECT id FROM categories WHERE slug = 'dom-i-sad'), 3),
('Рослини', 'Рослини', 'rasteniya', 'Flower', '#14b8a6', (SELECT id FROM categories WHERE slug = 'dom-i-sad'), 4),
('Ремонт та будівництво', 'Ремонт та будівництво', 'remont', 'Hammer', '#14b8a6', (SELECT id FROM categories WHERE slug = 'dom-i-sad'), 5);