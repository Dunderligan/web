import { exportTeamSubmissionCsv } from '$lib/remote/registration.remote';

export const GET = async ({ params }) => {
	const { season, content } = await exportTeamSubmissionCsv({
		registrationId: params.id
	});

	return new Response(content, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="${season.slug}.csv"`
		}
	});
};
