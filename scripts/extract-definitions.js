const https = require("https");
const fs = require("fs");
const path = require("path");

// Google Sheets CSV export URL
// Format: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv&gid={SHEET_ID}
const SPREADSHEET_ID = "1fAq95kEDDSgBSlJM_LDzk-JcG2zDAq9YFQfrzhDwd8k";
const SHEET_GID = "400467033";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

function parseCSV(csvText) {
  const lines = [];
  let currentLine = [];
  let inQuotes = false;
  let currentField = "";

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      currentLine.push(currentField.trim());
      currentField = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      // End of line
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        lines.push(currentLine);
        currentLine = [];
        currentField = "";
      }
      // Skip \r\n combination
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
    } else {
      currentField += char;
    }
  }

  // Add last field and line if any
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    lines.push(currentLine);
  }

  return lines;
}

function normalizeText(text) {
  if (!text) return "";
  // Replace newlines and carriage returns with spaces, then collapse multiple spaces
  return text
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fetchWithRedirect(url, callback) {
  https
    .get(url, (res) => {
      // Handle redirects
      if (
        res.statusCode === 301 ||
        res.statusCode === 302 ||
        res.statusCode === 307 ||
        res.statusCode === 308
      ) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          return fetchWithRedirect(redirectUrl, callback);
        }
      }

      // Check if we got HTML instead of CSV (error page)
      const contentType = res.headers["content-type"] || "";
      if (contentType.includes("text/html")) {
        let htmlData = "";
        res.on("data", (chunk) => {
          htmlData += chunk;
        });
        res.on("end", () => {
          // Try to extract redirect URL from HTML
          const match = htmlData.match(/HREF=([^>]+)>here<\/A>/i);
          if (match && match[1]) {
            let redirectUrl = match[1].replace(/&amp;/g, "&");
            return fetchWithRedirect(redirectUrl, callback);
          }
          console.error(
            "❌ Received HTML instead of CSV. The sheet may require authentication."
          );
          process.exit(1);
        });
        return;
      }

      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        callback(data);
      });
    })
    .on("error", (error) => {
      console.error("❌ Error fetching CSV:", error.message);
      process.exit(1);
    });
}

fetchWithRedirect(CSV_URL, (data) => {
  try {
    const rows = parseCSV(data);

    // Skip header row (row 0)
    // Columns: A=0 (Card Name), B=1 (Definition), C=2 (Planning), D=3 (empty), E=4 (Execution), F=5 (Min Standard), G=6 (Question)
    const cards = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] && row[0].trim()) {
        // Card Name exists
        cards.push({
          cardName: normalizeText(row[0] || ""),
          definition: row[1] || "",
          planning: row[2] || "",
          execution: row[4] || "", // Column E (index 4, skipping D)
          minimumStandardOfCare: row[5] || "", // Column F
          minimumStandardOfCareQuestion: row[6] || "", // Column G
        });
      }
    }

    const output = {
      metadata: {
        source: "Fair Play Definitions",
        extractedAt: new Date().toISOString(),
        totalCards: cards.length,
        spreadsheetId: SPREADSHEET_ID,
        sheetGid: SHEET_GID,
      },
      cards: cards,
    };

    const outputPath = path.join(__dirname, "definitions.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(
      `✅ Successfully extracted ${cards.length} cards to definitions.json`
    );
    console.log(`📄 File saved to: ${outputPath}`);
  } catch (error) {
    console.error("❌ Error parsing CSV:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
});
