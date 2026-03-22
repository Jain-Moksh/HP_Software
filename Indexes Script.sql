-- IN table indexes
CREATE INDEX idx_in_jobber ON transactions_in(jobber_id);
CREATE INDEX idx_in_date ON transactions_in(date);

-- OUT table indexes
CREATE INDEX idx_out_jobber ON transactions_out(jobber_id);
CREATE INDEX idx_out_date ON transactions_out(date);