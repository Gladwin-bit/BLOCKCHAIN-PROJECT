"""
Simple HTML to PDF converter using Playwright
This script converts the architecture diagram HTML to PDF
"""

import asyncio
import sys
import os

try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

async def convert_html_to_pdf():
    html_path = r"C:\Users\ACER\supplychain-demo-main\architecture_diagram.html"
    pdf_path = r"C:\Users\ACER\supplychain-demo-main\Blockchain_Supply_Chain_Architecture.pdf"
    
    if not os.path.exists(html_path):
        print(f"Error: HTML file not found at {html_path}")
        return False
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Load the HTML file
        await page.goto(f"file:///{html_path}")
        
        # Wait for mermaid to render
        await page.wait_for_timeout(3000)
        
        # Generate PDF with landscape orientation and A3 size
        await page.pdf(
            path=pdf_path,
            format='A3',
            landscape=True,
            print_background=True,
            margin={
                'top': '20mm',
                'right': '20mm',
                'bottom': '20mm',
                'left': '20mm'
            }
        )
        
        await browser.close()
        
        if os.path.exists(pdf_path):
            print(f"✅ PDF created successfully at: {pdf_path}")
            return True
        else:
            print("❌ Failed to create PDF")
            return False

if __name__ == "__main__":
    if not PLAYWRIGHT_AVAILABLE:
        print("Playwright not installed. Installing...")
        os.system("pip install playwright")
        os.system("playwright install chromium")
        print("\nPlease run this script again after installation completes.")
        sys.exit(1)
    
    asyncio.run(convert_html_to_pdf())
