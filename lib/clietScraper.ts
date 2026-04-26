import * as cheerio from 'cheerio';

export async function syncFluxClientSide() {
  // Using a high-uptime CORS proxy to bypass browser security
  const PROXY = "https://api.allorigins.win/get?url=";
  const TARGET_URL = "https://academia.srmist.edu.in/attendance.jsp";
  
  try {
    console.log("[FLUX] Initiating Secure Browser Tunnel...");

    // 1. Fetch the raw HTML via the proxy
    // This request carries the student's existing browser cookies
    const response = await fetch(`${PROXY}${encodeURIComponent(TARGET_URL)}`);
    
    if (!response.ok) throw new Error("NETWORK_ERROR");

    const data = await response.json();
    const html = data.contents;

    // 2. Security Check: Did we get the data or the login page?
    if (html.includes("txtUsername") || html.includes("login-box")) {
      throw new Error("SESSION_EXPIRED");
    }

    // 3. Parse the Table with Cheerio
    const $ = cheerio.load(html);
    const subjects: any[] = [];

    // Target the specific SRM Attendance Table rows
    $('table tr').each((i, el) => {
      const td = $(el).find('td');
      
      // SRM Table structure: [S.No, Subject, Present, Absent, Total, %]
      if (td.length >= 4) {
        const name = $(td[1]).text().trim();
        const present = parseInt($(td[2]).text().trim());
        const absent = parseInt($(td[3]).text().trim());
        
        // Filter out headers or empty rows
        if (name && !isNaN(present) && name !== "Subject Name" && name !== "Course Name") {
          const total = present + absent;
          const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : "0.00";
          
          subjects.push({
            name,
            present,
            absent,
            total,
            percentage,
            // Calculate how many more classes can be skipped (75% threshold)
            margin: Math.floor((present / 0.75) - total)
          });
        }
      }
    });

    if (subjects.length === 0) throw new Error("NO_DATA_PARSED");

    console.log(`[FLUX] Success: ${subjects.length} subjects decrypted.`);
    return subjects;

  } catch (error: any) {
    console.error("[FLUX] Bridge Failed:", error.message);
    throw error;
  }
}