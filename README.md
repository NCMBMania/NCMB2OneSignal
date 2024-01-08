# NCMBのInstallationをOneSignalへ移行するスクリプト

## 準備

以下が必要です。

- NCMBのInstallationクラスをJSON形式でエクスポートしたファイル
- OneSignalのアカウント

## NCMBのInstallationクラスをJSON形式でエクスポートする

NCMBの管理画面でデータをエクスポートするか、[NCMB Extension](https://chromewebstore.google.com/detail/ncmb-extension/dglkhlplcpmnbgodhbngcmdfpojkbdnc?hl=ja)を利用してください。

[NCMBの管理画面をGoogle Chrome機能拡張で便利にする（CSVエクスポート） \#JavaScript \- Qiita](https://qiita.com/goofmint/items/19bccf321f210b013e10)

## OneSignalのアカウントを作成する

[OneSignal](https://onesignal.com/)にアクセスしてアカウントを作成してください。そして、下記情報を控えておいてください。

- App ID
- REST API Key

どちらもOneSignalの管理画面の「Settings > Keys&IDs」から確認できます。

## スクリプトを実行する

スクリプトを実行するには、Node.jsが必要です。実行時には、オプションを指定してください。

```bash
npx node dist/index.js \
  --debug\
	-a YOUR_ONESIGNAL_APP_ID \
	-k YOUR_ONESIGNAL_REST_API_KEY\
	/path/to/installation.json
```

指定できるオプションです。

```
Usage: index [options] <filePath>

Arguments:
  filePath                   installation.jsonのパス

Options:
  -k, --key <REST API KEY>   OneSignalのREST APIキー (default: "")
  -a, --app-id <APP ID>      OneSignalのアプリID (default: "")
  --debug                    (iOSのみ)デバッグモード。サンドボックス向けの場合は指定してください。 (default: false)
  --adhoc                    (iOSのみ)アドホックモード。アドホック向けの場合は指定してください。 (default: false)
  -l, --language <language>  言語。デフォルトはja-JPです。 (default: "ja-JP")
  -c, --country <country>    国。デフォルトはJPです。 (default: "JP")
  -h, --help                 display help for command
```

`--debug` と `--adhoc` はiOS向けのオプションです。サンドボックス向けの場合は `--debug` を指定してください。アドホック向けの場合は `--adhoc` を指定してください。何も指定しない場合は、App Store向けの指定になります。

## ライセンス

MIT

