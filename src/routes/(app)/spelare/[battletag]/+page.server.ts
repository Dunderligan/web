import { db } from "$lib/server/db"
import { entityQuery, nestedGroupQuery } from "$lib/server/db/helpers";
import { error } from "console";

export const load = async ({ params }) => {
    const battletag = params.battletag.replace('-', '#');

    const data = await db.query.player.findFirst({
        where: {
            battletag
        },
        columns: {
            id: true,
            battletag: true
        },
        with: {
            socials: {
                columns: {
                    platform: true,
                    url: true
                }
            },
            memberships: {
                columns: {
                    role: true,
                    rank: true,
                    tier: true,
                    sr: true
                },
                with: {
                    roster: {
                       ...entityQuery,
                       with: {
                            group: nestedGroupQuery
                       }
                    }
                }
            }
        }
    });

    if (!data) {
        throw error(404);
    }

    return {
        player: data
    }
}