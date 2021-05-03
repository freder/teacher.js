import * as index from '../src/index';


describe('add', () => {
	it('should work', () => {
		expect(
			index.add(1, 1)
		).toEqual(2);
	});
});
