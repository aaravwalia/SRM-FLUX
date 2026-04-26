import * as cheerio from 'cheerio';

export async function getAcademiaData(netid: string, pass: string) {
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  try {
    console.log(`[FLUX] Initiating Mumbai-Region Tunnel: ${netid}`);

    // 1. STAGE 1: THE HANDSHAKE
    // We hit the landing page to scrape the dynamic Zoho tokens for 2026
    const landingRes = await fetch("https://academia.srmist.edu.in/", {
      headers: { "User-Agent": userAgent },
      cache: 'no-store'
    });

    const landingHtml = await landingRes.text();
    const $landing = cheerio.load(landingHtml);
    const initialCookies = landingRes.headers.get("set-cookie") || "";

    // Extracting dynamic 2026 tokens
    const sharedBy = $landing('input[name="sharedBy"]').val();
    const appLinkName = $landing('input[name="appLinkName"]').val();

    if (!sharedBy || !appLinkName) {
      console.error("[FLUX] Portal might be under maintenance or tokens hidden.");
      throw new Error("SRM_PORTAL_TIMEOUT");
    }

    // 2. STAGE 2: THE AUTHENTICATION
    // Sending encoded form data exactly like the login button does
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

    const loginCookies = loginRes.headers.get("set-cookie") || "";
    const sessionCookies = `${initialCookies}; ${loginCookies}`;

    // 3. STAGE 3: THE DATA GRAB
    const attendanceRes = await fetch("https://academia.srmist.edu.in/attendance.jsp", {
      headers: {
        "Cookie": sessionCookies,
        "User-Agent": userAgent,
        "Referer": "https://academia.srmist.edu.in/#View:My_Attendance",
      }
    });

    const html = await attendanceRes.text();

    // 4. VERIFICATION
    if (html.includes("txtUsername") || html.includes("login-box") || html.length < 500) {
      console.error("[FLUX] Authentication rejected. Check NetID/Pass or IP status.");
      throw new Error("INVALID_CREDENTIALS");
    }

    // 5. PARSING THE RESPONSE
    const $ = cheerio.load(html);
    const subjects: any[] = [];

    $('table tr').each((i, el) => {
      const td = $(el).find('td');
      // SRM Table Layout: [S.No, Subject, Present, Absent, Total, %]
      if (td.length >= 4) {
        const name = $(td[1]).text().trim();
        const present = parseInt($(td[2]).text().trim()) || 0;
        const absent = parseInt($(td[3]).text().trim()) || 0;
        
        if (name && !isNaN(present) && name !== "Subject Name" && name !== "Course Name") {
          const total = present + absent;
          subjects.push({
            name,
            present,
            absent,
            total,
            percentage: total > 0 ? ((present / total) * 100).toFixed(2) : "0.00",
            margin: Math.floor((present / 0.75) - total)
          });
        }
      }
    });

    if (subjects.length === 0) throw new Error("ACADEMIA_NO_DATA");

    console.log(`[FLUX] Success: ${subjects.length} subjects found.`);
    return subjects;

  } catch (error: any) {
    console.error("[FLUX CRITICAL]:", error.message);
    throw error;
  }
}