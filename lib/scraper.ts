import * as cheerio from 'cheerio';

export async function getAcademiaData(netid: string, pass: string) {
  // Use a very specific User Agent that mimics a modern Windows 11 Chrome browser
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  try {
    console.log(`[FLUX] BOM-1 Tunneling: ${netid}`);

    // 1. Initial Handshake - Grabbing session and tokens
    const landing = await fetch("https://academia.srmist.edu.in/", {
      headers: {
        "User-Agent": userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Upgrade-Insecure-Requests": "1"
      }
    });

    const landingHtml = await landing.text();
    const $landing = cheerio.load(landingHtml);
    const initialCookies = landing.headers.get("set-cookie") || "";

    // SCRAPE TOKENS (Crucial for 2026 Semester)
    const sharedBy = $landing('input[name="sharedBy"]').val();
    const appLinkName = $landing('input[name="appLinkName"]').val();

    if (!sharedBy || !appLinkName) {
      throw new Error("ACADEMIA_PORTAL_SHIELD_ACTIVE");
    }

    // 2. The Login POST
    // We must exactly mimic the Zoho Accounts login flow
    const loginRes = await fetch("https://academia.srmist.edu.in/accounts/signin.do", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": initialCookies,
        "User-Agent": userAgent,
        "Origin": "https://academia.srmist.edu.in",
        "Referer": "https://academia.srmist.edu.in/",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: new URLSearchParams({
        "username": netid,
        "password": pass,
        "sharedBy": sharedBy as string,
        "appLinkName": appLinkName as string,
        "is_ajax": "true",
        "rememberme": "false"
      })
    });

    // Check if login was actually successful (look for session cookies)
    const authCookies = loginRes.headers.get("set-cookie") || "";
    if (!authCookies.includes("JSESSIONID") && !initialCookies.includes("JSESSIONID")) {
        throw new Error("INVALID_AUTH_RESPONSE");
    }

    const allCookies = `${initialCookies}; ${authCookies}`;

    // 3. The Data Fetch - Directly hitting the Attendance endpoint
    const dataRes = await fetch("https://academia.srmist.edu.in/attendance.jsp", {
      headers: {
        "Cookie": allCookies,
        "User-Agent": userAgent,
        "Referer": "https://academia.srmist.edu.in/#View:My_Attendance"
      }
    });

    const html = await dataRes.text();

    if (html.includes("txtUsername") || html.includes("login-box")) {
      throw new Error("ACADEMIA_REJECTED_CREDENTIALS");
    }

    // 4. Parse Table
    const $ = cheerio.load(html);
    const subjects: any[] = [];

    $('table tr').each((i, el) => {
      const td = $(el).find('td');
      if (td.length >= 4) {
        const name = $(td[1]).text().trim();
        const present = parseInt($(td[2]).text().trim()) || 0;
        const absent = parseInt($(td[3]).text().trim()) || 0;
        
        if (name && !isNaN(present) && name !== "Subject Name") {
          subjects.push({
            name,
            present,
            absent,
            percentage: ((present / (present + absent)) * 100).toFixed(2),
            margin: Math.floor((present / 0.75) - (present + absent))
          });
        }
      }
    });

    return subjects;

  } catch (error: any) {
    console.error("[FLUX CRITICAL ERROR]:", error.message);
    throw error;
  }
}