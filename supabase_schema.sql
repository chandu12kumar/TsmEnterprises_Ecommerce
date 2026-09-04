-- ==========================================================
-- TSM ENTERPRISES: COMPLETE SUPABASE POSTGRESQL SCHEMA
-- Fully complies with RLS, Auth triggers, Storage, and Email logging
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year INTEGER,
  price NUMERIC NOT NULL,
  fuel_type TEXT,
  transmission TEXT DEFAULT 'Manual',
  km_driven INTEGER DEFAULT 0,
  location TEXT,
  condition TEXT DEFAULT 'Good',
  registration_year INTEGER,
  insurance_status TEXT DEFAULT 'Valid',
  description TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. VEHICLE IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.vehicle_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. CART ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_vehicle_cart UNIQUE (user_id, vehicle_id)
);

-- 6. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_vehicle_wishlist UNIQUE (user_id, vehicle_id)
);

-- 7. ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'negotiating', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. EMAIL LOGS TABLE
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('customer_confirmation', 'admin_notification')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. HELPER FUNCTION: CHECK IF CURRENT USER IS ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9B. HELPER FUNCTION: SECURELY CHECK IF USER EMAIL EXISTS (FOR FORGOT PASSWORD)
CREATE OR REPLACE FUNCTION public.check_user_exists(lookup_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(lookup_email))
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(lookup_email))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_user_exists(TEXT) TO anon, authenticated;


-- 10. AUTH TRIGGER: AUTO-CREATE PROFILE AS 'customer'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, city, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 11. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 12. RLS POLICIES

-- PROFILES
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- VEHICLES
CREATE POLICY "Public can read available/reserved vehicles" ON public.vehicles
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update vehicles" ON public.vehicles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete vehicles" ON public.vehicles
  FOR DELETE USING (public.is_admin());

-- VEHICLE IMAGES
CREATE POLICY "Public can view vehicle images" ON public.vehicle_images
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage vehicle images" ON public.vehicle_images
  FOR ALL USING (public.is_admin());

-- CART ITEMS
CREATE POLICY "Users can view own cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own cart" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- WISHLIST
CREATE POLICY "Users can view own wishlist" ON public.wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own wishlist" ON public.wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own wishlist" ON public.wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- ENQUIRIES
DROP POLICY IF EXISTS "Customers can create enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Anyone can create enquiries" ON public.enquiries;
CREATE POLICY "Anyone can create enquiries" ON public.enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can view own enquiries" ON public.enquiries;
CREATE POLICY "Customers can view own enquiries" ON public.enquiries
  FOR SELECT TO anon, authenticated
  USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update enquiries" ON public.enquiries;
CREATE POLICY "Admins can update enquiries" ON public.enquiries
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete enquiries" ON public.enquiries;
CREATE POLICY "Admins can delete enquiries" ON public.enquiries
  FOR DELETE USING (public.is_admin());

-- EMAIL LOGS
CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Service role / server can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);

-- 13. STORAGE BUCKET: vehicle-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read for vehicle images" ON storage.objects
  FOR SELECT USING (bucket_id = 'vehicle-images');

CREATE POLICY "Admin upload for vehicle images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'vehicle-images' AND public.is_admin());

CREATE POLICY "Admin update for vehicle images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'vehicle-images' AND public.is_admin());

CREATE POLICY "Admin delete for vehicle images" ON storage.objects
  FOR DELETE USING (bucket_id = 'vehicle-images' AND public.is_admin());

-- ==========================================================
-- 14. SAMPLE SEED DATA
-- ==========================================================
DO $$
DECLARE
  v1 UUID := '11111111-1111-1111-1111-111111111111';
  v2 UUID := '22222222-2222-2222-2222-222222222222';
  v3 UUID := '33333333-3333-3333-3333-333333333333';
  v4 UUID := '44444444-4444-4444-4444-444444444444';
  v5 UUID := '55555555-5555-5555-5555-555555555555';
  v6 UUID := '66666666-6666-6666-6666-666666666666';
BEGIN
  INSERT INTO public.vehicles (id, name, category, brand, model, year, price, fuel_type, transmission, km_driven, location, condition, status, featured, registration_year, insurance_status, description)
  VALUES
    (v1, 'Mahindra Cargo Auto', 'cargo-auto', 'Mahindra', 'Alfa Cargo', 2019, 245000, 'Diesel', 'Manual', 65000, 'Chennai, Tamil Nadu', 'Good', 'available', true, 2019, 'Valid', 'Well-maintained Mahindra Cargo Auto. Single owner, regular maintenance.'),
    (v2, 'Bajaj Maxima Cargo', 'cargo-auto', 'Bajaj', 'Maxima C', 2020, 285000, 'Diesel', 'Manual', 48000, 'Coimbatore, Tamil Nadu', 'Excellent', 'available', true, 2020, 'Valid', 'Low mileage Bajaj Maxima Cargo, excellent fuel efficiency and engine health.'),
    (v3, 'Mahindra Tractor', 'tractor', 'Mahindra', '265 DI', 2018, 450000, 'Diesel', 'Manual', 1200, 'Salem, Tamil Nadu', 'Good', 'available', true, 2018, 'Valid', 'Reliable Mahindra 265 DI Tractor suitable for agricultural and commercial haulage.'),
    (v4, 'Tata Ace Mini Truck', 'mini-truck', 'Tata', 'Ace Gold', 2019, 325000, 'Diesel', 'Manual', 72000, 'Madurai, Tamil Nadu', 'Good', 'available', true, 2019, 'Expired', 'Popular Tata Ace Mini Truck in running condition, ideal for local logistics.'),
    (v5, 'Piaggio Ape Auto', 'auto-rickshaw', 'Piaggio', 'Ape City', 2021, 185000, 'Petrol', 'Manual', 35000, 'Trichy, Tamil Nadu', 'Very Good', 'available', true, 2021, 'Valid', 'Piaggio Ape passenger auto in very good condition with clean service records.'),
    (v6, 'Mahindra Bolero Pickup', 'pickup-truck', 'Mahindra', 'Bolero Maxi Truck', 2019, 520000, 'Diesel', 'Manual', 58000, 'Erode, Tamil Nadu', 'Good', 'available', false, 2019, 'Valid', 'Heavy duty Mahindra Bolero Pickup with robust cargo box and powerful engine.')
  ON CONFLICT (id) DO NOTHING;

  -- Images
  INSERT INTO public.vehicle_images (vehicle_id, image_url, is_primary)
  VALUES
    (v1, 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=600&fit=crop', true),
    (v1, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', false),
    (v2, 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=600&fit=crop', true),
    (v3, 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=600&fit=crop', true),
    (v4, 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop', true),
    (v5, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', true),
    (v6, 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&h=600&fit=crop', true)
  ON CONFLICT DO NOTHING;
END $$;
