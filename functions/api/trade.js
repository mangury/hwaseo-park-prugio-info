export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const type = searchParams.get('type');   // 'sale' | 'rent'
  const ym   = searchParams.get('ym');     // e.g. '202503'

  const KEY = context.env.MLIT_API_KEY;

  if (!KEY) {
    return json({ error: 'API 키가 설정되지 않았습니다.' }, 500);
  }
  if (!type || !ym) {
    return json({ error: 'type, ym 파라미터가 필요합니다.' }, 400);
  }

  const ENDPOINT = type === 'sale'
    ? 'RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev'
    : 'RTMSDataSvcAptRent/getRTMSDataSvcAptRent';

  const apiUrl = new URL(`https://apis.data.go.kr/1613000/${ENDPOINT}`);
  apiUrl.searchParams.set('serviceKey', KEY);
  apiUrl.searchParams.set('LAWD_CD',   '41111');  // 수원시 장안구
  apiUrl.searchParams.set('DEAL_YMD',  ym);
  apiUrl.searchParams.set('pageNo',    '1');
  apiUrl.searchParams.set('numOfRows', '100');
  apiUrl.searchParams.set('_type',     'json');

  try {
    const res  = await fetch(apiUrl.toString());
    const data = await res.json();

    const raw = data?.response?.body?.items?.item ?? [];
    const items = Array.isArray(raw) ? raw : [raw];

    const NAME = '화서역파크푸르지오';
    const filtered = items.filter(it =>
      (it['아파트'] ?? it.aptNm ?? '').replace(/\s/g, '').includes(NAME)
    );

    return json({ items: filtered });
  } catch (e) {
    return json({ error: '외부 API 호출 실패: ' + e.message }, 502);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
