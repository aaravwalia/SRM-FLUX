import * as cheerio from 'cheerio';

export async function getAcademiaData(netid: string, pass: string) {
  try {
    console.log("Flux: Initiating Direct API Tunnel for", netid);

    // 1. Initial Handshake to get Session Cookies
    // We hit the landing page to pick up the CSRF and session tokens Zoho needs
    const landingRes = await fetch("https://academia.srmist.edu.in/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,webp,*/*;q=0.8",
      },
    });

    const initialCookies = landingRes.headers.get("set-cookie") || "";

    // 2. The Login Request
    // We send the form data exactly how the SRM 'Login' button does it
    const loginRes = await fetch("https://academia.srmist.edu.in/accounts/signin.do", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": initialCookies,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
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
    const allCookies = `${initialCookies}; ${loginCookies}`;

    // 3. Fetch the Attendance Data
    // We go straight to the internal attendance JSP file
    const attendanceRes = await fetch("https://academia.srmist.edu.in/attendance.jsp", {
      headers: {
        "Cookie": allCookies,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://academia.srmist.edu.in/#View:My_Attendance",
      }
    });

    const html = await attendanceRes.text();

    // 4. Check if we actually got the data or if it kicked us back to login
    if (html.includes("txtUsername") || html.includes("login")) {
      console.error("Flux: Authentication failed or redirect to login occurred.");
      throw new Error("INVALID_CREDENTIALS_OR_BLOCKED");
    }

    // 5. Parse the HTML Table with Cheerio
    const $ = cheerio.load(html);
    const subjects: any[] = [];

    // Target the table rows - skipping the header
    $('table tr').each((i, el) => {
      const td = $(el).find('td');
      if (td.length >= 4) {
        const name = $(td[1]).text().trim();
        const present = parseInt($(td[2]).text().trim()) || 0;
        const absent = parseInt($(td[3]).text().trim()) || 0;
        
        // Filter out empty rows or header rows
        if (name && !isNaN(present) && name !== "Subject Name" && name !== "Course Name") {
          subjects.push({
            name,
            present,
            absent,
            percentage: ((present / (present + absent)) * 100).toFixed(2)
          });
        }
      }
    });

    if (subjects.length === 0) {
      throw new Error("NO_DATA_FOUND");
    }

    console.log(`Flux: Successfully tunneled ${subjects.length} courses.`);
    return subjects;

  } catch (error: any) {
    console.error("Direct Scrape Error:", error.message);
    throw error;
  }
}