-- Remove "In Stock!" placeholder labels from existing products
UPDATE products 
SET status_label = NULL, status_color = NULL
WHERE status_label = 'In Stock!' OR status_label = 'In Stock';
