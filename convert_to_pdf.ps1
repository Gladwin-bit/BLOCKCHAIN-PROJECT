# PowerShell script to convert HTML to PDF using Chrome headless

$htmlPath = "C:\Users\ACER\supplychain-demo-main\architecture_diagram.html"
$pdfPath = "C:\Users\ACER\supplychain-demo-main\Blockchain_Supply_Chain_Architecture.pdf"

# Try to find Chrome installation
$chromePaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$chromePath = $null
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chromePath = $path
        break
    }
}

if ($chromePath) {
    Write-Host "Found Chrome at: $chromePath"
    Write-Host "Converting HTML to PDF..."
    
    # Use Chrome headless to print to PDF
    & $chromePath --headless --disable-gpu --print-to-pdf="$pdfPath" --no-margins "file:///$htmlPath"
    
    if (Test-Path $pdfPath) {
        Write-Host "PDF created successfully at: $pdfPath"
    } else {
        Write-Host "Failed to create PDF"
    }
} else {
    Write-Host "Chrome not found. Please install Google Chrome or use the HTML file directly."
    Write-Host "You can open the HTML file and use Ctrl+P to save as PDF manually."
}
