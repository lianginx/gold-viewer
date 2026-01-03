import "dotenv/config";

monitorGoldPrice();

async function monitorGoldPrice(
  interval = parseInt(process.env.INTERVAL) || 1800
) {
  while (true) {
    const start = Date.now();

    const data = await getGoldPrice();
    if (data) {
      const msg =
        `[${data.datetime}]\n` +
        `• 最新价: ${data.latest} 元/克\n` +
        `• 涨跌: ${data.change.amount} 元 (${data.change.percent}%)\n` +
        `• 区间: ${data.low} ~ ${data.high} 元/克\n` +
        `• 昨收: ${data.settlement} 元/克\n` +
        `• 成交量: ${data.volume.toLocaleString()} 手`;

      console.log(msg);

      const barkKey = process.env.BARK_KEY;
      if (barkKey) {
        await barkPush(barkKey, msg, "中国上海黄金交易所");
      }
    } else {
      console.log("获取失败，等待重试...");
    }

    const elapsed = (Date.now() - start) / 1000;
    const sleep = Math.max(interval - elapsed, 0);
    await new Promise((r) => setTimeout(r, sleep * 1000));
  }
}

async function barkPush(deviceKey, message, title = "金价监控", sound = true) {
  try {
    const baseUrl = `https://api.day.app/${deviceKey.trim()}/${encodeURIComponent(
      message
    )}`;

    const params = new URLSearchParams({
      group: title,
      level: "passive",
      id: "gold_price_monitor",
      url: "https://www.5huangjin.com/cn/",
      title,
    });

    if (!sound) {
      params.append("sound", "silent");
    }

    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      method: "GET",
    });

    if (res.ok) {
      console.log("📲 推送成功");
      return true;
    }

    console.warn("推送失败，状态码:", res.status);
    return false;
  } catch (err) {
    console.error("推送异常:", err);
    return false;
  }
}

const toFloat = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
};

async function getGoldPrice() {
  try {
    const res = await fetch("http://www.5huangjin.com/data/jin.js", {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      console.error(`[ERROR] 请求失败: ${res.status} ${res.statusText}`);
      return null;
    }

    const raw = await res.text();
    const dataStr = raw.split('="')[1].split('"')[0];
    const fields = dataStr.split(",");

    const latest = toFloat(fields[0]);
    const open = toFloat(fields[8]);
    const high = toFloat(fields[4]);
    const low = toFloat(fields[5]);
    const settlement = toFloat(fields[7]);

    const changeAmount = latest - settlement;
    const changePercent = settlement
      ? Number(((changeAmount / settlement) * 100).toFixed(3))
      : 0;

    return {
      datetime: `${fields[12]} ${fields[6]}`,
      latest,
      open,
      high,
      low,
      settlement,
      change: {
        amount: Number(changeAmount.toFixed(2)),
        percent: changePercent,
      },
      volume: parseInt(fields[9], 10) || 0,
    };
  } catch (err) {
    console.error("[ERROR] 金价获取失败:", err);
    return null;
  }
}
