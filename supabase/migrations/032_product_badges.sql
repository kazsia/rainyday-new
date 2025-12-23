-- Create product_badges table
CREATE TABLE IF NOT EXISTS product_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for product-badge relationship
CREATE TABLE IF NOT EXISTS product_badge_links (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES product_badges(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, badge_id)
);

-- Add RLS policies
ALTER TABLE product_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_badge_links ENABLE ROW LEVEL SECURITY;

-- Everyone can view badges
CREATE POLICY "Public badges are viewable by everyone" ON product_badges
    FOR SELECT USING (true);

CREATE POLICY "Public badge links are viewable by everyone" ON product_badge_links
    FOR SELECT USING (true);

-- Only admins can manage badges
CREATE POLICY "Admins can manage badges" ON product_badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage badge links" ON product_badge_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
