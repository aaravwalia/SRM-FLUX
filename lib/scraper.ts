import * as cheerio from 'cheerio';

export async function getAcademiaData(netid: string, pass: string) {
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  try {
    console.log(`[FLUX] Initiating Tunnel for ${netid} in Mumbai Region...`);

    // 1. STAGE 1: GRAB HIDDEN TOKENS & COOKIES
    // We must load the page once to get the unique 'sharedBy' and 'appLinkName'
    const landingRes = await fetch("https://academia.srmist.edu.in/", {
      headers: { "User-Agent": userAgent },
    });

    const landingHtml = await landingRes.text();
    const $landing = cheerio.load(landingHtml);
    const initialCookies = landingRes.headers.get("set-cookie") || "";

    // Extract dynamic hidden fields
    const sharedBy = $landing('input[name="sharedBy"]').val();
    const appLinkName = $landing('input[name="appLinkName"]').val();

    if (!sharedBy || !appLinkName) {
      console.error("[FLUX] Failed to extract tokens. SRM might be under maintenance.");
      throw new Error("SRM_MAINTENANCE_OR_BLOCKED");
    }

    // 2. STAGE 2: AUTHENTICATION
    // We send the form data EXACTLY like the browser does
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
        "sharedBy": sharedBy as string,
        "appLinkName": appLinkName as string,
        "is_ajax": "true",
        "rememberme": "false"
      }),
    });

    const authCookies = loginRes.headers.get("set-cookie") || "";
    const allCookies = `${initialCookies}; ${authCookies}`;

    // 3. STAGE 3: DATA EXTRACTION
    const attendanceRes = await fetch("https://academia.srmist.edu.in/attendance.jsp", {
      headers: {
        "Cookie": allCookies,
        "User-Agent": userAgent,
      }
    });

    const html = await attendanceRes.text();

    // Verification: If we see "txtUsername", the login failed.
    if (html.includes("txtUsername") || html.includes("login-box")) {
       throw new Error("INVALID_CREDENTIALS");
    }

    // 4. PARSING
    const $ = cheerio.load(html);
    const subjects: any[] = [];

    $('table tr').each((i, el) => {
      const td = $(el).find('td');
      if (td.length >= 4) {
        const name = $(td[1]).text().trim();
        const present = parseInt($(td[2]).text().trim()) || 0;
        const absent = parseInt($(td[3]).text().trim()) || 0;
        
        if (name && !isNaN(present) && name !== "Subject Name") {
          const total = present + absent;
          subjects.push({
            name,
            present,
            absent,
            percentage: total > 0 ? ((present / total) * 100).toFixed(2) : "0",
            margin: Math.floor((present / 0.75) - total) // Bunk Margin
          });
        }
      }
    });

    if (subjects.length === 0) throw new Error("NO_DATA_FOUND");

    return subjects;

  } catch (error: any) {
    console.error("[FLUX ERROR]:", error.message);
    throw error;
  }
}