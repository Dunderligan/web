import * as tournament from './schema/tournament';
import * as auth from './schema/auth';
import * as pickBan from './schema/pick-ban';

const schema = {
	...tournament,
	...auth,
	...pickBan
};

export default schema;
