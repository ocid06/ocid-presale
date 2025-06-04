-- Function to safely increment sold tokens
CREATE OR REPLACE FUNCTION increment_sold_tokens(stage_id INTEGER, amount BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE presale_stages 
  SET sold_tokens = sold_tokens + amount 
  WHERE id = stage_id;
END;
$$ LANGUAGE plpgsql;
