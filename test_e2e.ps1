# 1. Login as admin
$loginBody = @{ username = 'admin'; password = 'admin123' } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri 'http://localhost:8081/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
Write-Host "=== 1. Login Test ==="
Write-Host "Login Success: $($loginRes.success)"
Write-Host "Logged in as: $($loginRes.data.fullName) ($($loginRes.data.role))"
$token = $loginRes.data.token

$headers = @{ Authorization = "Bearer $token" }

# 2. Generate a new batch of 25 x ৳100 cards
Write-Host "`n=== 2. Generate Serialized Batch Test ==="
$batchBody = @{
    denominationId = 2; # ৳100 Standard
    quantity = 25;
    validityDays = 365;
    notes = 'Serialized Production Batch'
} | ConvertTo-Json
$batchRes = Invoke-RestMethod -Uri 'http://localhost:8081/api/inventory/batches/generate' -Method Post -Headers $headers -Body $batchBody -ContentType 'application/json'
Write-Host "Batch Number: $($batchRes.data.batchNumber)"
Write-Host "Batch Size: $($batchRes.data.quantity) cards"
Write-Host "Batch Serial Range: $($batchRes.data.startSerialNumber) to $($batchRes.data.endSerialNumber)"
Write-Host "Total Face Value: ৳$($batchRes.data.totalFaceValue)"

# 3. Create a Sales Order for Metro Telecom (Distributor ID: 2) for 10 cards
Write-Host "`n=== 3. Create Distributor Sales Order with Serial Allocation ==="
$orderBody = @{
    distributorId = 2;
    items = @(
        @{ denominationId = 2; batchId = $batchRes.data.id; quantity = 10 }
    );
    paymentMethod = 'BALANCE_CREDIT';
    notes = 'Wholesale allocation with serial range tracking'
} | ConvertTo-Json
$orderRes = Invoke-RestMethod -Uri 'http://localhost:8081/api/sales/orders' -Method Post -Headers $headers -Body $orderBody -ContentType 'application/json'
Write-Host "Order Number: $($orderRes.data.orderNumber)"
Write-Host "Cards Allocated: $($orderRes.data.totalCardsCount)"
Write-Host "Allocated Serial Range: $($orderRes.data.items[0].serialRange)"
Write-Host "Order Serial Summary: $($orderRes.data.serialRangesSummary)"
Write-Host "Gross Face Value: ৳$($orderRes.data.totalFaceValue)"
Write-Host "Discount Amount: ৳$($orderRes.data.discountAmount) ($($orderRes.data.discountPercentage)%)"
Write-Host "Final Net Amount: ৳$($orderRes.data.finalAmount)"

# 4. Fetch Invoice Voucher and check serial range column
Write-Host "`n=== 4. Fetch Official Sales Voucher / Invoice ==="
$invoiceRes = Invoke-RestMethod -Uri "http://localhost:8081/api/sales/orders/$($orderRes.data.id)/invoice" -Method Get -Headers $headers
$invItem = $invoiceRes.data.order.items[0]
Write-Host "Invoice Serial Voucher Line: Denomination: $($invItem.denominationName) | Serial Range: $($invItem.serialRange) | Qty: $($invItem.quantity) | Net: ৳$($invItem.subtotalFinal)"

# 5. Search Cards from this order to retrieve allocated cards with Plain PINs
Write-Host "`n=== 5. Search Order Cards and Decrypt PINs Test ==="
$cardsRes = Invoke-RestMethod -Uri "http://localhost:8081/api/inventory/cards?orderId=$($orderRes.data.id)&includePlainPin=true&size=10" -Method Get -Headers $headers
$allocatedCard = $cardsRes.data.content[0]
Write-Host "Allocated Card 1 Serial: $($allocatedCard.serialNumber)"
Write-Host "Allocated Card 1 Revealed PIN: $($allocatedCard.pinPlain)"
Write-Host "Allocated Card 1 Masked PIN: $($allocatedCard.pinMasked)"

# 6. Test VoIP Card Redemption against public VoIP endpoint
Write-Host "`n=== 6. VoIP Card Redemption Test ==="
$redeemBody = @{
    pin = $allocatedCard.pinPlain;
    serialNumber = $allocatedCard.serialNumber;
    subscriberNumber = '+8801700000001'
} | ConvertTo-Json
$redeemRes = Invoke-RestMethod -Uri 'http://localhost:8081/api/voip/redeem' -Method Post -Body $redeemBody -ContentType 'application/json'
Write-Host "Redemption Success: $($redeemRes.success)"
Write-Host "Message: $($redeemRes.message)"
Write-Host "Credited Amount: $($redeemRes.data.faceValue) $($redeemRes.data.currency)"
Write-Host "TXN Reference: $($redeemRes.data.transactionReference)"

# 7. Try redeeming same card again (verify replay / fraud prevention)
Write-Host "`n=== 7. Double Redemption / Fraud Prevention Test ==="
try {
    $dupRes = Invoke-RestMethod -Uri 'http://localhost:8081/api/voip/redeem' -Method Post -Body $redeemBody -ContentType 'application/json'
} catch {
    Write-Host "Caught expected rejection on used card: $($_.Exception.Message)"
}
