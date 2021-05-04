import * as utils from '../src/utils';


describe('add', () => {
	it('should work', () => {
		expect(
			utils.add(1, 1)
		).toEqual(2);
	});
});
