-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'viewer', 'salesperson');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE retailer_status AS ENUM ('Approved', 'Pending', 'Rejected');
CREATE TYPE retailer_sector AS ENUM ('Vape Shop', 'Convenience Store', 'Not Provided');
CREATE TYPE registration_channel AS ENUM ('Website', 'POS', 'Manual');
CREATE TYPE email_marketing AS ENUM ('Subscribed', 'Unsubscribed');
CREATE TYPE product_type AS ENUM ('Disposable', 'Closed Pod', 'Open System');
CREATE TYPE product_category AS ENUM ('Disposable', 'Refillable');
CREATE TYPE order_status AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');
CREATE TYPE payment_status AS ENUM ('Pending', 'Paid', 'Failed', 'Refunded');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  status user_status NOT NULL DEFAULT 'pending',
  profile_picture TEXT
);

-- Create admin_settings table for application configuration
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cities table
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'UK',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  UNIQUE(name, country)
);

-- Create retailers table
CREATE TABLE public.retailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_created DATE DEFAULT CURRENT_DATE,
  reg_company_name TEXT NOT NULL,
  store_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  sector retailer_sector NOT NULL DEFAULT 'Not Provided',
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  status retailer_status NOT NULL DEFAULT 'Pending',
  address_1 TEXT NOT NULL,
  address_2 TEXT DEFAULT '',
  retailer_city TEXT NOT NULL,
  retailer_postcode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'UK',
  registration_channel registration_channel NOT NULL DEFAULT 'Manual',
  email_marketing email_marketing NOT NULL DEFAULT 'Unsubscribed',
  total_order_count INTEGER DEFAULT 0,
  total_tax DECIMAL(10,2) DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  salesperson TEXT NOT NULL DEFAULT 'Not assigned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  product_type product_type NOT NULL,
  category product_category NOT NULL,
  nicotine_strength TEXT,
  flavour TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create retailer_products junction table
CREATE TABLE public.retailer_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer_id UUID REFERENCES public.retailers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(retailer_id, product_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  retailer_id UUID REFERENCES public.retailers(id) ON DELETE CASCADE,
  retailer_name TEXT NOT NULL,
  order_date DATE DEFAULT CURRENT_DATE,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  status order_status NOT NULL DEFAULT 'Pending',
  payment_status payment_status NOT NULL DEFAULT 'Pending',
  shipping_address TEXT,
  salesperson TEXT NOT NULL DEFAULT 'Not assigned',
  product_id UUID REFERENCES public.products(id),
  product_name TEXT,
  flavour TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create salespersons table
CREATE TABLE public.salespersons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  date_created DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default cities
INSERT INTO public.cities (name, country, created_by) VALUES
('London', 'UK', 'system'),
('Manchester', 'UK', 'system'),
('Birmingham', 'UK', 'system'),
('Liverpool', 'UK', 'system'),
('Leeds', 'UK', 'system');

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value) VALUES
('googleSheetsConfig', '{"spreadsheetId":"","apiKey":"","retailersRange":"Retailers!A:T","ordersRange":"Orders!A:M","salespersonsRange":"Salespersons!A:D"}'),
('companyBranding', '{"logoUrl":"","companyName":"Retailer Management System"}'),
('mapboxToken', '""'),
('defaultCurrency', '"GBP"'),
('timezone', '"UTC"');

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salespersons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for admin_settings (admin only)
CREATE POLICY "Admins can manage admin settings" ON public.admin_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for cities (all authenticated users can read, admins can modify)
CREATE POLICY "All users can view cities" ON public.cities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage cities" ON public.cities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for retailers (role-based access)
CREATE POLICY "All users can view retailers" ON public.retailers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managers and admins can manage retailers" ON public.retailers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create RLS policies for products (managers and admins)
CREATE POLICY "All users can view products" ON public.products FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managers and admins can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create RLS policies for retailer_products
CREATE POLICY "All users can view retailer products" ON public.retailer_products FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managers and admins can manage retailer products" ON public.retailer_products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create RLS policies for orders
CREATE POLICY "All users can view orders" ON public.orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managers and admins can manage orders" ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create RLS policies for salespersons
CREATE POLICY "All users can view salespersons" ON public.salespersons FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage salespersons" ON public.salespersons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create trigger function to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_retailers_updated_at BEFORE UPDATE ON public.retailers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role, created_by, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')::user_role,
    'system',
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.retailers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.retailer_products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.salespersons;
