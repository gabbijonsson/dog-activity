export const APP_NAME = 'Dog Sports Tracker'

export function pageTitle(page?: string) {
	return page ? `${page} — ${APP_NAME}` : APP_NAME
}
