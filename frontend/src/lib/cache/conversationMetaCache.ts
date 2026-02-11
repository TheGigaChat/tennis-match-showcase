type Meta = { name: string; avatar?: string };
const map = new Map<string, Meta>(); // key = chatId

export const convMetaCache = {
    get(chatId: string) { return map.get(chatId); },
    set(chatId: string, meta: Meta) { map.set(chatId, meta); },
};