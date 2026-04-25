import * as cheerio from 'cheerio';

export async function getAcademiaData(netid: string, pass: string) {
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
  
  try {
    console.log(`[FLUX] Executing AcademiaX-Logic for: ${netid}`);

    // 1. Get the landing page to capture the ZOHO_ID and Semester Tokens
    const landing = await fetch("https://academia.srmist.edu.in/", {
      headers: { "User-Agent": userAgent }
    });
    const initialCookies = landing.headers.get("set-cookie") || "";
    const htmlContent = await landing.text();
    const $ = cheerio.load(htmlContent);

    // AcademiaX secret: These fields change every semester
    const sharedBy = $('input[name="sharedBy"]').val();
    const appLinkName = $('input[name="appLinkName"]').val();

    if (!sharedBy || !appLinkName) {
      throw new Error("Unable to resolve SRM Semester Tokens.");
    }

    // 2. The Direct Login Request
    const loginResponse = await fetch("https://academia.srmist.edu.in/accounts/signin.do", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": initialCookies,
        "User-Agent": userAgent,
        "Referer": "https://academia.srmist.edu.in/",
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

    const loginCookies = loginResponse.headers.get("set-cookie") || "";
    const finalCookies = `${initialCookies}; ${loginCookies}`;

    // 3. Fetch the Attendance HTML
    const attendanceRes = await fetch("https://academia.srmist.edu.in/attendance.jsp", {
      headers: {
        "Cookie": finalCookies,
        "User-Agent": userAgent,
      }
    });

    const attendanceHtml = await attendanceRes.text();

    // 4. Parse the data
    const $data = cheerio.load(attendanceHtml);
    const subjects: any[] = [];

    $data('table tr').each((i, el) => {
      const td = $data(el).find('td');
      if (td.length >= 4) {
        const name = $data(td[1]).text().trim();
        const present = parseInt($data(td[2]).text().trim());
        const absent = parseInt($data(td[3]).text().trim());

        if (name && !isNaN(present) && name !== "Subject Name") {
          const total = present + absent;
          subjects.push({
            name,
            present,
            absent,
            percentage: total > 0 ? ((present / total) * 100).toFixed(2) : "0",
            margin: Math.floor((present / 0.75) - total) // The "Bunk" Margin
          });
        }
      }
    });

    if (subjects.length === 0) {
        // If login failed, the HTML usually contains the login form again
        if (attendanceHtml.includes("txtUsername")) throw new Error("INVALID_CREDENTIALS");
        throw new Error("ACADEMIA_EMPTY_DATA");
    }

    return subjects;

  } catch (error: any) {
    console.error("[FLUX CRITICAL]:", error.message);
    throw error;
  }
}