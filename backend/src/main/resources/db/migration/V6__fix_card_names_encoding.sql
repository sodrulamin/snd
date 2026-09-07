-- V6: Fix garbage character encoding in card product names, descriptions, and batch notes

UPDATE card_denominations 
SET name = 'VoIP Mini ৳50', description = 'Starter card for casual VoIP calling and verification'
WHERE id = 1 OR code = 'VOIP-50';

UPDATE card_denominations 
SET name = 'VoIP Standard ৳100', description = 'Most popular standard card for international dial-out'
WHERE id = 2 OR code = 'VOIP-100';

UPDATE card_denominations 
SET name = 'VoIP Plus ৳200', description = 'High-usage card with bonus talk-time credits'
WHERE id = 3 OR code = 'VOIP-200';

UPDATE card_denominations 
SET name = 'VoIP Gold ৳500', description = 'Enterprise & heavy user calling card with premium priority'
WHERE id = 4 OR code = 'VOIP-500';

UPDATE card_denominations 
SET name = 'VoIP Platinum ৳1000', description = 'Premium wholesale denomination with maximum volume discount'
WHERE id = 5 OR code = 'VOIP-1000';

-- Clean up any residual garbage characters across card_denominations table
UPDATE card_denominations
SET name = REPLACE(name, 'à§³', '৳'),
    description = REPLACE(description, 'à§³', '৳');

-- Clean up any notes in card_batches
UPDATE card_batches
SET notes = REPLACE(notes, 'à§³', '৳');
