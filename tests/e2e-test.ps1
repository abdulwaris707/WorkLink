# Complete End-to-End Automated Test Script for WorkLink

$ErrorActionPreference = "Stop"

Write-Output "--- Starting WorkLink End-to-End Verification ---"

# 1. Login as Client (Jessica)
$clientSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$clientLogin = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body (@{ email = "client@worklink.com"; password = "password123" } | ConvertTo-Json) -ContentType "application/json" -WebSession $clientSession
Write-Output "1. Client Login: $($clientLogin.user.name) (Role: $($clientLogin.user.role))"

# 2. Login as Worker (Marcus)
$workerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$workerLogin = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body (@{ email = "marcus@worklink.com"; password = "password123" } | ConvertTo-Json) -ContentType "application/json" -WebSession $workerSession
Write-Output "2. Worker Login: $($workerLogin.user.name) (Role: $($workerLogin.user.role))"

# 3. Retrieve Marcus's services
$servicesRes = Invoke-RestMethod -Uri "http://localhost:3000/api/services" -Method GET -WebSession $workerSession
$service = $servicesRes.services[0]
Write-Output "3. Selected Service: '$($service.title)' for `$$($service.price)"

# 4. Client books the service
$bookingDate = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
$bookingPayload = @{
  workerId = $workerLogin.user.id
  serviceId = $service.id
  bookingDate = $bookingDate
  timeSlot = "01:00 PM - 03:00 PM"
  requestDetails = "Automated test: installing kitchen lights."
} | ConvertTo-Json

$bookingRes = Invoke-RestMethod -Uri "http://localhost:3000/api/bookings" -Method POST -Body $bookingPayload -ContentType "application/json" -WebSession $clientSession
$bookingId = $bookingRes.booking.id
Write-Output "4. Booking Created Successfully: ID=$bookingId (Status: $($bookingRes.booking.status))"

# 5. Worker accepts the booking
$acceptPayload = @{ status = "ACCEPTED" } | ConvertTo-Json
$acceptRes = Invoke-RestMethod -Uri "http://localhost:3000/api/bookings/$bookingId" -Method PATCH -Body $acceptPayload -ContentType "application/json" -WebSession $workerSession
Write-Output "5. Worker Accepted Booking: Status=$($acceptRes.booking.status)"

# 6. Messaging: Client sends message to Worker
$convId = $bookingRes.conversationId
$msgPayload = @{ content = "Hi Marcus, confirming access via front door." } | ConvertTo-Json
$msgRes = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/$convId/messages" -Method POST -Body $msgPayload -ContentType "application/json" -WebSession $clientSession
Write-Output "6. Client Sent Message: '$($msgRes.message.content)'"

# Worker replies
$replyPayload = @{ content = "Received! I will arrive promptly at 1:00 PM." } | ConvertTo-Json
$replyRes = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/$convId/messages" -Method POST -Body $replyPayload -ContentType "application/json" -WebSession $workerSession
Write-Output "   Worker Replied: '$($replyRes.message.content)'"

# 7. Worker marks booking IN_PROGRESS then COMPLETED
$inProgPayload = @{ status = "IN_PROGRESS" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/bookings/$bookingId" -Method PATCH -Body $inProgPayload -ContentType "application/json" -WebSession $workerSession | Out-Null

$compPayload = @{ status = "COMPLETED" } | ConvertTo-Json
$compRes = Invoke-RestMethod -Uri "http://localhost:3000/api/bookings/$bookingId" -Method PATCH -Body $compPayload -ContentType "application/json" -WebSession $workerSession
Write-Output "7. Worker Completed Job: Status=$($compRes.booking.status)"

# 8. Client pays for the completed booking
$payPayload = @{
  bookingId = $bookingId
  cardNumber = "4242 4242 4242 4242"
  cardExpiry = "12/28"
  cardCvc = "123"
} | ConvertTo-Json
$payRes = Invoke-RestMethod -Uri "http://localhost:3000/api/payments" -Method POST -Body $payPayload -ContentType "application/json" -WebSession $clientSession
Write-Output "8. Client Payment Processed: Amount=`$$($payRes.payment.amount), ProviderID=$($payRes.payment.providerPaymentId)"

# 9. Client leaves a verified 5-star review
$reviewPayload = @{
  bookingId = $bookingId
  rating = 5
  comment = "Superb service! Installed fixtures seamlessly and left everything clean."
} | ConvertTo-Json
$reviewRes = Invoke-RestMethod -Uri "http://localhost:3000/api/reviews" -Method POST -Body $reviewPayload -ContentType "application/json" -WebSession $clientSession
$reviewId = $reviewRes.review.id
Write-Output "9. Client Review Submitted: ID=$reviewId (Rating: $($reviewRes.review.rating)/5)"

# 10. Worker responds to the review
$respPayload = @{
  reviewId = $reviewId
  response = "Thank you! It was great working on your project."
} | ConvertTo-Json
$respRes = Invoke-RestMethod -Uri "http://localhost:3000/api/reviews" -Method PATCH -Body $respPayload -ContentType "application/json" -WebSession $workerSession
Write-Output "10. Worker Response Added: '$($respRes.review.workerResponse)'"

Write-Output "--- All 10 End-to-End Steps Passed Successfully! ---"
