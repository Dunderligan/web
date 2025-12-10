import * as tournament from './schema/tournament';
import * as auth from './schema/auth';

const schema = {
	...tournament,
	...auth
};

export default schema;
