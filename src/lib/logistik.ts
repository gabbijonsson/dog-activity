export function formatLogistik(options: {
	driveDistanceMeters: number | null
	driveDurationSeconds: number | null
}): string | null {
	const { driveDistanceMeters, driveDurationSeconds } = options
	if (driveDistanceMeters == null && driveDurationSeconds == null) return null

	const parts: string[] = []

	if (driveDistanceMeters != null) {
		parts.push(`${Math.round(driveDistanceMeters / 1000)} km`)
	}

	if (driveDurationSeconds != null) {
		parts.push(formatDriveDuration(driveDurationSeconds))
	}

	return parts.join(' / ')
}

function formatDriveDuration(seconds: number): string {
	const totalMinutes = Math.round(seconds / 60)
	if (totalMinutes < 60) return `${totalMinutes}min`

	const hours = Math.floor(totalMinutes / 60)
	const minutes = totalMinutes % 60
	return `${hours}h ${minutes}min`
}
