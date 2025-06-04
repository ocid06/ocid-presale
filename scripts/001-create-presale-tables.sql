-- Create presale stages table
CREATE TABLE IF NOT EXISTS presale_stages (
  id SERIAL PRIMARY KEY,
  stage_number INTEGER NOT NULL,
  price_per_token DECIMAL(10, 8) NOT NULL,
  total_tokens BIGINT NOT NULL,
  sold_tokens BIGINT DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS presale_transactions (
  id SERIAL PRIMARY KEY,
  user_wallet VARCHAR(255) NOT NULL,
  stage_id INTEGER REFERENCES presale_stages(id),
  token_amount BIGINT NOT NULL,
  payment_amount DECIMAL(10, 8) NOT NULL,
  payment_currency VARCHAR(10) NOT NULL,
  payment_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial presale stages
INSERT INTO presale_stages (stage_number, price_per_token, total_tokens, start_date, end_date, is_active) VALUES
(0, 0.001, 10000000, NOW(), NOW() + INTERVAL '30 days', true),
(1, 0.002, 15000000, NOW() + INTERVAL '30 days', NOW() + INTERVAL '60 days', false),
(2, 0.003, 20000000, NOW() + INTERVAL '60 days', NOW() + INTERVAL '90 days', false),
(3, 0.005, 25000000, NOW() + INTERVAL '90 days', NOW() + INTERVAL '120 days', false);
