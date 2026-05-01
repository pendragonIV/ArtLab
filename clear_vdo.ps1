$apiKey = 'd4ixQb7VGd8CnEei97OWVBouavTt6FbE97FEWhunyZzPHN4SHE6hbsAe4kYLqjlj'
$headers = @{ 'Authorization' = "Apisecret $apiKey" }
$res = Invoke-RestMethod -Method Get -Uri 'https://dev.vdocipher.com/api/videos' -Headers $headers
$ids = $res.rows.id -join ','
if ($ids) {
    Invoke-RestMethod -Method Delete -Uri "https://dev.vdocipher.com/api/videos?videos=$ids" -Headers $headers
    Write-Host "Deleted videos: $ids"
} else {
    Write-Host "No videos found"
}
