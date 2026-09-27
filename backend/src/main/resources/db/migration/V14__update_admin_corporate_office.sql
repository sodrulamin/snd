-- Update admin corporate office address to Impetus Center, Tejgaon-Gulshan Link Road
UPDATE users 
SET address = 'Impetus Center, 242/B Tejgaon-Gulshan Link Road, Tejgaon I/A, Dhaka-1208, Bangladesh'
WHERE username = 'admin' AND (address LIKE '%Gulshan-2%' OR address IS NULL);
