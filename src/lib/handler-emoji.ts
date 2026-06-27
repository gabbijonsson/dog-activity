type HandlerWithEmoji = {
	id: string
	calendar_emoji: string | null
} | null

type EntryWithHandler = {
	handler: HandlerWithEmoji
}

/** Unique handler emojis for a competition's entries, in entry order. */
export function competitionHandlerEmojis(entries: EntryWithHandler[]): string {
	const seenHandlerIds = new Set<string>()
	const emojis: string[] = []

	for (const entry of entries) {
		const handler = entry.handler
		if (!handler || seenHandlerIds.has(handler.id)) continue
		seenHandlerIds.add(handler.id)

		const emoji = handler.calendar_emoji?.trim()
		if (emoji) emojis.push(emoji)
	}

	return emojis.join('')
}

export function calendarEventLabelWithEmojis(
	title: string,
	entries: EntryWithHandler[],
): string {
	const emojis = competitionHandlerEmojis(entries)
	return emojis ? `${emojis} ${title}` : title
}
