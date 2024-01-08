"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const luxon_1 = require("luxon");
;
commander_1.program
    .option('-k, --key <REST API KEY>', 'OneSignalのREST APIキー', '')
    .option('-a, --app-id <APP ID>', 'OneSignalのアプリID', '')
    .option('--debug', '(iOSのみ)デバッグモード。サンドボックス向けの場合は指定してください。', false)
    .option('--adhoc', '(iOSのみ)アドホックモード。アドホック向けの場合は指定してください。', false)
    .option('-l, --language <language>', '言語。デフォルトはja-JPです。', 'ja-JP')
    .option('-c, --country <country>', '国。デフォルトはJPです。', 'JP')
    .argument('<filePath>', 'installation.jsonのパス');
commander_1.program.parse();
const options = commander_1.program.opts();
const [filePath] = commander_1.program.args;
;
const url = 'https://onesignal.com/api/v1/players';
const getTimezoneOffsetInSeconds = (timezone) => {
    const now = luxon_1.DateTime.now().setZone(timezone); // タイムゾーンを設定
    const offsetInSeconds = now.offset * 60; // 分単位から秒単位へ変換
    return offsetInSeconds;
};
((params) => __awaiter(void 0, void 0, void 0, function* () {
    if (!params.key) {
        console.error('REST APIキーを指定してください。OneSignalのSettings > Keys&IDsから取得できます。');
        process.exit(1);
    }
    if (!params.appId) {
        console.error('アプリIDを指定してください。OneSignalのSettings > Keys&IDsから取得できます。');
        process.exit(1);
    }
    if (!params.filePath) {
        console.error('installation.jsonのパスを指定してください。');
        process.exit(1);
    }
    params.filePath = path_1.default.resolve(params.filePath);
    if (!params.filePath) {
        console.error(`正しいinstallation.jsonのパスを指定してください。ファイルパス ${params.filePath}`);
        process.exit(1);
    }
    try {
        params.json = JSON.parse(fs_1.default.readFileSync(params.filePath, 'utf8'));
    }
    catch (e) {
        console.error(`installation.jsonの読み込みに失敗しました。ファイルパス: ${params.filePath}`);
        process.exit(1);
    }
    console.log(params.json.results);
    for (const installation of params.json.results) {
        const body = {
            app_id: params.appId,
            device_type: installation.deviceType === 'ios' ? 0 : 1,
            identifier: installation.deviceToken,
            language: params.language,
            timezone: getTimezoneOffsetInSeconds(installation.timeZone || 'Asia/Tokyo'),
            game_version: installation.appVersion,
            country: params.country,
            test_type: params.adhoc ? 2 : (params.debug ? 1 : 0),
            created_at: luxon_1.DateTime.fromISO(installation.createDate).toSeconds(),
            last_active: luxon_1.DateTime.fromISO(installation.updateDate).toSeconds(),
            tags: {},
        };
        for (const channel of installation.channels) {
            body.tags[channel] = 'true';
        }
        for (const [key, value] of Object.entries(installation)) {
            if (['objectId', 'appVersion', 'channels', 'deviceToken', 'deviceType', 'timeZone', 'createDate', 'updateDate', 'acl'].indexOf(key) > -1) {
                continue;
            }
            body.tags[key] = value;
        }
        console.log(body);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${params.key}`,
            },
            body: JSON.stringify(body),
        };
        const res = yield (0, node_fetch_1.default)(url, options);
        const json = yield res.json();
        if (json.success) {
            console.log(`成功: ${installation.deviceToken} -> ${json.id}`);
        }
        else {
            console.error(`失敗: ${installation.deviceToken} -> ${json.errors.join(', ')}`);
        }
    }
}))(Object.assign(Object.assign({}, options), { filePath }));
