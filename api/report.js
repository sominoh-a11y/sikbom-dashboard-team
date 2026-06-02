export const config = { runtime: 'edge' };

const APP_NAME = 'foodspring';
const BASE = `https://api.airbridge.io/reports/api/v7/apps/${APP_NAME}`;

const CAMPAIGN_ALIASES = {
  'FS_Kakao_AOS_NRU_Biz_AON_2606_perform':             'FS_Kakao_AOS_NRU_Biz_AON_perform',
  'FS_Danggeun_Web_Central_FirstPurchase_2606_perform': 'FS_Danggeun_Web_NRU_FirstPurchase_2606_perform',
  'FS_Danggeun_Web_East_FirstPurchase_2606_perform':    'FS_Danggeun_Web_NRU_FirstPurchase_2606_perform',
};

const NAVER_CAMPAIGNS = [
  'FS_Naver_Web_NRU_Native_perform',
  'FS_Naver_Web_NRU_Commu_perform',
  'FS_Naver_Web_NRU_Advoost_perform',
];
const KAKAO_CAMPAIGNS = [
  'FS_Kakao_AOS_NRU_Biz_AON_perform',
  'FS_Kakao_AOS_NRU_Biz_AON_2606_perform',
  'FS_Kakao_Web_NRU_Native_AON_perform',
];
const META_CAMPAIGNS = [
  'FS_Meta_WEB_NRU_Conv_TBD _2606_perform',
  'FS_Meta_WEB_NRU_Conv_AON _2606_perform',
  'FS_Meta_WEB_NRU_Conv_INCU _2606_perform',
  'FS_Meta_WEB_NRU_Conv_INTRO _2606_perform',
  'FS_Meta_iOS_NRU_Conv_AON _2606_perform',
];
const TOSS_CAMPAIGNS = [
  'FS_Toss_App_NRU_List_banner_AON_2606_perform',
  'FS_Toss_App_NRU_Board_banner_AON_2604',
];
const DANGGEUN_CAMPAIGNS = [
  'FS_Danggeun_Web_NRU_FirstPurchase_2606_perform',
  'FS_Danggeun_Web_Central_FirstPurchase_2606_perform',
  'FS_Danggeun_Web_East_FirstPurchase_2606_perform',
];
const CAFE_GROUPS = [
  '2605_cafe_noinyoyang',
  '2605_cafe_asajang',
  '2605_comm_yysdoumi',
];

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (!date) return json({ error: 'date 필요' }, 400);

  const apiKey = process.env.AIRBRIDGE_API_TOKEN;
  if (!apiKey) return json({ error: 'AIRBRIDGE_API_TOKEN 없음' }, 500);

  try {
    const allCampaigns = [
      ...NAVER_CAMPAIGNS, ...KAKAO_CAMPAIGNS, ...META_CAMPAIGNS,
      ...TOSS_CAMPAIGNS, ...DANGGEUN_CAMPAIGNS,
    ];
    const [campaignRows, cafeRows] = await Promise.all([
      fetchActuals(apiKey, date, 'campaign', allCampaigns),
      fetchActuals(apiKey, date, 'ad_group', CAFE_GROUPS),
    ]);
    return json({ ok: true, rows: mergeRows([...campaignRows, ...cafeRows]) });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

function mergeRows(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = `${r.campaign}||${r.group}||${r.creative}`;
    if (map.has(key)) {
      const ex = map.get(key);
      ex.install += r.install; ex.signup += r.signup;
      ex.purchase += r.purchase; ex.cost += r.cost;
    } else {
      map.set(key, { ...r });
    }
  }
  return Array.from(map.values());
}

async function fetchActuals(apiKey, date, filterDimension, filterValues) {
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
  const body = JSON.stringify({
    from: date, to: date,
    groupBys: ['campaign', 'ad_group', 'ad_creative'],
    metrics: ['app_installs','app_sign_up','web_sign_up','app_custom_firstPurchase','web_custom_firstPurchase','cost_channel'],
    filters: [{ field: filterDimension, filterType: 'IN', values: filterValues }],
    size: 1000,
  });

  const postRes = await fetch(`${BASE}/actuals/query`, { method: 'POST', headers, body });
  const postText = await postRes.text();
  if (!postRes.ok) throw new Error(`POST ${postRes.status}: ${postText}`);
  const taskId = JSON.parse(postText)?.task?.taskId;
  if (!taskId) throw new Error('taskId 없음: ' + postText);

  for (let i = 0; i < 10; i++) {
    await sleep(1000);
    const getData = await (await fetch(`${BASE}/actuals/query/${taskId}?skip=0&size=1000`, { headers })).json();
    if (getData?.task?.status === 'SUCCESS') {
      return (getData?.actuals?.data?.rows || []).map(r => {
        const g = r.groupBys || [], v = r.values || {};
        const camp = CAMPAIGN_ALIASES[g[0]||''] || g[0] || '';
        return {
          campaign: camp, group: g[1]||'', creative: g[2]||'',
          install:  Number(v.app_installs?.value||0),
          signup:   Number(v.app_sign_up?.value||0) + Number(v.web_sign_up?.value||0),
          purchase: Number(v.app_custom_firstPurchase?.value||0) + Number(v.web_custom_firstPurchase?.value||0),
          cost:     Number(v.cost_channel?.value||0),
        };
      });
    }
    if (getData?.task?.status === 'FAILED') throw new Error('Airbridge task 실패');
  }
  throw new Error('Airbridge 타임아웃');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});
