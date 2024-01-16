const puppeteer = require('puppeteer');

module.exports.generatePDF = async (htmlTemplate) => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] , headless: 'new' });
    const page = await browser.newPage();

    // Set the HTML content of the page
    await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded' });

    // Generate the PDF
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    await browser.close();

    return pdfBuffer;
};
