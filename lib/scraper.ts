import * as cheerio from 'cheerio';

export async function getAcademiaData(netid: string, pass: string) {
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  try {
    console.log(`[FLUX] Initiating secure tunnel for: ${netid} (Region: BOM)`);

    // 1. PHASE 1: Establish Session
    // We hit the portal to collect the 'JSESSIONID' and 'IAMCSRF' cookies
    const landingRes = await fetch("https://academia.srmist.edu.in/", {
      headers: { "User-Agent": userAgent },
    });

    const initialCookies = landingRes.headers.get("set-cookie") || "";

    // 2. PHASE 2: Authentication Handshake
    // We send the credentials to the sign-in endpoint
    const loginRes = await fetch("https://academia.srmist.edu.in/accounts/signin.do", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": initialCookies,
        "User-Agent": userAgent,
        "Origin": "https://academia.srmist.edu.in",
        "Referer": "https://academia.srmist.edu.in/",
      },
      body: new URLSearchParams({
        "username": netid,
        "password": pass,
        "is_ajax": "true",
        "rememberme": "false",
      }),
    });

    const loginCookies = loginRes.headers.get("set-cookie") || "";
    const sessionCookies = `${initialCookies}; ${loginCookies}`;

    // 3. PHASE 3: Data Extraction
    // After login, we fetch the raw attendance JSP table
    const attendanceRes = await fetch("https://academia.srmist.edu.in/attendance.jsp", {
      headers: {
        "Cookie": sessionCookies,
        "User-Agent": userAgent,
        "Referer": "https://academia.srmist.edu.in/#View:My_Attendance",
      }
    });

    const html = await attendanceRes.text();

    // 4. SECURITY CHECK: Did we actually get in?
    // If the HTML still contains login fields, the credentials or cookies failed.
    if (html.includes("txtUsername") || html.includes("login-box") || html.length < 1000) {
      console.error("[FLUX] Authentication rejected by Academia firewall.");
      throw new Error("INVALID_AUTH_OR_SESSION_BLOCKED");
    }

    // 5. PARSING: Extract attendance with Cheerio
    const $ = cheerio.load(html);
    const subjects: any[] = [];

    // Find the attendance table and loop through rows
    $('table tr').each((i, el) => {
      const td = $(el).find('td');
      // Academia table structure: [Code, Name, Present, Absent, Total, %]
      if (td.length >= 4) {
        const name = $(td[1]).text().trim();
        const present = parseInt($(td[2]).text().trim());
        const absent = parseInt($(td[3]).text().trim());

        // Validate data is actual attendance and not a header
        if (name && !isNaN(present) && name !== "Course Name" && name !== "Subject Name") {
          const total = present + absent;
          const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : "0";
          
          subjects.push({
            name,
            present,
            absent,
            percentage,
            // Calculate Bunk Margin (classes you can skip while staying above 75%)
            margin: Math.floor((present / 0.75) - total)
          });
        }
      }
    });

    if (subjects.length === 0) {
      throw new Error("EMPTY_DATA_RETURNED");
    }

    console.log(`[FLUX] Tunnel successful. Extracted ${subjects.length} subjects.`);
    return subjects;

  } catch (error: any) {
    console.error("[FLUX] Scraper Critical Failure:", error.message);
    throw error;
  }
}