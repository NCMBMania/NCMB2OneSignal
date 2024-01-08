import {program} from 'commander';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import { DateTime, IANAZone } from 'luxon';

interface Options {
	key: string;
	debug: boolean;
	adhoc: boolean;
	language: string;
	country: string;
	appId: string;
};

program
    .option('-k, --key <REST API KEY>', 'OneSignalのREST APIキー', '')
		.option('-a, --app-id <APP ID>', 'OneSignalのアプリID', '')
		.option('--debug', '(iOSのみ)デバッグモード。サンドボックス向けの場合は指定してください。', false)
		.option('--adhoc', '(iOSのみ)アドホックモード。アドホック向けの場合は指定してください。', false)
		.option('-l, --language <language>', '言語。デフォルトはja-JPです。', 'ja-JP')
		.option('-c, --country <country>', '国。デフォルトはJPです。', 'JP')
		.argument('<filePath>', 'installation.jsonのパス');
program.parse();
const options: Options = program.opts();

const [filePath] = program.args;

interface Params extends Options {
	filePath: string | undefined;
	json?: InstallationJson;
};

type InstallationJson = {
	results: {
		objectId: string;
    applicationName: string;
    appVersion: string;
    badge: number;
    channels: string[];
    deviceToken: string;
    deviceType: string;
    sdkVersion: string;
    timeZone: string;
    createDate: string;
    updateDate: string;
    acl: {[key: string]: string };
    pushType: string;
	}[]
};

type OneSignalRequest = {
	app_id: string;
	device_type: number;
	identifier: string;
	test_type?: number;
	language?: string;
	external_user_id?: string;
	timezone?: number;
	game_version?: string;
	created_at?: number;
	last_active?: number;
	country?: string;
	tags: {[key: string]: string; };
};

type OneSignalResponse = {
	id: string;
	success: boolean;
	errors: string[];
};

const url = 'https://onesignal.com/api/v1/players';

const getTimezoneOffsetInSeconds = (timezone: string): number => {
	const now = DateTime.now().setZone(timezone); // タイムゾーンを設定
  const offsetInSeconds = now.offset * 60; // 分単位から秒単位へ変換
  return offsetInSeconds;
}

(async (params: Params) => {
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
	params.filePath = path.resolve(params.filePath);
	if (!params.filePath) {
		console.error(`正しいinstallation.jsonのパスを指定してください。ファイルパス ${params.filePath}`);
		process.exit(1);
	}

	try {
		params.json = JSON.parse(fs.readFileSync(params.filePath, 'utf8')) as InstallationJson;
	} catch (e) {
		console.error(`installation.jsonの読み込みに失敗しました。ファイルパス: ${params.filePath}`);
		process.exit(1);
	}
	console.log(params.json.results);
	for (const installation of params.json.results) {
		const body: OneSignalRequest = {
			app_id: params.appId,
			device_type: installation.deviceType === 'ios' ? 0 : 1,
			identifier: installation.deviceToken,
			language: params.language,
			timezone: getTimezoneOffsetInSeconds(installation.timeZone || 'Asia/Tokyo'),
			game_version: installation.appVersion,
			country: params.country,
			test_type: params.adhoc ? 2 : (params.debug ? 1 : 0),
			created_at: DateTime.fromISO(installation.createDate).toSeconds(),
			last_active: DateTime.fromISO(installation.updateDate).toSeconds(),
			tags: {},
		};
		for (const channel of installation.channels) {
			body.tags[channel] = 'true';
		}
		for (const [key, value] of Object.entries(installation)) {
			if (['objectId', 'appVersion', 'channels', 'deviceToken', 'deviceType', 'timeZone', 'createDate', 'updateDate', 'acl'].indexOf(key) > -1) {
				continue;
			}
			body.tags[key] = value as string;
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
		const res = await fetch(url, options);
		const json = await res.json() as OneSignalResponse;
		if (json.success) {
			console.log(`成功: ${installation.deviceToken} -> ${json.id}`);
		} else {
			console.error(`失敗: ${installation.deviceToken} -> ${json.errors.join(', ')}`);
		}
	}
})({...options, filePath });
