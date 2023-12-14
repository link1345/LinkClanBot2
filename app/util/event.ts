// EventList とは、DiscordのEventとそれに対応した引数をリストアップしたオブジェクトです。
// https://discord.js.org/#/docs/main/stable/class/Client
// ※わざわざ変数の型が書かれているけど、ぶっちゃけ、特に意味ないです。
// 必要なのは、変数の個数。

import { Client, ClientEvents } from 'discord.js';

export interface ExtendedEvents {
	exit: [],
}

export type PluginEvents = ClientEvents & ExtendedEvents;
export type ClientEventType = keyof ClientEvents;
export type ExtendedEventType = keyof ExtendedEvents;
export type PluginEventType = keyof PluginEvents;

export type PluginModule = {
	readonly [K in PluginEventType]?: (client: Client, config: Object, ...data: PluginEvents[K]) => Promise<void>;
}

export const ClientEventList = [
	"applicationCommandCreate",
	"applicationCommandDelete",
	"applicationCommandUpdate",
	"channelCreate",
	"channelDelete",
	"channelPinsUpdate",
	"channelUpdate",
	"debug",
	"emojiCreate",
	"emojiDelete",
	"emojiUpdate",
	"error",
	"guildBanAdd",
	"guildBanRemove",
	"guildCreate",
	"guildDelete",
	"guildIntegrationsUpdate",
	"guildMemberAdd",
	"guildMemberAvailable",
	"guildMemberRemove",
	"guildMembersChunk",
	"guildMemberUpdate",
	"guildUnavailable",
	"guildUpdate",
	"interactionCreate",
	"invalidRequestWarning",
	"inviteCreate",
	"inviteDelete",
	"messageCreate",
	"messageDelete",
	"messageDeleteBulk",
	"messageReactionAdd",
	"messageReactionRemove",
	"messageReactionRemoveAll",
	"messageReactionRemoveEmoji",
	"messageUpdate",
	"presenceUpdate",
	"rateLimit",
	"ready",
	"roleCreate",
	"roleDelete",
	"roleUpdate",
	"shardDisconnect",
	"shardError",
	"shardReady",
	"shardReconnecting",
	"shardResume",
	"stageInstanceCreate",
	"stageInstanceDelete",
	"stageInstanceUpdate",
	"stickerCreate",
	"stickerDelete",
	"stickerUpdate",
	"threadCreate",
	"threadDelete",
	"threadListSync",
	"threadMembersUpdate",
	"threadMemberUpdate",
	"threadUpdate",
	"typingStart",
	"userUpdate",
	"voiceStateUpdate",
	"warn",
	"webhookUpdate",
	// 以下の3イベントは定義されていなかったけれど
	// おそらく必要(かつ登録しても問題なさそう)なので追加した
	"message",
	"invalidated",
	"interaction",
] as const;

export const ExtendedEventList = [
	"exit",
] as const;

export const PluginEventList = [
	...ClientEventList,
	...ExtendedEventList,
] as const;


interface CheckMissing<T extends readonly unknown[], Keys extends T[number]>{ }
interface CheckExcess<T extends readonly Keys[], Keys>{}

// Checking for PluginEvents
{
	type _CheckMissing = CheckMissing<typeof ClientEventList, ClientEventType>;
	type _CheckExcess = CheckExcess<typeof ClientEventList, ClientEventType>;
}

// Checking for PluginEvents
{
	type _CheckMissing = CheckMissing<typeof ExtendedEventList, ExtendedEventType>;
	type _CheckExcess = CheckExcess<typeof ExtendedEventList, ExtendedEventType>;
}

// Checking for PluginEvents
{
	type _CheckMissing = CheckMissing<typeof PluginEventList, PluginEventType>;
	type _CheckExcess = CheckExcess<typeof PluginEventList, PluginEventType>;
}
