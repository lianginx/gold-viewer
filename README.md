# 金价监控

每小时抓取 [中国上海黄金交易所](https://www.5huangjin.com/cn/) 交易数据，通过 [Bark](https://github.com/finb/bark) 推送到 iOS 设备。

## 安装依赖

```bash
pnpm i
```

## 配置 Bark Key

拷贝 `.env.example` 文件为 `.env`：

```bash
cp example.env .env      
```

编辑 `.env` 文件，将 Bark Key 填写到 `BARK_KEY` 变量中。

## 启动与管理命令

```bash
pnpm start
```

## Docker 部署

```bash
docker compose up -d
```
