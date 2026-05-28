import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const PROXY_CONFIG = {
  host: '127.0.0.1',
  port: 8080,
  auth: {
    username: 'user',
    password: 'password'
  }
};

const proxyUrl = PROXY_CONFIG.auth 
  ? `http://${PROXY_CONFIG.auth.username}:${PROXY_CONFIG.auth.password}@${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`
  : `http://${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`;

const proxyAgent = new HttpsProxyAgent(proxyUrl);

const BASE_HEADERS = {
  'accept': '*/*',
  'accept-language': 'en-US,en;q=0.9',
  'priority': 'u=1, i',
  'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
  'sec-ch-ua-full-version-list': '"Chromium";v="148.0.7778.179", "Google Chrome";v="148.0.7778.179", "Not/A)Brand";v="99.0.0.0"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-model': '""',
  'sec-ch-ua-platform': '"Windows"',
  'sec-ch-ua-platform-version': '"19.0.0"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
};

async function fetchInstagramData(username) {
  try {
    const targetUrl = `https://www.instagram.com/${username}/`;
    console.log("Fetching profile data...");
    
    const profileResponse = await axios.get(targetUrl, { 
      headers: BASE_HEADERS,
      httpsAgent: proxyAgent 
    });
    
    const htmlContent = typeof profileResponse.data === 'object' 
      ? JSON.stringify(profileResponse.data) 
      : profileResponse.data;

    const queryIdMatch = htmlContent.match(/"query_id"\s*:\s*"([^"]+)"/);
    const userIdMatch = htmlContent.match(/"user_id"\s*:\s*"([^"]+)"/);

    if (!queryIdMatch || !userIdMatch) {
      throw new Error("(query_id, user_id) not found");
    }

    const dynamicQueryId = queryIdMatch[1];
    const dynamicUserId = userIdMatch[1];

    console.log(`query_id: ${dynamicQueryId} | user_id: ${dynamicUserId}`);
    
    const graphqlResponse = await axios.get('https://www.instagram.com/graphql/query/', {
      params: {
        'query_id': dynamicQueryId,
        'user_id': dynamicUserId,
        'include_chaining': 'false',
        'include_reel': 'true',
        'include_suggested_users': 'false',
        'include_logged_out_extras': 'true',
        'include_live_status': 'false',
        'include_highlight_reels': 'true'
      },
      headers: {
        ...BASE_HEADERS,
        'referer': targetUrl,
      },
      httpsAgent: proxyAgent
    });

    return graphqlResponse.data.data.user.user.profile_pic_url;

  } catch (error) {
    console.error("Err:", error.message);
  }
}

console.log(await fetchInstagramData("ronaldo"));
